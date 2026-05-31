import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignalsView } from "./SignalsView";

const listCopilotSignals = vi.fn();

vi.mock("../../../api/analyticsApi", () => ({
	analyticsApi: {
		listCopilotSignals: (...args: unknown[]) => listCopilotSignals(...args),
	},
}));

describe("SignalsView", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listCopilotSignals.mockResolvedValue([]);
	});

	it("loads ontology signal summaries from the copilot signal API", async () => {
		listCopilotSignals.mockResolvedValue([
			{
				id: "flowerbiz:bad-debt",
				title: "项目坏账风险",
				severity: "high",
				description: "项目坏账率超过阈值。",
				source: "ontology.flowerbiz.signals",
				linkedActions: ["创建坏账处理单"],
			},
		]);

		render(<SignalsView />);

		expect(await screen.findByRole("button", { name: /项目坏账风险/ })).toBeInTheDocument();
		expect(screen.getByText("项目坏账率超过阈值。")).toBeInTheDocument();
		expect(screen.getByText("创建坏账处理单")).toBeInTheDocument();
		expect(listCopilotSignals).toHaveBeenCalledWith("flowerbiz");
	});

	it("opens a selected signal for follow-up analysis", async () => {
		const onOpenSignal = vi.fn();
		listCopilotSignals.mockResolvedValue([
			{
				id: "flowerbiz:customer-risk",
				title: "高金额客户坏账风险",
				severity: "medium",
				description: "客户在租金额高且存在坏账租金损失。",
				source: "ontology.flowerbiz.signals",
				linkedActions: [],
			},
		]);

		render(<SignalsView onOpenSignal={onOpenSignal} />);

		fireEvent.click(await screen.findByRole("button", { name: /高金额客户坏账风险/ }));

		expect(onOpenSignal).toHaveBeenCalledWith(expect.objectContaining({
			id: "flowerbiz:customer-risk",
			title: "高金额客户坏账风险",
		}));
	});
});
