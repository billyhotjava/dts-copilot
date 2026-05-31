import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import { MessageList } from "./MessageList";

function userMessage(): AiAgentChatMessage {
	return {
		content: "统计本月收入",
		id: "user-1",
		role: "user",
		sequenceNum: 1,
		sessionId: "session-1",
	};
}

function assistantClarificationMessage(): AiAgentChatMessage {
	return {
		clarifications: [
			{
				key: "period",
				question: "本月按哪种口径?",
				options: [
					{ value: "calendar", label: "自然月" },
					{ value: "billing", label: "账期" },
				],
			},
		],
		confidence: 0.4,
		content: "需要先确认时间口径。",
		generatedSql: "select revenue from mart",
		id: "assistant-1",
		role: "assistant",
		sequenceNum: 2,
		sessionId: "session-1",
	};
}

describe("MessageList clarification chips", () => {
	it("renders low-confidence clarifications instead of SQL preview and forwards answers", async () => {
		const onClarificationAnswer = vi.fn();
		const messages = [userMessage(), assistantClarificationMessage()];
		render(
			<MessageList
				copilotDisabledMessage="disabled"
				copilotEnabled
				compactReasoning={false}
				databases={[]}
				focusNotice={null}
				focusedMessageId={null}
				latestSqlMessageId="assistant-1"
				scrollRef={createRef<HTMLDivElement>()}
				selectedDbId={null}
				sessionId="session-1"
				sortedMessages={messages}
				chatMessages={messages}
				onClarificationAnswer={onClarificationAnswer}
				onWelcomeQuestion={vi.fn()}
			/>,
		);
		const user = userEvent.setup();

		expect(await screen.findByText("本月按哪种口径?")).toBeInTheDocument();
		expect(screen.queryByText("编辑")).not.toBeInTheDocument();

		await user.click(screen.getByRole("radio", { name: "账期" }));
		await user.click(screen.getByRole("button", { name: "继续" }));

		expect(onClarificationAnswer).toHaveBeenCalledWith(
			"assistant-1",
			"统计本月收入",
			{ period: "billing" },
		);
	});
});
