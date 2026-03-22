import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackButtons } from "./FeedbackButtons";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		submitChatFeedback: vi.fn().mockResolvedValue(undefined),
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

	it("渲染点赞和点踩按钮", () => {
		render(<FeedbackButtons {...defaultProps} />);
		const buttons = screen.getAllByRole("button");
		// At least thumbs up and thumbs down
		expect(buttons.length).toBeGreaterThanOrEqual(2);
		expect(screen.getByText("👍")).toBeInTheDocument();
		expect(screen.getByText("👎")).toBeInTheDocument();
	});

	it("点击点赞后显示激活状态", async () => {
		render(<FeedbackButtons {...defaultProps} />);
		const thumbsUp = screen.getByText("👍");
		fireEvent.click(thumbsUp);
		await waitFor(() => {
			// After positive feedback, thumbs up button should be disabled (active state)
			const activeBtn = screen.getByText("👍").closest("button");
			expect(activeBtn).toBeDisabled();
		});
	});

	it("点击点踩后显示反馈表单", () => {
		render(<FeedbackButtons {...defaultProps} />);
		const thumbsDown = screen.getByText("👎");
		fireEvent.click(thumbsDown);
		// Should show reason chips
		expect(screen.getByText("SQL不正确")).toBeInTheDocument();
		expect(screen.getByText("数据不准确")).toBeInTheDocument();
		expect(screen.getByText("查错了表")).toBeInTheDocument();
		expect(screen.getByText("没理解我的意思")).toBeInTheDocument();
		expect(screen.getByText("响应太慢")).toBeInTheDocument();
		expect(screen.getByText("其他")).toBeInTheDocument();
	});

	it("反馈表单包含补充说明文本框和提交/取消按钮", () => {
		render(<FeedbackButtons {...defaultProps} />);
		fireEvent.click(screen.getByText("👎"));
		expect(screen.getByPlaceholderText("补充说明（可选）")).toBeInTheDocument();
		expect(screen.getByText("提交")).toBeInTheDocument();
		expect(screen.getByText("取消")).toBeInTheDocument();
	});

	it("点击取消恢复到初始状态", () => {
		render(<FeedbackButtons {...defaultProps} />);
		fireEvent.click(screen.getByText("👎"));
		expect(screen.getByText("SQL不正确")).toBeInTheDocument();
		fireEvent.click(screen.getByText("取消"));
		expect(screen.queryByText("SQL不正确")).not.toBeInTheDocument();
	});
});
