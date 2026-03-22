import { render, screen, fireEvent } from "@testing-library/react";
import { InlineSqlPreview } from "./InlineSqlPreview";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		runDatasetQuery: vi.fn().mockResolvedValue({ data: { cols: [], rows: [] } }),
		createAnalysisDraft: vi.fn().mockResolvedValue({ id: 1 }),
	},
}));

vi.mock("./copilotAnalysisDraft", () => ({
	buildCopilotAnalysisDraftPayload: vi.fn().mockReturnValue({}),
	buildCopilotDraftEditorHref: vi.fn().mockReturnValue("/draft/1"),
}));

describe("InlineSqlPreview", () => {
	const defaultProps = {
		sql: "SELECT * FROM projects WHERE status = 'active'",
		databaseId: 1,
		question: "查询活跃项目",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("渲染 SQL 代码块", () => {
		render(<InlineSqlPreview {...defaultProps} />);
		expect(
			screen.getByText("SELECT * FROM projects WHERE status = 'active'"),
		).toBeInTheDocument();
		expect(screen.getByText("生成的 SQL")).toBeInTheDocument();
	});

	it("点击编辑按钮切换到文本编辑区域", () => {
		render(<InlineSqlPreview {...defaultProps} />);
		const editBtn = screen.getByText("编辑");
		fireEvent.click(editBtn);
		// After clicking edit, a textarea should appear
		const textarea = screen.getByRole("textbox");
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue(defaultProps.sql);
	});

	it("渲染复制按钮", () => {
		render(<InlineSqlPreview {...defaultProps} />);
		expect(screen.getByText("复制")).toBeInTheDocument();
	});

	it("渲染创建可视化按钮", () => {
		render(<InlineSqlPreview {...defaultProps} />);
		expect(screen.getByText("创建可视化")).toBeInTheDocument();
	});

	it("渲染执行查询按钮", () => {
		render(<InlineSqlPreview {...defaultProps} />);
		expect(screen.getByText("执行查询")).toBeInTheDocument();
	});
});
