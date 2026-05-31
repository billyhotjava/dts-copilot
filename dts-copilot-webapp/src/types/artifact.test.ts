import type { AiAgentChatMessage } from "../api/analyticsApi";
import {
	artifactFromMessage,
	makeArtifactId,
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

	it("generates traceable artifact ids from the source message id", () => {
		expect(makeArtifactId("msg 12")).toMatch(/^artifact:msg-12:/);
	});
});
