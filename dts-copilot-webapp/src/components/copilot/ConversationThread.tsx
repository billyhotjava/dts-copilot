import { useEffect, useMemo, useRef, useState } from "react";
import {
	getCopilotApiKey,
	hasCopilotSessionAccess,
} from "../../api/copilotAuth";
import { analyticsApi } from "../../api/analyticsApi";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import type { ArtifactStore } from "../../hooks/useArtifactStore";
import { extractSqlFromMarkdown } from "../../utils/sqlExtractor";
import { ApprovalPanel } from "./ApprovalPanel";
import { Composer } from "./Composer";
import { ConversationHeader } from "./ConversationHeader";
import { MessageList } from "./MessageList";
import { canEditCopilotComposer } from "./copilotComposerState";
import type { CopilotSessionFocusRequest } from "./copilotSessionFocus";
import type { CopilotPromptRequest } from "./copilotPromptRequest";
import {
	createCopilotPromptRequestGate,
	resolveCopilotPromptHandoff,
} from "./copilotPromptHandoff";
import { resolveCopilotSendAction } from "./copilotStreamControl";
import { useCopilotApproval } from "./useCopilotApproval";
import { useCopilotSessionState } from "./useCopilotSessionState";
import { useCopilotStream } from "./useCopilotStream";
import { canUseCopilot } from "./copilotAccessPolicy";
import {
	getUserQuestionForAssistant,
	resolveUiError,
	sortMessages,
} from "./CopilotChat.helpers";
import "./CopilotChat.css";

export interface CopilotChatProps {
	hasSessionAccess?: boolean;
	focusRequest?: CopilotSessionFocusRequest | null;
	promptRequest?: CopilotPromptRequest | null;
	presentation?: "sidebar" | "workbench";
	compactReasoning?: boolean;
	artifactStore?: ArtifactStore;
	onMessagesChange?: (messages: AiAgentChatMessage[]) => void;
}

