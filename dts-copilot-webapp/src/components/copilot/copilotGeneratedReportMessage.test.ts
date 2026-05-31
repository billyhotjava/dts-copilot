import { describe, expect, it } from "vitest";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import {
	getGeneratedReportDraftNotice,
	inferGeneratedReportSuggestedDisplay,
	isGeneratedReportDraftMessage,
} from "./copilotGeneratedReportMessage";

describe("copilotGeneratedReportMessage", () => {
	it("识别 Agent 生成报表草稿消息", () => {
		expect(
			isGeneratedReportDraftMessage({
				responseKind: "REPORT_DRAFT",
			} as AiAgentChatMessage),
		).toBe(true);

		expect(
			isGeneratedReportDraftMessage({
				responseKind: "FIXED_REPORT",
			} as AiAgentChatMessage),
		).toBe(false);
	});

	it("按问题和 SQL 推断趋势报表的展示类型", () => {
		const display = inferGeneratedReportSuggestedDisplay({
			question: "帮我生成一张PRS租赁项目月度趋势报表",
			sql: "select month_id, project_name, lease_amount from xycyl_dws_flowerbiz_project_monthly order by month_id",
		});

		expect(display).toBe("line");
	});

	it("生成草稿提示和后续动作说明", () => {
		const notice = getGeneratedReportDraftNotice({
			responseKind: "REPORT_DRAFT",
			reportCode: "prs.flowerbiz.lease_execution_monthly",
			routedDomain: "flowerbiz",
			targetView: "xycyl_dws_flowerbiz_project_monthly",
			dataSurface: "L1_DBT_MART",
			qualityLevel: "MEDIUM",
			qualityNotes: ["2025年5月以后数据较可用"],
			sourceRefs: [
				"dbt-model:public.xycyl_dws_flowerbiz_project_monthly",
				"semantic-pack:flowerbiz",
			],
		} as AiAgentChatMessage);

		expect(notice).toEqual({
			title: "Agent 已生成报表草稿",
			description:
				"正在自动执行表格预览，确认口径后可直接切换为 BI 侧可视化组件。",
			meta: [
				"报表编码：prs.flowerbiz.lease_execution_monthly",
				"业务域：flowerbiz",
				"数据目标：xycyl_dws_flowerbiz_project_monthly",
				"数据层：L1_DBT_MART",
				"质量等级：MEDIUM",
				"质量提示：2025年5月以后数据较可用",
				"来源：dbt-model:public.xycyl_dws_flowerbiz_project_monthly",
				"来源：semantic-pack:flowerbiz",
			],
		});
	});

	it("兼容后端历史消息返回的分号分隔质量提示", () => {
		const notice = getGeneratedReportDraftNotice({
			responseKind: "REPORT_DRAFT",
			qualityNotes: "客户关联需核验；回款字段需交叉校验",
		} as AiAgentChatMessage);

		expect(notice?.meta).toContain("质量提示：客户关联需核验");
		expect(notice?.meta).toContain("质量提示：回款字段需交叉校验");
	});

	it("展示已自动保存的分析草稿编号", () => {
		const notice = getGeneratedReportDraftNotice({
			responseKind: "REPORT_DRAFT",
			analysisDraftStatus: "saved",
			analysisDraftId: 101,
		} as AiAgentChatMessage);

		expect(notice?.description).toContain("已自动保存为分析草稿 #101");
	});
});
