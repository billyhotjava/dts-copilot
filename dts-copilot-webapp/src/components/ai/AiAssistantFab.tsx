import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	analyticsApi,
	AuthError,
	type AiAgentChatMessage,
	type AiAgentChatSession,
	type AiAgentPendingAction,
} from "../../api/analyticsApi";
import { getPageContext } from "../../hooks/pageContext";
import { Button, TextArea } from "../../ui";
import { AI_QUICK_ASK_EVENT } from "./AiQuickAsk";
import "./AiAssistantFab.css";

type SessionDetail = {
	messages?: AiAgentChatMessage[];
	pendingAction?: AiAgentPendingAction | null;
};

function toArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

function text(value: unknown): string {
	return typeof value === "string" ? value : "";
}

function sortMessages(messages: AiAgentChatMessage[]): AiAgentChatMessage[] {
	return [...messages].sort((left, right) => {
		const seq = (left.sequenceNum ?? 0) - (right.sequenceNum ?? 0);
		if (seq !== 0) return seq;
		return text(left.createdAt).localeCompare(text(right.createdAt));
	});
}

function stringifyPayload(value: unknown): string {
	if (typeof value === "string") return value;
	if (value == null) return "";
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function resolveUiError(error: unknown, fallback: string): string {
	if (error instanceof AuthError) {
		return "登录状态已失效，请刷新页面后重试。";
	}
	return error instanceof Error ? error.message : fallback;
}

export default function AiAssistantFab() {
	const [open, setOpen] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [sessions, setSessions] = useState<AiAgentChatSession[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(
		undefined,
	);
	const [messages, setMessages] = useState<AiAgentChatMessage[]>([]);
	const [pendingAction, setPendingAction] =
		useState<AiAgentPendingAction | null>(null);
	const messagesViewportRef = useRef<HTMLDivElement | null>(null);

	const currentSession = useMemo(
		() => sessions.find((session) => session.id === currentSessionId),
		[sessions, currentSessionId],
	);
	const sortedMessages = useMemo(() => sortMessages(messages), [messages]);

	const reloadSessions = useCallback(async () => {
		const rows = await analyticsApi.listAiAgentSessions(50);
		const list = toArray<AiAgentChatSession>(rows);
		setSessions(list);
		return list;
	}, []);

	const loadSession = useCallback(async (sessionId: string) => {
		const detail = (await analyticsApi.getAiAgentSession(
			sessionId,
		)) as SessionDetail;
		setCurrentSessionId(sessionId);
		setMessages(toArray<AiAgentChatMessage>(detail?.messages));
		setPendingAction(detail?.pendingAction ?? null);
	}, []);

	const switchSession = useCallback(
		async (sessionId: string) => {
			setLoading(true);
			setError("");
			try {
				await loadSession(sessionId);
			} catch (err) {
				setError(resolveUiError(err, "加载会话失败"));
			} finally {
				setLoading(false);
			}
		},
		[loadSession],
	);

	const createSession = useCallback(() => {
		setCurrentSessionId(undefined);
		setMessages([]);
		setPendingAction(null);
		setPrompt("");
		setError("");
	}, []);

	const deleteSession = useCallback(
		async (sessionId: string) => {
			setLoading(true);
			setError("");
			try {
				await analyticsApi.deleteAiAgentSession(sessionId);
				const list = await reloadSessions();
				if (currentSessionId === sessionId) {
					const next = list[0]?.id;
					if (next) {
						await loadSession(next);
					} else {
						createSession();
					}
				}
			} catch (err) {
				setError(resolveUiError(err, "删除会话失败"));
			} finally {
				setLoading(false);
			}
		},
		[currentSessionId, createSession, loadSession, reloadSessions],
	);

	const sendMessage = useCallback(
		async (content: string) => {
			const question = content.trim();
			if (!question || loading) return;
			setLoading(true);
			setError("");
			try {
				const currentPageContext = getPageContext();
				const response = await analyticsApi.aiAgentChatSend({
					sessionId: currentSessionId,
					userMessage: question,
					...(currentPageContext ? { pageContext: currentPageContext } : {}),
				});
				const sessionId = text(response?.sessionId);
				if (sessionId) {
					await loadSession(sessionId);
				}
				setPendingAction(response?.pendingAction ?? null);
				await reloadSessions();
			} catch (err) {
				setError(resolveUiError(err, "发送失败"));
			} finally {
				setLoading(false);
			}
		},
		[currentSessionId, loadSession, loading, reloadSessions],
	);

	const approveAction = useCallback(
		async (actionId: string) => {
			if (!currentSessionId) return;
			setLoading(true);
			setError("");
			try {
				await analyticsApi.aiAgentChatApprove(currentSessionId, actionId);
				await loadSession(currentSessionId);
				setPendingAction(null);
				await reloadSessions();
			} catch (err) {
				setError(resolveUiError(err, "审批失败"));
			} finally {
				setLoading(false);
			}
		},
		[currentSessionId, loadSession, reloadSessions],
	);

	const cancelAction = useCallback(
		async (actionId: string) => {
			if (!currentSessionId) return;
			setLoading(true);
			setError("");
			try {
				await analyticsApi.aiAgentChatCancel(currentSessionId, actionId);
				await loadSession(currentSessionId);
				setPendingAction(null);
				await reloadSessions();
			} catch (err) {
				setError(resolveUiError(err, "取消失败"));
			} finally {
				setLoading(false);
			}
		},
		[currentSessionId, loadSession, reloadSessions],
	);

	useEffect(() => {
		if (!open) return;
		void (async () => {
			try {
				const list = await reloadSessions();
				if (!currentSessionId && list.length > 0) {
					await loadSession(list[0].id);
				}
			} catch (err) {
				setError(resolveUiError(err, "加载会话失败"));
			}
		})();
	}, [open, currentSessionId, loadSession, reloadSessions]);

	useEffect(() => {
		const handler = (event: Event) => {
			const prompt = (event as CustomEvent<string>).detail;
			if (typeof prompt === "string" && prompt.trim()) {
				setOpen(true);
				setPrompt(prompt);
				// Auto-send after a tick to let the panel render
				setTimeout(() => void sendMessage(prompt), 100);
			}
		};
		window.addEventListener(AI_QUICK_ASK_EVENT, handler);
		return () => window.removeEventListener(AI_QUICK_ASK_EVENT, handler);
	}, [sendMessage]);

	useEffect(() => {
		if (!open) return;
		const handler = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const viewport = messagesViewportRef.current;
		if (!viewport) return;
		viewport.scrollTop = viewport.scrollHeight;
	}, [open, sortedMessages, pendingAction]);

	const onSend = async () => {
		const value = prompt.trim();
		if (!value) return;
		setPrompt("");
		await sendMessage(value);
	};

	return (
		<>
			<button
				type="button"
				className="analytics-ai-chat__trigger"
				onClick={() => setOpen(true)}
				aria-label="打开 AI 助手"
			>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M4 4h16v11a3 3 0 0 1-3 3h-7l-4 3v-3H7a3 3 0 0 1-3-3z" />
				</svg>
			</button>

			{open ? (
				<div
					className="analytics-ai-chat__overlay"
					onClick={() => setOpen(false)}
					role="presentation"
				>
					<aside
						className="analytics-ai-chat__panel"
						onClick={(event) => event.stopPropagation()}
						role="dialog"
						aria-modal="true"
						aria-label="AI 助手"
					>
						<header className="analytics-ai-chat__header">
							<div>
								<div className="analytics-ai-chat__title">AI 助手</div>
								<div className="analytics-ai-chat__subtitle">
									接入 platform 同款 ai/agent/chat 全能力。
								</div>
							</div>
							<button
								type="button"
								className="analytics-ai-chat__close"
								onClick={() => setOpen(false)}
								aria-label="关闭"
							>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M18 6 6 18" />
									<path d="m6 6 12 12" />
								</svg>
							</button>
						</header>

						<div className="analytics-ai-chat__content">
							<section className="analytics-ai-chat__sessions">
								<div className="analytics-ai-chat__sessions-actions">
									<Button variant="secondary" size="sm" onClick={createSession}>
										新对话
									</Button>
								</div>
								<div className="analytics-ai-chat__sessions-list">
									{sessions.length <= 0 ? (
										<div className="analytics-ai-chat__empty-session">
											暂无会话
										</div>
									) : (
										sessions.map((session) => (
											<div
												key={session.id}
												className={
													session.id === currentSession?.id
														? "analytics-ai-chat__session analytics-ai-chat__session--active"
														: "analytics-ai-chat__session"
												}
											>
												<button
													type="button"
													className="analytics-ai-chat__session-main"
													onClick={() => void switchSession(session.id)}
												>
													<span className="analytics-ai-chat__session-title">
														{text(session.title) || session.id}
													</span>
												</button>
												<button
													type="button"
													className="analytics-ai-chat__session-delete"
													aria-label="删除会话"
													onClick={() => void deleteSession(session.id)}
												>
													<svg viewBox="0 0 24 24" aria-hidden="true">
														<path d="M3 6h18" />
														<path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
														<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
														<path d="M10 11v6" />
														<path d="M14 11v6" />
													</svg>
												</button>
											</div>
										))
									)}
								</div>
							</section>

							<section className="analytics-ai-chat__conversation">
								<div
									className="analytics-ai-chat__messages"
									ref={messagesViewportRef}
								>
									{pendingAction ? (
										<div className="analytics-ai-chat__approval">
											<div className="analytics-ai-chat__approval-title">
												待确认操作
											</div>
											<div className="analytics-ai-chat__approval-row">
												工具: {pendingAction.toolId}
											</div>
											<div className="analytics-ai-chat__approval-row">
												原因:{" "}
												{text(pendingAction.reason) || "该操作需要用户确认"}
											</div>
											<div className="analytics-ai-chat__approval-actions">
												<Button
													variant="primary"
													size="sm"
													loading={loading}
													onClick={() =>
														void approveAction(pendingAction.actionId)
													}
												>
													确认
												</Button>
												<Button
													variant="secondary"
													size="sm"
													loading={loading}
													onClick={() =>
														void cancelAction(pendingAction.actionId)
													}
												>
													取消
												</Button>
											</div>
										</div>
									) : null}

									{error ? (
										<div className="analytics-ai-chat__error">{error}</div>
									) : null}

									{sortedMessages.length <= 0 ? (
										<div className="analytics-ai-chat__empty">
											开始你的第一个问题，例如：请先梳理本周销售异常并给出后续检查动作。
										</div>
									) : (
										sortedMessages.map((message, index) => {
											if (message.role === "tool" && text(message.toolName) === "navigate_to_page") {
												let navData: { path?: string; description?: string; query?: Record<string, string> } = {};
												try {
													const raw = message.toolResult;
													if (typeof raw === "string") navData = JSON.parse(raw);
													else if (raw && typeof raw === "object") navData = raw as typeof navData;
												} catch { /* ignore */ }
												const navPath = typeof navData.path === "string" ? navData.path : "";
												const ALLOWED = ["/dashboard/", "/catalog/", "/governance/", "/explore/", "/modeling/", "/ops/", "/services/", "/app/", "/bi/"];
												const isAllowed = navPath && ALLOWED.some(p => navPath.startsWith(p));
												return (
													<div key={message.id || `${index}-nav`} className="analytics-ai-chat__tool" style={{ background: "#f0f9eb", border: "1px solid #b7eb8f", borderRadius: 6, padding: "8px 12px" }}>
														<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
															<span>{navData.description || "AI 建议前往查看"}</span>
															{isAllowed ? (
																<a href={navPath} style={{ marginLeft: "auto", fontWeight: 500 }}>前往查看 →</a>
															) : null}
														</div>
													</div>
												);
											}
											if (message.role === "tool") {
												return (
													<div
														key={message.id || `${index}-tool`}
														className="analytics-ai-chat__tool"
													>
														<div className="analytics-ai-chat__tool-title">
															Tool: {text(message.toolName) || "unknown"}
														</div>
														<details className="analytics-ai-chat__tool-block">
															<summary>参数</summary>
															<pre>{stringifyPayload(message.toolParams)}</pre>
														</details>
														<details
															className="analytics-ai-chat__tool-block"
															open
														>
															<summary>结果</summary>
															<pre>{stringifyPayload(message.toolResult)}</pre>
														</details>
													</div>
												);
											}
											const isUser = message.role === "user";
											return (
												<div
													key={message.id || `${index}-${message.role}`}
													className={
														isUser
															? "analytics-ai-chat__message analytics-ai-chat__message--user"
															: "analytics-ai-chat__message analytics-ai-chat__message--assistant"
													}
												>
													<div className="analytics-ai-chat__bubble">
														<div className="analytics-ai-chat__text">
															{text(message.content) ||
																(isUser ? "(empty)" : "(no response)")}
														</div>
													</div>
												</div>
											);
										})
									)}
								</div>

								<div className="analytics-ai-chat__composer">
									<TextArea
										rows={3}
										placeholder="输入你的问题，按 Enter 发送，Shift + Enter 换行"
										value={prompt}
										onChange={(event) => setPrompt(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												void onSend();
											}
										}}
									/>
									<div className="analytics-ai-chat__composer-actions">
										<Button variant="secondary" onClick={() => setOpen(false)}>
											关闭
										</Button>
										<Button
											variant="primary"
											loading={loading}
											onClick={() => void onSend()}
										>
											{loading ? "发送中" : "发送"}
										</Button>
									</div>
								</div>
							</section>
						</div>
					</aside>
				</div>
			) : null}
		</>
	);
}
