import { memo, type CSSProperties, useEffect, useMemo, useState } from "react";
import {
	analyticsApi,
	type CardQueryResponse,
} from "../../api/analyticsApi";
import { DataTable } from "../DataTable";
import { ChartRenderer } from "../charts/ChartRenderer";
import {
	resolveIndicatorDisplay,
	type Artifact,
	type ArtifactDataset,
	type IndicatorArtifactMeta,
} from "../../types/artifact";
import "./Canvas.css";

interface ArtifactCanvasProps {
	artifact: Artifact | null;
	loading?: boolean;
	error?: unknown;
	className?: string;
	style?: CSSProperties;
	onDatasetReady?: (artifact: Artifact, dataset: ArtifactDataset) => void;
	onArtifactUpdate?: (artifact: Artifact) => void;
}

export const ArtifactCanvas = memo(function ArtifactCanvas({
	artifact,
	loading = false,
	error,
	className,
	style,
	onDatasetReady,
	onArtifactUpdate,
}: ArtifactCanvasProps) {
	const classes = ["artifact-canvas", className].filter(Boolean).join(" ");

	if (loading && !artifact) {
		return (
			<section className={classes} style={style} aria-busy="true">
				<CanvasState title="正在生成画布产物…" />
			</section>
		);
	}

	if (error && !artifact) {
		return (
			<section className={classes} style={style}>
				<CanvasState title={resolveErrorMessage(error)} tone="error" />
			</section>
		);
	}

	if (!artifact) {
		return (
			<section className={classes} style={style}>
				<CanvasState title="右侧画布会在这里钉住你正在看的产物" />
			</section>
		);
	}

	return (
		<section className={classes} style={style} aria-busy={loading || undefined}>
			<header className="artifact-canvas__header">
				<div>
					<p className="artifact-canvas__eyebrow">{resolveTypeLabel(artifact)}</p>
					<h2>{artifact.title || "查询产物"}</h2>
				</div>
			</header>
			<div className="artifact-canvas__body">
				{renderArtifactBody(artifact, loading, error, onDatasetReady, onArtifactUpdate)}
			</div>
		</section>
	);
});

function renderArtifactBody(
	artifact: Artifact,
	loading: boolean,
	error: unknown,
	onDatasetReady?: (artifact: Artifact, dataset: ArtifactDataset) => void,
	onArtifactUpdate?: (artifact: Artifact) => void,
) {
	if (!artifact.spec.dataset && artifact.spec.generatedSql?.trim()) {
		return (
			<SqlBackedArtifactBody
				artifact={artifact}
				onDatasetReady={onDatasetReady}
			/>
		);
	}

	if (artifact.type === "indicator") {
		if (loading) {
			return <CanvasState title="正在向 dts-platform 取指标值…" />;
		}
		if (error) {
			return <CanvasState title={resolveErrorMessage(error)} tone="error" />;
		}
		return <IndicatorArtifactBody artifact={artifact} onArtifactUpdate={onArtifactUpdate} />;
	}

	if (artifact.type === "chart") {
		return (
			<ChartRenderer
				data={artifact.spec.dataset ?? null}
				display={artifact.spec.display ?? "table"}
				settings={artifact.spec.settings}
				loading={loading}
				error={error}
				className="artifact-canvas__chart"
			/>
		);
	}

	if (artifact.type === "table") {
		if (loading) {
			return <CanvasState title="正在生成表格结果…" />;
		}
		if (error) {
			return <CanvasState title={resolveErrorMessage(error)} tone="error" />;
		}
		return (
			<DataTable
				cols={artifact.spec.dataset?.cols ?? []}
				rows={artifact.spec.dataset?.rows ?? []}
			/>
		);
	}

	if (loading) {
		return <CanvasState title="正在准备报表入口…" />;
	}
	if (error) {
		return <CanvasState title={resolveErrorMessage(error)} tone="error" />;
	}
	return <ReportArtifact artifact={artifact} />;
}

