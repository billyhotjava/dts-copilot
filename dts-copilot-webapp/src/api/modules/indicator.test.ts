import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchJson = vi.hoisted(() => vi.fn());

vi.mock("../httpClient.ts", () => {
	class MockHttpError extends Error {
		status: number;
		bodyText: string;
		constructor(status: number, message: string, bodyText: string) {
			super(message);
			this.status = status;
			this.bodyText = bodyText;
		}
	}
	return {
		fetchJson,
		HttpError: MockHttpError,
	};
});

import { HttpError } from "../httpClient.ts";
import { indicatorApi } from "./indicator";

describe("indicatorApi", () => {
	beforeEach(() => {
		fetchJson.mockReset();
	});

	it("lists platform indicators and normalizes missing items", async () => {
		fetchJson.mockResolvedValueOnce({
			items: [
				{
					id: "cash-in",
					name: "回款金额",
					status: "已发布",
				},
			],
		});

		await expect(indicatorApi.listPlatformIndicators()).resolves.toMatchObject({
			items: [{ id: "cash-in", name: "回款金额" }],
		});
		expect(fetchJson).toHaveBeenCalledWith("/api/analytics/platform/indicators");

		fetchJson.mockResolvedValueOnce({});
		await expect(indicatorApi.listPlatformIndicators()).resolves.toMatchObject({
			items: [],
		});
	});

	it("returns degraded catalog instead of throwing when platform indicators fail", async () => {
		fetchJson.mockRejectedValueOnce(new HttpError(503, "unavailable", ""));

		await expect(indicatorApi.listPlatformIndicators()).resolves.toMatchObject({
			items: [],
			degraded: true,
			degradedReason: "平台指标服务暂不可达",
		});
	});

	it("fetches detail values and degrades value requests", async () => {
		fetchJson.mockResolvedValueOnce({
			indicatorId: "cash-in",
			mode: "detail",
			cols: [{ name: "month" }, { name: "value" }],
			rows: [["2026-05", 100]],
		});

		await expect(indicatorApi.getPlatformIndicatorDetail("cash-in", 30)).resolves.toMatchObject({
			indicatorId: "cash-in",
			mode: "detail",
			rows: [["2026-05", 100]],
		});
		expect(fetchJson).toHaveBeenCalledWith(
			"/api/analytics/platform/indicators/cash-in/detail?days=30",
		);

		fetchJson.mockRejectedValueOnce(new HttpError(404, "missing", ""));
		await expect(indicatorApi.getPlatformIndicatorDetail("missing")).resolves.toMatchObject({
			indicatorId: "missing",
			mode: "detail",
			cols: [],
			rows: [],
			degraded: true,
			degradedReason: "平台指标取值失败",
		});
	});

	it("builds dashboard and drilldown URLs", async () => {
		fetchJson.mockResolvedValueOnce({
			indicatorId: "_all",
			mode: "dashboard",
			cols: [],
			rows: [],
		});
		await indicatorApi.getPlatformIndicatorDashboard(7);
		expect(fetchJson).toHaveBeenCalledWith(
			"/api/analytics/platform/indicators/dashboard?days=7",
		);

		fetchJson.mockResolvedValueOnce({
			indicatorId: "cash-in",
			mode: "drilldown",
			cols: [],
			rows: [],
		});
		await indicatorApi.getPlatformIndicatorDrilldown("cash-in", "project", "2026-05");
		expect(fetchJson).toHaveBeenCalledWith(
			"/api/analytics/platform/indicators/cash-in/drilldown?dimension=project&period=2026-05",
		);
	});
});
