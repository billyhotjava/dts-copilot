import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsApi } from "../api/analyticsApi";
import { MetricAssetsPanel } from "./MetricAssetsPanel";

vi.mock("react-router", async () => {
	const React = await vi.importActual<typeof import("react")>("react");
	return {
		Link: ({
			children,
			className,
			to,
		}: {
			children: ReactNode;
			className?: string;
			to: string;
		}) => React.createElement("a", { className, href: to }, children),
	};
});

vi.mock("../api/analyticsApi", () => ({
	analyticsApi: {
		getPlatformIndicatorDetail: vi.fn(),
		listPlatformIndicators: vi.fn(),
		listMetricLens: vi.fn(),
	},
}));

vi.mock("../components/charts/ChartRenderer", () => ({
	ChartRenderer: vi.fn(
		(props: { data?: { rows?: unknown[] } | null; display?: string }) => (
			<div data-testid="indicator-preview">
				preview:{props.display}:{props.data?.rows?.length ?? 0}
			</div>
		),
	),
}));

const getPlatformIndicatorDetail = vi.mocked(analyticsApi.getPlatformIndicatorDetail);
const listPlatformIndicators = vi.mocked(analyticsApi.listPlatformIndicators);
const listMetricLens = vi.mocked(analyticsApi.listMetricLens);

function renderPanel() {
	return render(<MetricAssetsPanel />);
}

describe("MetricAssetsPanel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		window.localStorage.clear();
		listPlatformIndicators.mockResolvedValue({
			items: [
				{
					id: "cash-in",
					name: "回款金额",
					definition: "按月统计已确认回款。",
					status: "已发布",
					version: "v2",
					timeGrain: "month",
				},
			],
		});
		listMetricLens.mockResolvedValue([
			{
				metricId: 7,
				name: "租赁收入",
				aggregation: "sum",
				timeGrain: "month",
				latestVersion: "v3",
			},
		]);
		getPlatformIndicatorDetail.mockResolvedValue({
			indicatorId: "cash-in",
			mode: "detail",
			cols: [
				{ name: "month", display_name: "月份" },
				{ name: "amount", display_name: "金额" },
			],
			rows: [["2026-05", 100]],
			timeGrain: "month",
		});
	});

	it("renders platform indicators and links them into Agent BI", async () => {
		renderPanel();

		expect(await screen.findByRole("heading", { name: "平台指标资产" })).toBeInTheDocument();
		expect(await screen.findByText("回款金额")).toBeInTheDocument();
		expect(await screen.findByText("租赁收入")).toBeInTheDocument();
		expect(screen.getByText("平台指标").closest(".asset-library-metrics__stat")).toHaveTextContent("1");
		expect(screen.getByText("本地口径").closest(".asset-library-metrics__stat")).toHaveTextContent("1");

		const card = screen.getByText("回款金额").closest("li");
		expect(card).not.toBeNull();
		const agentLink = within(card as HTMLElement).getByRole("link", { name: "交给 Agent" });
		expect(agentLink).toHaveAttribute("href", expect.stringContaining("/agent-bi?"));
		expect(decodeURIComponent(agentLink.getAttribute("href") ?? "")).toContain(
			"metric=platform:cash-in",
		);
	});

	it("previews platform indicator values inside the asset library", async () => {
		renderPanel();

		const card = (await screen.findByText("回款金额")).closest("li");
		expect(card).not.toBeNull();

		fireEvent.click(within(card as HTMLElement).getByRole("button", { name: "预览取值" }));

		expect(await screen.findByTestId("indicator-preview")).toHaveTextContent("preview:line:1");
		expect(getPlatformIndicatorDetail).toHaveBeenCalledWith("cash-in", 30);
	});

	it("keeps local metric assets visible when platform indicators degrade", async () => {
		listPlatformIndicators.mockResolvedValue({
			items: [],
			degraded: true,
			degradedReason: "平台指标服务暂不可达",
		});

		renderPanel();

		expect(await screen.findByText("平台指标服务暂不可达")).toBeInTheDocument();
		expect(await screen.findByText("租赁收入")).toBeInTheDocument();
	});

	it("marks platform indicators when the stored caliber version changes", async () => {
		window.localStorage.setItem(
			"dts-copilot.platformIndicatorVersions",
			JSON.stringify({ "cash-in": "v1" }),
		);

		renderPanel();

		const card = (await screen.findByText("回款金额")).closest("li");
		expect(card).not.toBeNull();
		expect(within(card as HTMLElement).getByText("口径已更新")).toBeInTheDocument();
	});
});
