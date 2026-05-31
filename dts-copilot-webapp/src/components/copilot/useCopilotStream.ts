import { useCallback, useEffect } from "react";
import type {
	AiAgentChatMessage,
	AiAgentChatResponse,
	AiAgentChatSession,
	AiAgentPendingAction,
	DatabaseListItem,
} from "../../api/analyticsApi";
import type { ArtifactStore } from "../../hooks/useArtifactStore";
import { artifactFromMessage } from "../../types/artifact";
import {
	analyticsApi,
	aiAgentChatSendStream,
	type CopilotStreamEvent,
} from "../../api/analyticsApi";
import { buildCopilotAnalysisDraftPayload } from "./copilotAnalysisDraft";
import {
	inferGeneratedReportSuggestedDisplay,
} from "./copilotGeneratedReportMessage";
import { resolveCopilotSqlDatabaseId } from "./copilotReportDatabase";
import {
	SESSION_ID_KEY,
	STREAM_IDLE_TIMEOUT_MS,
	STREAM_PENDING_REASONING,
	resolveUiError,
} from "./CopilotChat.helpers";
import {
	createCopilotStreamWatchdog,
} from "./copilotStreamControl";
import { resolveCopilotSendGuard } from "./copilotSendGuard";
import {
	reduceCopilotStreamContent,
	reduceCopilotStreamMessages,
} from "./copilotStreamReducer";

type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

interface ValueRef<T> {
	current: T;
}

interface UseCopilotStreamInput {
	activeStreamingSessionIdRef: ValueRef<string | null>;
	artifactStore?: ArtifactStore;
	copilotDisabledMessage: string;
	copilotEnabled: boolean;
	databases: DatabaseListItem[];
	input: string;
	messages: AiAgentChatMessage[];
	queuedInput: string | null;
	queuedInputRef: ValueRef<string | null>;
	selectedDbId: number | null;
	sending: boolean;
	sessionId: string | null;
	streamAbortRef: ValueRef<AbortController | null>;
	streamInFlightRef: ValueRef<boolean>;
	reloadMessages: (sessionId: string) => Promise<void>;
	reloadSessions: () => Promise<AiAgentChatSession[]>;
	setError: StateSetter<string | null>;
	setFocusedMessageId: StateSetter<string | null>;
	setFocusNotice: StateSetter<string | null>;
	setInput: StateSetter<string>;
	setMessages: StateSetter<AiAgentChatMessage[]>;
	setPendingAction: StateSetter<AiAgentPendingAction | null>;
	setQueuedInput: StateSetter<string | null>;
	setSending: StateSetter<boolean>;
	setSessionId: StateSetter<string | null>;
}

type CopilotSendBody = Parameters<typeof analyticsApi.aiAgentChatSend>[0];

interface CopilotSendOptions {
	clarificationAnswers?: Record<string, string>;
	assumptionOverrides?: Record<string, string>;
	replaceAssistantMessageId?: string;
	recomputeArtifactId?: string;
}

