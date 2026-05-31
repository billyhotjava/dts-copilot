import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Artifact, CanvasActionType } from "../../types/artifact";
import { CanvasActions } from "./CanvasActions";

function artifact(): Artifact {
	return {
		createdAt: 1000,
		id: "artifact-1",
		sourceMessageId: "msg-1",
		spec: {
			generatedSql: "select * from mart",
			sourceRefs: ["model:mart"],
		},
		title: "项目收入",
		type: "table",
	};
}

function indicatorArtifact(): Artifact {
	return {
		...artifact(),
		spec: {
			dataset: {
				cols: [{ name: "dimension" }, { name: "value" }],
				rows: [["项目A", 100]],
			},
			indicator: {
				indicatorId: "cash-in",
				name: "回款金额",
			},
		},
		type: "indicator",
	};
}

describe("CanvasActions", () => {
	it("renders the canvas actions in the expected order", async () => {
		render(<CanvasActions artifact={artifact()} onAction={vi.fn()} />);

		const buttons = await screen.findAllByRole("button");
		expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
			"存为卡片",
			"钉到看板",
			"SQL·溯源",
			"下钻",
			"导出",
		]);
	});

	it("dispatches each action with the current artifact", async () => {
		const current = artifact();
		const onAction = vi.fn();
		render(<CanvasActions artifact={current} onAction={onAction} />);

		const expected: Array<[string, CanvasActionType]> = [
			["存为卡片", "save-card"],
			["钉到看板", "pin-dashboard"],
			["SQL·溯源", "trace-sql"],
			["导出", "export"],
		];

		for (const [label, action] of expected) {
			await userEvent.click(await screen.findByRole("button", { name: label }));
			expect(onAction).toHaveBeenLastCalledWith({ action, artifact: current });
		}
		expect(onAction).toHaveBeenCalledTimes(4);
	});

	it("enables drilldown only for indicator artifacts", async () => {
		const { rerender } = render(<CanvasActions artifact={artifact()} onAction={vi.fn()} />);

		expect(await screen.findByRole("button", { name: "下钻" })).toBeDisabled();

		rerender(<CanvasActions artifact={indicatorArtifact()} onAction={vi.fn()} />);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "下钻" })).not.toBeDisabled();
		});
	});

	it("disables every action when no artifact is selected", async () => {
		const onAction = vi.fn();
		render(<CanvasActions artifact={null} onAction={onAction} />);

		for (const button of await screen.findAllByRole("button")) {
			expect(button).toBeDisabled();
		}
		expect(onAction).not.toHaveBeenCalled();
	});

	it("supports disabledActions and busyAction controls", async () => {
		render(
			<CanvasActions
				artifact={artifact()}
				busyAction="export"
				disabledActions={["trace-sql"]}
				onAction={vi.fn()}
			/>,
		);

		expect(await screen.findByRole("button", { name: "SQL·溯源" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "导出" })).toBeDisabled();
	});
});