function IndicatorArtifactBody({
	artifact,
	onArtifactUpdate,
}: {
	artifact: Artifact;
	onArtifactUpdate?: (artifact: Artifact) => void;
}) {
	const [renderArtifact, setRenderArtifact] = useState(artifact);
	const [dimension, setDimension] = useState("");
	const [period, setPeriod] = useState("");
	const [drilldownState, setDrilldownState] = useState<
		| { state: "idle" }
		| { state: "loading" }
		| { state: "error"; message: string }
	>({ state: "idle" });
	const availableDimensions = useMemo(
		() =>
			(renderArtifact.spec.indicator?.dimensionFields ?? [])
				.map((item) => item.trim())
				.filter(isSafeDrilldownDimension),
		[renderArtifact.spec.indicator?.dimensionFields],
	);

	useEffect(() => {
		setRenderArtifact(artifact);
		setDrilldownState({ state: "idle" });
		const firstDimension = (artifact.spec.indicator?.dimensionFields ?? [])
			.map((item) => item.trim())
			.find(isSafeDrilldownDimension);
		setDimension(firstDimension ?? "");
		setPeriod("");
	}, [artifact]);

	const handleDrilldown = () => {
		const meta = renderArtifact.spec.indicator;
		if (!meta || !dimension || drilldownState.state === "loading") {
			return;
		}
		setDrilldownState({ state: "loading" });
		analyticsApi
			.getPlatformIndicatorDrilldown(meta.indicatorId, dimension, period.trim() || undefined)
			.then((value) => {
				if (value.degraded) {
					setDrilldownState({
						state: "error",
						message: value.degradedReason || "平台指标服务暂不可达",
					});
					return;
				}
				const dataset = {
					cols: value.cols,
					rows: value.rows,
				};
				const activePeriod = period.trim();
				const nextMeta: IndicatorArtifactMeta = {
					...meta,
					valueMode: "drilldown",
					activeDrilldownDimension: dimension,
					activeDrilldownPeriod: activePeriod || undefined,
					...(value.timeGrain ? { timeGrain: value.timeGrain } : {}),
					...(value.dimensionFields?.length ? { dimensionFields: value.dimensionFields } : {}),
				};
				const nextArtifact: Artifact = {
					...renderArtifact,
					spec: {
						...renderArtifact.spec,
						dataset,
						display: resolveIndicatorDisplay(nextMeta, dataset),
						indicator: nextMeta,
					},
				};
				setRenderArtifact(nextArtifact);
				onArtifactUpdate?.(nextArtifact);
				setDrilldownState({ state: "idle" });
			})
			.catch((err) => {
				setDrilldownState({
					state: "error",
					message: err instanceof Error ? err.message : "平台指标下钻失败",
				});
			});
	};

	return (
		<div className="artifact-canvas__indicator">
			{renderArtifact.spec.indicator ? (
				<IndicatorCaliberBar meta={renderArtifact.spec.indicator} />
			) : null}
			{renderArtifact.spec.indicator && availableDimensions.length > 0 ? (
				<div className="artifact-canvas__drilldown" aria-label="指标下钻">
					<select
						aria-label="下钻维度"
						value={dimension}
						onChange={(event) => setDimension(event.target.value)}
					>
						{availableDimensions.map((item) => (
							<option key={item} value={item}>
								{item}
							</option>
						))}
					</select>
					<input
						aria-label="下钻周期"
						placeholder="2026-05"
						value={period}
						onChange={(event) => setPeriod(event.target.value)}
					/>
					<button
						type="button"
						disabled={!dimension || drilldownState.state === "loading"}
						onClick={handleDrilldown}
					>
						{drilldownState.state === "loading" ? "下钻中" : "下钻"}
					</button>
				</div>
			) : null}
			{drilldownState.state === "error" ? (
				<div className="artifact-canvas__drilldown-error">{drilldownState.message}</div>
			) : null}
			<ChartRenderer
				data={renderArtifact.spec.dataset ?? null}
				display={renderArtifact.spec.display ?? "table"}
				settings={renderArtifact.spec.settings}
				className="artifact-canvas__chart"
			/>
		</div>
	);
}

function IndicatorCaliberBar({ meta }: { meta: IndicatorArtifactMeta }) {
	return (
		<div className="artifact-canvas__caliber" title={meta.definition}>
			<span className="artifact-canvas__caliber-badge">平台指标</span>
			<span>{meta.name}</span>
			{meta.version ? (
				<span className="artifact-canvas__caliber-ver">口径 {meta.version}</span>
			) : null}
			{meta.stale ? (
				<span className="artifact-canvas__caliber-stale">缓存值</span>
			) : null}
			{meta.caliberChanged ? (
				<span className="artifact-canvas__caliber-changed">口径已更新</span>
			) : null}
		</div>
	);
}

function isSafeDrilldownDimension(value: string): boolean {
	return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

type QueryPreviewState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; dataset: ArtifactDataset }
	| { status: "error"; message: string };

