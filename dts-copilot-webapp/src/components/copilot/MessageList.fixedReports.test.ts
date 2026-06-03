import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MESSAGE_LIST_SOURCE = readFileSync(resolve(__dirname, "MessageList.tsx"), "utf8");

describe("MessageList fixed report links", () => {
	it("does not synthesize fixed report hrefs when the candidate model marks them unavailable", () => {
		expect(MESSAGE_LIST_SOURCE).not.toContain("candidate.href ??");
		expect(MESSAGE_LIST_SOURCE).toContain("candidate.href ? (");
	});

	it("opens screen-backed fixed report links in a new browser window", () => {
		expect(MESSAGE_LIST_SOURCE).toContain("getScreenPreviewLinkTarget");
		expect(MESSAGE_LIST_SOURCE).toContain('target={getScreenPreviewLinkTarget(fixedReportShortcut.href)}');
		expect(MESSAGE_LIST_SOURCE).toContain('target={getScreenPreviewLinkTarget(candidate.href)}');
		expect(MESSAGE_LIST_SOURCE).toContain('rel={getScreenPreviewLinkRel(fixedReportShortcut.href)}');
		expect(MESSAGE_LIST_SOURCE).toContain('rel={getScreenPreviewLinkRel(candidate.href)}');
	});

	it("labels fixed report candidates as asset library candidates for users", () => {
		expect(MESSAGE_LIST_SOURCE).toContain("资产库候选");
		expect(MESSAGE_LIST_SOURCE).not.toContain("固定报表候选");
	});
});
