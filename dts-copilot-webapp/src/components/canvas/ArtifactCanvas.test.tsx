import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { analyticsApi } from "../../api/analyticsApi";
import type { Artifact } from "../../types/artifact";
import { ArtifactCanvas } from "./ArtifactCanvas";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		getPlatformIndicatorDrilldown: vi.fn(),
		runDatasetQuery: vi.fn(),
	},
}));

vi.mock("../charts/ChartRenderer", () => ({
	ChartRenderer: vi.fn(
		(props: { data?: { rows?: unknown[]; cols?: unknown[] } | null; display?: string }) => (
			<div data-testid="chart-renderer">
				chart:{props.display}:{props.data?.rows?.length ?? 0}
			</div>
		),
	),
}));

vi.mock("../DataTable", () => ({
	DataTable: vi.fn(
		(props: { rows?: unknown[]; cols?: unknown[] }) => (
			<div data-testid="data-table">
				table:{props.rows?.length ?? 0}x{props.cols?.length ?? 0}
			</div>
		),
	),
}));

const dataset = {
	cols: [
		{ name: "month", display_name: "月份" },
		{ name: "amount", display_name: "金额" },
	],
	rows: [["2026-05", 1234]],
};

function artifact(overrides: Partial<Artifact> = {}): Artifact {
	return {
		createdAt: 1000,
		id: "artifact-1",
		sourceMessageId: "msg-1",
		spec: {
			dataset,
			display: "table",
		},
		title: "项目收入",
		type: "table",
		...overrides,
	};
}

describe("ArtifactCanvas", () => {
	it("renders an empty canvas state when no artifact is selected", async () => {
		render(<ArtifactCanvas artifact={null} />);

		expect(
			await screen.findByText("右侧画布会在这里钉住你正在看的产物"),
		).toBeInTheDocument();
	});

	it("renders a loading state before an artifact exists", async () => {
		render(<ArtifactCanvas artifact={null} loading />);

		expect(await screen.findByText("正在生成画布产物…")).toBeInTheDocument();
	});

	it("renders a readable error state", async () => {
		render(<ArtifactCanvas artifact={null} error={new Error("SQL 执行失败")} />);

		expect(await screen.findByText("SQL 执行失败")).toBeInTheDocument();
	});

	it("dispatches chart artifacts to ChartRenderer", async () => {
		render(
			<ArtifactCanvas
				artifact={artifact({
					spec: { dataset, display: "line" },
					type: "chart",
				})}
			/>,
		);

		expect(await screen.findByTestId("chart-renderer")).toHaveTextContent("chart:line:1");
	});

	it("dispatches table artifacts to DataTable", async () => {
		render(<ArtifactCanvas artifact={artifact()} />);

		expect(await screen.findByTestId("data-table")).toHaveTextContent("table:1x2");
	});

	it("renders indicator artifacts with platform caliber identity", async () => {
		render(
			<ArtifactCanvas
				artifact={artifact({
					spec: {
						dataset,
						display: "line",
						indicator: {
							indicatorId: "cash-in",
							name: "回款金额",
							version: "v2",
							definition: "按月统计已确认回款。",
						},
					},
					title: "回款金额",
					type: "indicator",
				})}
			/>,
		);

		expect(await screen.findByText("平台指标产物")).toBeInTheDocument();
		expect(await screen.findByText("平台指标")).toBeInTheDocument();
		expect(await screen.findByText("口径 v2")).toBeInTheDocument();
		expect(await screen.findByTestId("chart-renderer")).toHaveTextContent("chart:line:1");
	});

	it("drills down indicator artifacts in the same canvas surface", async () => {
		vi.mocked(analyticsApi.getPlatformIndicatorDrilldown).mockResolvedValue({
			indicatorId: "cash-in",
			mode: "drilldown",
			cols: [
				{ name: "dimension", display_name: "项目" },
				{ name: "metric_value", display_name: "金额" },
			],
			rows: [
				["项目A", 1200],
				["项目B", 900],
			],
		});
		const onArtifactUpdate = vi.fn();

		render(
			<ArtifactCanvas
				artifact={artifact({
					id: "indicator-artifact",
					spec: {
						dataset,
						display: "line",
						indicator: {
							indicatorId: "cash-in",
							name: "回款金额",
							version: "v2",
							dimensionFields: ["project_id", "customer_id"],
						},
					},
					title: "回款金额",
					type: "indicator",
				})}
				onArtifactUpdate={onArtifactUpdate}
			/>,
		);

		fireEvent.change(await screen.findByLabelText("下钻维度"), {
			target: { value: "customer_id" },
		});
		fireEvent.change(screen.getByLabelText("下钻周期"), {
			target: { value: "2026-05" },
		});
		fireEvent.click(screen.getByRole("button", { name: "下钻" }));

		await waitFor(() => {
			expect(screen.getByTestId("chart-renderer")).toHaveTextContent("chart:bar:2");
		});
		expect(analyticsApi.getPlatformIndicatorDrilldown).toHaveBeenCalledWith(
			"cash-in",
			"customer_id",
			"2026-05",
		);
		expect(onArtifactUpdate).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "indicator-artifact",
				spec: expect.objectContaining({
					indicator: expect.objectContaining({
						activeDrilldownDimension: "customer_id",
						activeDrilldownPeriod: "2026-05",
						valueMode: "drilldown",
					}),
				}),
			}),
		);
	});

	it("renders report artifacts as a visualization screen link", async () => {
		render(
			<ArtifactCanvas
				artifact={artifact({
					spec: {
						reportCode: "PRS-FLOWERBIZ-OVERVIEW",
						reportHref: "/screens/290001/preview",
					},
					type: "report",
				})}
			/>,
		);

		expect(await screen.findByText("PRS-FLOWERBIZ-OVERVIEW")).toBeInTheDocument();
		expect(await screen.findByRole("link", { name: "打开可视化大屏" })).toHaveAttribute(
			"href",
			"/screens/290001/preview",
		);
	});

	it("auto-runs SQL-backed artifacts when the dataset has not been materialized yet", async () => {
		let resolveQuery!: (value: Awaited<ReturnType<typeof analyticsApi.runDatasetQuery>>) => void;
		vi.mocked(analyticsApi.runDatasetQuery).mockReturnValue(
			new Promise((resolve) => {
				resolveQuery = resolve;
			}),
		);
		const onDatasetReady = vi.fn();

		render(
			<ArtifactCanvas
				artifact={artifact({
					spec: {
						databaseId: 7,
						display: "table",
						generatedSql: "select * from mart",
						reportCode: "prs.project.customer_value",
					},
					type: "table",
				})}
				onDatasetReady={onDatasetReady}
			/>,
		);

		expect(await screen.findByText("正在执行画布查询…")).toBeInTheDocument();
		await act(async () => {
			resolveQuery({
				data: {
					cols: [
						{ name: "month", display_name: "月份" },
						{ name: "amount", display_name: "金额" },
					],
					rows: [["2026-05", 1234]],
				},
				row_count: 1,
				status: "completed",
			});
		});
		expect(await screen.findByTestId("data-table")).toHaveTextContent("table:1x2");
		expect(analyticsApi.runDatasetQuery).toHaveBeenCalledWith({
			context: "agent-canvas",
			database: 7,
			native: { query: "select * from mart" },
			type: "native",
		});
		expect(onDatasetReady).toHaveBeenCalledWith(
			expect.objectContaining({ id: "artifact-1" }),
			{
				cols: [
					{ name: "month", display_name: "月份" },
					{ name: "amount", display_name: "金额" },
				],
				rows: [["2026-05", 1234]],
			},
		);
	});
});
