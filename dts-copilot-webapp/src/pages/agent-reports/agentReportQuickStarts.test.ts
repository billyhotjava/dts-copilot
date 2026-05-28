import { describe, expect, it } from "vitest";
import {
	AGENT_REPORT_BUSINESS_OBJECTS,
	AGENT_REPORT_QUICK_STARTS,
	AGENT_REPORT_SUPPORTING_ASSETS,
} from "./agentReportQuickStarts";
import {
	buildAgentReportHandoffRequest,
	buildBusinessObjectHandoffRequest,
} from "./agentReportPromptHandoff";

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
			"/fixed-reports",
			"/dashboards",
			"/data",
		]);
	});

	it("exposes business object questions across the key PRS domains", () => {
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.domain)).toEqual([
			"报花",
			"采购",
			"项目",
			"财务",
			"仓库",
		]);
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.objectCode)).toContain(
			"prs.flowerbiz.biz_order",
		);
		expect(AGENT_REPORT_BUSINESS_OBJECTS.map((item) => item.objectCode)).toContain(
			"prs.finance.bank_statement",
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
