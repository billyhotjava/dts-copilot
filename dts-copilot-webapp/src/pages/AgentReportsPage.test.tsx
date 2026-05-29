import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	COPILOT_PROMPT_REQUEST_EVENT,
	type CopilotPromptRequest,
} from "../components/copilot/copilotPromptRequest";
import AgentReportsPage from "./AgentReportsPage";

vi.mock("react-router", async () => {
	const React = await import("react");
	return {
		Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
			React.createElement("a", { href: to }, children),
	};
});

function renderPage() {
	return render(<AgentReportsPage />);
}

describe("AgentReportsPage", () => {
	it("shows one stacked entry for reports and business object QA", async () => {
		const { container } = renderPage();

		expect(
			await screen.findByRole("heading", { name: "报表与业务对象入口" }),
		).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "报表问题模板" })).toBeInTheDocument();
		expect(
			screen.getByRole("heading", { name: "业务对象补充问答" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("heading", { name: "业务对象问答器" })).not.toBeInTheDocument();
		expect(screen.getByText("报花单据状态分布")).toBeInTheDocument();
		expect(screen.getByText("项目点状态统计")).toBeInTheDocument();
		expect(screen.getByText("银行流水未核对")).toBeInTheDocument();
		expect(screen.getAllByText("L0_BUSINESS_OBJECT_PROFILE")).toHaveLength(5);
		expect(container.querySelector(".agent-reports-layout")).not.toBeInTheDocument();
		expect(container.querySelector(".agent-reports-entry-stack")).toBeInTheDocument();
	});

	it("dispatches a business-object prompt request from the object table", async () => {
		renderPage();
		const user = userEvent.setup();
		const events: CopilotPromptRequest[] = [];
		window.addEventListener(COPILOT_PROMPT_REQUEST_EVENT, ((event: Event) => {
			events.push((event as CustomEvent<CopilotPromptRequest>).detail);
		}) as EventListener);

		const flowerRow = await screen.findByRole("row", { name: /报花单据状态分布/ });
		await user.click(
			within(flowerRow).getByRole("button", { name: /问业务对象/ }),
		);

		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			source: "business-object",
			reportIntentId: "flowerbiz-order-status",
			submit: true,
		});
		expect(events[0].prompt).toContain("prs.flowerbiz.biz_order");
		expect(events[0].prompt).toContain("结构化表格");
	});
});
