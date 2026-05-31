import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CopilotClarification } from "../../../api/analyticsApi";
import { ClarificationChips } from "./ClarificationChips";

const clarifications: CopilotClarification[] = [
	{
		key: "period",
		question: "本月按哪种口径?",
		options: [
			{ value: "calendar", label: "自然月" },
			{ value: "billing", label: "账期" },
		],
	},
	{
		key: "scope",
		question: "项目范围是什么?",
		options: [
			{ value: "leased", label: "在租项目" },
			{ value: "all", label: "全部项目" },
		],
	},
];

describe("ClarificationChips", () => {
	it("requires one answer per clarification before continuing", async () => {
		const onAnswer = vi.fn();
		render(
			<ClarificationChips
				clarifications={clarifications}
				onAnswer={onAnswer}
			/>,
		);
		const user = userEvent.setup();

		expect(await screen.findByRole("button", { name: "继续" })).toBeDisabled();
		await user.click(screen.getByRole("radio", { name: "自然月" }));
		expect(screen.getByRole("button", { name: "继续" })).toBeDisabled();
		await user.click(screen.getByRole("radio", { name: "全部项目" }));
		await user.click(screen.getByRole("button", { name: "继续" }));

		expect(onAnswer).toHaveBeenCalledWith({
			period: "calendar",
			scope: "all",
		});
	});

	it("supports keyboard selection and keeps options in one group mutually exclusive", async () => {
		const onAnswer = vi.fn();
		render(
			<ClarificationChips
				clarifications={[clarifications[0]]}
				onAnswer={onAnswer}
			/>,
		);
		const user = userEvent.setup();

		await screen.findByRole("radio", { name: "自然月" });
		await user.tab();
		await user.keyboard("{Enter}");
		expect(screen.getByRole("radio", { name: "自然月" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
		await user.click(screen.getByRole("radio", { name: "账期" }));
		expect(screen.getByRole("radio", { name: "自然月" })).toHaveAttribute(
			"aria-checked",
			"false",
		);
		expect(screen.getByRole("radio", { name: "账期" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});
});
