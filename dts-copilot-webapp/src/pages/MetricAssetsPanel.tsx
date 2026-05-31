import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
	analyticsApi,
	type MetricLensSummary,
	type PlatformIndicatorListItem,
	type PlatformIndicatorValueResponse,
} from "../api/analyticsApi";
import { ArtifactCanvas } from "../components/canvas/ArtifactCanvas";
import { EmptyState } from "../components/EmptyState";
import { indicatorArtifact } from "../types/artifact";
import { Spinner } from "../ui/Loading/Spinner";
import {
	buildMetricAgentHref,
	filterMetricAssets,
	type MetricAssetItem,
	toMetricAssetItems,
} from "./assetLibraryMetrics";

type MetricAssetsState =
	| { state: "loading" }
	| {
			state: "loaded";
			caliberChangedIds: string[];
			metricLens: MetricLensSummary[];
			platformIndicators: PlatformIndicatorListItem[];
			warnings: string[];
	  }
	| { state: "error"; message: string };

type IndicatorPreviewState =
	| { state: "idle" }
	| { state: "loading" }
	| { state: "loaded"; value: PlatformIndicatorValueResponse }
	| { state: "error"; message: string };

export function MetricAssetsPanel() {
	const [state, setState] = useState<MetricAssetsState>({ state: "loading" });
	const [query, setQuery] = useState("");

	useEffect(() => {
		let cancelled = false;
		setState({ state: "loading" });
		void Promise.allSettled([
			analyticsApi.listPlatformIndicators(),
			analyticsApi.listMetricLens(),
		]).then(([indicatorResult, lensResult]) => {
			if (cancelled) return;
			const platformCatalog =
				indicatorResult.status === "fulfilled" ? indicatorResult.value : null;
			const platformIndicators =
				platformCatalog && Array.isArray(platformCatalog.items)
					? platformCatalog.items
					: [];
			const metricLens =
				lensResult.status === "fulfilled" && Array.isArray(lensResult.value)
					? lensResult.value
					: [];
			const caliberChangedIds = detectPlatformIndicatorVersionChanges(platformIndicators);
			const warnings = [
				indicatorResult.status === "rejected"
					? "平台指标目录暂不可用，已保留本地指标资产。"
					: null,
				platformCatalog?.degraded
					? platformCatalog.degradedReason || "平台指标服务暂不可达，已保留本地指标资产。"
					: null,
				lensResult.status === "rejected"
					? "本地 Metric Lens 暂不可用，已保留平台指标资产。"
					: null,
			].filter(Boolean) as string[];
			if (indicatorResult.status === "rejected" && lensResult.status === "rejected") {
				setState({
					state: "error",
					message: "指标资产读取失败，请稍后重试。",
				});
				return;
			}
			setState({
				caliberChangedIds,
				state: "loaded",
				metricLens,
				platformIndicators,
				warnings,
			});
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const items = useMemo(() => {
		if (state.state !== "loaded") return [];
		return toMetricAssetItems(state.platformIndicators, state.metricLens);
	}, [state]);
	const filteredItems = useMemo(
		() => filterMetricAssets(items, query),
		[items, query],
	);

	return (
		<section className="asset-library-metrics" aria-labelledby="asset-metrics-title">
			<header className="asset-library-metrics__header">
				<div>
					<p className="asset-library-metrics__eyebrow">Sprint-29 · Indicator Federation</p>
					<h2 id="asset-metrics-title">平台指标资产</h2>
					<p>
						浏览 dts-platform 已发布治理指标和本地 Metric Lens，直接交给 Agent
						按权威口径分析。
					</p>
				</div>
				<Link className="asset-library-metrics__secondary-link" to="/metrics">
					本地指标治理
				</Link>
			</header>

			{state.state === "loading" ? (
				<div className="asset-library-metrics__loading">
					<Spinner size="md" />
				</div>
			) : state.state === "error" ? (
				<div className="asset-library-metrics__notice asset-library-metrics__notice--error">
					{state.message}
				</div>
			) : (
				<>
					<div className="asset-library-metrics__stats" aria-label="指标资产统计">
						<MetricAssetStat label="平台指标" value={state.platformIndicators.length} />
						<MetricAssetStat label="本地口径" value={state.metricLens.length} />
						<MetricAssetStat label="可召唤资产" value={items.length} />
					</div>
					{state.warnings.map((warning) => (
						<div key={warning} className="asset-library-metrics__notice">
							{warning}
						</div>
					))}
					<div className="asset-library-metrics__toolbar">
						<input
							aria-label="搜索指标资产"
							placeholder="搜索指标、口径、分类"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</div>
					{filteredItems.length === 0 ? (
						<EmptyState
							title={query ? "没有匹配的指标资产" : "暂无指标资产"}
							description="平台指标同步完成后会出现在这里，也可以先使用本地 Metric Lens。"
						/>
					) : (
						<ul className="asset-library-metrics__grid">
							{filteredItems.map((item) => (
								<MetricAssetCard
									key={item.id}
									caliberChanged={
										item.source === "platform" &&
										state.caliberChangedIds.includes(item.sourceId)
									}
									item={item}
								/>
							))}
						</ul>
					)}
				</>
			)}
		</section>
	);
}

function MetricAssetStat({ label, value }: { label: string; value: number }) {
	return (
		<div className="asset-library-metrics__stat">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function MetricAssetCard({
	caliberChanged = false,
	item,
}: {
	caliberChanged?: boolean;
	item: MetricAssetItem;
}) {
	const [previewState, setPreviewState] = useState<IndicatorPreviewState>({ state: "idle" });
	const canPreview = item.source === "platform";

	const previewIndicator = () => {
		if (!canPreview || previewState.state === "loading") return;
		setPreviewState({ state: "loading" });
		analyticsApi
			.getPlatformIndicatorDetail(item.sourceId, 30)
			.then((value) => {
				if (value.degraded) {
					setPreviewState({
						state: "error",
						message: value.degradedReason || "平台指标服务暂不可达",
					});
					return;
				}
				setPreviewState({ state: "loaded", value });
			})
			.catch((error) => {
				setPreviewState({
					state: "error",
					message: error instanceof Error ? error.message : "平台指标取值失败",
				});
			});
	};

	return (
		<li className="asset-library-metrics__card">
			<div className="asset-library-metrics__card-top">
				<span className={`asset-library-metrics__source asset-library-metrics__source--${item.source}`}>
					{item.sourceLabel}
				</span>
				{item.status ? <span className="asset-library-metrics__meta-chip">{item.status}</span> : null}
				{caliberChanged ? (
					<span className="asset-library-metrics__meta-chip asset-library-metrics__meta-chip--warning">
						口径已更新
					</span>
				) : null}
			</div>
			<h3>{item.name}</h3>
			{item.description ? <p>{item.description}</p> : null}
			<dl className="asset-library-metrics__meta">
				{item.category ? (
					<>
						<dt>分类</dt>
						<dd>{item.category}</dd>
					</>
				) : null}
				{item.aggregation ? (
					<>
						<dt>聚合</dt>
						<dd>{item.aggregation}</dd>
					</>
				) : null}
				{item.timeGrain ? (
					<>
						<dt>粒度</dt>
						<dd>{item.timeGrain}</dd>
					</>
				) : null}
				{item.version ? (
					<>
						<dt>版本</dt>
						<dd>{item.version}</dd>
					</>
				) : null}
			</dl>
			<div className="asset-library-metrics__actions">
				<Link className="asset-library-metrics__primary-link" to={buildMetricAgentHref(item)}>
					交给 Agent
				</Link>
				{canPreview ? (
					<button
						type="button"
						className="asset-library-metrics__text-button"
						disabled={previewState.state === "loading"}
						onClick={previewIndicator}
					>
						{previewState.state === "loading" ? "取值中" : "预览取值"}
					</button>
				) : null}
				<Link className="asset-library-metrics__text-link" to="/metrics">
					查看口径
				</Link>
			</div>
			<MetricAssetPreview
				caliberChanged={caliberChanged}
				item={item}
				previewState={previewState}
			/>
		</li>
	);
}

function MetricAssetPreview({
	caliberChanged = false,
	item,
	previewState,
}: {
	caliberChanged?: boolean;
	item: MetricAssetItem;
	previewState: IndicatorPreviewState;
}) {
	if (previewState.state === "idle") {
		return null;
	}
	if (previewState.state === "loading") {
		return (
			<div className="asset-library-metrics__preview asset-library-metrics__preview--loading">
				<Spinner size="sm" />
			</div>
		);
	}
	if (previewState.state === "error") {
		return (
			<div className="asset-library-metrics__notice asset-library-metrics__notice--error">
				{previewState.message}
			</div>
		);
	}
	const definition = item.definition ?? item.description ?? null;
	const timeGrain = previewState.value.timeGrain ?? item.timeGrain ?? null;
	const artifact = indicatorArtifact({
		dataset: {
			cols: previewState.value.cols,
			rows: previewState.value.rows,
		},
		meta: {
			indicatorId: item.sourceId,
			code: item.sourceId,
			name: item.name,
			valueMode: previewState.value.mode,
			...(definition ? { definition } : {}),
			...(item.expressionSql ? { expressionSql: item.expressionSql } : {}),
			...(item.version ? { version: item.version } : {}),
			...(item.category ? { category: item.category } : {}),
			...(timeGrain ? { timeGrain } : {}),
			...(previewState.value.dimensionFields?.length
				? { dimensionFields: previewState.value.dimensionFields }
				: item.dimensionFields?.length
					? { dimensionFields: item.dimensionFields }
				: {}),
			...(item.dataLevel ? { dataLevel: item.dataLevel } : {}),
			...(item.owner == null ? {} : { owner: String(item.owner) }),
			caliberChanged,
		},
	});
	return (
		<div className="asset-library-metrics__preview">
			<ArtifactCanvas
				artifact={artifact}
				className="asset-library-metrics__preview-artifact"
			/>
		</div>
	);
}

const PLATFORM_INDICATOR_VERSION_CACHE_KEY = "dts-copilot.platformIndicatorVersions";

function detectPlatformIndicatorVersionChanges(
	indicators: PlatformIndicatorListItem[],
): string[] {
	if (typeof window === "undefined" || !window.localStorage) {
		return [];
	}
	try {
		const previous = parseVersionCache(
			window.localStorage.getItem(PLATFORM_INDICATOR_VERSION_CACHE_KEY),
		);
		const next: Record<string, string> = {};
		const changed: string[] = [];
		for (const indicator of indicators) {
			const id = String(indicator.id);
			const version = indicator.version?.trim();
			if (!id || !version) continue;
			next[id] = version;
			if (previous[id] && previous[id] !== version) {
				changed.push(id);
			}
		}
		window.localStorage.setItem(
			PLATFORM_INDICATOR_VERSION_CACHE_KEY,
			JSON.stringify(next),
		);
		return changed;
	} catch {
		return [];
	}
}

function parseVersionCache(raw: string | null): Record<string, string> {
	if (!raw) return {};
	const parsed = JSON.parse(raw);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(parsed).filter(
			(entry): entry is [string, string] => typeof entry[1] === "string",
		),
	);
}
