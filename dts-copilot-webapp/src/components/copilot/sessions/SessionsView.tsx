import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type AiAgentChatSession } from "../../../api/analyticsApi";

type SessionsViewState = {
	loading: boolean;
	error: string | null;
	sessions: AiAgentChatSession[];
};

type SessionsViewProps = {
	onNewQuestion: () => void;
	onOpenSession: (session: AiAgentChatSession) => void;
};

const INITIAL_STATE: SessionsViewState = {
	loading: true,
	error: null,
	sessions: [],
};

export function SessionsView({ onNewQuestion, onOpenSession }: SessionsViewProps) {
	const [state, setState] = useState<SessionsViewState>(INITIAL_STATE);

	useEffect(() => {
		let active = true;
		void (async () => {
			try {
				const sessions = await analyticsApi.listAiAgentSessions(50);
				if (!active) return;
				setState({
					loading: false,
					error: null,
					sessions,
				});
			} catch {
				if (!active) return;
				setState({
					loading: false,
					error: "历史会话读取失败，请稍后重试。",
					sessions: [],
				});
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const sessions = useMemo(
		() => sortSessionsByLastActiveAt(state.sessions),
		[state.sessions],
	);

	return (
		<section className="agent-sessions-view" aria-labelledby="agent-sessions-title">
			<div className="agent-sessions-view__header">
				<div>
					<p className="agent-sessions-view__eyebrow">Agent BI</p>
					<h1 id="agent-sessions-title">历史会话</h1>
					<p>继续之前的分析上下文,或回到新问题重新开始。</p>
				</div>
				<button
					type="button"
					className="agent-sessions-view__new"
					onClick={onNewQuestion}
				>
					新问题
				</button>
			</div>

			{state.loading ? (
				<p className="agent-sessions-view__status">正在读取历史会话...</p>
			) : state.error ? (
				<p className="agent-sessions-view__status agent-sessions-view__status--error">
					{state.error}
				</p>
			) : sessions.length === 0 ? (
				<p className="agent-sessions-view__status">暂无历史会话。</p>
			) : (
				<ul className="agent-sessions-view__list">
					{sessions.map((session) => {
						const title = resolveSessionTitle(session);
						return (
							<li key={session.id} className="agent-sessions-view__item">
								<button
									type="button"
									className="agent-sessions-view__session"
									onClick={() => onOpenSession(session)}
								>
									<span className="agent-sessions-view__session-title">{title}</span>
									<span className="agent-sessions-view__session-meta">
										{formatSessionTime(session)}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

function sortSessionsByLastActiveAt(
	sessions: AiAgentChatSession[],
): AiAgentChatSession[] {
	return [...sessions].sort(
		(left, right) =>
			parseSessionActivityTime(right) - parseSessionActivityTime(left),
	);
}

function parseSessionActivityTime(session: AiAgentChatSession): number {
	const timestamp = Date.parse(session.lastActiveAt ?? session.createdAt ?? "");
	return Number.isFinite(timestamp) ? timestamp : 0;
}

function resolveSessionTitle(session: AiAgentChatSession): string {
	return session.title?.trim() || `会话 ${session.id}`;
}

function formatSessionTime(session: AiAgentChatSession): string {
	const raw = session.lastActiveAt ?? session.createdAt;
	if (!raw) {
		return "暂无更新时间";
	}
	const timestamp = Date.parse(raw);
	if (!Number.isFinite(timestamp)) {
		return "暂无更新时间";
	}
	return new Intl.DateTimeFormat("zh-CN", {
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(timestamp));
}
