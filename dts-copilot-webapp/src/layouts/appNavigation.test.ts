import { describe, expect, it } from "vitest";
import {
	ADMIN_NAV_ITEMS,
	HIDDEN_LEGACY_NAV_IDS,
	PRIMARY_NAV_SECTIONS,
	getVisibleNavigation,
} from "./appNavigation";

describe("appNavigation", () => {
	it("keeps the visible sidebar focused on implemented agent BI flows", () => {
		const visibleIds = getVisibleNavigation({
			privileged: true,
			superuser: true,
		})
			.flatMap((section) => section.items)
			.map((item) => item.id);

		expect(visibleIds).toEqual([
			"agentReports",
			"dashboards",
			"dataSources",
			"users",
			"systemSettings",
		]);
	});

	it("does not expose unfinished Metabase clone pages in primary navigation", () => {
		const visibleIds = PRIMARY_NAV_SECTIONS.flatMap((section) =>
			section.items.map((item) => item.id),
		).concat(ADMIN_NAV_ITEMS.map((item) => item.id));

		expect(visibleIds).not.toEqual(
			expect.arrayContaining([...HIDDEN_LEGACY_NAV_IDS]),
		);
	});

	it("shows only business-facing core entries to non-privileged users", () => {
		const visibleIds = getVisibleNavigation({
			privileged: false,
			superuser: false,
		})
			.flatMap((section) => section.items)
			.map((item) => item.id);

		expect(visibleIds).toEqual(["agentReports", "dashboards"]);
	});
});
