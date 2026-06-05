import { describe, expect, it } from "vitest";
import {
	GOVERNANCE_NAV_ITEMS,
	HIDDEN_LEGACY_NAV_IDS,
	MOBILE_NAV_ITEMS,
	PRIMARY_NAV_SECTIONS,
	getVisibleGovernanceItems,
	getVisibleNavigation,
} from "./appNavigation";
import { normalizeAgentWorkspaceView } from "../pages/AgentWorkspacePage";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROUTES_SOURCE = readFileSync(resolve(__dirname, "../routes.tsx"), "utf8");

function allNavigationTargets() {
	return [
		...PRIMARY_NAV_SECTIONS.flatMap((section) => section.items),
		...GOVERNANCE_NAV_ITEMS,
		...MOBILE_NAV_ITEMS,
	];
}

function routePathExists(pathname: string): boolean {
	return ROUTES_SOURCE.includes(`path: "${pathname}"`);
}

describe("appNavigation", () => {
	it("keeps the visible sidebar focused on the four agent workspace entries", () => {
		const visibleIds = getVisibleNavigation({
			privileged: true,
			superuser: true,
		})
			.flatMap((section) => section.items)
			.map((item) => item.id);

		expect(visibleIds).toEqual([
			"newChat",
			"chatHistory",
			"assets",
			"signals",
		]);
	});

	it("does not expose unfinished Metabase clone pages in primary navigation", () => {
		const visibleIds = PRIMARY_NAV_SECTIONS.flatMap((section) =>
			section.items.map((item) => item.id),
		).concat(GOVERNANCE_NAV_ITEMS.map((item) => item.id));

		expect(visibleIds).not.toEqual(
			expect.arrayContaining([...HIDDEN_LEGACY_NAV_IDS]),
		);
	});

	it("shows all business-facing workspace entries to non-privileged users", () => {
		const visibleItems = getVisibleNavigation({
			privileged: false,
			superuser: false,
		})
			.flatMap((section) => section.items);
		const visibleIds = visibleItems.map((item) => item.id);

		expect(visibleIds).toEqual(["newChat", "chatHistory", "assets", "signals"]);
		expect(visibleItems.find((item) => item.id === "assets")?.to).toBe("/asset-library");
	});

	it("keeps governance entries out of the sidebar and visible only to privileged users", () => {
		expect(getVisibleGovernanceItems({ privileged: false, superuser: false })).toEqual([]);
		expect(
			getVisibleGovernanceItems({ privileged: true, superuser: false }).map((item) => item.id),
		).toEqual(["dataSources", "models", "metrics", "users", "systemSettings"]);
		expect(
			getVisibleGovernanceItems({ privileged: false, superuser: true }).map((item) => item.id),
		).toEqual(["dataSources", "models", "metrics", "users", "systemSettings"]);
	});

	it("keeps every visible navigation target backed by a route or consumed workspace view", () => {
		for (const item of allNavigationTargets()) {
			const url = new URL(item.to, "http://dts.local");
			if (url.pathname === "/agent-bi" && url.searchParams.has("view")) {
				const view = url.searchParams.get("view");
				expect(normalizeAgentWorkspaceView(view), item.id).toBe(view);
				continue;
			}
			expect(routePathExists(url.pathname), item.id).toBe(true);
		}
	});
});
