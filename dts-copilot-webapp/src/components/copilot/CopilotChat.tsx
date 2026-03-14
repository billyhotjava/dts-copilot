import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	AiAgentChatMessage,
	AiAgentChatResponse,
	AiAgentChatSession,
	AiAgentPendingAction,
	MicroFormSchema,
} from "../../api/analyticsApi";
import { AuthError, analyticsApi } from "../../api/analyticsApi";
import type { CopilotObjectContext } from "../../hooks/useCopilotContext";
import { renderObjectRefs } from "./ObjectRefLink";
import { TracePanel } from "./TracePanel";
import "./CopilotChat.css";

type CopilotSendBody = Parameters<typeof analyticsApi.aiAgentChatSend>[0];
type FormValues = Record<string, string | number | undefined>;

const SESSION_ID_KEY = "dts-analytics.copilot.sessionId";

const MICRO_FORM_PRESETS: Record<string, MicroFormSchema> = {
	validate_sql: {
		title: "SQL 执行前确认",
		description: "AI 已补全主要参数，请补齐缺失项后再执行。",
		riskLevel: "MEDIUM",
		riskNote: "将触发真实 SQL 校验并读取元数据。",
		fields: [
			{ key: "datasourceId", label: "数据源", required: true, placeholder: "例如: pg-main", source: "session_context" },
			{
				key: "schemaName",
				label: "Schema",
				required: true,
				placeholder: "例如: analytics",
				source: "metadata_profile",
			},
			{ key: "sql", label: "SQL", type: "textarea", required: true, source: "ai_draft" },
		],
	},
	generate_task: {
		title: "任务创建确认",
		description: "请确认任务内容和优先级，避免误建任务。",
		riskLevel: "LOW",
		fields: [
			{ key: "title", label: "任务标题", required: true, source: "ai_summary" },
			{
				key: "priority",
				label: "优先级",
				type: "select",
				required: true,
				value: "P2",
				options: [
					{ label: "P1", value: "P1" },
					{ label: "P2", value: "P2" },
					{ label: "P3", value: "P3" },
				],
			},
			{ key: "description", label: "任务描述", type: "textarea", required: true, source: "ai_plan" },
		],
	},
	trigger_pipeline: {
		title: "流水线触发确认",
		description: "该操作会触发 Airflow DAG 执行，请确认 DAG 参数。",
		riskLevel: "HIGH",
		riskNote: "属于执行类操作，建议二次确认后再执行。",
		fields: [
			{ key: "dagId", label: "DAG ID", required: true, placeholder: "例如: dbt_load", source: "session_context" },
			{
				key: "confJson",
				label: "运行参数(JSON，可选)",
				type: "textarea",
				placeholder: '{"bizDate":"2026-03-03"}',
				helpText: "仅支持 JSON 对象格式，留空则不传 conf。",
			},
		],
	},
};

function getStoredSessionId(): string | null {
	try {
		const value = sessionStorage.getItem(SESSION_ID_KEY);
		return value?.trim() ? value : null;
	} catch {
		return null;
	}
}

interface Props {
	objectContext: CopilotObjectContext;
}

function resolveUiError(error: unknown, fallback: string): string {
	if (error instanceof AuthError) {
		return "登录状态已失效，请刷新页面后重试。";
	}
	return error instanceof Error ? error.message : fallback;
}

function toArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

function sortMessages(messages: AiAgentChatMessage[]): AiAgentChatMessage[] {
	return [...messages].sort((left, right) => {
		const seq = (left.sequenceNum ?? 0) - (right.sequenceNum ?? 0);
		if (seq !== 0) return seq;
		return (left.createdAt ?? "").localeCompare(right.createdAt ?? "");
	});
}

function normalizeMicroForm(action: AiAgentPendingAction | null): MicroFormSchema | undefined {
	if (!action) return undefined;
	if (action.microForm?.fields?.length) {
		return action.microForm;
	}
	const inlineSchema = action.params?.microForm as MicroFormSchema | undefined;
	if (inlineSchema?.fields?.length) {
		return inlineSchema;
	}
	return MICRO_FORM_PRESETS[action.toolId];
}

