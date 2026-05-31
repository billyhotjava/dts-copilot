import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { analyticsApi, type AiAgentChatMessage } from "../../api/analyticsApi";
import { MessageList } from "./MessageList";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		getPlatformIndicatorDetail: vi.fn(),
	},
}));

vi.mock("../charts/ChartRenderer", () => ({
	ChartRenderer: vi.fn(
		(props: { data?: { rows?: unknown[] } | null; display?: string }) => (
			<div data-testid="inline-indicator-preview">
				preview:{props.display}:{props.data?.rows?.length ?? 0}
			</div>
		),
	),
}));

const getPlatformIndicatorDetail = vi.mocked(analyticsApi.getPlatformIndicatorDetail);

function renderMessages(messages: AiAgentChatMessage[]) {
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
			sortedMessages={messages}
			chatMessages={messages}
			onWelcomeQuestion={vi.fn()}
		/>,
	);
}

describe("MessageList platform indicator badge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getPlatformIndicatorDetail.mockResolvedValue({
			indicatorId: "cash-in",
			mode: "detail",
			cols: [
				{ name: "month", display_name: "月份" },
				{ name: "amount", display_name: "金额" },
			],
			rows: [["2026-05", 100]],
			timeGrain: "month",
		});
	});

	it("marks assistant answers backed by platform indicator caliber", async () => {
		renderMessages([
			{
				content: "这是平台指标返回的回款趋势。",
				id: "assistant-1",
				role: "assistant",
				sequenceNum: 1,
				sessionId: "session-1",
				trace: {
					metricCaliber: {
						name: "回款金额",
						version: "v3",
						ontologyRef: "platform:cash-in",
					},
				},
			},
		]);

		expect(await screen.findByText("来自平台指标")).toBeInTheDocument();
		expect(screen.getByText("回款金额")).toBeInTheDocument();
		expect(screen.getByText("口径 v3")).toBeInTheDocument();
	});

	it("does not mark ordinary assistant answers", () => {
		renderMessages([
			{
				content: "这是现生成 SQL 的回答。",
				id: "assistant-1",
				role: "assistant",
				sequenceNum: 1,
				sessionId: "session-1",
			},
		]);

		expect(screen.queryByText("来自平台指标")).not.toBeInTheDocument();
	});

	it("renders published indicator values inline in the single conversation window", async () => {
		renderMessages([
			{
				content: "已命中平台指标。",
				id: "assistant-1",
				role: "assistant",
				sequenceNum: 1,
				sessionId: "session-1",
				reportCode: "cash-in",
				responseKind: "PUBLISHED_INDICATOR",
				trace: {
					metricCaliber: {
						name: "回款金额",
						formula: "sum(amount)",
						domain: "finance",
						version: "v3",
						ontologyRef: "cash-in",
					},
				},
			},
		]);

		expect(await screen.findByTestId("inline-indicator-preview")).toHaveTextContent(
			"preview:line:1",
		);
		expect(getPlatformIndicatorDetail).toHaveBeenCalledWith("cash-in", 30);
	});
});
