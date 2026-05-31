import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AGENT_REPORT_BUSINESS_GUIDE } from "../../pages/agent-reports/agentReportQuickStarts";

const WELCOME_SOURCE = readFileSync(resolve(__dirname, "WelcomeCard.tsx"), "utf8");

describe("WelcomeCard", () => {
	it("uses the unified green-business assistant copy", () => {
		expect(WELCOME_SOURCE).toContain("你好，我是绿植业务助手");
		expect(WELCOME_SOURCE).toContain("固定报表、dbt 主题表和业务对象问答合在一个入口");
		expect(WELCOME_SOURCE).toContain("welcome-card__domain-guide");
	});

	it("renders business-domain guide chips from the shared guide model", () => {
		expect(WELCOME_SOURCE).toContain("AGENT_REPORT_BUSINESS_GUIDE.map");
		expect(WELCOME_SOURCE).toContain("domain.questions.map");
		expect(WELCOME_SOURCE).toContain("onQuestionClick(question.prompt)");
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
	});

	it("keeps API suggestions collapsed below the business-domain guide", () => {
		expect(WELCOME_SOURCE).toContain("<details className=\"welcome-card__suggestions\">");
		expect(WELCOME_SOURCE).toContain("更多推荐问题");
	});
});
