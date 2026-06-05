import { describe, expect, it } from "vitest";
import {
	AGENT_REPORT_BUSINESS_OBJECTS,
	AGENT_REPORT_BUSINESS_GUIDE,
	AGENT_REPORT_QUICK_STARTS,
	AGENT_REPORT_SUPPORTING_ASSETS,
} from "./agentReportQuickStarts";
import {
	buildAgentReportHandoffRequest,
	buildBusinessObjectHandoffRequest,
} from "./agentReportPromptHandoff";
import { PRS_SCREEN_SHORTCUTS } from "../../shared/prsScreenShortcuts";

const EXPECTED_FLOWERBIZ_ADS_MODELS = [
	"public.xycyl_ads_flowerbiz_audit_trail",
	"public.xycyl_ads_flowerbiz_baddebt_summary",
	"public.xycyl_ads_flowerbiz_change_log",
	"public.xycyl_ads_flowerbiz_curing_workload",
	"public.xycyl_ads_flowerbiz_extra_cost_summary",
	"public.xycyl_ads_flowerbiz_finance_cost",
	"public.xycyl_ads_flowerbiz_lease_detail",
	"public.xycyl_ads_flowerbiz_lease_summary",
	"public.xycyl_ads_flowerbiz_overview",
	"public.xycyl_ads_flowerbiz_pending",
	"public.xycyl_ads_flowerbiz_project_customer",
	"public.xycyl_ads_flowerbiz_recovery_detail",
	"public.xycyl_ads_flowerbiz_sale_summary",
];

describe("agentReportQuickStarts", () => {
	it("starts from PRS flower-business report questions instead of generic demos", () => {
		expect(AGENT_REPORT_QUICK_STARTS).toHaveLength(4);
		expect(AGENT_REPORT_QUICK_STARTS.map((item) => item.domain)).toEqual([
			"租赁经营",
			"回收与坏账",
			"养护成本",
			"项目运营",
		]);
		expect(AGENT_REPORT_QUICK_STARTS[0].prompt).toContain("2025-05-01");
	});

	it("marks each question with the agent routing surface it should exercise", () => {
		expect(
			AGENT_REPORT_QUICK_STARTS.map((item) => ({
				id: item.id,
				routeLevel: item.routeLevel,
				responseKind: item.responseKind,
				qualityLevel: item.qualityLevel,
			})),
		).toEqual([
			{
				id: "lease-revenue-trend",
				routeLevel: "L1",
				responseKind: "REPORT_DRAFT",
				qualityLevel: "MEDIUM",
			},
			{
				id: "recovery-baddebt",
				routeLevel: "L1",
				responseKind: "REPORT_DRAFT",
				qualityLevel: "MEDIUM",
			},
			{
				id: "curing-extra-cost",
				routeLevel: "L1",
				responseKind: "REPORT_DRAFT",
				qualityLevel: "MEDIUM",
			},
			{
				id: "project-operation",
				routeLevel: "L2",
				responseKind: "REPORT_DRAFT",
				qualityLevel: "MEDIUM",
			},
		]);
	});

	it("builds different handoff requests for direct run and editable draft", () => {
		const quickStart = AGENT_REPORT_QUICK_STARTS[0];

		expect(buildAgentReportHandoffRequest(quickStart, "run")).toMatchObject({
			prompt: quickStart.prompt,
			submit: true,
			source: "agent-bi",
			reportIntentId: quickStart.id,
		});
		expect(buildAgentReportHandoffRequest(quickStart, "edit")).toMatchObject({
			prompt: quickStart.prompt,
			submit: false,
			source: "agent-bi",
			reportIntentId: quickStart.id,
		});
	});

	it("links users to implemented report assets while hiding unfinished menu noise", () => {
		expect(AGENT_REPORT_SUPPORTING_ASSETS.map((item) => item.to)).toEqual([
			"/agent-bi",
			"/dashboards",
			"/data",
		]);
	});

	it("organizes the assistant guide by business object domains and data paths", () => {
		expect(AGENT_REPORT_BUSINESS_GUIDE.map((item) => item.title)).toEqual([
			"经营总览",
			"报花业务",
			"采购与配送",
			"变更与回收",
			"项目点与履约",
			"仓库与库存",
			"财务结算",
			"任务执行与养护",
		]);
		expect(
			AGENT_REPORT_BUSINESS_GUIDE.every(
				(item) =>
					item.dbtModels.length > 0 &&
					item.businessObjects.length > 0 &&
					item.questions.length > 0,
			),
		).toBe(true);
		expect(
			AGENT_REPORT_BUSINESS_GUIDE.find((item) => item.id === "warehouse-inventory")
				?.fixedReports,
		).toEqual([]);
		expect(
			AGENT_REPORT_BUSINESS_GUIDE.flatMap((item) => item.businessObjects),
			).toContain("prs.procurement.delivery_record");
	});

	it("keeps the AI report guide aligned with the 12 PRS screen-backed dbt reports", () => {
		const guideFixedReports = new Set(
			AGENT_REPORT_BUSINESS_GUIDE.flatMap((item) => item.fixedReports),
		);

		expect([...guideFixedReports]).toEqual(
			expect.arrayContaining(
				PRS_SCREEN_SHORTCUTS.map((shortcut) => shortcut.templateCode),
			),
		);
	});

	it("keeps the AI report guide aligned with the flowerbiz ADS model package", () => {
		const guideDbtModels = new Set(
			AGENT_REPORT_BUSINESS_GUIDE.flatMap((item) => item.dbtModels),
		);

		expect([...guideDbtModels]).toEqual(
			expect.arrayContaining(EXPECTED_FLOWERBIZ_ADS_MODELS),
		);
	});

	it("exposes business object questions across the key PRS domains", () => {
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.domain)).toEqual(
			expect.arrayContaining(["报花", "采购", "项目", "财务", "仓库"]),
		);
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.objectCode)).toContain(
			"prs.flowerbiz.biz_order",
		);
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.objectCode)).toContain(
			"prs.finance.bank_statement",
		);
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.objectCode)).toEqual(
			expect.arrayContaining([
				"prs.warehouse.stock_info",
				"prs.warehouse.inout_record",
			]),
		);
		expect(
			AGENT_REPORT_BUSINESS_GUIDE.flatMap((item) => item.businessObjects),
		).toEqual(
			expect.arrayContaining([
				"prs.warehouse.stock_info",
				"prs.warehouse.inout_record",
			]),
		);
		expect(
			AGENT_REPORT_BUSINESS_OBJECTS.every(
				(item) => item.dataSurface === "L0_BUSINESS_OBJECT_PROFILE",
			),
		).toBe(true);
	});

	it("builds a dedicated handoff request for business object read-only questions", () => {
		const businessObject = AGENT_REPORT_BUSINESS_OBJECTS[0];

		expect(buildBusinessObjectHandoffRequest(businessObject, "run")).toMatchObject({
			prompt: businessObject.prompt,
			submit: true,
			source: "business-object",
			reportIntentId: businessObject.id,
		});
		expect(buildBusinessObjectHandoffRequest(businessObject, "edit")).toMatchObject({
			prompt: businessObject.prompt,
			submit: false,
			source: "business-object",
			reportIntentId: businessObject.id,
		});
	});
});
