import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CHAT_SOURCE = readFileSync(resolve(__dirname, "CopilotChat.tsx"), "utf8");
const CHAT_CSS = readFileSync(resolve(__dirname, "CopilotChat.css"), "utf8");

describe("CopilotChat presentation", () => {
	it("keeps assistant output visible while only compacting reasoning", () => {
		expect(CHAT_SOURCE).toContain("compactReasoning");
		expect(CHAT_SOURCE).toContain("copilot-chat__reasoning-details");
		expect(CHAT_SOURCE).toContain("<CopilotMessageContent content={msg.content} />");
		expect(CHAT_SOURCE).not.toContain("copilot-chat__assistant-echo");
		expect(CHAT_SOURCE).not.toContain("Agent 回显");
	});

	it("styles reasoning as the collapsible section instead of the answer body", () => {
		expect(CHAT_CSS).toContain(".copilot-chat__reasoning-details");
		expect(CHAT_CSS).not.toContain(".copilot-chat__assistant-echo");
	});
});