function SqlBackedArtifactBody({
	artifact,
	onDatasetReady,
}: {
	artifact: Artifact;
	onDatasetReady?: (artifact: Artifact, dataset: ArtifactDataset) => void;
}) {
	const sql = artifact.spec.generatedSql?.trim() ?? "";
	const databaseId = normalizeDatabaseId(artifact.spec.databaseId);
	const [previewState, setPreviewState] = useState<QueryPreviewState>({
		status: "idle",
	});
	const renderAsChart =
		artifact.type === "chart" ||
		(artifact.type === "report" &&
			Boolean(artifact.spec.display) &&
			artifact.spec.display !== "table");

	useEffect(() => {
		if (!sql) {
			setPreviewState({ status: "idle" });
			return;
		}
		if (databaseId == null) {
			setPreviewState({
				status: "error",
				message: "缺少数据源，无法执行画布查询",
			});
			return;
		}
		let cancelled = false;
		setPreviewState({ status: "loading" });
		analyticsApi
			.runDatasetQuery({
				context: "agent-canvas",
				database: databaseId,
				native: { query: sql },
				type: "native",
			})
			.then((response) => {
				if (cancelled) return;
				if (response.error) {
					setPreviewState({
						status: "error",
						message: String(response.error),
					});
					return;
				}
				const dataset = normalizeQueryDataset(response);
				setPreviewState({ status: "success", dataset });
				onDatasetReady?.(artifact, dataset);
			})
			.catch((err) => {
				if (cancelled) return;
				setPreviewState({
					status: "error",
					message: err instanceof Error ? err.message : "画布查询执行失败",
				});
			});
		return () => {
			cancelled = true;
		};
	}, [artifact, databaseId, onDatasetReady, sql]);

	if (previewState.status === "loading") {
		if (renderAsChart) {
			return (
				<ChartRenderer
					data={null}
					display={artifact.spec.display ?? "table"}
					settings={artifact.spec.settings}
					loading
					className="artifact-canvas__chart"
				/>
			);
		}
		return <CanvasState title="正在执行画布查询…" />;
	}
	if (previewState.status === "error") {
		return <CanvasState title={previewState.message} tone="error" />;
	}
	if (previewState.status === "success") {
		return renderDatasetArtifact(artifact, previewState.dataset, renderAsChart);
	}
	return <CanvasState title="等待执行画布查询…" />;
}

function renderDatasetArtifact(
	artifact: Artifact,
	dataset: ArtifactDataset,
	renderAsChart: boolean,
) {
	if (renderAsChart) {
		return (
			<ChartRenderer
				data={dataset}
				display={artifact.spec.display ?? "table"}
				settings={artifact.spec.settings}
				className="artifact-canvas__chart"
			/>
		);
	}
	return <DataTable cols={dataset.cols} rows={dataset.rows} />;
}

function ReportArtifact({ artifact }: { artifact: Artifact }) {
	const reportCode = artifact.spec.reportCode ?? artifact.title ?? "报表产物";
	return (
		<div className="artifact-canvas__report">
			<div>
				<p className="artifact-canvas__report-label">AI 报表</p>
				<h3>{reportCode}</h3>
			</div>
			{artifact.spec.reportHref ? (
				<a className="artifact-canvas__report-link" href={artifact.spec.reportHref} target="_blank" rel="noreferrer">
					打开可视化大屏
				</a>
			) : null}
		</div>
	);
}

function CanvasState({
	title,
	tone = "muted",
}: {
	title: string;
	tone?: "muted" | "error";
}) {
	return (
		<div className={`artifact-canvas__state artifact-canvas__state--${tone}`}>
			{title}
		</div>
	);
}

function resolveTypeLabel(artifact: Artifact): string {
	if (artifact.type === "indicator") return "平台指标产物";
	if (artifact.type === "chart") return "图表产物";
	if (artifact.type === "table") return "表格产物";
	return "报表产物";
}

function resolveErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message || "画布产物生成失败";
	}
	return String(error ?? "画布产物生成失败");
}

function normalizeDatabaseId(value: number | string | null | undefined): number | null {
	if (value == null || value === "") {
		return null;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeQueryDataset(response: CardQueryResponse): ArtifactDataset {
	return {
		cols: normalizeQueryColumns(response.data?.cols),
		rows: normalizeQueryRows(response.data?.rows),
	};
}

function normalizeQueryColumns(
	cols: Array<Record<string, unknown>> | undefined,
): ArtifactDataset["cols"] {
	if (!Array.isArray(cols)) {
		return [];
	}
	return cols.map((col, index) => {
		const name =
			readNonEmptyString(col.name) ??
			readNonEmptyString(col.display_name) ??
			`col_${index + 1}`;
		const displayName = readNonEmptyString(col.display_name);
		const baseType = readNonEmptyString(col.base_type);
		return {
			name,
			...(displayName ? { display_name: displayName } : {}),
			...(baseType ? { base_type: baseType } : {}),
		};
	});
}

function normalizeQueryRows(rows: unknown[] | undefined): unknown[][] {
	if (!Array.isArray(rows)) {
		return [];
	}
	return rows.map((row) => (Array.isArray(row) ? row : [row]));
}

function readNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}
