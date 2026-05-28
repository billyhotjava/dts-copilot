import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	CopilotMessageContent,
	parseCopilotMarkdownTables,
} from "./CopilotMessageContent";

describe("CopilotMessageContent", () => {
	it("parses markdown tables into structured table segments", () => {
		const segments = parseCopilotMarkdownTables(`
报表说明

| 指标 | 说明 |
| --- | --- |
| 报花单数 | 所有业务单据数 |
| 租金净额 | 收入金额 |
`);

		expect(segments).toEqual([
			{ type: "text", content: "报表说明" },
			{
				type: "table",
				headers: ["指标", "说明"],
				rows: [
					["报花单数", "所有业务单据数"],
					["租金净额", "收入金额"],
				],
			},
		]);
	});

	it("renders agent markdown tables with styled header and white data rows", async () => {
		render(
			<CopilotMessageContent
				content={`| 指标 | 说明 |
| --- | --- |
| 报花单数 | 所有业务单据数 |
| 租金净额 | 收入金额 |`}
			/>,
		);

		const table = await screen.findByRole("table");
		expect(table).toHaveClass("copilot-message-table");
		expect(within(table).getByRole("columnheader", { name: "指标" })).toHaveClass(
			"copilot-message-table__header-cell",
		);
		expect(within(table).getByRole("cell", { name: "报花单数" })).toHaveClass(
			"copilot-message-table__body-cell",
		);
	});
});
