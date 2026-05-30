import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE_SOURCE = readFileSync(resolve(__dirname, "AgentReportsPage.tsx"), "utf8");

describe("AgentReportsPage", () => {
	it("uses a vertical guide plus embedded agent conversation workbench", () => {
		expect(PAGE_SOURCE).toContain("agent-reports-workbench");
		expect(PAGE_SOURCE).toContain("agent-reports-chat-workbench");
		expect(PAGE_SOURCE).toContain('presentation="workbench"');
		expect(PAGE_SOURCE).toContain("compactReasoning");
		expect(PAGE_SOURCE).not.toContain("compactAssistantEcho");
		expect(PAGE_SOURCE).toContain("AGENT_REPORT_BUSINESS_GUIDE");
		expect(PAGE_SOURCE).toContain("L2 固定报表");
		expect(PAGE_SOURCE).toContain("L1 dbt");
		expect(PAGE_SOURCE).toContain("L0 业务对象");
		expect(PAGE_SOURCE).not.toContain("agent-reports-layout");
	});

	it("submits guide questions into the embedded agent chat", () => {
		expect(PAGE_SOURCE).toContain("handleGuideQuestion");
		expect(PAGE_SOURCE).toContain('source: "agent-bi-guide"');
		expect(PAGE_SOURCE).toContain("question.prompt");
		expect(PAGE_SOURCE).toContain("reportIntentId: question.id");
	});

	it("turns old fixed report URLs into AI report prompts instead of rendering a fixed report page", () => {
		expect(PAGE_SOURCE).toContain("fixedReportCode");
		expect(PAGE_SOURCE).toContain("fixed-report-redirect");
		expect(PAGE_SOURCE).toContain("已从旧固定报表链接切回 AI 报表统一入口");
		expect(PAGE_SOURCE).toContain("打开固定报表");
	});
});