export function ConversationThread({
	hasSessionAccess = false,
	focusRequest = null,
	promptRequest = null,
	presentation = "sidebar",
	compactReasoning = false,
	artifactStore,
	onMessagesChange,
}: CopilotChatProps) {
	const copilotEnabled = canUseCopilot(
		getCopilotApiKey(),
		hasSessionAccess || hasCopilotSessionAccess(),
	);
	const [input, setInput] = useState("");
	const [queuedInput, setQueuedInput] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const [recomputingMessageId, setRecomputingMessageId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const activeStreamingSessionIdRef = useRef<string | null>(null);
	const streamInFlightRef = useRef(false);
	const streamAbortRef = useRef<AbortController | null>(null);
	const queuedInputRef = useRef<string | null>(null);
	const promptRequestGateRef = useRef(createCopilotPromptRequestGate());
	const {
		databases,
		focusedMessageId,
		focusNotice,
		messages,
		pendingAction,
		reloadMessages,
		reloadSessions,
		selectedDbId,
		sessionId,
		sessions,
		setFocusedMessageId,
		setFocusNotice,
		setMessages,
		setPendingAction,
		setSelectedDbId,
		setSessionId,
	} = useCopilotSessionState({
		activeStreamingSessionIdRef,
		copilotEnabled,
		focusRequest,
		streamInFlightRef,
	});
	const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
	const chatMessages = useMemo(
		() => sortedMessages.filter((m) => m.role === "user" || m.role === "assistant"),
		[sortedMessages],
	);
	const latestSqlMessageId = useMemo(() => {
		for (let index = chatMessages.length - 1; index >= 0; index -= 1) {
			const message = chatMessages[index];
			if (message.role !== "assistant") {
				continue;
			}
			const sql = message.generatedSql ?? extractSqlFromMarkdown(message.content ?? "");
			if (sql?.trim()) {
				return message.id;
			}
		}
		return null;
	}, [chatMessages]);
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
	const {
		abortStreaming,
		handleSend,
		handleSendText,
		handleStopStreaming,
	} = useCopilotStream({
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
	});
	const {
		approvalSchema,
		approvalValues,
		handleApprove,
		handleCancel,
		resetApprovalValues,
		setApprovalField,
	} = useCopilotApproval({
		copilotDisabledMessage,
		copilotEnabled,
		pendingAction,
		selectedDbId,
		sessionId,
		reloadMessages,
		reloadSessions,
		setError,
		setPendingAction,
		setSending,
	});

	useEffect(() => {
		onMessagesChange?.(sortedMessages);
	}, [onMessagesChange, sortedMessages]);

	useEffect(() => {
		if (!promptRequestGateRef.current.shouldConsume(promptRequest)) return;
		const decision = resolveCopilotPromptHandoff({
			request: promptRequest,
			sending,
		});
		if (decision.mode === "ignore") return;
		setFocusNotice(decision.notice);
		if (decision.mode === "queue") {
			queuedInputRef.current = decision.prompt;
			setQueuedInput(decision.prompt);
			setInput("");
			setError(null);
			abortStreaming();
			return;
		}
		if (decision.mode === "submit") {
			setInput("");
			void handleSendText(decision.prompt);
			return;
		}
		setInput(decision.prompt);
		requestAnimationFrame(() => {
			inputRef.current?.focus();
			if (!inputRef.current) return;
			inputRef.current.style.height = "auto";
			inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 160)}px`;
		});
	}, [promptRequest]);

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
			const nextSessionId =
				list.find((item) => item.id !== sessionId)?.id ?? null;
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
		queuedInputRef.current = null;
		setQueuedInput(null);
		setSessionId(null);
		setMessages([]);
		setPendingAction(null);
		setError(null);
		setFocusNotice(null);
		setFocusedMessageId(null);
		resetApprovalValues();
	}

	async function handleAssumptionCommit(
		messageId: string,
		key: string,
		nextValue: string,
	) {
		const sourceMessage = sortedMessages.find((message) => message.id === messageId);
		if (!sourceMessage) {
			setError("找不到需要重算的回答。");
			return;
		}
		const sourceQuestion = getUserQuestionForAssistant(sortedMessages, sourceMessage);
		if (!sourceQuestion?.trim()) {
			setError("缺少原始问题，无法重算口径。");
			return;
		}
		const sourceArtifact =
			artifactStore?.artifacts.find(
				(artifact) => artifact.sourceMessageId === messageId,
			) ?? null;
		setRecomputingMessageId(messageId);
		try {
			await handleSendText(sourceQuestion, {
				assumptionOverrides: { [key]: nextValue },
				replaceAssistantMessageId: messageId,
				...(sourceArtifact ? { recomputeArtifactId: sourceArtifact.id } : {}),
			});
		} finally {
			setRecomputingMessageId(null);
		}
	}

	return (
		<div
			className={[
				"copilot-chat",
				presentation === "workbench" ? "copilot-chat--workbench" : "",
				compactReasoning ? "copilot-chat--compact-reasoning" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<ConversationHeader
				copilotEnabled={copilotEnabled}
				databases={databases}
				selectedDbId={selectedDbId}
				sending={sending}
				sessionId={sessionId}
				sessions={sessions}
				onDeleteSession={handleDeleteSession}
				onNewChat={handleNewChat}
				onSelectSession={(nextSessionId) => {
					if (!nextSessionId) {
						handleNewChat();
						return;
					}
					setFocusNotice(null);
					setFocusedMessageId(null);
					setSessionId(nextSessionId);
				}}
			/>
			<MessageList
				copilotDisabledMessage={copilotDisabledMessage}
				copilotEnabled={copilotEnabled}
				compactReasoning={compactReasoning}
				databases={databases}
				focusNotice={focusNotice}
				focusedMessageId={focusedMessageId}
				latestSqlMessageId={latestSqlMessageId}
				scrollRef={scrollRef}
				selectedDbId={selectedDbId}
				sessionId={sessionId}
				sortedMessages={sortedMessages}
				chatMessages={chatMessages}
				activeArtifactMessageId={artifactStore?.current?.sourceMessageId ?? null}
				recomputingMessageId={recomputingMessageId}
				onAssumptionCommit={(messageId, key, nextValue) => {
					void handleAssumptionCommit(messageId, key, nextValue);
				}}
				onSelectArtifact={(messageId) => {
					const artifact = artifactStore?.artifacts.find(
						(item) => item.sourceMessageId === messageId,
					);
					if (artifact) {
						artifactStore?.setCurrent(artifact.id);
					}
				}}
				onClarificationAnswer={(messageId, question, answers) => {
					setMessages((prev) =>
						prev.map((message) =>
							message.id === messageId
								? { ...message, clarificationAnswered: true }
								: message,
						),
					);
					if (!question.trim()) {
						setError("缺少原始问题，无法继续执行澄清后的查询。");
						return;
					}
					void handleSendText(question, { clarificationAnswers: answers });
				}}
				onWelcomeQuestion={(question) => void handleSendText(question)}
			>
				{pendingAction && (
					<ApprovalPanel
						approvalSchema={approvalSchema}
						approvalValues={approvalValues}
						pendingAction={pendingAction}
						sending={sending}
						onApprove={handleApprove}
						onCancel={handleCancel}
						onFieldChange={setApprovalField}
					/>
				)}
				{error && <div className="copilot-chat__error">{error}</div>}
			</MessageList>
			<Composer
				canEditComposer={canEditComposer}
				copilotEnabled={copilotEnabled}
				input={input}
				inputRef={inputRef}
				sendAction={sendAction}
				sending={sending}
				onInputChange={setInput}
				onNewChat={handleNewChat}
				onStop={handleStopStreaming}
				onSubmit={handleSend}
				onVoiceTranscript={(text, isFinal) => {
					if (isFinal) {
						setInput((prev) => (prev ? `${prev} ${text}` : text));
					}
				}}
			/>
		</div>
	);
}
