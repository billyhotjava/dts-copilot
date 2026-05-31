import type { AiAgentChatMessage } from "../api/analyticsApi";
import {
	artifactFromMessage,
	indicatorArtifact,
	makeIndicatorArtifactId,
	makeArtifactId,
	resolveIndicatorDisplay,
	type ArtifactDataset,
} from "./artifact";

const dataset: ArtifactDataset = {
	cols: [
		{ name: "month", display_name: "月份", base_type: "type/Text" },
		{ name: "amount", display_name: "金额", base_type: "type/Float" },
	],
	rows: [["2026-05", 1234]],
};

function message(
	overrides: Partial<AiAgentChatMessage> = {},
): AiAgentChatMessage {
	return {
		content: "项目收入趋势",
		id: "msg-1",
		role: "assistant",
		sessionId: "session-1",
		...overrides,
	};
}

describe("artifact model", () => {
	it("builds a chart artifact from an assistant message with chart display metadata", () => {
		const artifact = artifactFromMessage(
			message({
				dataSurface: "xycyl_dws_project_monthly",
				generatedSql: "select month, amount from mart",
				sourceRefs: "model:xycyl_dws_project_monthly\nfield:amount",
				suggestedDisplay: "line",
				targetView: "xycyl_dws_project_monthly",
			}),
			dataset,
			{ createdAt: 1000, id: "artifact-chart", title: "项目收入趋势" },
		);

		expect(artifact).toMatchObject({
			createdAt: 1000,
			id: "artifact-chart",
			sourceMessageId: "msg-1",
			title: "项目收入趋势",
			type: "chart",
			spec: {
				dataSurface: "xycyl_dws_project_monthly",
				dataset,
				display: "line",
				generatedSql: "select month, amount from mart",
				sourceRefs: [
					"model:xycyl_dws_project_monthly",
					"field:amount",
				],
				targetView: "xycyl_dws_project_monthly",
			},
		});
	});

	it("builds a table artifact when display is table or missing", () => {
		const artifact = artifactFromMessage(
			message({
				generatedSql: "select * from mart",
				suggestedDisplay: "table",
			}),
			dataset,
			{ createdAt: 1000, id: "artifact-table" },
		);

		expect(artifact.type).toBe("table");
		expect(artifact.spec.display).toBe("table");
		expect(artifact.spec.dataset).toBe(dataset);
	});

	it("builds a report artifact from fixed report messages without embedding dataset rows", () => {
		const artifact = artifactFromMessage(
			message({
				reportCode: "prs.flowerbiz.overview",
				responseKind: "FIXED_REPORT",
				templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			}),
			null,
			{ createdAt: 1000, id: "artifact-report" },
		);

		expect(artifact).toMatchObject({
			id: "artifact-report",
			type: "report",
			spec: {
				reportCode: "prs.flowerbiz.overview",
				reportHref: "/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW",
			},
		});
		expect(artifact.spec.dataset).toBeUndefined();
	});

	it("keeps generated SQL from fixed-report classified messages visible as a query artifact", () => {
		const artifact = artifactFromMessage(
			message({
				generatedSql: "select * from public.xycyl_ads_flowerbiz_project_customer",
				reportCode: "prs.project.customer_value",
				responseKind: "FIXED_REPORT",
				suggestedDisplay: "table",
			}),
			null,
			{ createdAt: 1000, id: "artifact-fixed-report-sql" },
		);

		expect(artifact).toMatchObject({
			id: "artifact-fixed-report-sql",
			type: "table",
			spec: {
				display: "table",
				generatedSql:
					"select * from public.xycyl_ads_flowerbiz_project_customer",
				reportCode: "prs.project.customer_value",
			},
		});
	});

	it("generates traceable artifact ids from the source message id", () => {
		expect(makeArtifactId("msg 12")).toMatch(/^artifact:msg-12:/);
	});

	it("builds stable indicator artifacts with platform caliber trace", () => {
		const artifact = indicatorArtifact({
			createdAt: 1000,
			dataset,
			meta: {
				indicatorId: "cash-in",
				name: "回款金额",
				definition: "按月统计已确认回款。",
				expressionSql: "sum(received_amount)",
				version: "v2",
				timeGrain: "month",
				dimensionFields: ["project", "customer"],
				drilldownEnabled: true,
			},
		});

		expect(artifact).toMatchObject({
			createdAt: 1000,
			id: "artifact:indicator:cash-in",
			sourceMessageId: "indicator:cash-in",
			title: "回款金额",
			type: "indicator",
			spec: {
				display: "line",
				dataset,
				indicator: {
					indicatorId: "cash-in",
					name: "回款金额",
					version: "v2",
					drilldownEnabled: true,
				},
				trace: {
					metricCaliber: {
						name: "回款金额",
						formula: "sum(received_amount)",
						version: "v2",
					},
				},
			},
		});
		expect(makeIndicatorArtifactId("cash-in")).toBe("artifact:indicator:cash-in");
	});

	it("infers indicator display from time grain and value shape", () => {
		expect(
			resolveIndicatorDisplay({ indicatorId: "cash-in", name: "回款金额", timeGrain: "month" }, dataset),
		).toBe("line");
		expect(
			resolveIndicatorDisplay(
				{ indicatorId: "cash-in", name: "回款金额" },
				{ cols: [{ name: "label" }, { name: "value" }], rows: [["本月", 100]] },
			),
		).toBe("scalar");
		expect(
			resolveIndicatorDisplay(
				{ indicatorId: "cash-in", name: "回款金额" },
				{ cols: [{ name: "project" }, { name: "value" }], rows: [["A", 100], ["B", 80]] },
			),
		).toBe("table");
	});
});
