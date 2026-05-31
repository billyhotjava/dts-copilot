import { render, screen } from "@testing-library/react";
import type { Artifact } from "../../types/artifact";
import { ArtifactCanvas } from "./ArtifactCanvas";

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

	it("renders report artifacts as an AI report entry link", async () => {
		render(
			<ArtifactCanvas
				artifact={artifact({
					spec: {
						reportCode: "PRS-FLOWERBIZ-OVERVIEW",
						reportHref: "/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW",
					},
					type: "report",
				})}
			/>,
		);

		expect(await screen.findByText("PRS-FLOWERBIZ-OVERVIEW")).toBeInTheDocument();
		expect(await screen.findByRole("link", { name: "用 AI 报表打开" })).toHaveAttribute(
			"href",
			"/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW",
		);
	});
});
