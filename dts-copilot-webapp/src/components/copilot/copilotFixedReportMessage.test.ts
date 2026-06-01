import { describe, expect, it } from "vitest";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import {
	getFixedReportCandidates,
	getFixedReportShortcut,
} from "./copilotFixedReportMessage";

describe("copilotFixedReportMessage", () => {
	it("为 PRS 固定报表生成可视化大屏入口", () => {
		const shortcut = getFixedReportShortcut({
			responseKind: "FIXED_REPORT",
			templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			targetView: "screen.prs-flowerbiz-overview-v1",
		} as AiAgentChatMessage);

		expect(shortcut).toEqual({
			label: "打开可视化大屏",
			href: "/screens/290001/preview",
		});
	});

	it("为 PRS 候选项生成可视化大屏入口", () => {
		const candidates = getFixedReportCandidates({
			responseKind: "FIXED_REPORT_CANDIDATES",
			content: "- PRS 租赁经营总览\n- PRS 销售坏账与费用看板",
		} as AiAgentChatMessage);

		expect(candidates).toEqual([
			{
				label: "PRS 租赁经营总览",
				templateCode: "PRS-FLOWERBIZ-OVERVIEW",
				href: "/screens/290001/preview",
			},
			{
				label: "PRS 销售坏账与费用看板",
				templateCode: "PRS-FLOWERBIZ-FINANCE-COST",
				href: "/screens/290003/preview",
			},
		]);
	});

	it("不会为已归档的旧固定报表候选项生成死链接", () => {
		const candidates = getFixedReportCandidates({
			responseKind: "FIXED_REPORT_CANDIDATES",
			content: "- 库存现量低库存预警\n- PRS 租赁经营总览",
		} as AiAgentChatMessage);

		expect(candidates).toEqual([
			{
				label: "库存现量低库存预警",
				templateCode: "WH-LOW-STOCK-ALERT",
				href: undefined,
			},
			{
				label: "PRS 租赁经营总览",
				templateCode: "PRS-FLOWERBIZ-OVERVIEW",
				href: "/screens/290001/preview",
			},
		]);
	});

	it("不会为已归档的旧固定报表响应生成快捷入口", () => {
		const shortcut = getFixedReportShortcut({
			responseKind: "FIXED_REPORT",
			templateCode: "WH-LOW-STOCK-ALERT",
			targetView: "authority.inventory.low_stock_alert",
		} as AiAgentChatMessage);

		expect(shortcut).toBeNull();
	});
});
