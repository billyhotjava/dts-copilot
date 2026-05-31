import type { AiAgentChatSession } from "../../../api/analyticsApi";

export type ColdStartSignal = {
	id: string;
	title: string;
	description: string;
};

export type ColdStartSignalInput = {
	dashboardCount: number;
	cardCount: number;
	session: AiAgentChatSession | null;
};

const GREETING_TITLES = new Set(["你好", "您好", "hi", "hello", "新对话", "开始"]);

function sessionTimeValue(session: AiAgentChatSession): number {
	const raw = session.lastActiveAt ?? session.createdAt;
	if (!raw) return 0;
	const value = Date.parse(raw);
	return Number.isFinite(value) ? value : 0;
}

function isResumableSession(session: AiAgentChatSession): boolean {
	const title = session.title?.trim();
	if (!title) return false;
	return !GREETING_TITLES.has(title.toLowerCase());
}

export function pickResumableSession(
	sessions: AiAgentChatSession[],
): AiAgentChatSession | null {
	const resumable = sessions.filter(isResumableSession);
	if (resumable.length === 0) return null;
	return [...resumable].sort((a, b) => sessionTimeValue(b) - sessionTimeValue(a))[0];
}

export function buildPlaceholderSignals(input: ColdStartSignalInput): ColdStartSignal[] {
	void input;
	return [];
}
