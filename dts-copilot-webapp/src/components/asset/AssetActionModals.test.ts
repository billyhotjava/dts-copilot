import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(resolve(__dirname, "AssetActionModals.tsx"), "utf8");

describe("AssetActionModals", () => {
	it("wires save-card, pin-dashboard, and export dialogs to asset operations", () => {
		expect(SOURCE).toContain("saveArtifactCard");
		expect(SOURCE).toContain("pinArtifactToDashboard");
		expect(SOURCE).toContain("downloadArtifactCsv");
		expect(SOURCE).toContain("downloadArtifactPng");
		expect(SOURCE).toContain("analyticsApi.listCollections");
		expect(SOURCE).toContain("analyticsApi.listDashboards");
	});

	it("offers the expected user-facing actions", () => {
		expect(SOURCE).toContain("存为卡片");
		expect(SOURCE).toContain("钉到看板");
		expect(SOURCE).toContain("导出 CSV");
		expect(SOURCE).toContain("导出 PNG");
	});
});
