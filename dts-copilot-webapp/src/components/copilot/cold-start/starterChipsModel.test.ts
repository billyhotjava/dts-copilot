import { describe, expect, it } from "vitest";
import type { CopilotSuggestedQuestion } from "../../../api/analyticsApi";
import { buildStarterChips } from "./starterChipsModel";

describe("buildStarterChips", () => {
	it("prefers API suggestions and removes duplicate labels", () => {
		const suggestions: CopilotSuggestedQuestion[] = [
			{ question: "本月各项目利润", domain: "project" },
			{ question: "本月各项目利润", domain: "project" },
			{ question: "报花趋势", domain: "flowerbiz" },
		];

		expect(buildStarterChips(suggestions).map((chip) => chip.label)).toEqual([
			"本月各项目利润",
			"报花趋势",
			"打开报花月报",
		]);
	});

	it("falls back to the existing welcome question model when suggestions are empty", () => {
		const chips = buildStarterChips([]);

		expect(chips.map((chip) => chip.label)).toContain("PRS 租赁经营总览");
		expect(chips.map((chip) => chip.label)).toContain("打开报花月报");
		expect(chips.every((chip) => chip.prompt.trim().length > 0)).toBe(true);
	});
});
