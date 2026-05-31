import { describe, expect, it } from "vitest";
import type { AiAgentChatSession } from "../../../api/analyticsApi";
import { buildPlaceholderSignals, pickResumableSession } from "./coldStartCardsModel";

describe("coldStartCardsModel", () => {
	it("picks the newest non-empty resumable session", () => {
		const sessions: AiAgentChatSession[] = [
			{ id: "empty", title: "你好", lastActiveAt: "2026-05-30T09:00:00Z" },
			{ id: "old", title: "项目利润分析", lastActiveAt: "2026-05-29T09:00:00Z" },
			{ id: "new", title: "报花趋势复盘", lastActiveAt: "2026-05-30T10:00:00Z" },
		];

		expect(pickResumableSession(sessions)?.id).toBe("new");
	});

	it("returns null when only greeting sessions exist", () => {
		expect(pickResumableSession([{ id: "s1", title: "你好" }])).toBeNull();
	});

	it("does not synthesize business signals from asset and session state", () => {
		const signals = buildPlaceholderSignals({
			dashboardCount: 2,
			cardCount: 5,
			session: { id: "s1", title: "报花趋势复盘" },
		});

		expect(signals).toEqual([]);
	});
});
