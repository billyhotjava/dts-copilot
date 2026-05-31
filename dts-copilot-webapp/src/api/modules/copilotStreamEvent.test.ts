import { describe, expect, it } from "vitest";
import { normalizeCopilotDoneStreamEvent } from "./copilot";

describe("normalizeCopilotDoneStreamEvent", () => {
	it("preserves optimistic NL2SQL assumptions and confidence from done events", () => {
		expect(
			normalizeCopilotDoneStreamEvent({
				generatedSql: "select revenue from mart",
				responseKind: "SQL_RESULT",
				assumptions: [
					{
						key: "period",
						label: "期间",
						value: "本月",
						editable: true,
					},
				],
				confidence: 0.72,
				clarifications: [
					{
						key: "scope",
						question: "项目范围是什么?",
						options: [
							{ value: "leased", label: "在租项目" },
							{ value: "all", label: "全部项目" },
						],
					},
				],
				trace: {
					metricCaliber: {
						name: "利润",
						formula: "收入-成本",
						domain: "报花域",
						version: "v3",
					},
					sources: [
						{ table: "xycyl_dws_profit", fields: ["revenue", "cost"] },
					],
					sql: "select revenue - cost from mart",
				},
			}),
		).toMatchObject({
			type: "done",
			generatedSql: "select revenue from mart",
			responseKind: "SQL_RESULT",
			assumptions: [
				{
					key: "period",
					label: "期间",
					value: "本月",
					editable: true,
				},
			],
			confidence: 0.72,
			clarifications: [
				{
					key: "scope",
					question: "项目范围是什么?",
					options: [
						{ value: "leased", label: "在租项目" },
						{ value: "all", label: "全部项目" },
					],
				},
			],
			trace: {
				metricCaliber: {
					name: "利润",
					formula: "收入-成本",
					domain: "报花域",
					version: "v3",
				},
				sources: [
					{ table: "xycyl_dws_profit", fields: ["revenue", "cost"] },
				],
				sql: "select revenue - cost from mart",
			},
		});
	});

	it("keeps zero confidence and ignores malformed assumptions", () => {
		expect(
			normalizeCopilotDoneStreamEvent({
				assumptions: "bad",
				confidence: 0,
			}),
		).toEqual({
			type: "done",
			confidence: 0,
		});
	});
});
