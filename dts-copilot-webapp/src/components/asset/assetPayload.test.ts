import { describe, expect, it } from "vitest";
import type { Artifact } from "../../types/artifact";
import { buildCardPayloadFromArtifact, resolveArtifactCardName } from "./assetPayload";

function artifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		createdAt: 1000,
		id: "artifact-1",
		sourceMessageId: "msg-1",
		spec: {
			dataSurface: "xycyl_dws_project_profit",
			databaseId: 9,
			display: "bar",
			generatedSql: "select revenue - cost as profit from mart",
			settings: { "graph.show_values": true },
			sourceRefs: ["model:xycyl_dws_project_profit"],
			trace: {
				metricCaliber: {
					name: "利润",
					formula: "收入-成本",
					domain: "报花域",
					version: "v3",
				},
				sources: [
					{ table: "xycyl_dws_project_profit", fields: ["revenue", "cost"] },
				],
			},
		},
		title: "项目利润",
		type: "chart",
		...overrides,
	};
}

describe("assetPayload", () => {
	it("builds a native SQL card payload from a canvas artifact", () => {
		expect(
			buildCardPayloadFromArtifact(artifact(), {
				collectionId: 12,
				name: "利润分析卡片",
			}),
		).toMatchObject({
			collection_id: 12,
			dataset_query: {
				database: 9,
				native: { query: "select revenue - cost as profit from mart" },
				type: "native",
			},
			display: "bar",
			name: "利润分析卡片",
			visualization_settings: { "graph.show_values": true },
		});
		const payload = buildCardPayloadFromArtifact(artifact(), {
			collectionId: 12,
			name: "利润分析卡片",
		});
		expect(payload.description).toContain("口径: 利润=收入-成本 · 报花域 · 口径 v3");
		expect(payload.description).toContain("来源: model:xycyl_dws_project_profit");
	});

	it("falls back to the artifact title when the requested card name is empty", () => {
		expect(resolveArtifactCardName(artifact(), "   ")).toBe("项目利润");
		expect(resolveArtifactCardName(artifact({ title: "" }), "")).toBe("查询产物");
	});
});
