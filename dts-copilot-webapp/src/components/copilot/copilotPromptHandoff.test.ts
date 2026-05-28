import { describe, expect, it } from "vitest";
import {
	createCopilotPromptRequestGate,
	resolveCopilotPromptHandoff,
} from "./copilotPromptHandoff";

describe("resolveCopilotPromptHandoff", () => {
	it("prefills the composer for editable prompt requests", () => {
		expect(
			resolveCopilotPromptHandoff({
				request: { prompt: "  看租赁收入趋势  ", submit: false },
				sending: false,
			}),
		).toEqual({
			mode: "prefill",
			prompt: "看租赁收入趋势",
			notice: "已把问题带入 AI Copilot，可直接发送或继续修改。",
		});
	});

	it("submits immediately when the agent is idle", () => {
		expect(
			resolveCopilotPromptHandoff({
				request: {
					prompt: "生成项目经营月报",
					submit: true,
					notice: "已提交给 AI Copilot。",
				},
				sending: false,
			}),
		).toEqual({
			mode: "submit",
			prompt: "生成项目经营月报",
			notice: "已提交给 AI Copilot。",
		});
	});

	it("queues direct submissions while the agent is already answering", () => {
		expect(
			resolveCopilotPromptHandoff({
				request: { prompt: "分析坏账风险", submit: true },
				sending: true,
			}),
		).toEqual({
			mode: "queue",
			prompt: "分析坏账风险",
			notice: "当前回答结束后会继续执行新的报表问题。",
		});
	});

	it("ignores blank requests", () => {
		expect(
			resolveCopilotPromptHandoff({
				request: { prompt: " ", submit: true },
				sending: false,
			}),
		).toEqual({ mode: "ignore" });
	});

	it("consumes a prompt request only once for the same nonce", () => {
		const gate = createCopilotPromptRequestGate();
		const request = {
			prompt: "从 2025 年 5 月到现在租赁收入按月趋势怎么样",
			submit: true,
			nonce: 1001,
		};

		expect(gate.shouldConsume(request)).toBe(true);
		expect(gate.shouldConsume(request)).toBe(false);
		expect(gate.shouldConsume({ ...request, nonce: 1002 })).toBe(true);
	});
});