function buildInitialApprovalValues(
	action: AiAgentPendingAction | null,
	schema: MicroFormSchema | undefined,
): FormValues {
	if (!action || !schema) return {};
	const values: FormValues = {};
	for (const field of schema.fields) {
		if (field.value !== undefined) {
			values[field.key] = field.value;
			continue;
		}
		const paramValue = action.params?.[field.key];
		if (typeof paramValue === "string" || typeof paramValue === "number") {
			values[field.key] = paramValue;
		}
	}
	if (
		schema.fields.some((field) => field.key === "confJson")
		&& action.params?.conf
		&& typeof action.params.conf === "object"
	) {
		try {
			values.confJson = JSON.stringify(action.params.conf);
		} catch {
			/* ignore */
		}
	}
	return values;
}

export function CopilotChat({ objectContext }: Props) {
	const [sessionId, setSessionId] = useState<string | null>(() =>
		getStoredSessionId(),
	);
	const [sessions, setSessions] = useState<AiAgentChatSession[]>([]);
	const [messages, setMessages] = useState<AiAgentChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [sending, setSending] = useState(false);
	const [pendingAction, setPendingAction] =
		useState<AiAgentPendingAction | null>(null);
	const [approvalValues, setApprovalValues] = useState<FormValues>({});
	const [error, setError] = useState<string | null>(null);
	const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
	const scrollRef = useRef<HTMLDivElement>(null);
	const sortedMessages = useMemo(() => sortMessages(messages), [messages]);
	const approvalSchema = useMemo(
		() => normalizeMicroForm(pendingAction),
		[pendingAction],
	);

	const reloadSessions = useCallback(async () => {
		try {
			const rows = await analyticsApi.listAiAgentSessions(50);
			const list = toArray<AiAgentChatSession>(rows);
			setSessions(list);
			return list;
		} catch {
			return [];
		}
	}, []);

	const reloadMessages = useCallback(async (sid: string) => {
		try {
			const detail = await analyticsApi.getAiAgentSession(sid);
			setMessages(sortMessages(detail.messages ?? []));
			setPendingAction(detail.pendingAction ?? null);
		} catch {
			/* ignore */
		}
	}, []);

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

	// Load sessions and restore initial session context from storage.
	// This bootstrap should only run on mount; otherwise "new chat" state is overwritten.
	useEffect(() => {
		let active = true;
		void (async () => {
			const list = await reloadSessions();
			if (!active) return;
			if (!sessionId && list.length > 0) {
				setSessionId(list[0].id);
				return;
			}
			if (sessionId && list.length > 0 && !list.some((item) => item.id === sessionId)) {
				setSessionId(list[0].id);
			}
		})();
		return () => {
			active = false;
		};
	}, [reloadSessions]);

	// Restore messages for current backend session.
	useEffect(() => {
		if (!sessionId) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		void reloadMessages(sessionId);
	}, [sessionId, reloadMessages]);

	useEffect(() => {
		setApprovalValues(buildInitialApprovalValues(pendingAction, approvalSchema));
	}, [pendingAction, approvalSchema]);

	// Scroll to bottom when conversation content updates.
	useEffect(() => {
		scrollRef.current?.scrollTo({
			top: scrollRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [sortedMessages, pendingAction, sending]);

	async function handleSend() {
		const text = input.trim();
		if (!text || sending) return;
		setInput("");
		setSending(true);
		setError(null);

		const optimistic: AiAgentChatMessage = {
			id: `opt-${Date.now()}`,
			sessionId: sessionId ?? "",
			role: "user",
			content: text,
			sequenceNum: messages.length,
		};
		setMessages((prev) => [...prev, optimistic]);

		try {
			const body: CopilotSendBody = {
				userMessage: text,
				...(sessionId ? { sessionId } : {}),
				...(objectContext.typeId
					? {
							objectContext: {
								typeId: objectContext.typeId,
								instanceId: objectContext.instanceId,
								displayName: objectContext.displayName,
							},
						}
					: {}),
			};

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
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "Failed to send"));
		} finally {
			setSending(false);
		}
	}

	async function handleApprove() {
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
			setError(resolveUiError(e, "Approval failed"));
		} finally {
			setSending(false);
		}
	}

	async function handleCancel() {
		if (!sessionId || !pendingAction?.actionId) return;
		setSending(true);
		try {
			await analyticsApi.aiAgentChatCancel(sessionId, pendingAction.actionId);
			setPendingAction(null);
			await reloadMessages(sessionId);
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "Cancel failed"));
		} finally {
			setSending(false);
		}
	}

	async function handleDeleteSession() {
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
			setError(resolveUiError(e, "Delete session failed"));
		} finally {
			setSending(false);
		}
	}

	function handleNewChat() {
		setSessionId(null);
		setMessages([]);
		setPendingAction(null);
		setError(null);
		setApprovalValues({});
	}

	return (
		<div className="copilot-chat">
			{/* Context bar */}
			{objectContext.typeId && (
				<div className="copilot-chat__context-bar">
					<span className="copilot-chat__context-icon">📋</span>
					<span className="copilot-chat__context-text">
						{objectContext.typeId}
						{objectContext.instanceId &&
							` / ${objectContext.displayName || objectContext.instanceId}`}
					</span>
				</div>
			)}

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
						setSessionId(next);
					}}
					disabled={sending}
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
					disabled={sending}
				>
					新建
				</button>
				<button
					type="button"
					className="copilot-chat__mini-btn copilot-chat__mini-btn--danger"
					onClick={() => void handleDeleteSession()}
					disabled={sending || !sessionId}
				>
					删除
				</button>
			</div>

			{/* Messages */}
			<div className="copilot-chat__messages" ref={scrollRef}>
				{sortedMessages.length === 0 ? (
					<div className="copilot-chat__empty">
						Ask me about your data, objects, or actions.
					</div>
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
						return (
							<div
								key={msg.id}
								className={`copilot-chat__msg copilot-chat__msg--${msg.role}`}
							>
								<div className="copilot-chat__msg-content">
									{msg.role === "assistant"
										? renderObjectRefs(msg.content ?? "")
										: msg.content}
								</div>
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
											{traceExpanded ? "Hide" : "View"} reasoning (
											{toolMsgs.length} step{toolMsgs.length > 1 ? "s" : ""})
										</button>
										{traceExpanded && <TracePanel toolMessages={toolMsgs} />}
									</>
								)}
							</div>
						);
					})}

				{/* Pending approval */}
				{pendingAction && (
					<div className="copilot-chat__approval">
						<div className="copilot-chat__approval-title">Pending Approval</div>
						<div className="copilot-chat__approval-detail">
							Tool: {pendingAction.toolId}
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
								Approve
							</button>
							<button
								type="button"
								className="copilot-chat__btn copilot-chat__btn--cancel"
								onClick={handleCancel}
								disabled={sending}
							>
								Reject
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
					title="New chat"
					disabled={sending}
				>
					+
				</button>
				<input
					className="copilot-chat__input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					placeholder="Ask a question..."
					disabled={sending}
				/>
				<button
					type="button"
					className="copilot-chat__send-btn"
					onClick={handleSend}
					disabled={sending || !input.trim()}
				>
					{sending ? "..." : "→"}
				</button>
			</div>
		</div>
	);
}

/**
 * Collect tool messages that belong to a given assistant message.
 * Groups tool messages between the preceding user message and this assistant message.
 */
function getToolMessagesForAssistant(
	allMessages: AiAgentChatMessage[],
	assistantMsg: AiAgentChatMessage,
): AiAgentChatMessage[] {
	const assistantSeq = assistantMsg.sequenceNum ?? 0;
	// Find the last user message before this assistant message
	let lastUserSeq = -1;
	for (const m of allMessages) {
		const seq = m.sequenceNum ?? 0;
		if (m.role === "user" && seq < assistantSeq) {
			lastUserSeq = Math.max(lastUserSeq, seq);
		}
	}
	return allMessages.filter(
		(m) =>
			m.role === "tool" &&
			(m.sequenceNum ?? 0) > lastUserSeq &&
			(m.sequenceNum ?? 0) < assistantSeq,
	);
}
