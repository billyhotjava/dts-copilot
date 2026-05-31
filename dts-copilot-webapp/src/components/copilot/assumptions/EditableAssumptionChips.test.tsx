import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CopilotAssumption } from "./assumptionTypes";
import { EditableAssumptionChips } from "./EditableAssumptionChips";

const assumptions: CopilotAssumption[] = [
	{
		key: "period",
		label: "本月",
		options: [
			{ label: "2026-05", value: "2026-05" },
			{ label: "2026-04", value: "2026-04" },
		],
		value: "2026-05",
	},
	{
		key: "profitFormula",
		label: "利润",
		value: "收入-成本",
	},
	{
		editable: false,
		key: "scope",
		label: "范围",
		value: "在租项目",
	},
];

describe("EditableAssumptionChips", () => {
	it("renders editable and readonly assumption chips", async () => {
		render(<EditableAssumptionChips assumptions={assumptions} onCommit={vi.fn()} />);

		expect(await screen.findByRole("button", { name: /本月=2026-05/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /利润=收入-成本/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /范围=在租项目/ })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
	});

	it("commits option edits from a select control", async () => {
		const onCommit = vi.fn();
		render(<EditableAssumptionChips assumptions={assumptions} onCommit={onCommit} />);

		await userEvent.click(await screen.findByRole("button", { name: /本月=2026-05/ }));
		await userEvent.selectOptions(screen.getByLabelText("本月"), "2026-04");
		await userEvent.click(screen.getByRole("button", { name: "确定" }));

		expect(onCommit).toHaveBeenCalledWith("period", "2026-04");
	});

	it("commits text edits and ignores unchanged values", async () => {
		const onCommit = vi.fn();
		render(<EditableAssumptionChips assumptions={assumptions} onCommit={onCommit} />);

		await userEvent.click(await screen.findByRole("button", { name: /利润=收入-成本/ }));
		await userEvent.clear(screen.getByLabelText("利润"));
		await userEvent.type(screen.getByLabelText("利润"), "收入-采购成本");
		await userEvent.keyboard("{Enter}");

		expect(onCommit).toHaveBeenCalledWith("profitFormula", "收入-采购成本");

		await userEvent.click(screen.getByRole("button", { name: /利润=收入-成本/ }));
		await userEvent.clear(screen.getByLabelText("利润"));
		await userEvent.type(screen.getByLabelText("利润"), " 收入-成本 ");
		await userEvent.click(screen.getByRole("button", { name: "确定" }));

		expect(onCommit).toHaveBeenCalledTimes(1);
	});

	it("cancels edits with Escape and blocks disabled chips", async () => {
		const onCommit = vi.fn();
		render(
			<EditableAssumptionChips
				assumptions={assumptions}
				disabled
				onCommit={onCommit}
			/>,
		);

		await userEvent.click(await screen.findByRole("button", { name: /本月=2026-05/ }));
		expect(screen.queryByLabelText("本月")).not.toBeInTheDocument();
		expect(onCommit).not.toHaveBeenCalled();
	});
});
