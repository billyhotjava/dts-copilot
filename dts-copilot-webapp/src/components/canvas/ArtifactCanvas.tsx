import { memo, type CSSProperties } from "react";
import { DataTable } from "../DataTable";
import { ChartRenderer } from "../charts/ChartRenderer";
import type { Artifact } from "../../types/artifact";
import "./Canvas.css";

interface ArtifactCanvasProps {
	artifact: Artifact | null;
	loading?: boolean;
	error?: unknown;
	className?: string;
	style?: CSSProperties;
}

export const ArtifactCanvas = memo(function ArtifactCanvas({
	artifact,
	loading = false,
	error,
	className,
	style,
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
				{renderArtifactBody(artifact, loading, error)}
			</div>
		</section>
	);
});

function renderArtifactBody(
	artifact: Artifact,
	loading: boolean,
	error: unknown,
) {
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

function ReportArtifact({ artifact }: { artifact: Artifact }) {
	const reportCode = artifact.spec.reportCode ?? artifact.title ?? "报表产物";
	return (
		<div className="artifact-canvas__report">
			<div>
				<p className="artifact-canvas__report-label">AI 报表</p>
				<h3>{reportCode}</h3>
			</div>
			{artifact.spec.reportHref ? (
				<a className="artifact-canvas__report-link" href={artifact.spec.reportHref}>
					用 AI 报表打开
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
