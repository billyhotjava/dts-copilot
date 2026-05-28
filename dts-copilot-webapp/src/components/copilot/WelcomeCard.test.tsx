import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeCard } from "./WelcomeCard";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		listSuggestedQuestions: vi.fn().mockResolvedValue([]),
	},
}));

describe("WelcomeCard", () => {
	const onQuestionClick = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("渲染欢迎标题", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		expect(screen.getByText("你好，我是绿植业务助手")).toBeInTheDocument();
	});

	it("渲染 4 个默认建议分组", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		expect(screen.getByText("PRS租赁报表")).toBeInTheDocument();
		expect(screen.getByText("PRS钻取明细")).toBeInTheDocument();
		expect(screen.getByText("Agent报表")).toBeInTheDocument();
		expect(screen.getByText("项目履约")).toBeInTheDocument();
	});

	it("点击建议按钮触发 onQuestionClick 回调", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		const chip = screen.getByText("PRS 租赁经营总览");
		fireEvent.click(chip);
		expect(onQuestionClick).toHaveBeenCalledWith("PRS 租赁经营总览");
	});

	it("渲染默认分组的所有建议文本", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		expect(screen.getByText("PRS 租赁报花执行看板")).toBeInTheDocument();
		expect(screen.getByText("PRS 回收明细钻取")).toBeInTheDocument();
		expect(screen.getByText("当前在服项目一共多少个？")).toBeInTheDocument();
	});
});
