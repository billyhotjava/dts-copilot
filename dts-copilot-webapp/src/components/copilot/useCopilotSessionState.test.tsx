import { act, createElement, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import type {
	AiAgentChatMessage,
	AiAgentChatSessionDetail,
} from "../../api/analyticsApi";
import { analyticsApi } from "../../api/analyticsApi";
import type { CopilotSessionFocusRequest } from "./copilotSessionFocus";
import {
	DATASOURCE_ID_KEY,
	SESSION_ID_KEY,
} from "./CopilotChat.helpers";
import { useCopilotSessionState } from "./useCopilotSessionState";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		getAiAgentSession: vi.fn(),
		listAiAgentSessions: vi.fn(),
		listAnalysisDrafts: vi.fn(),
		listDatabases: vi.fn(),
	},
}));

type SessionStateValue = ReturnType<typeof useCopilotSessionState>;

interface ProbeRef<T> {
	current: T;
}

interface ProbeValue {
	activeStreamingSessionIdRef: ProbeRef<string | null>;
	state: SessionStateValue;
	streamInFlightRef: ProbeRef<boolean>;
}

let currentProbe: ProbeValue | null = null;

function SessionStateProbe(props: {
	copilotEnabled?: boolean;
	focusRequest?: CopilotSessionFocusRequest | null;
}) {
	const activeStreamingSessionIdRef = useRef<string | null>(null);
	const streamInFlightRef = useRef(false);
	const state = useCopilotSessionState({
		activeStreamingSessionIdRef,
		copilotEnabled: props.copilotEnabled ?? true,
		focusRequest: props.focusRequest ?? null,
		streamInFlightRef,
	});

	currentProbe = {
		activeStreamingSessionIdRef,
		state,
		streamInFlightRef,
	};

	return createElement(
		"span",
		{ "data-testid": "session-state-probe" },
		[
			state.sessionId ?? "",
			state.messages.length,
			state.selectedDbId ?? "",
			state.focusedMessageId ?? "",
			state.focusNotice ?? "",
		].join(":"),
	);
}

async function renderSessionStateProbe(props: {
	copilotEnabled?: boolean;
	focusRequest?: CopilotSessionFocusRequest | null;
} = {}) {
	currentProbe = null;
	const view = render(createElement(SessionStateProbe, props));
	await screen.findByTestId("session-state-probe");
	if (!currentProbe) {
		throw new Error("session state probe did not render");
	}
	return {
		...view,
		probe: () => currentProbe as ProbeValue,
	};
}

function detail(messages: AiAgentChatMessage[]): AiAgentChatSessionDetail {
	return {
		messages,
		session: { id: messages[0]?.sessionId ?? "session-1" },
	};
}

