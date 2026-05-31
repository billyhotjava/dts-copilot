import type { MetricLensSummary, PlatformIndicatorListItem } from "../api/analyticsApi";

export type MetricAssetSource = "platform" | "metric-lens";

export interface MetricAssetItem {
	id: string;
	source: MetricAssetSource;
	sourceId: string;
	sourceLabel: string;
	name: string;
	description?: string | null;
	category?: string | null;
	status?: string | null;
	definition?: string | null;
	expressionSql?: string | null;
	aggregation?: string | null;
	timeGrain?: string | null;
	version?: string | null;
	owner?: string | number | null;
	dimensionFields?: string[];
	dataLevel?: string | null;
	searchText: string;
}

export function toMetricAssetItems(
	platformIndicators: PlatformIndicatorListItem[] = [],
	metricLens: MetricLensSummary[] = [],
): MetricAssetItem[] {
	return [
		...platformIndicators.map(toPlatformIndicatorAsset),
		...metricLens.map(toMetricLensAsset),
	];
}

export function filterMetricAssets(
	items: MetricAssetItem[],
	query: string,
): MetricAssetItem[] {
	const keyword = query.trim().toLowerCase();
	if (!keyword) return items;
	return items.filter((item) => item.searchText.includes(keyword));
}

export function buildMetricAgentPrompt(item: MetricAssetItem): string {
	if (item.source === "platform") {
		return [
			`用平台治理指标「${item.name}」做一次经营分析。`,
			item.definition || item.description
				? `指标口径：${item.definition || item.description}`
				: null,
			item.version ? `口径版本：${item.version}` : null,
			item.category ? `业务分类：${item.category}` : null,
			item.status ? `发布状态：${item.status}` : null,
			item.dimensionFields?.length
				? `可用维度：${item.dimensionFields.join("、")}`
				: null,
			item.timeGrain ? `时间粒度：${item.timeGrain}` : null,
			"请优先使用 dts-platform 已发布指标口径，说明口径来源、可用维度、最近趋势和异常点。",
			"如果平台指标服务不可达，请明确提示，并给出退回 AI 现生成 SQL 的降级方案。",
		]
			.filter(Boolean)
			.join("\n");
	}
	return [
		`查看本地指标口径「${item.name}」。`,
		item.aggregation ? `聚合方式：${item.aggregation}` : null,
		item.timeGrain ? `时间粒度：${item.timeGrain}` : null,
		item.version ? `最新版本：${item.version}` : null,
		"请说明这个指标的业务含义、已沉淀资产、可复用口径和下一步可分析的问题。",
	]
		.filter(Boolean)
		.join("\n");
}

export function buildMetricAgentHref(item: MetricAssetItem): string {
	const params = new URLSearchParams({
		metric: item.id,
		prompt: buildMetricAgentPrompt(item),
		source: "asset-library-metric",
		submit: "1",
	});
	return `/agent-bi?${params.toString()}`;
}

function toPlatformIndicatorAsset(indicator: PlatformIndicatorListItem): MetricAssetItem {
	const sourceId = String(indicator.id);
	const name = normalizeText(indicator.name) || `平台指标 ${sourceId}`;
	const item: Omit<MetricAssetItem, "searchText"> = {
		id: `platform:${sourceId}`,
		source: "platform",
		sourceId,
		sourceLabel: "dts-platform",
		name,
		description: indicator.description ?? indicator.definition ?? null,
		category: indicator.category ?? null,
		status: indicator.status ?? null,
		definition: indicator.definition ?? null,
		expressionSql: indicator.expressionSql ?? null,
		timeGrain: indicator.timeGrain ?? null,
		version: indicator.version ?? null,
		owner: indicator.owner ?? null,
		dimensionFields: indicator.dimensionFields ?? [],
		dataLevel: indicator.dataLevel ?? null,
	};
	return {
		...item,
		searchText: buildSearchText(item),
	};
}

function toMetricLensAsset(metric: MetricLensSummary): MetricAssetItem {
	const sourceId = String(metric.metricId ?? "");
	const name = normalizeText(metric.name) || `本地指标 ${sourceId || "-"}`;
	const item: Omit<MetricAssetItem, "searchText"> = {
		id: `lens:${sourceId || name}`,
		source: "metric-lens",
		sourceId: sourceId || name,
		sourceLabel: "Metric Lens",
		name,
		aggregation: metric.aggregation ?? null,
		timeGrain: metric.timeGrain ?? null,
		version: metric.latestVersion ?? null,
		owner: metric.owner ?? null,
		status: metric.aclScope ?? null,
	};
	return {
		...item,
		searchText: buildSearchText(item),
	};
}

function buildSearchText(item: Omit<MetricAssetItem, "searchText">): string {
	return [
		item.id,
		item.source,
		item.sourceLabel,
		item.sourceId,
		item.name,
		item.description,
		item.category,
		item.status,
		item.definition,
		item.expressionSql,
		item.aggregation,
		item.timeGrain,
		item.version,
		item.owner,
		item.dimensionFields?.join(" "),
		item.dataLevel,
	]
		.filter((value) => value != null && String(value).trim())
		.join(" ")
		.toLowerCase();
}

function normalizeText(value?: string | null): string {
	return value?.trim() ?? "";
}
