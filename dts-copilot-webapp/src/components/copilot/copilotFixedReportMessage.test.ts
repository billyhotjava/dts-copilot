import { describe, expect, it } from "vitest";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import {
	getFixedReportCandidates,
	getFixedReportShortcut,
} from "./copilotFixedReportMessage";

describe("copilotFixedReportMessage", () => {
	it("为 PRS 固定报表生成表格报表入口", () => {
		const shortcut = getFixedReportShortcut({
			responseKind: "FIXED_REPORT",
			templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			targetView: "screen.prs-flowerbiz-overview-v1",
		} as AiAgentChatMessage);

		expect(shortcut).toEqual({
			label: "用 AI 报表打开",
			href: "/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW",
		});
	});

	it("为 PRS 候选项生成表格报表入口", () => {
		const candidates = getFixedReportCandidates({
			responseKind: "FIXED_REPORT_CANDIDATES",
			content: "- PRS 租赁经营总览\n- PRS 销售坏账与费用看板",
		} as AiAgentChatMessage);

		expect(candidates).toEqual([
			{
				label: "PRS 租赁经营总览",
				templateCode: "PRS-FLOWERBIZ-OVERVIEW",
				href: "/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW",
			},
			{
				label: "PRS 销售坏账与费用看板",
				templateCode: "PRS-FLOWERBIZ-FINANCE-COST",
				href: "/agent-bi?fixedReport=PRS-FLOWERBIZ-FINANCE-COST",
			},
		]);
	});
});
