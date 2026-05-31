import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeAssetLibraryTab } from "./AssetLibraryPage";

const PAGE_SOURCE = readFileSync(resolve(__dirname, "AssetLibraryPage.tsx"), "utf8");
const DASHBOARDS_SOURCE = readFileSync(resolve(__dirname, "DashboardsPage.tsx"), "utf8");
const CARDS_SOURCE = readFileSync(resolve(__dirname, "CardsPage.tsx"), "utf8");
const COLLECTIONS_SOURCE = readFileSync(resolve(__dirname, "CollectionsPage.tsx"), "utf8");

describe("AssetLibraryPage", () => {
	it("normalizes unknown tab values to dashboards", () => {
		expect(normalizeAssetLibraryTab(null)).toBe("dashboards");
		expect(normalizeAssetLibraryTab("dashboards")).toBe("dashboards");
		expect(normalizeAssetLibraryTab("cards")).toBe("cards");
		expect(normalizeAssetLibraryTab("collections")).toBe("collections");
		expect(normalizeAssetLibraryTab("legacy")).toBe("dashboards");
	});

	it("keeps asset browsing as a secondary tabbed entry without nesting full pages", () => {
		expect(PAGE_SOURCE).toContain("useSearchParams");
		expect(PAGE_SOURCE).toContain("资产库");
		expect(PAGE_SOURCE).toContain('<Tab value="dashboards">看板</Tab>');
		expect(PAGE_SOURCE).toContain("<DashboardsPage embedded />");
		expect(PAGE_SOURCE).toContain("<CardsPage embedded />");
		expect(PAGE_SOURCE).toContain("<CollectionsPage embedded />");
		expect(PAGE_SOURCE).not.toContain("<DashboardsPage />");
		expect(PAGE_SOURCE).not.toContain("<CardsPage />");
		expect(PAGE_SOURCE).not.toContain("<CollectionsPage />");
	});

	it("lets legacy asset list pages suppress their own page chrome when embedded", () => {
		expect(DASHBOARDS_SOURCE).toContain("embedded = false");
		expect(DASHBOARDS_SOURCE).toContain("{!embedded ? (");
		expect(CARDS_SOURCE).toContain("embedded = false");
		expect(CARDS_SOURCE).toContain("{!embedded ? (");
		expect(COLLECTIONS_SOURCE).toContain("embedded = false");
		expect(COLLECTIONS_SOURCE).toContain("{!embedded ? (");
	});
});