describe("useCopilotSessionState", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.clear();
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([]);
		vi.mocked(analyticsApi.getAiAgentSession).mockResolvedValue(detail([]));
		vi.mocked(analyticsApi.listAnalysisDrafts).mockResolvedValue([]);
		vi.mocked(analyticsApi.listDatabases).mockResolvedValue({
			data: [],
			total: 0,
		});
	});

	it("restores a persisted business session while pinning datasource to the federated entry", async () => {
		sessionStorage.setItem(SESSION_ID_KEY, "session-1");
		sessionStorage.setItem(DATASOURCE_ID_KEY, "7");
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([
			{ id: "session-1", title: "经营分析" },
		]);
		vi.mocked(analyticsApi.listDatabases).mockResolvedValue({
			data: [
				{ engine: "mysql", id: 7, name: "main" },
				{ engine: "trino", id: 9, name: "联邦查询入口" },
			],
			total: 2,
		});
		vi.mocked(analyticsApi.getAiAgentSession).mockResolvedValue(
			detail([
				{
					content: "报表已生成",
					generatedSql: "select * from dws_project",
					id: "assistant-1",
					responseKind: "REPORT_DRAFT",
					role: "assistant",
					sequenceNum: 2,
					sessionId: "session-1",
				},
				{
					content: "生成项目经营报表",
					id: "user-1",
					role: "user",
					sequenceNum: 1,
					sessionId: "session-1",
				},
			]),
		);
		vi.mocked(analyticsApi.listAnalysisDrafts).mockResolvedValue([
			{
				id: 101,
				session_id: "session-1",
				sql_text: "SELECT * FROM dws_project",
				suggested_display: "table",
			},
		]);

		const { probe } = await renderSessionStateProbe();

		await waitFor(() => {
			expect(probe().state.messages).toHaveLength(2);
		});

		expect(probe().state.sessionId).toBe("session-1");
		expect(probe().state.selectedDbId).toBe(9);
		expect(probe().state.messages.map((message) => message.id)).toEqual([
			"user-1",
			"assistant-1",
		]);
		expect(probe().state.messages[1]).toMatchObject({
			analysisDraftId: 101,
			analysisDraftStatus: "saved",
			suggestedDisplay: "table",
		});
		expect(sessionStorage.getItem(SESSION_ID_KEY)).toBe("session-1");
		expect(sessionStorage.getItem(DATASOURCE_ID_KEY)).toBe("9");
	});

	it("sorts history sessions by last active time before exposing them to the spine", async () => {
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([
			{ id: "old-session", lastActiveAt: "2026-05-30T09:00:00Z" },
			{ id: "missing-time" },
			{ id: "new-session", lastActiveAt: "2026-05-31T09:00:00Z" },
		]);

		const { probe } = await renderSessionStateProbe();

		await waitFor(() => {
			expect(probe().state.sessions).toHaveLength(3);
		});

		expect(probe().state.sessions.map((session) => session.id)).toEqual([
			"new-session",
			"old-session",
			"missing-time",
		]);
	});

	it("clears a persisted greeting-only direct response session", async () => {
		sessionStorage.setItem(SESSION_ID_KEY, "sess-hi");
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([
			{ id: "sess-hi", title: "hi" },
		]);
		vi.mocked(analyticsApi.getAiAgentSession).mockResolvedValue({
			messages: [
				{
					content: "hi",
					id: "user-hi",
					role: "user",
					sequenceNum: 1,
					sessionId: "sess-hi",
				},
				{
					content: "当前已沉淀的业务分析范围包括：项目履约、现场运营、经营分析。",
					id: "assistant-hi",
					responseKind: "BUSINESS_DIRECT_RESPONSE",
					role: "assistant",
					sequenceNum: 2,
					sessionId: "sess-hi",
				},
			],
			session: { id: "sess-hi", title: "hi" },
		});

		const { probe } = await renderSessionStateProbe();

		await waitFor(() => {
			expect(probe().state.sessionId).toBeNull();
		});

		expect(probe().state.messages).toEqual([]);
		expect(sessionStorage.getItem(SESSION_ID_KEY)).toBeNull();
	});

	it("applies focus requests by selecting the session, loading messages, and exposing focus notice state", async () => {
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([
			{ id: "focus-session", title: "报表草稿" },
		]);
		vi.mocked(analyticsApi.getAiAgentSession).mockResolvedValue(
			detail([
				{
					content: "已生成草稿",
					id: "focus-message",
					role: "assistant",
					sequenceNum: 1,
					sessionId: "focus-session",
				},
			]),
		);
		const { probe, rerender } = await renderSessionStateProbe();

		rerender(
			createElement(SessionStateProbe, {
				focusRequest: {
					messageId: "focus-message",
					notice: "已定位到报表草稿来源",
					sessionId: "focus-session",
				},
			}),
		);

		await waitFor(() => {
			expect(probe().state.messages).toHaveLength(1);
		});

		expect(probe().state.sessionId).toBe("focus-session");
		expect(probe().state.focusedMessageId).toBe("focus-message");
		expect(probe().state.focusNotice).toBe("已定位到报表草稿来源");
		expect(probe().state.messages[0]).toMatchObject({
			id: "focus-message",
			sessionId: "focus-session",
		});
	});

	it("does not reload the active session while a stream is still in flight", async () => {
		vi.mocked(analyticsApi.listAiAgentSessions).mockResolvedValue([
			{ id: "streaming-session", title: "流式回答" },
		]);
		const { probe } = await renderSessionStateProbe();

		probe().activeStreamingSessionIdRef.current = "streaming-session";
		probe().streamInFlightRef.current = true;
		act(() => {
			probe().state.setSessionId("streaming-session");
		});

		await waitFor(() => {
			expect(sessionStorage.getItem(SESSION_ID_KEY)).toBe("streaming-session");
		});

		expect(analyticsApi.getAiAgentSession).not.toHaveBeenCalled();
		expect(probe().state.messages).toEqual([]);
	});
});
