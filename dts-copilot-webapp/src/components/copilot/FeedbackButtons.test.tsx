import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackButtons } from "./FeedbackButtons";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		submitChatFeedback: vi.fn().mockResolvedValue(undefined),
		submitCaliberCorrection: vi.fn().mockResolvedValue({
			accepted: true,
			queued: false,
		}),
	},
}));

describe("FeedbackButtons", () => {
	const defaultProps = {
		messageId: "msg-1",
		sessionId: "sess-1",
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("渲染点赞和点踩按钮", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		expect(await screen.findByText("👍")).toBeInTheDocument();
		const buttons = screen.getAllByRole("button");
		// At least thumbs up and thumbs down
		expect(buttons.length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("👎")).toBeInTheDocument();
	});

	it("点击点赞后显示激活状态", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		const thumbsUp = await screen.findByText("👍");
		fireEvent.click(thumbsUp);
		await waitFor(() => {
			// After positive feedback, thumbs up button should be disabled (active state)
			const activeBtn = screen.getByText("👍").closest("button");
			expect(activeBtn).toBeDisabled();
		});
	});

	it("点击点踩后显示反馈表单", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		const thumbsDown = await screen.findByText("👎");
		fireEvent.click(thumbsDown);
		// Should show reason chips
		expect(await screen.findByText("SQL不正确")).toBeInTheDocument();
		expect(screen.getByText("数据不准确")).toBeInTheDocument();
		expect(screen.getByText("查错了表")).toBeInTheDocument();
		expect(screen.getByText("没理解我的意思")).toBeInTheDocument();
		expect(screen.getByText("响应太慢")).toBeInTheDocument();
		expect(screen.getByText("其他")).toBeInTheDocument();
	});

	it("反馈表单包含补充说明文本框和提交/取消按钮", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		fireEvent.click(await screen.findByText("👎"));
		expect(await screen.findByPlaceholderText("补充说明（可选）")).toBeInTheDocument();
		expect(screen.getByText("提交")).toBeInTheDocument();
		expect(screen.getByText("取消")).toBeInTheDocument();
	});

	it("点击取消恢复到初始状态", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		fireEvent.click(await screen.findByText("👎"));
		expect(await screen.findByText("SQL不正确")).toBeInTheDocument();
		fireEvent.click(screen.getByText("取消"));
		await waitFor(() => {
			expect(screen.queryByText("SQL不正确")).not.toBeInTheDocument();
		});
	});

	it("纠正态提交口径纠正上下文", async () => {
		const { analyticsApi } = await import("../../api/analyticsApi");
		render(
			<FeedbackButtons
				{...defaultProps}
				correctionKind="metric_caliber"
				generatedSql="select 1"
				metricCaliberRef="ontology:profit"
				variant="correction"
			/>,
		);
		fireEvent.click(await screen.findByText("SQL不正确"));
		fireEvent.change(screen.getByPlaceholderText("补充说明（可选）"), {
			target: { value: "利润口径应该扣除成本" },
		});
		fireEvent.click(screen.getByText("提交"));

		await waitFor(() => {
			expect(analyticsApi.submitCaliberCorrection).toHaveBeenCalledWith(
				expect.objectContaining({
					correctionKind: "metric_caliber",
					detail: "利润口径应该扣除成本",
					generatedSql: "select 1",
					messageId: "msg-1",
					metricCaliberRef: "ontology:profit",
					reason: "SQL不正确",
					sessionId: "sess-1",
				}),
			);
		});
		expect(await screen.findByText("感谢反馈")).toBeInTheDocument();
	});
});
