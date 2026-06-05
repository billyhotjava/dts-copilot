import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import { TracePanel } from "./TracePanel";

const tracedMessage: AiAgentChatMessage = {
	content: "利润已生成",
	generatedSql: "select revenue - cost as profit from mart",
	id: "assistant-1",
	role: "assistant",
	sessionId: "session-1",
	trace: {
		metricCaliber: {
			name: "利润",
			formula: "收入-成本",
			domain: "报花域",
			version: "v3",
			ontologyRef: "ontology:profit",
		},
		sources: [
			{ table: "xycyl_dws_project_profit", fields: ["revenue", "cost"], role: "fact" },
		],
		sql: "select revenue - cost as profit from mart",
	},
};

const fallbackMessage: AiAgentChatMessage = {
	content: "收入已生成",
	generatedSql: "select revenue from mart",
	id: "assistant-2",
	role: "assistant",
	sessionId: "session-1",
	sourceRefs: ["model:xycyl_dws_project_revenue", "field:revenue"],
};

const toolMessage: AiAgentChatMessage = {
	id: "tool-1",
	role: "tool",
	sessionId: "session-1",
	toolName: "schema_lookup",
	toolParams: '{"table":"xycyl_dws_project_profit"}',
	toolResult: '{"success":true,"rows":1}',
};

const financeAuditMessage: AiAgentChatMessage = {
	content: "月对账折后实收已生成",
	generatedSql: "select sum(folding_after_total_amount) from xycyl_ads_month_settlement_summary",
	id: "assistant-finance-audit",
	role: "assistant",
	sessionId: "session-1",
	trace: {
		metricCaliber: {
			name: "月对账折后实收",
			formula: "sum(folding_after_total_amount)",
			domain: "finance",
			version: "L3",
			ontologyRef: "finance.month_settlement",
		},
		sources: [
			{ table: "xycyl_ads_month_settlement_summary", role: "ADS" },
		],
		sql: "select sum(folding_after_total_amount) from xycyl_ads_month_settlement_summary",
		financeAudit: {
			oracleStatus: {
				bindingId: "month-settlement",
				healthStatus: "PASS",
				maxDifference: "0.00",
			},
			appliedRules: [
				{
					ruleId: "CAL-MONTH-AMOUNT-TIER",
					description: "月对账金额必须区分名义租金、应收折前、折后实收和已回款四层。",
				},
			],
			appliedInvariants: [
				{
					invariantId: "FIN-INV-03-PAYMENT-NOT-EXCEED-DISCOUNTED",
					statement: "任意条件下已回款金额不能超过折后应收金额。",
				},
			],
			lineage: [
				{ level: "ADS_MODEL", name: "xycyl_ads_month_settlement_summary", role: "auditable-result-model" },
				{ level: "SOURCE_TABLE", name: "a_month_accounting", role: "adminapi-source" },
			],
		},
	},
};

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		submitCaliberCorrection: vi.fn().mockResolvedValue({
			accepted: true,
			queued: false,
		}),
	},
}));

describe("TracePanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("does not render drawer content when closed", () => {
		render(
			<TracePanel
				message={tracedMessage}
				onClose={vi.fn()}
				open={false}
				toolMessages={[toolMessage]}
			/>,
		);

		expect(screen.queryByRole("dialog", { name: "SQL·溯源" })).not.toBeInTheDocument();
	});

	it("renders trace caliber, sources, SQL, and tool steps in a drawer", async () => {
		render(
			<TracePanel
				message={tracedMessage}
				onClose={vi.fn()}
				open
				toolMessages={[toolMessage]}
			/>,
		);
		const user = userEvent.setup();

		expect(await screen.findByRole("dialog", { name: "SQL·溯源" })).toBeInTheDocument();
		expect(screen.getByText("利润=收入-成本 · 报花域 · 口径 v3")).toBeInTheDocument();
		expect(screen.getByText("xycyl_dws_project_profit")).toBeInTheDocument();
		expect(screen.getByText("revenue")).toBeInTheDocument();
		expect(screen.getByText("cost")).toBeInTheDocument();

		expect(screen.queryByText("select revenue - cost as profit from mart")).not.toBeVisible();
		await user.click(screen.getByText("生成 SQL"));
		expect(screen.getByText("select revenue - cost as profit from mart")).toBeVisible();

		await user.click(screen.getByRole("button", { name: /schema_lookup/ }));
		expect(screen.getByText(/xycyl_dws_project_profit/)).toBeInTheDocument();

		await user.click(screen.getByText("⚑口径不对？纠正"));
		expect(await screen.findByText("SQL不正确")).toBeInTheDocument();
	});

	it("falls back to sourceRefs and generatedSql when structured trace is missing", async () => {
		render(
			<TracePanel
				message={fallbackMessage}
				onClose={vi.fn()}
				open
				toolMessages={[]}
			/>,
		);

		expect(await screen.findByText("口径结构化待后台补充")).toBeInTheDocument();
		expect(screen.getByText("model:xycyl_dws_project_revenue")).toBeInTheDocument();
		expect(screen.getByText("field:revenue")).toBeInTheDocument();
		await userEvent.click(screen.getByText("生成 SQL"));
		expect(screen.getByText("select revenue from mart")).toBeVisible();
	});

	it("renders finance audit status, applied rules, invariants, and lineage", async () => {
		render(
			<TracePanel
				message={financeAuditMessage}
				onClose={vi.fn()}
				open
				toolMessages={[]}
			/>,
		);

		expect(await screen.findByText("财务审计")).toBeInTheDocument();
		expect(screen.getByText("对账状态 PASS · 差异 0.00")).toBeInTheDocument();
		expect(screen.getByText("CAL-MONTH-AMOUNT-TIER")).toBeInTheDocument();
		expect(screen.getByText("FIN-INV-03-PAYMENT-NOT-EXCEED-DISCOUNTED")).toBeInTheDocument();
		expect(screen.getByText("a_month_accounting")).toBeInTheDocument();
	});

	it("closes on backdrop, close button, and Escape", async () => {
		const onClose = vi.fn();
		const user = userEvent.setup();
		const { rerender } = render(
			<TracePanel
				message={tracedMessage}
				onClose={onClose}
				open
				toolMessages={[]}
			/>,
		);

		await user.click(await screen.findByRole("button", { name: "关闭溯源面板" }));
		expect(onClose).toHaveBeenCalledTimes(1);

		rerender(
			<TracePanel
				message={tracedMessage}
				onClose={onClose}
				open
				toolMessages={[]}
			/>,
		);
		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
