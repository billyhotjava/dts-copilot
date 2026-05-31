import { describe, expect, it } from "vitest";
import { mergeTranscript } from "./coldStartComposerModel";

describe("mergeTranscript", () => {
	it("uses the transcript when the input is empty", () => {
		expect(mergeTranscript("", " 报花趋势 ")).toBe("报花趋势");
	});

	it("appends final transcript to existing typed text with a readable space", () => {
		expect(mergeTranscript("本月各项目利润", "报花趋势")).toBe("本月各项目利润 报花趋势");
	});

	it("does not duplicate a transcript already present at the end", () => {
		expect(mergeTranscript("本月各项目利润", "各项目利润")).toBe("本月各项目利润");
	});
});
