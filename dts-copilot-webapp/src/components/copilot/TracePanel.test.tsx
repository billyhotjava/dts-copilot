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
