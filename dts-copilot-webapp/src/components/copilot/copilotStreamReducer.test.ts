import { describe, expect, it } from "vitest";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import {
	reduceCopilotStreamMessages,
	reduceCopilotStreamState,
} from "./copilotStreamReducer";

const pendingReasoning = "__STREAM_PENDING__";
const assistantId = "stream-1";

function assistantMessage(
	overrides: Partial<AiAgentChatMessage> = {},
): AiAgentChatMessage {
	return {
		id: assistantId,
		sessionId: "",
		role: "assistant",
		content: "",
		reasoningContent: pendingReasoning,
		sequenceNum: 1,
		...overrides,
	};
}

describe("reduceCopilotStreamMessages", () => {
	it("merges reasoning deltas and clears the pending placeholder", () => {
		const messages = reduceCopilotStreamMessages(
			[assistantMessage()],
			{ type: "reasoning", content: "先识别业务域" },
			{
				assistantId,
				streamedContent: "",
				pendingReasoning,
			},
		);

		expect(messages[0]).toMatchObject({
			reasoningContent: "先识别业务域",
		});
	});

	it("appends token content without losing earlier fragments", () => {
		const messages = reduceCopilotStreamMessages(
			[assistantMessage({ reasoningContent: "先识别业务域" })],
			{ type: "token", content: "结果" },
			{
				assistantId,
				streamedContent: "第一段结果",
				pendingReasoning,
			},
		);

		expect(messages[0]).toMatchObject({
			content: "第一段结果",
			reasoningContent: "先识别业务域",
		});
	});

	it("turns tool progress into reasoning lines", () => {
		const messages = reduceCopilotStreamMessages(
			[assistantMessage({ reasoningContent: "先识别业务域" })],
			{ type: "tool", tool: "schema_lookup", status: "running" },
			{
				assistantId,
				streamedContent: "",
				pendingReasoning,
			},
		);

		expect(messages[0]).toMatchObject({
			reasoningContent: "先识别业务域\n[工具] schema_lookup · running",
		});
	});

	it("copies done metadata onto the assistant message", () => {
		const messages = reduceCopilotStreamMessages(
			[assistantMessage({ content: "已完成" })],
			{
				type: "done",
				generatedSql: "select 1",
				templateCode: "prs.summary",
				routedDomain: "flowerbiz",
				targetView: "xycyl_dws_summary",
				responseKind: "REPORT_DRAFT",
				suggestedDisplay: "table",
				dataSurface: "xycyl_dws_summary",
				qualityLevel: "HIGH",
				qualityNotes: ["matched"],
				reportCode: "prs.summary",
				sourceRefs: ["model:xycyl_dws_summary"],
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
			},
			{
				assistantId,
				streamedContent: "已完成",
				pendingReasoning,
			},
		);

		expect(messages[0]).toMatchObject({
			content: "已完成",
			generatedSql: "select 1",
			templateCode: "prs.summary",
			routedDomain: "flowerbiz",
			targetView: "xycyl_dws_summary",
			responseKind: "REPORT_DRAFT",
			suggestedDisplay: "table",
			dataSurface: "xycyl_dws_summary",
			qualityLevel: "HIGH",
			qualityNotes: ["matched"],
			reportCode: "prs.summary",
			sourceRefs: ["model:xycyl_dws_summary"],
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

	it("renders stream errors as assistant content and clears pending reasoning", () => {
		const messages = reduceCopilotStreamMessages(
			[assistantMessage()],
			{ type: "error", error: "模型不可用" },
			{
				assistantId,
				streamedContent: "",
				pendingReasoning,
			},
		);

		expect(messages[0]).toMatchObject({
			content: "模型不可用",
			reasoningContent: undefined,
		});
	});
});

describe("reduceCopilotStreamState", () => {
	it("accumulates session, token, done, and error state across stream events", () => {
		let state = {
			messages: [assistantMessage()],
			streamedContent: "",
			streamedSessionId: null as string | null,
			error: null as string | null,
		};
		const options = { assistantId, pendingReasoning };

		state = reduceCopilotStreamState(state, {
			type: "session",
			sessionId: "session-1",
		}, options);
		state = reduceCopilotStreamState(state, {
			type: "token",
			content: "营收",
		}, options);
		state = reduceCopilotStreamState(state, {
			type: "token",
			content: "上涨",
		}, options);
		state = reduceCopilotStreamState(state, {
			type: "done",
			generatedSql: "select revenue from mart",
		}, options);
		state = reduceCopilotStreamState(state, {
			type: "error",
			error: "后续保存失败",
		}, options);

		expect(state.streamedSessionId).toBe("session-1");
		expect(state.streamedContent).toBe("营收上涨");
		expect(state.error).toBe("后续保存失败");
		expect(state.messages[0]).toMatchObject({
			content: "后续保存失败",
			generatedSql: "select revenue from mart",
		});
	});
});
