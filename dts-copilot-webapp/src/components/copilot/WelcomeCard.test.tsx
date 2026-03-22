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
		expect(screen.getByText("财务")).toBeInTheDocument();
		expect(screen.getByText("采购")).toBeInTheDocument();
		expect(screen.getByText("仓库")).toBeInTheDocument();
		expect(screen.getByText("项目履约")).toBeInTheDocument();
	});

	it("点击建议按钮触发 onQuestionClick 回调", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		const chip = screen.getByText("财务结算汇总");
		fireEvent.click(chip);
		expect(onQuestionClick).toHaveBeenCalledWith("财务结算汇总");
	});

	it("渲染默认分组的所有建议文本", () => {
		render(<WelcomeCard onQuestionClick={onQuestionClick} />);
		expect(screen.getByText("采购汇总")).toBeInTheDocument();
		expect(screen.getByText("库存现量")).toBeInTheDocument();
		expect(screen.getByText("当前在服项目一共多少个？")).toBeInTheDocument();
	});
});