export function useCopilotStream({
	activeStreamingSessionIdRef,
	artifactStore,
	copilotDisabledMessage,
	copilotEnabled,
	databases,
	input,
	messages,
	queuedInput,
	queuedInputRef,
	selectedDbId,
	sending,
	sessionId,
	streamAbortRef,
	streamInFlightRef,
	reloadMessages,
	reloadSessions,
	setError,
	setFocusedMessageId,
	setFocusNotice,
	setInput,
	setMessages,
	setPendingAction,
	setQueuedInput,
	setSending,
	setSessionId,
}: UseCopilotStreamInput) {
	const abortStreaming = useCallback(
		(notice?: string) => {
			if (!streamAbortRef.current) {
				return false;
			}
			streamAbortRef.current.abort();
			streamAbortRef.current = null;
			if (notice) {
				setError(notice);
			}
			return true;
		},
		[setError, streamAbortRef],
	);

	const handleStopStreaming = useCallback(() => {
		abortStreaming("已停止本次回答生成。");
	}, [abortStreaming]);

	async function handleSendText(text: string, options: CopilotSendOptions = {}) {
		const sendGuard = resolveCopilotSendGuard({
			copilotEnabled,
			requestInFlight: sending,
			streamInFlight: streamInFlightRef.current,
			text,
		});
		if (sendGuard.action === "block") {
			if (sendGuard.reason === "copilot-disabled") {
				setError(copilotDisabledMessage);
			}
			return;
		}
		const trimmed = sendGuard.text;
		streamInFlightRef.current = true;
		setInput("");
		setSending(true);
		setError(null);
		setFocusNotice(null);
		setFocusedMessageId(null);

		const recomputeAssistantId = options.replaceAssistantMessageId;
		const isRecompute = Boolean(recomputeAssistantId);
		const optimistic: AiAgentChatMessage = {
			id: `opt-${Date.now()}`,
			sessionId: sessionId ?? "",
			role: "user",
			content: trimmed,
			sequenceNum: messages.length,
		};
		if (isRecompute) {
			setMessages((prev) =>
				prev.map((message) =>
					message.id === recomputeAssistantId
						? {
								...message,
								content: "",
								reasoningContent: STREAM_PENDING_REASONING,
								assumptionRecomputing: true,
								analysisDraftError: undefined,
							}
						: message,
				),
			);
		} else {
			setMessages((prev) => [...prev, optimistic]);
		}

		const body: CopilotSendBody = {
			userMessage: trimmed,
			...(sessionId ? { sessionId } : {}),
			...(selectedDbId != null ? { datasourceId: String(selectedDbId) } : {}),
			...(options.clarificationAnswers
				? { clarificationAnswers: options.clarificationAnswers }
				: {}),
			...(options.assumptionOverrides
				? { assumptionOverrides: options.assumptionOverrides }
				: {}),
		};
		const assistantId = recomputeAssistantId ?? `stream-${Date.now()}`;
		let streamedContent = "";
		let streamedSessionId = sessionId;
		let sawStreamEvent = false;
		let streamTimedOut = false;
		const abortController = new AbortController();
		const streamWatchdog = createCopilotStreamWatchdog({
			idleMs: STREAM_IDLE_TIMEOUT_MS,
			onIdle: () => {
				streamTimedOut = true;
				abortController.abort();
				setError("AI Copilot 响应超时，请重试或换一个更明确的问题。");
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId && !m.content
							? {
									...m,
									content: "本次回答因响应超时被中断，请重试。",
									reasoningContent:
										m.reasoningContent === STREAM_PENDING_REASONING
											? undefined
											: m.reasoningContent,
								}
							: m,
					),
				);
			},
		});

		async function createGeneratedReportDraft(
			event: Extract<CopilotStreamEvent, { type: "done" }>,
		) {
			const draftDatabaseId = resolveCopilotSqlDatabaseId({
				selectedDatabaseId: selectedDbId,
				databases,
				dataSurface: event.dataSurface,
				sql: event.generatedSql,
				sourceRefs: event.sourceRefs,
			});
			if (
				event.responseKind !== "REPORT_DRAFT" ||
				!event.generatedSql ||
				draftDatabaseId == null
			) {
				return;
			}
			setMessages((prev) =>
				prev.map((m) =>
					m.id === assistantId
						? {
								...m,
								analysisDraftStatus: "saving",
								analysisDraftError: undefined,
							}
						: m,
				),
			);
			const suggestedDisplay =
				event.suggestedDisplay ??
				inferGeneratedReportSuggestedDisplay({
					question: trimmed,
					sql: event.generatedSql,
				});
			try {
				const draft = await analyticsApi.createAnalysisDraft(
					buildCopilotAnalysisDraftPayload({
						question: trimmed,
						sql: event.generatedSql,
						databaseId: draftDatabaseId,
						explanationText: streamedContent || undefined,
						sessionId: streamedSessionId ?? sessionId ?? undefined,
						messageId: assistantId,
						suggestedDisplay,
						responseKind: event.responseKind,
						dataSurface: event.dataSurface,
						qualityLevel: event.qualityLevel,
						qualityNotes: event.qualityNotes,
						reportCode: event.reportCode,
					}),
				);
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId
							? {
									...m,
									analysisDraftId: draft.id,
									analysisDraftStatus: "saved",
									analysisDraftError: undefined,
								}
							: m,
					),
				);
				const currentArtifact = artifactStore?.artifacts.find(
					(item) => item.sourceMessageId === assistantId,
				);
				if (currentArtifact) {
					artifactStore?.upsert({
						...currentArtifact,
						spec: {
							...currentArtifact.spec,
							analysisDraftId: draft.id,
						},
					});
				}
			} catch (e) {
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId
							? {
									...m,
									analysisDraftStatus: "error",
									analysisDraftError:
										e instanceof Error ? e.message : "保存失败",
								}
							: m,
					),
				);
			}
		}

		function upsertArtifactFromDoneEvent(
			event: Extract<CopilotStreamEvent, { type: "done" }>,
		) {
			if (!artifactStore) {
				return;
			}
			if (!event.generatedSql && !event.templateCode && !event.reportCode) {
				return;
			}
			const existingArtifact = options.recomputeArtifactId
				? artifactStore.getById(options.recomputeArtifactId)
				: null;
			const artifactId = existingArtifact?.id ?? options.recomputeArtifactId;
			const artifact = artifactFromMessage(
				{
					content: streamedContent,
					dataSurface: event.dataSurface,
					databaseId: resolveCopilotSqlDatabaseId({
						selectedDatabaseId: selectedDbId,
						databases,
						dataSurface: event.dataSurface,
						sql: event.generatedSql,
						sourceRefs: event.sourceRefs,
					}) ?? undefined,
					generatedSql: event.generatedSql,
					id: assistantId,
					reportCode: event.reportCode,
					responseKind: event.responseKind,
					sourceRefs: event.sourceRefs,
					suggestedDisplay: event.suggestedDisplay,
					targetView: event.targetView,
					templateCode: event.templateCode,
					trace: event.trace,
				},
				null,
				{
					...(artifactId ? { id: artifactId } : {}),
					...(existingArtifact?.createdAt
						? { createdAt: existingArtifact.createdAt }
						: {}),
					...(existingArtifact?.title ? { title: existingArtifact.title } : {}),
				},
			);
			artifactStore.upsert(artifact);
		}

		try {
			activeStreamingSessionIdRef.current = sessionId;
			streamAbortRef.current = abortController;
			streamWatchdog.start();

			if (!isRecompute) {
				setMessages((prev) => [
					...prev,
					{
						id: assistantId,
						sessionId: sessionId ?? "",
						role: "assistant" as const,
						content: "",
						reasoningContent: STREAM_PENDING_REASONING,
						sequenceNum: messages.length + 1,
					},
				]);
			}

			await aiAgentChatSendStream(
				body,
				(event: CopilotStreamEvent) => {
					sawStreamEvent = true;
					streamWatchdog.markActivity();
					switch (event.type) {
						case "session":
							streamedSessionId = event.sessionId;
							activeStreamingSessionIdRef.current = event.sessionId;
							setSessionId(event.sessionId);
							try {
								sessionStorage.setItem(SESSION_ID_KEY, event.sessionId);
							} catch {}
							break;
						case "heartbeat":
							break;
						case "reasoning":
							setMessages((prev) =>
								reduceCopilotStreamMessages(prev, event, {
									assistantId,
									streamedContent,
									pendingReasoning: STREAM_PENDING_REASONING,
								}),
							);
							break;
						case "token":
							streamedContent = reduceCopilotStreamContent(
								streamedContent,
								event,
							);
							setMessages((prev) =>
								reduceCopilotStreamMessages(prev, event, {
									assistantId,
									streamedContent,
									pendingReasoning: STREAM_PENDING_REASONING,
								}),
							);
							break;
						case "tool":
							setMessages((prev) =>
								reduceCopilotStreamMessages(prev, event, {
									assistantId,
									streamedContent,
									pendingReasoning: STREAM_PENDING_REASONING,
								}),
							);
							break;
						case "done":
							setMessages((prev) =>
								reduceCopilotStreamMessages(prev, event, {
									assistantId,
									streamedContent,
									pendingReasoning: STREAM_PENDING_REASONING,
								}),
							);
							upsertArtifactFromDoneEvent(event);
							void createGeneratedReportDraft(event);
							break;
						case "error":
							setError(event.error);
							setMessages((prev) =>
								reduceCopilotStreamMessages(prev, event, {
									assistantId,
									streamedContent,
									pendingReasoning: STREAM_PENDING_REASONING,
								}),
							);
							break;
					}
				},
				{ signal: abortController.signal },
			);
			void reloadSessions();
		} catch (e) {
			const aborted =
				e instanceof DOMException
					? e.name === "AbortError"
					: e instanceof Error && e.name === "AbortError";
			if (aborted) {
				const interruptedForReplacement = queuedInputRef.current != null;
				if (!streamTimedOut && !interruptedForReplacement) {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === assistantId && !m.content
								? {
										...m,
										content: "已停止本次回答生成。",
										reasoningContent:
											m.reasoningContent === STREAM_PENDING_REASONING
												? undefined
												: m.reasoningContent,
									}
								: m,
						),
					);
				}
				return;
			}
			if (sawStreamEvent) {
				setError(resolveUiError(e, "流式响应中断，请重试。"));
				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantId && !m.content
							? {
									...m,
									content: "流式响应中断，请重试。",
									reasoningContent:
										m.reasoningContent === STREAM_PENDING_REASONING
											? undefined
											: m.reasoningContent,
								}
							: m,
					),
				);
				return;
			}
			try {
				setMessages((prev) => prev.filter((m) => !m.id.startsWith("stream-")));
				const res = (await analyticsApi.aiAgentChatSend(
					body,
				)) as AiAgentChatResponse;
				if (res.sessionId) {
					setSessionId(res.sessionId);
					await reloadMessages(res.sessionId);
				}
				if (res.requiresApproval && res.pendingAction) {
					setPendingAction(res.pendingAction);
				}
				void reloadSessions();
			} catch (e) {
				setError(resolveUiError(e, "发送失败"));
			}
		} finally {
			if (isRecompute) {
				setMessages((prev) =>
					prev.map((message) =>
						message.id === assistantId
							? { ...message, assumptionRecomputing: false }
							: message,
					),
				);
			}
			streamWatchdog.stop();
			streamAbortRef.current = null;
			streamInFlightRef.current = false;
			activeStreamingSessionIdRef.current = null;
			setSending(false);
		}
	}

	async function handleSend() {
		const trimmed = input.trim();
		if (sending) {
			if (!trimmed) {
				handleStopStreaming();
				return;
			}
			queuedInputRef.current = trimmed;
			setQueuedInput(trimmed);
			setInput("");
			setError(null);
			abortStreaming();
			return;
		}
		await handleSendText(input);
	}

	useEffect(
		() => () => {
			streamAbortRef.current?.abort();
			streamAbortRef.current = null;
		},
		[streamAbortRef],
	);

	useEffect(() => {
		if (sending || !queuedInput) return;
		queuedInputRef.current = null;
		setQueuedInput(null);
		void handleSendText(queuedInput);
	}, [sending, queuedInput]);

	return {
		abortStreaming,
		handleSend,
		handleSendText,
		handleStopStreaming,
	};
}
