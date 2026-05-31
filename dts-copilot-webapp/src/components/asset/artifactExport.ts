import type { Artifact } from "../../types/artifact";
import { rowsToCsv } from "../../lib/csv";
import {
	downloadBlob as defaultDownloadBlob,
	downloadText as defaultDownloadText,
} from "../../lib/download";

export type DownloadTextFn = (text: string, fileName: string, mime: string) => void;
export type DownloadBlobFn = (blob: Blob, fileName: string) => void;

export function buildArtifactExportFileName(
	artifact: Artifact,
	extension: "csv" | "png",
): string {
	const base = (artifact.title ?? "")
		.trim()
		.replace(/[\\/:*?"<>|]+/g, "_")
		.replace(/\s+/g, "_")
		.replace(/^_+|_+$/g, "");
	return `${base || "agent-artifact"}.${extension}`;
}

export function downloadArtifactCsv(
	artifact: Artifact,
	downloadText: DownloadTextFn = defaultDownloadText,
): void {
	const columns = artifact.spec.dataset?.cols.map((col) => col.display_name || col.name) ?? [];
	const rows = artifact.spec.dataset?.rows ?? [];
	downloadText(
		rowsToCsv(columns, rows),
		buildArtifactExportFileName(artifact, "csv"),
		"text/csv;charset=utf-8",
	);
}

export function downloadArtifactPng(
	artifact: Artifact,
	downloadBlob: DownloadBlobFn = defaultDownloadBlob,
): Promise<void> {
	const canvas = document.createElement("canvas");
	canvas.width = 960;
	canvas.height = 540;
	const context = canvas.getContext("2d");
	if (!context) {
		return Promise.reject(new Error("canvas_context_unavailable"));
	}

	drawArtifactSnapshot(context, artifact, canvas.width, canvas.height);

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error("canvas_blob_unavailable"));
				return;
			}
			downloadBlob(blob, buildArtifactExportFileName(artifact, "png"));
			resolve();
		}, "image/png");
	});
}

function drawArtifactSnapshot(
	context: CanvasRenderingContext2D,
	artifact: Artifact,
	width: number,
	height: number,
) {
	context.fillStyle = "#f8fafc";
	context.fillRect(0, 0, width, height);
	context.fillStyle = "#111827";
	context.font = "700 28px sans-serif";
	context.fillText(artifact.title || "Agent 画布产物", 48, 64);
	context.font = "16px sans-serif";
	context.fillStyle = "#64748b";
	context.fillText(resolveTypeLabel(artifact), 48, 96);
	context.strokeStyle = "#d1d5db";
	context.strokeRect(48, 128, width - 96, height - 176);

	const dataset = artifact.spec.dataset;
	if (!dataset || dataset.rows.length === 0) {
		context.fillStyle = "#475569";
		context.fillText("当前产物暂无可导出的表格结果。", 72, 180);
		return;
	}

	const columns = dataset.cols.slice(0, 5).map((col) => col.display_name || col.name);
	const rows = dataset.rows.slice(0, 8);
	const columnWidth = (width - 144) / Math.max(columns.length, 1);
	context.font = "600 14px sans-serif";
	context.fillStyle = "#0f172a";
	columns.forEach((column, index) => {
		context.fillText(truncate(column, 16), 72 + index * columnWidth, 168);
	});

	context.font = "14px sans-serif";
	context.fillStyle = "#334155";
	rows.forEach((row, rowIndex) => {
		const y = 204 + rowIndex * 34;
		columns.forEach((_, colIndex) => {
			const value = Array.isArray(row) ? row[colIndex] : "";
			context.fillText(truncate(String(value ?? ""), 18), 72 + colIndex * columnWidth, y);
		});
	});
}

function resolveTypeLabel(artifact: Artifact): string {
	if (artifact.type === "chart") return "图表快照";
	if (artifact.type === "table") return "表格快照";
	return "报表快照";
}

function truncate(value: string, maxLength: number): string {
	return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}
