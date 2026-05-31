import { describe, expect, it } from "vitest";
import type { MetricLensSummary, PlatformIndicatorListItem } from "../api/analyticsApi";
import {
	buildMetricAgentHref,
	buildMetricAgentPrompt,
	filterMetricAssets,
	toMetricAssetItems,
} from "./assetLibraryMetrics";

describe("assetLibraryMetrics", () => {
	it("normalizes platform metrics and metric lens rows into searchable assets", () => {
		const platformIndicators: PlatformIndicatorListItem[] = [
			{
				id: "governance-revenue",
				name: "项目收入",
				definition: "dts-platform 已发布治理指标",
				category: "经营",
				status: "已发布",
			},
		];
		const metricLens: MetricLensSummary[] = [
			{
				metricId: 7,
				name: "租赁收入",
				aggregation: "sum",
				timeGrain: "month",
				latestVersion: "v3",
			},
		];

		const items = toMetricAssetItems(platformIndicators, metricLens);

		expect(items).toHaveLength(2);
		expect(items[0]).toMatchObject({
			id: "platform:governance-revenue",
			name: "项目收入",
			source: "platform",
			sourceLabel: "dts-platform",
			status: "已发布",
		});
		expect(items[1]).toMatchObject({
			id: "lens:7",
			name: "租赁收入",
			source: "metric-lens",
			sourceLabel: "Metric Lens",
			version: "v3",
		});
		expect(filterMetricAssets(items, "租赁")).toHaveLength(1);
		expect(filterMetricAssets(items, "dts-platform")).toHaveLength(1);
	});

	it("builds a metric prompt and URL that AgentWorkspacePage can consume", () => {
		const [item] = toMetricAssetItems([
			{
				id: "cash-in",
				name: "回款金额",
				definition: "按月统计已确认回款。",
				status: "已发布",
			},
		], []);

		const prompt = buildMetricAgentPrompt(item);
		const href = buildMetricAgentHref(item);

		expect(prompt).toContain("回款金额");
		expect(prompt).toContain("平台治理指标");
		expect(prompt).toContain("口径");
		expect(href).toContain("/agent-bi?");
		expect(decodeURIComponent(href)).toContain("source=asset-library-metric");
		expect(decodeURIComponent(href)).toContain("metric=platform:cash-in");
		expect(decodeURIComponent(href)).toContain("submit=1");
	});
});
