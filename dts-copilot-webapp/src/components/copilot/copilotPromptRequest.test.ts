import { describe, expect, it, vi } from "vitest";
import {
	COPILOT_PROMPT_REQUEST_EVENT,
	buildCopilotPromptRequest,
	requestCopilotPrompt,
} from "./copilotPromptRequest";

describe("copilotPromptRequest", () => {
	it("normalizes a quick-start prompt into a request", () => {
		expect(buildCopilotPromptRequest("  分析 2025 年后的租赁收入  ")).toEqual({
			prompt: "分析 2025 年后的租赁收入",
			notice: "已把问题带入 AI Copilot，可直接发送或继续修改。",
			submit: false,
		});
	});

	it("can request an immediate agent submission with source metadata", () => {
		expect(
			buildCopilotPromptRequest("生成项目经营月报", {
				submit: true,
				source: "agent-bi",
				reportIntentId: "project-operation",
				notice: "已提交给 AI Copilot。",
			}),
		).toEqual({
			prompt: "生成项目经营月报",
			notice: "已提交给 AI Copilot。",
			submit: true,
			source: "agent-bi",
			reportIntentId: "project-operation",
		});
	});

	it("returns null for empty prompts", () => {
		expect(buildCopilotPromptRequest(" ")).toBeNull();
	});

	it("dispatches a browser event for the copilot sidebar", () => {
		const listener = vi.fn();
		window.addEventListener(COPILOT_PROMPT_REQUEST_EVENT, listener);

		requestCopilotPrompt({
			prompt: "生成项目租赁日报",
			notice: "已填入日报问题",
		});

		expect(listener).toHaveBeenCalledTimes(1);
		const event = listener.mock.calls[0][0] as CustomEvent;
		expect(event.detail).toEqual({
			prompt: "生成项目租赁日报",
			notice: "已填入日报问题",
			submit: false,
		});
		window.removeEventListener(COPILOT_PROMPT_REQUEST_EVENT, listener);
	});
});
