import type { Artifact } from "../../types/artifact";

export interface BuildCardPayloadOptions {
	collectionId?: number | string | null;
	name?: string;
}

export function resolveArtifactCardName(
	artifact: Artifact,
	requestedName?: string,
): string {
	const trimmed = requestedName?.trim();
	if (trimmed) {
		return trimmed;
	}
	const title = artifact.title?.trim();
	return title || "查询产物";
}

export function buildCardPayloadFromArtifact(
	artifact: Artifact,
	options: BuildCardPayloadOptions = {},
) {
	const sql = artifact.spec.generatedSql?.trim();
	const databaseId = normalizeNumberId(artifact.spec.databaseId);
	const datasetQuery = sql
		? {
				...(databaseId != null ? { database: databaseId } : {}),
				type: "native",
				native: { query: sql },
			}
		: artifact.spec.dataset
			? {
					type: "query",
					query: {
						source_table: artifact.spec.dataSurface ?? artifact.id,
					},
				}
			: undefined;

	return {
		name: resolveArtifactCardName(artifact, options.name),
		collection_id: normalizeCollectionId(options.collectionId),
		display: artifact.spec.display ?? "table",
		...(datasetQuery ? { dataset_query: datasetQuery } : {}),
		description: buildArtifactDescription(artifact),
		visualization_settings: artifact.spec.settings ?? {},
	};
}

function buildArtifactDescription(artifact: Artifact): string {
	const lines = ["由 Agent 工作台沉淀"];
	const caliber = formatMetricCaliber(artifact);
	if (caliber) {
		lines.push(`口径: ${caliber}`);
	}
	if (artifact.spec.sourceRefs?.length) {
		lines.push(`来源: ${artifact.spec.sourceRefs.join(", ")}`);
	}
	if (artifact.spec.dataSurface) {
		lines.push(`数据面: ${artifact.spec.dataSurface}`);
	}
	if (artifact.spec.generatedSql) {
		lines.push(`SQL: ${artifact.spec.generatedSql}`);
	}
	return lines.join("\n");
}

function formatMetricCaliber(artifact: Artifact): string | null {
	const caliber = artifact.spec.trace?.metricCaliber;
	if (!caliber) {
		return null;
	}
	const nameFormula = [caliber.name, caliber.formula].filter(Boolean).join("=");
	const parts = [
		nameFormula,
		caliber.domain,
		caliber.version ? `口径 ${caliber.version}` : undefined,
	].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : null;
}

function normalizeCollectionId(value: number | string | null | undefined) {
	if (value === "root" || value === "" || value == null) {
		return null;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : null;
}

function normalizeNumberId(value: number | string | null | undefined) {
	if (value == null || value === "") {
		return undefined;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : undefined;
}
