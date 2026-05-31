import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import { MessageList } from "./MessageList";

vi.mock("./InlineSqlPreview", () => ({
	InlineSqlPreview: vi.fn((props: { autoRun?: boolean }) => (
		<div
			data-autorun={String(Boolean(props.autoRun))}
			data-testid="inline-sql-preview"
		/>
	)),
}));

function userMessage(): AiAgentChatMessage {
	return {
		content: "查本月租赁情况",
		id: "user-1",
		role: "user",
		sequenceNum: 1,
		sessionId: "session-1",
	};
}

function assistantMessage(): AiAgentChatMessage {
	return {
		content: "已生成 SQL。",
		generatedSql: "select * from mart",
		id: "assistant-1",
		role: "assistant",
		sequenceNum: 2,
		sessionId: "session-1",
	};
}

function renderMessageList() {
	const messages = [userMessage(), assistantMessage()];
	render(
		<MessageList
			copilotDisabledMessage="disabled"
			copilotEnabled
			compactReasoning={false}
			databases={[{ id: 7, name: "DTS", engine: "postgres" }]}
			focusNotice={null}
			focusedMessageId={null}
			latestSqlMessageId="assistant-1"
			scrollRef={createRef<HTMLDivElement>()}
			selectedDbId={7}
			sessionId="session-1"
			sortedMessages={messages}
			chatMessages={messages}
			onWelcomeQuestion={vi.fn()}
		/>,
	);
}

describe("MessageList inline SQL preview", () => {
	it("auto-runs inline SQL when the conversation has no artifact canvas", async () => {
		renderMessageList();

		expect(await screen.findByTestId("inline-sql-preview")).toHaveAttribute(
			"data-autorun",
			"true",
		);
	});
});
