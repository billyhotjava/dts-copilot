import { describe, expect, it } from "vitest";
import type { DashboardCard, DashboardDetail } from "../../api/analyticsApi";
import {
	appendCardToDashboardLayout,
	buildSaveDashboardPayload,
} from "./dashboardLayout";

describe("dashboardLayout", () => {
	it("appends a card to an empty dashboard layout", () => {
		expect(appendCardToDashboardLayout([], 42)).toEqual([
			{
				card_id: 42,
				col: 0,
				id: 0,
				row: 0,
				size_x: 12,
				size_y: 6,
			},
		]);
	});

	it("places new cards below the existing layout without mutating input", () => {
		const existing: DashboardCard[] = [
			{ id: 1, card_id: 1, row: 0, col: 0, size_x: 12, size_y: 6 },
			{ id: 2, card_id: 2, row: 6, col: 12, size_x: 12, size_y: 4 },
		];
		const next = appendCardToDashboardLayout(existing, "99", { size_x: 8, size_y: 5 });

		expect(next).toHaveLength(3);
		expect(next[2]).toMatchObject({
			card_id: 99,
			col: 0,
			row: 10,
			size_x: 8,
			size_y: 5,
		});
		expect(existing).toHaveLength(2);
	});

	it("builds the dashboard save payload shape used by DashboardEditorPage", () => {
		const dashboard: DashboardDetail = {
			collection_id: 3,
			description: "月度经营",
			id: 7,
			name: "经营看板",
		};
		const dashcards = appendCardToDashboardLayout([], 42);

		expect(buildSaveDashboardPayload(dashboard, dashcards)).toEqual({
			dashboard: {
				collection_id: 3,
				description: "月度经营",
				id: 7,
				name: "经营看板",
			},
			dashcards: [
				{
					card_id: 42,
					col: 0,
					parameter_mappings: [],
					row: 0,
					size_x: 12,
					size_y: 6,
					visualization_settings: {},
					_seriesIndex: 0,
				},
			],
		});
	});
});
