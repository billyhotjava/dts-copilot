import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const COPILOT_DIR = __dirname;

function readComponentSource(fileName: string): string {
	const filePath = resolve(COPILOT_DIR, fileName);
	expect(existsSync(filePath), `${fileName} should exist`).toBe(true);
	return readFileSync(filePath, "utf8");
}

function lineCount(source: string): number {
	return source.split(/\r?\n/).length;
}

describe("CopilotChat split structure", () => {
	it("keeps CopilotChat as a thin compatibility entry", () => {
		const source = readComponentSource("CopilotChat.tsx");

		expect(source).toContain("ConversationThread");
		expect(source).not.toContain("useState");
		expect(source).not.toContain("aiAgentChatSendStream");
		expect(lineCount(source)).toBeLessThan(80);
	});

	it("mounts the conversation spine through split presentational components", () => {
		const source = readComponentSource("ConversationThread.tsx");

		expect(source).toContain("<MessageList");
		expect(source).toContain("<Composer");
		expect(source).toContain('className={[');
		expect(source).toContain("copilot-chat--workbench");
	});

	it("moves message rendering anchors into MessageList", () => {
		const source = readComponentSource("MessageList.tsx");

		expect(source).toContain('className="copilot-chat__messages"');
		expect(source).toContain("<WelcomeCard");
		expect(source).toContain("<CopilotMessageContent content={msg.content} />");
		expect(source).toContain("<InlineSqlPreview");
		expect(source).toContain("<FeedbackButtons");
		expect(source).toContain("copilot-chat__reasoning-details");
		expect(source).not.toContain("trace-toggle");
	});

	it("moves composer rendering anchors into Composer", () => {
		const source = readComponentSource("Composer.tsx");

		expect(source).toContain('className="copilot-chat__input-area"');
		expect(source).toContain("<VoiceInputButton");
		expect(source).toContain("shouldSubmitCopilotInputOnEnter");
		expect(source).toContain("sendAction.label");
	});

	it("moves approval state and actions into an approval hook", () => {
		const conversationSource = readComponentSource("ConversationThread.tsx");
		const approvalSource = readComponentSource("useCopilotApproval.ts");

		expect(conversationSource).toContain("useCopilotApproval");
		expect(approvalSource).toContain("buildInitialApprovalValues");
		expect(approvalSource).toContain("handleApprove");
		expect(approvalSource).toContain("handleCancel");
	});

	it("moves session bootstrap and history state into a session hook", () => {
		const conversationSource = readComponentSource("ConversationThread.tsx");
		const sessionSource = readComponentSource("useCopilotSessionState.ts");

		expect(conversationSource).toContain("useCopilotSessionState");
		expect(sessionSource).toContain("reloadSessions");
		expect(sessionSource).toContain("reloadMessages");
		expect(sessionSource).toContain("shouldRestorePersistedCopilotSession");
		expect(sessionSource).toContain("listAiAgentSessions");
	});

	it("keeps the split files below the sprint line-count guardrail", () => {
		for (const fileName of [
			"CopilotChat.tsx",
			"ConversationThread.tsx",
			"MessageList.tsx",
			"Composer.tsx",
			"useCopilotStream.ts",
			"useCopilotApproval.ts",
			"useCopilotSessionState.ts",
		]) {
			const source = readComponentSource(fileName);

			expect(lineCount(source), `${fileName} should stay below 800 lines`).toBeLessThan(
				800,
			);
		}
	});
});
