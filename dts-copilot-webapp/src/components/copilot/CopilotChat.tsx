import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import type {
	AiAgentChatMessage,
	AiAgentChatResponse,
	AiAgentChatSession,
	AiAgentPendingAction,
	DatabaseListItem,
	MicroFormSchema,
} from "../../api/analyticsApi";
import { getCopilotApiKey, hasCopilotSessionAccess } from "../../api/copilotAuth";
import { AuthError, analyticsApi, aiAgentChatSendStream, type CopilotStreamEvent } from "../../api/analyticsApi";
import { extractSqlFromMarkdown } from "../../utils/sqlExtractor";
import { FeedbackButtons } from "./FeedbackButtons";
import { InlineSqlPreview } from "./InlineSqlPreview";
import { TracePanel } from "./TracePanel";
import { VoiceInputButton } from "./VoiceInputButton";
import { WelcomeCard } from "./WelcomeCard";
import { canEditCopilotComposer } from "./copilotComposerState";
import {
	getFixedReportCandidates,
	shouldShowFixedReportShortcut,
} from "./copilotFixedReportMessage";
import { shouldSubmitCopilotInputOnEnter } from "./copilotInputBehavior";
import { appendReasoningDelta, appendToolProgressLine } from "./copilotReasoningState";
import type { CopilotSessionFocusRequest } from "./copilotSessionFocus";
import { shouldRestorePersistedCopilotSession } from "./copilotSessionBootstrap";
import { createCopilotStreamWatchdog, resolveCopilotSendAction } from "./copilotStreamControl";
import { canUseCopilot } from "./copilotAccessPolicy";
import {
	SESSION_ID_KEY,
	DATASOURCE_ID_KEY,
	STREAM_IDLE_TIMEOUT_MS,
	STREAM_PENDING_REASONING,
	getStoredDatasourceId,
	MICRO_FORM_PRESETS,
	getStoredSessionId,
	resolveUiError,
	toArray,
	sortMessages,
	normalizeMicroForm,
	buildInitialApprovalValues,
	getToolMessagesForAssistant,
	getUserQuestionForAssistant,
} from "./CopilotChat.helpers";
import "./CopilotChat.css";

type CopilotSendBody = Parameters<typeof analyticsApi.aiAgentChatSend>[0];
type FormValues = Record<string, string | number | undefined>;


interface Props {
	hasSessionAccess?: boolean;
	focusRequest?: CopilotSessionFocusRequest | null;
}

