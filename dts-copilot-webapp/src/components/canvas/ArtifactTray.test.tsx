import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Artifact } from "../../types/artifact";
import { ArtifactTray } from "./ArtifactTray";

function artifact(id: string, title: string, type: Artifact["type"]): Artifact {
	return {
		createdAt: id === "a" ? 1000 : 2000,
		id,
		sourceMessageId: `msg-${id}`,
		spec: {},
		title,
		type,
	};
}

describe("ArtifactTray", () => {
	it("renders artifact chips and highlights the current artifact", async () => {
		const onSelect = vi.fn();
		render(
			<ArtifactTray
				artifacts={[
					artifact("a", "收入表格", "table"),
					artifact("b", "趋势图", "chart"),
				]}
				currentId="b"
				onSelect={onSelect}
			/>,
		);

		expect(await screen.findByRole("button", { name: /收入表格/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /趋势图/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);

		await userEvent.click(screen.getByRole("button", { name: /收入表格/ }));

		expect(onSelect).toHaveBeenCalledWith("a");
	});

	it("supports arrow-key selection across tray chips", async () => {
		const onSelect = vi.fn();
		render(
			<ArtifactTray
				artifacts={[
					artifact("a", "收入表格", "table"),
					artifact("b", "趋势图", "chart"),
				]}
				currentId="a"
				onSelect={onSelect}
			/>,
		);
		const first = await screen.findByRole("button", { name: /收入表格/ });
		const second = screen.getByRole("button", { name: /趋势图/ });

		first.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(onSelect).toHaveBeenLastCalledWith("b");

		second.focus();
		await userEvent.keyboard("{ArrowLeft}");
		expect(onSelect).toHaveBeenLastCalledWith("a");
	});
});
