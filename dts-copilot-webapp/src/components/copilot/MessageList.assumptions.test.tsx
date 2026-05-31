import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import { MessageList } from "./MessageList";

function assistantMessage(): AiAgentChatMessage {
	return {
		assumptions: [
			{ key: "period", label: "本月", value: "2026-05" },
		],
		content: "已完成项目收入统计。",
		id: "assistant-1",
		role: "assistant",
		sequenceNum: 1,
		sessionId: "session-1",
	};
}

describe("MessageList assumption chips", () => {
	it("renders assumption chips above assistant result content and forwards edits", async () => {
		const onAssumptionCommit = vi.fn();
		const message = assistantMessage();
		render(
			<MessageList
				copilotDisabledMessage="disabled"
				copilotEnabled
				compactReasoning={false}
				databases={[]}
				focusNotice={null}
				focusedMessageId={null}
				latestSqlMessageId={null}
				scrollRef={createRef<HTMLDivElement>()}
				selectedDbId={null}
				sessionId="session-1"
				sortedMessages={[message]}
				chatMessages={[message]}
				onAssumptionCommit={onAssumptionCommit}
				onWelcomeQuestion={vi.fn()}
			/>,
		);

		await userEvent.click(await screen.findByRole("button", { name: /本月=2026-05/ }));
		await userEvent.clear(screen.getByLabelText("本月"));
		await userEvent.type(screen.getByLabelText("本月"), "2026-04");
		await userEvent.keyboard("{Enter}");

		expect(onAssumptionCommit).toHaveBeenCalledWith("assistant-1", "period", "2026-04");
	});
});