export function CopilotChat({ hasSessionAccess = false, focusRequest = null }: Props) {
	const initialStoredSessionId = useRef(getStoredSessionId());
	const copilotEnabled = canUseCopilot(
		getCopilotApiKey(),
		hasSessionAccess || hasCopilotSessionAccess(),
	);
	const [sessionId, setSessionId] = useState<string | null>(() =>
		initialStoredSessionId.current,
	);
	const [sessions, setSessions] = useState<AiAgentChatSession[]>([]);
	const [messages, setMessages] = useState<AiAgentChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [pendingAction, setPendingAction] =
		useState<AiAgentPendingAction | null>(null);
	const [approvalValues, setApprovalValues] = useState<FormValues>({});
	const [databases, setDatabases] = useState<DatabaseListItem[]>([]);
	const [selectedDbId, setSelectedDbId] = useState<number | null>(() => getStoredDatasourceId());
	const [error, setError] = useState<string | null>(null);
	const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
	const [focusNotice, setFocusNotice] = useState<string | null>(null);
	const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const activeStreamingSessionIdRef = useRef<string | null>(null);
	const streamInFlightRef = useRef(false);
	const streamAbortRef = useRef<AbortController | null>(null);
	const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
	const approvalSchema = useMemo(
		() => normalizeMicroForm(pendingAction),
		[pendingAction],
	);
	const copilotDisabledMessage =
		"当前页面还没有可用的 Copilot 访问权限，请先登录或配置 copilot API Key。";
	const canEditComposer = canEditCopilotComposer({
		copilotEnabled,
		requestInFlight: sending,
	});
	const sendAction = resolveCopilotSendAction({
		copilotEnabled,
		requestInFlight: sending,
		input,
	});

	const reloadSessions = useCallback(async () => {
		if (!copilotEnabled) {
			setSessions([]);
			return [];
		}
		try {
			const rows = await analyticsApi.listAiAgentSessions(50);
			const list = toArray<AiAgentChatSession>(rows);
			setSessions(list);
			return list;
		} catch {
			return [];
		}
	}, [copilotEnabled]);

	const reloadMessages = useCallback(async (sid: string) => {
		if (!copilotEnabled) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		try {
			const detail = await analyticsApi.getAiAgentSession(sid);
			setMessages(sortMessages(detail.messages ?? []));
			setPendingAction(detail.pendingAction ?? null);
		} catch {
			/* ignore */
		}
	}, [copilotEnabled]);

	useEffect(() => {
		try {
			if (sessionId) {
				sessionStorage.setItem(SESSION_ID_KEY, sessionId);
			} else {
				sessionStorage.removeItem(SESSION_ID_KEY);
			}
		} catch {
			/* ignore */
		}
	}, [sessionId]);

	// Load databases on mount.
	useEffect(() => {
		if (!copilotEnabled) return;
		let active = true;
		void (async () => {
			try {
				const res = await analyticsApi.listDatabases();
				if (!active) return;
				const list = toArray<DatabaseListItem>(res.data);
				setDatabases(list);
				// Default to stored value if valid, otherwise first database
				setSelectedDbId((prev) => {
					if (prev != null && list.some((db) => db.id === prev)) return prev;
					return list.length > 0 ? list[0].id : null;
				});
			} catch {
				/* ignore */
			}
		})();
		return () => { active = false; };
	}, [copilotEnabled]);

	// Persist selected datasource to sessionStorage.
	useEffect(() => {
		try {
			if (selectedDbId != null) {
				sessionStorage.setItem(DATASOURCE_ID_KEY, String(selectedDbId));
			} else {
				sessionStorage.removeItem(DATASOURCE_ID_KEY);
			}
		} catch {
			/* ignore */
		}
	}, [selectedDbId]);

	// Load sessions and restore initial session context from storage.
	// This bootstrap should only run on mount; otherwise "new chat" state is overwritten.
	useEffect(() => {
		let active = true;
		void (async () => {
			const list = await reloadSessions();
			if (!active) return;
			const restoredSessionId = initialStoredSessionId.current;
			if (restoredSessionId && list.some((item) => item.id === restoredSessionId)) {
				try {
					const detail = await analyticsApi.getAiAgentSession(restoredSessionId);
					if (!active) return;
					if (!shouldRestorePersistedCopilotSession(detail)) {
						setSessionId(null);
						setMessages([]);
						setPendingAction(null);
						initialStoredSessionId.current = null;
						try {
							sessionStorage.removeItem(SESSION_ID_KEY);
						} catch {
							/* ignore */
						}
						return;
					}
				} catch {
					/* ignore */
				}
			}
			if (sessionId && list.length > 0 && !list.some((item) => item.id === sessionId)) {
				setSessionId(null);
			}
		})();
		return () => {
			active = false;
		};
	}, [reloadSessions, sessionId]);

	// Restore messages for current backend session.
	useEffect(() => {
		if (!copilotEnabled) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		if (!sessionId) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		if (streamInFlightRef.current && activeStreamingSessionIdRef.current === sessionId) {
			return;
		}
		void reloadMessages(sessionId);
	}, [copilotEnabled, sessionId, reloadMessages]);

	useEffect(() => {
		setApprovalValues(buildInitialApprovalValues(pendingAction, approvalSchema, selectedDbId));
	}, [pendingAction, approvalSchema]);

	useEffect(() => {
		if (!focusRequest?.sessionId) return;
		setSessionId(focusRequest.sessionId);
		setFocusNotice(focusRequest.notice);
		setFocusedMessageId(focusRequest.messageId ?? null);
		void reloadMessages(focusRequest.sessionId);
	}, [focusRequest, reloadMessages]);

	// Scroll to bottom when conversation content updates.
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [sortedMessages, pendingAction, sending]);

	useEffect(() => {
		if (!focusedMessageId) return;
		const frame = requestAnimationFrame(() => {
			const target = document.querySelector<HTMLElement>(
				`[data-copilot-message-id="${focusedMessageId}"]`,
			);
			target?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
		return () => cancelAnimationFrame(frame);
	}, [sortedMessages, focusedMessageId]);

	useEffect(() => () => {
		streamAbortRef.current?.abort();
		streamAbortRef.current = null;
	}, []);

	const handleStopStreaming = useCallback(() => {
		if (!streamAbortRef.current) {
			return;
		}
		streamAbortRef.current.abort();
		streamAbortRef.current = null;
		setError("已停止本次回答生成。");
	}, []);

	async function handleSendText(text: string) {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		const trimmed = text.trim();
		if (!trimmed || sending) return;
		setInput("");
		setSending(true);
		setError(null);
		setFocusNotice(null);
		setFocusedMessageId(null);

		const optimistic: AiAgentChatMessage = {
			id: `opt-${Date.now()}`,
			sessionId: sessionId ?? "",
			role: "user",
			content: trimmed,
			sequenceNum: messages.length,
		};
		setMessages((prev) => [...prev, optimistic]);

		const body: CopilotSendBody = {
			userMessage: trimmed,
			...(sessionId ? { sessionId } : {}),
			...(selectedDbId != null ? { datasourceId: String(selectedDbId) } : {}),
		};
		const assistantId = `stream-${Date.now()}`;
		let streamedContent = "";
		let streamFailed = false;
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
								reasoningContent: m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
							}
							: m,
					),
				);
			},
		});

		// Try SSE streaming first, fallback to sync
		try {
			streamInFlightRef.current = true;
			activeStreamingSessionIdRef.current = sessionId;
			streamAbortRef.current = abortController;
			streamWatchdog.start();

			// Add placeholder assistant message
				setMessages((prev) => [...prev, {
					id: assistantId,
					sessionId: sessionId ?? "",
					role: "assistant" as const,
					content: "",
					reasoningContent: STREAM_PENDING_REASONING,
					sequenceNum: messages.length + 1,
				}]);

			await aiAgentChatSendStream(body, (event: CopilotStreamEvent) => {
				sawStreamEvent = true;
				streamWatchdog.markActivity();
				switch (event.type) {
					case "session":
						streamedSessionId = event.sessionId;
						activeStreamingSessionIdRef.current = event.sessionId;
						setSessionId(event.sessionId);
						try { sessionStorage.setItem(SESSION_ID_KEY, event.sessionId); } catch {}
						break;
					case "heartbeat":
						break;
					case "reasoning":
						setMessages((prev) => prev.map((m) =>
							m.id === assistantId
								? {
									...m,
									reasoningContent: appendReasoningDelta(
										m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
										event.content,
									),
								}
								: m
						));
						break;
					case "token":
						streamedContent += event.content;
						setMessages((prev) => prev.map((m) =>
							m.id === assistantId
								? {
									...m,
									content: streamedContent,
									reasoningContent: m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
								}
								: m
						));
						break;
					case "tool":
						setMessages((prev) => prev.map((m) =>
							m.id === assistantId
								? {
									...m,
									reasoningContent: appendToolProgressLine(
										m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
										{
											tool: event.tool,
											status: event.status,
										},
									),
								}
								: m
						));
						break;
					case "done":
						setMessages((prev) => prev.map((m) =>
							m.id === assistantId
								? {
									...m,
									generatedSql: event.generatedSql,
									templateCode: event.templateCode,
									routedDomain: event.routedDomain,
									targetView: event.targetView,
									responseKind: event.responseKind,
								}
								: m
						));
						break;
					case "error":
						streamFailed = true;
						setError(event.error);
						setMessages((prev) => prev.map((m) =>
							m.id === assistantId
								? {
									...m,
									content: event.error,
									reasoningContent: m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
								}
								: m
						));
						break;
				}
			}, { signal: abortController.signal });
			// Don't reloadMessages — streamed content (including reasoning) is
			// already rendered.  Reloading would race with the persist and may
			// momentarily replace the message list, causing reasoning to flash away.
			void reloadSessions();
		} catch (e) {
			const aborted = e instanceof DOMException
				? e.name === "AbortError"
				: e instanceof Error && e.name === "AbortError";
			if (aborted) {
				if (!streamTimedOut) {
					setMessages((prev) => prev.map((m) =>
						m.id === assistantId && !m.content
							? {
								...m,
								content: "已停止本次回答生成。",
								reasoningContent: m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
							}
							: m
					));
				}
				return;
			}
			if (sawStreamEvent) {
				setError(resolveUiError(e, "流式响应中断，请重试。"));
				setMessages((prev) => prev.map((m) =>
					m.id === assistantId && !m.content
						? {
							...m,
							content: "流式响应中断，请重试。",
							reasoningContent: m.reasoningContent === STREAM_PENDING_REASONING ? undefined : m.reasoningContent,
						}
						: m
				));
				return;
			}
			// Fallback to synchronous API
			try {
				setMessages((prev) => prev.filter((m) => !m.id.startsWith("stream-")));
				const res = (await analyticsApi.aiAgentChatSend(body)) as AiAgentChatResponse;
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
				streamWatchdog.stop();
				streamAbortRef.current = null;
				streamInFlightRef.current = false;
			activeStreamingSessionIdRef.current = null;
			setSending(false);
		}
	}

	async function handleSend() {
		await handleSendText(input);
	}

	async function handleApprove() {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		if (!sessionId || !pendingAction?.actionId) return;
		setSending(true);
		setError(null);
		try {
			let formData: Record<string, unknown> | undefined;
			if (approvalSchema) {
				const payload: Record<string, unknown> = {};
				for (const field of approvalSchema.fields) {
					const raw = approvalValues[field.key];
					const missing = raw == null || (typeof raw === "string" && raw.trim().length === 0);
					if (missing) {
						if (field.required) {
							setError(`缺少参数: ${field.label}`);
							setSending(false);
							return;
						}
						continue;
					}
					if (field.type === "number" && typeof raw === "string") {
						const num = Number(raw);
						if (Number.isFinite(num)) {
							payload[field.key] = num;
							continue;
						}
					}
					payload[field.key] = raw;
				}

				if (typeof payload.confJson === "string") {
					const confRaw = payload.confJson.trim();
					delete payload.confJson;
					if (confRaw.length > 0) {
						try {
							const parsed = JSON.parse(confRaw);
							if (parsed == null || Array.isArray(parsed) || typeof parsed !== "object") {
								setError("运行参数必须是 JSON 对象");
								setSending(false);
								return;
							}
							payload.conf = parsed;
						} catch {
							setError("运行参数 JSON 格式不正确");
							setSending(false);
							return;
						}
					}
				}
				formData = Object.keys(payload).length > 0 ? payload : undefined;
			}

			await analyticsApi.aiAgentChatApprove(sessionId, pendingAction.actionId, formData);
			setPendingAction(null);
			await reloadMessages(sessionId);
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "审批失败"));
		} finally {
			setSending(false);
		}
	}

	async function handleCancel() {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		if (!sessionId || !pendingAction?.actionId) return;
		setSending(true);
		try {
			await analyticsApi.aiAgentChatCancel(sessionId, pendingAction.actionId);
			setPendingAction(null);
			await reloadMessages(sessionId);
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "取消失败"));
		} finally {
			setSending(false);
		}
	}

	async function handleDeleteSession() {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		if (!sessionId || sending) return;
		setSending(true);
		setError(null);
		try {
			await analyticsApi.deleteAiAgentSession(sessionId);
			const list = await reloadSessions();
			const nextSessionId = list.find((item) => item.id !== sessionId)?.id ?? null;
			setSessionId(nextSessionId);
			if (nextSessionId) {
				await reloadMessages(nextSessionId);
			} else {
				setMessages([]);
				setPendingAction(null);
			}
		} catch (e) {
			setError(resolveUiError(e, "删除会话失败"));
		} finally {
			setSending(false);
		}
	}

	function handleNewChat() {
		setSessionId(null);
		setMessages([]);
		setPendingAction(null);
		setError(null);
		setFocusNotice(null);
		setFocusedMessageId(null);
		setApprovalValues({});
	}

	return (
		<div className="copilot-chat">
			<div className="copilot-chat__session-bar">
				<select
					className="copilot-chat__session-select"
					value={sessionId ?? ""}
					onChange={(event) => {
						const next = event.target.value;
						if (!next) {
							handleNewChat();
							return;
						}
						setFocusNotice(null);
						setFocusedMessageId(null);
						setSessionId(next);
					}}
					disabled={sending || !copilotEnabled}
				>
					<option value="">新对话（未保存）</option>
					{sessions.map((item) => (
						<option key={item.id} value={item.id}>
							{item.title?.trim() || item.id}
						</option>
					))}
				</select>
				<button
					type="button"
					className="copilot-chat__mini-btn"
					onClick={handleNewChat}
					disabled={sending || !copilotEnabled}
				>
					新建
				</button>
				<button
					type="button"
					className="copilot-chat__mini-btn copilot-chat__mini-btn--danger"
					onClick={() => void handleDeleteSession()}
					disabled={sending || !sessionId || !copilotEnabled}
				>
					删除
				</button>
			</div>

			{/* Database selector */}
			{databases.length > 0 && (
				<div className="copilot-chat__db-bar">
					<label className="copilot-chat__db-label" htmlFor="copilot-db-select">
						数据源
					</label>
					<select
						id="copilot-db-select"
						className="copilot-chat__db-select"
						value={selectedDbId ?? ""}
						onChange={(e) => {
							const val = Number(e.target.value);
							setSelectedDbId(Number.isFinite(val) ? val : null);
						}}
						disabled={sending || !copilotEnabled}
					>
						{databases.map((db) => (
							<option key={db.id} value={db.id}>
								{db.name ?? `DB #${db.id}`}{db.engine ? ` (${db.engine})` : ""}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Messages */}
			<div className="copilot-chat__messages" ref={scrollRef}>
				{!copilotEnabled ? (
					<div className="copilot-chat__notice">{copilotDisabledMessage}</div>
				) : sortedMessages.length === 0 ? (
					<WelcomeCard onQuestionClick={(q) => void handleSendText(q)} />
				) : null}
				{focusNotice ? (
					<div className="copilot-chat__notice copilot-chat__notice--focus">{focusNotice}</div>
				) : null}
				{sortedMessages
					.filter((m) => m.role === "user" || m.role === "assistant")
						.map((msg) => {
							// For assistant messages, collect preceding tool calls
						const toolMsgs =
							msg.role === "assistant"
								? getToolMessagesForAssistant(sortedMessages, msg)
								: [];
						const hasTrace = toolMsgs.length > 0;
						const traceExpanded = expandedTraces.has(msg.id);
							const extractedSql = msg.role === "assistant"
								? (msg.generatedSql ?? extractSqlFromMarkdown(msg.content ?? ""))
								: null;
							const sourceQuestion =
								msg.role === "assistant"
									? getUserQuestionForAssistant(sortedMessages, msg)
									: null;
							const fixedReportCandidates = getFixedReportCandidates(msg);
								return (
								<div
									key={msg.id}
									className={`copilot-chat__msg copilot-chat__msg--${msg.role}${msg.id === focusedMessageId ? " copilot-chat__msg--focused" : ""}`}
									data-copilot-message-id={msg.id}
								>
									<div className="copilot-chat__msg-content">
										{msg.role === "assistant" &&
										msg.id.startsWith("stream-") &&
										!msg.content &&
										msg.reasoningContent === STREAM_PENDING_REASONING ? (
											<div className="copilot-chat__streaming-placeholder">正在思考…</div>
										) : null}
										{msg.reasoningContent &&
										msg.reasoningContent !== STREAM_PENDING_REASONING && (
											<div className="copilot-chat__reasoning">
												<div className="copilot-chat__reasoning-label">思考过程</div>
										<div className="copilot-chat__reasoning-content">{msg.reasoningContent}</div>
											</div>
										)}
									{msg.content}
								</div>
								{shouldShowFixedReportShortcut(msg) && (
									<div className="copilot-chat__fixed-report-action">
											<Link
												className="copilot-chat__fixed-report-link"
												to={`/fixed-reports/${encodeURIComponent(msg.templateCode!)}/run`}
											>
											查看固定报表
										</Link>
									</div>
								)}
								{fixedReportCandidates.length > 0 && (
									<div className="copilot-chat__fixed-report-candidates">
										<div className="copilot-chat__fixed-report-candidates-label">固定报表候选</div>
										<div className="copilot-chat__fixed-report-candidates-list">
											{fixedReportCandidates.map((candidate) =>
												candidate.templateCode ? (
													<Link
														key={`${msg.id}-${candidate.templateCode}`}
														className="copilot-chat__fixed-report-link"
														to={`/fixed-reports/${encodeURIComponent(candidate.templateCode)}/run`}
													>
														{candidate.label}
													</Link>
												) : (
													<span
														key={`${msg.id}-${candidate.label}`}
														className="copilot-chat__fixed-report-chip"
													>
														{candidate.label}
													</span>
												),
											)}
										</div>
									</div>
									)}
									{extractedSql && (
										<InlineSqlPreview
											sql={extractedSql}
											databaseId={selectedDbId ?? undefined}
											question={sourceQuestion ?? undefined}
											explanationText={msg.content ?? undefined}
											sessionId={sessionId ?? msg.sessionId}
											messageId={msg.id}
											suggestedDisplay="table"
										/>
									)}
								{hasTrace && (
									<>
										<button
											type="button"
											className="trace-toggle"
											onClick={() => {
												setExpandedTraces((prev) => {
													const next = new Set(prev);
													if (next.has(msg.id)) next.delete(msg.id);
													else next.add(msg.id);
													return next;
												});
											}}
										>
											<span className="trace-toggle__icon">
												{traceExpanded ? "\u25B2" : "\u25BC"}
											</span>
											{traceExpanded ? "隐藏" : "查看"}推理过程（{toolMsgs.length} 步）
										</button>
										{traceExpanded && <TracePanel toolMessages={toolMsgs} />}
									</>
								)}
								{msg.role === "assistant" && (
									<FeedbackButtons
										messageId={msg.id}
										sessionId={sessionId ?? ""}
										{...(extractedSql ? { generatedSql: extractedSql } : {})}
										{...(msg.routedDomain ? { routedDomain: msg.routedDomain } : {})}
										{...(msg.targetView ? { targetView: msg.targetView } : {})}
										{...(msg.templateCode ? { templateCode: msg.templateCode } : {})}
									/>
								)}
							</div>
						);
					})}

				{/* Pending approval */}
				{pendingAction && (
					<div className="copilot-chat__approval">
						<div className="copilot-chat__approval-title">待审批</div>
						<div className="copilot-chat__approval-detail">
							工具: {pendingAction.toolId}
						</div>
						{pendingAction.reason && (
							<div className="copilot-chat__approval-detail">
								{pendingAction.reason}
							</div>
						)}
						{pendingAction.planSummary && (
							<div className="copilot-chat__approval-detail">
								计划: {pendingAction.planSummary}
							</div>
						)}
						{pendingAction.impactScope && (
							<div className="copilot-chat__approval-detail">
								范围: {pendingAction.impactScope}
							</div>
						)}
						{approvalSchema && (
							<div className="copilot-chat__approval-form">
								{approvalSchema.fields.map((field) => {
									const value = approvalValues[field.key];
									return (
										<label key={field.key} className="copilot-chat__approval-field">
											<span className="copilot-chat__approval-label">
												{field.label}
												{field.required ? " *" : ""}
											</span>
											{field.type === "textarea" ? (
												<textarea
													className="copilot-chat__approval-input copilot-chat__approval-input--textarea"
													rows={2}
													value={value == null ? "" : String(value)}
													placeholder={field.placeholder}
													onChange={(event) =>
														setApprovalValues((prev) => ({
															...prev,
															[field.key]: event.target.value,
														}))
													}
												/>
											) : field.type === "select" ? (
												<select
													className="copilot-chat__approval-input"
													value={value == null ? "" : String(value)}
													onChange={(event) =>
														setApprovalValues((prev) => ({
															...prev,
															[field.key]: event.target.value,
														}))
													}
												>
													<option value="">请选择</option>
													{(field.options ?? []).map((option) => (
														<option key={String(option.value)} value={String(option.value)}>
															{option.label}
														</option>
													))}
												</select>
											) : (
												<input
													className="copilot-chat__approval-input"
													type={field.type === "number" ? "number" : "text"}
													value={value == null ? "" : String(value)}
													placeholder={field.placeholder}
													onChange={(event) =>
														setApprovalValues((prev) => ({
															...prev,
															[field.key]: event.target.value,
														}))
													}
												/>
											)}
											{field.helpText ? (
												<span className="copilot-chat__approval-help">
													{field.helpText}
												</span>
											) : null}
										</label>
									);
								})}
							</div>
						)}
						<div className="copilot-chat__approval-actions">
							<button
								type="button"
								className="copilot-chat__btn copilot-chat__btn--approve"
								onClick={() => void handleApprove()}
								disabled={sending}
							>
								批准
							</button>
							<button
								type="button"
								className="copilot-chat__btn copilot-chat__btn--cancel"
								onClick={handleCancel}
								disabled={sending}
							>
								拒绝
							</button>
						</div>
					</div>
				)}

				{error && <div className="copilot-chat__error">{error}</div>}
			</div>

			{/* Input */}
			<div className="copilot-chat__input-area">
				<button
					type="button"
					className="copilot-chat__new-btn"
					onClick={handleNewChat}
					title="新对话"
					disabled={sending}
				>
					+
				</button>
				<textarea
					className="copilot-chat__input"
					rows={1}
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						// Auto-resize: reset height then set to scrollHeight
						const el = e.target;
						el.style.height = "auto";
						el.style.height = Math.min(el.scrollHeight, 160) + "px";
					}}
					onKeyDown={(e) => {
						const nativeEvent = e.nativeEvent as KeyboardEvent & {
							isComposing?: boolean;
							keyCode?: number;
						};
						if (shouldSubmitCopilotInputOnEnter({
							key: e.key,
							shiftKey: e.shiftKey,
							isComposing: nativeEvent.isComposing,
							keyCode: nativeEvent.keyCode,
						})) {
							e.preventDefault();
							handleSend();
							// Reset height after send
							const el = e.target as HTMLTextAreaElement;
							requestAnimationFrame(() => {
								el.style.height = "auto";
							});
						}
					}}
					placeholder={
						copilotEnabled
							? "输入问题..."
							: "需要先登录或配置 copilot API Key 才能使用 AI Copilot"
					}
					disabled={!canEditComposer}
				/>
					<VoiceInputButton
						onTranscript={(text, isFinal) => {
							if (isFinal) {
								setInput((prev) => (prev ? prev + " " + text : text));
							}
						}}
						disabled={!canEditComposer || sending}
					/>
					<button
						type="button"
						className="copilot-chat__send-btn"
						onClick={sendAction.mode === "stop" ? handleStopStreaming : handleSend}
						disabled={sendAction.disabled}
					>
						{sendAction.label}
					</button>
				</div>
			</div>
		);
}

