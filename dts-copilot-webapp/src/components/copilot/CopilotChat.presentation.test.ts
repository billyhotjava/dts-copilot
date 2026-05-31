import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CONVERSATION_SOURCE = readFileSync(
	resolve(__dirname, "ConversationThread.tsx"),
	"utf8",
);
const MESSAGE_LIST_SOURCE = readFileSync(
	resolve(__dirname, "MessageList.tsx"),
	"utf8",
);
const COMPOSER_SOURCE = readFileSync(resolve(__dirname, "Composer.tsx"), "utf8");
const STREAM_SOURCE = readFileSync(
	resolve(__dirname, "useCopilotStream.ts"),
	"utf8",
);
const SPLIT_SOURCES = [
	CONVERSATION_SOURCE,
	MESSAGE_LIST_SOURCE,
	COMPOSER_SOURCE,
	STREAM_SOURCE,
].join("\n");
const CHAT_CSS = readFileSync(resolve(__dirname, "CopilotChat.css"), "utf8");

describe("CopilotChat presentation", () => {
	it("keeps assistant output visible while only compacting reasoning", () => {
		expect(CONVERSATION_SOURCE).toContain("compactReasoning");
		expect(MESSAGE_LIST_SOURCE).toContain("copilot-chat__reasoning-details");
		expect(MESSAGE_LIST_SOURCE).toContain(
			"<CopilotMessageContent content={msg.content} />",
		);
		expect(SPLIT_SOURCES).not.toContain("copilot-chat__assistant-echo");
		expect(SPLIT_SOURCES).not.toContain("Agent 回显");
	});

	it("styles reasoning as the collapsible section instead of the answer body", () => {
		expect(CHAT_CSS).toContain(".copilot-chat__reasoning-details");
		expect(CHAT_CSS).not.toContain(".copilot-chat__assistant-echo");
	});

	it("keeps the pre-split chat rendering anchors mounted", () => {
		expect(MESSAGE_LIST_SOURCE).toContain('className="copilot-chat__messages"');
		expect(MESSAGE_LIST_SOURCE).toContain("<WelcomeCard");
		expect(MESSAGE_LIST_SOURCE).toContain("<CopilotMessageContent");
		expect(MESSAGE_LIST_SOURCE).toContain("<InlineSqlPreview");
		expect(MESSAGE_LIST_SOURCE).toContain("<FeedbackButtons");
		expect(MESSAGE_LIST_SOURCE).not.toContain("trace-toggle");
		expect(COMPOSER_SOURCE).toContain('className="copilot-chat__input-area"');
		expect(COMPOSER_SOURCE).toContain("<VoiceInputButton");
		expect(COMPOSER_SOURCE).toContain("shouldSubmitCopilotInputOnEnter");
	});

	it("keeps send and stream behavior routed through pure baseline guards", () => {
		expect(STREAM_SOURCE).toContain("resolveCopilotSendGuard");
		expect(STREAM_SOURCE).toContain("reduceCopilotStreamContent");
		expect(STREAM_SOURCE).toContain("reduceCopilotStreamMessages");
	});
});
