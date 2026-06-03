import { act, createElement, useMemo, useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import type {
	AiAgentChatMessage,
	AiAgentPendingAction,
	DatabaseListItem,
} from "../../api/analyticsApi";
import type { ArtifactStore } from "../../hooks/useArtifactStore";
import type { Artifact } from "../../types/artifact";
import {
	analyticsApi,
	aiAgentChatSendStream,
	type CopilotStreamEvent,
} from "../../api/analyticsApi";
import { SESSION_ID_KEY } from "./CopilotChat.helpers";
import { useCopilotStream } from "./useCopilotStream";

vi.mock("../../api/analyticsApi", () => ({
	analyticsApi: {
		aiAgentChatSend: vi.fn(),
		createAnalysisDraft: vi.fn(),
	},
	aiAgentChatSendStream: vi.fn(),
}));

type StreamValue = ReturnType<typeof useCopilotStream>;

interface ProbeSnapshot {
	error: string | null;
	messages: AiAgentChatMessage[];
	pendingAction: AiAgentPendingAction | null;
	sending: boolean;
	sessionId: string | null;
}

interface ProbeValue {
	reloadMessages: ReturnType<typeof vi.fn>;
	reloadSessions: ReturnType<typeof vi.fn>;
	snapshot: ProbeSnapshot;
	stream: StreamValue;
}

let currentProbe: ProbeValue | null = null;

function StreamProbe(props: {
	artifactStore?: ArtifactStore;
	databases?: DatabaseListItem[];
	initialMessages?: AiAgentChatMessage[];
	initialSessionId?: string | null;
	selectedDbId?: number | null;
}) {
	const [error, setError] = useState<string | null>(null);
	const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
	const [focusNotice, setFocusNotice] = useState<string | null>(null);
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<AiAgentChatMessage[]>(
		props.initialMessages ?? [],
	);
	const [pendingAction, setPendingAction] =
		useState<AiAgentPendingAction | null>(null);
	const [queuedInput, setQueuedInput] = useState<string | null>(null);
	const [sending, setSending] = useState(false);
	const [sessionId, setSessionId] = useState<string | null>(
		props.initialSessionId ?? null,
	);
	const activeStreamingSessionIdRef = useRef<string | null>(null);
	const queuedInputRef = useRef<string | null>(null);
	const streamAbortRef = useRef<AbortController | null>(null);
	const streamInFlightRef = useRef(false);
	const reloadMessages = useMemo(() => vi.fn(async () => undefined), []);
	const reloadSessions = useMemo(() => vi.fn(async () => []), []);
	const stream = useCopilotStream({
		activeStreamingSessionIdRef,
		artifactStore: props.artifactStore,
		copilotDisabledMessage: "disabled",
		copilotEnabled: true,
		databases: props.databases ?? [],
		input,
		messages,
		queuedInput,
		queuedInputRef,
		selectedDbId: props.selectedDbId ?? null,
		sending,
		sessionId,
		streamAbortRef,
		streamInFlightRef,
		reloadMessages,
		reloadSessions,
		setError,
		setFocusedMessageId,
		setFocusNotice,
		setInput,
		setMessages,
		setPendingAction,
		setQueuedInput,
		setSending,
		setSessionId,
	});

	currentProbe = {
		reloadMessages,
		reloadSessions,
		snapshot: {
			error,
			messages,
			pendingAction,
			sending,
			sessionId,
		},
		stream,
	};

	return createElement(
		"span",
		{ "data-testid": "stream-probe" },
		`${messages.length}:${focusedMessageId ?? ""}:${focusNotice ?? ""}`,
	);
}

async function renderStreamProbe(props: {
	artifactStore?: ArtifactStore;
	databases?: DatabaseListItem[];
	initialMessages?: AiAgentChatMessage[];
	initialSessionId?: string | null;
	selectedDbId?: number | null;
} = {}) {
	currentProbe = null;
	render(createElement(StreamProbe, props));
	await screen.findByTestId("stream-probe");
	if (!currentProbe) {
		throw new Error("stream probe did not render");
	}
	return () => currentProbe as ProbeValue;
}

describe("useCopilotStream", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		sessionStorage.clear();
	});

	it("merges session, reasoning, tool, token, and done events into the spine messages", async () => {
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (_body, onEvent: (event: CopilotStreamEvent) => void) => {
				onEvent({ type: "session", sessionId: "session-1" });
				onEvent({ type: "reasoning", content: "先识别业务域" });
				onEvent({ type: "tool", tool: "schema_lookup", status: "running" });
				onEvent({ type: "token", content: "收入" });
				onEvent({ type: "token", content: "上涨" });
				onEvent({
					type: "done",
					generatedSql: "select revenue from mart",
					responseKind: "SQL_RESULT",
					sourceRefs: ["model:mart"],
					assumptions: [
						{
							key: "period",
							label: "期间",
							value: "本月",
							editable: true,
						},
					],
					confidence: 0.72,
					clarifications: [
						{
							key: "scope",
							question: "项目范围是什么?",
							options: [
								{ value: "leased", label: "在租项目" },
								{ value: "all", label: "全部项目" },
							],
						},
					],
				});
			},
		);
		const probe = await renderStreamProbe();

		await act(async () => {
			await probe().stream.handleSendText(" 项目收入 ");
		});

		await waitFor(() => {
			expect(probe().snapshot.messages).toHaveLength(2);
		});
		const assistant = probe().snapshot.messages.find(
			(message) => message.role === "assistant",
		);

		expect(probe().snapshot.sessionId).toBe("session-1");
		expect(sessionStorage.getItem(SESSION_ID_KEY)).toBe("session-1");
		expect(probe().snapshot.error).toBeNull();
		expect(assistant).toMatchObject({
			content: "收入上涨",
			generatedSql: "select revenue from mart",
			reasoningContent: "先识别业务域\n[工具] schema_lookup · running",
			responseKind: "SQL_RESULT",
			sourceRefs: ["model:mart"],
			assumptions: [
				{
					key: "period",
					label: "期间",
					value: "本月",
					editable: true,
				},
			],
			confidence: 0.72,
			clarifications: [
				{
					key: "scope",
					question: "项目范围是什么?",
					options: [
						{ value: "leased", label: "在租项目" },
						{ value: "all", label: "全部项目" },
					],
				},
			],
		});
		expect(probe().reloadSessions).toHaveBeenCalledTimes(1);
	});

	it("keeps fixed report metadata from streaming done events", async () => {
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (_body, onEvent: (event: CopilotStreamEvent) => void) => {
				onEvent({ type: "session", sessionId: "fixed-report-session" });
				onEvent({
					type: "token",
					content: "已命中资产库资产 PRS-FLOWERBIZ-LEASE-EXECUTION。",
				});
				onEvent({
					type: "done",
					dataSurface: "L2_FIXED_REPORT",
					qualityLevel: "MEDIUM",
					reportCode: "prs.flowerbiz.lease_execution_monthly",
					responseKind: "FIXED_REPORT",
					routedDomain: "flowerbiz",
					sourceRefs: [
						"fixed-report:PRS-FLOWERBIZ-LEASE-EXECUTION",
						"dbt-model:public.xycyl_ads_flowerbiz_lease_summary",
					],
					targetView: "public.xycyl_ads_flowerbiz_lease_summary",
					templateCode: "PRS-FLOWERBIZ-LEASE-EXECUTION",
				});
			},
		);
		const probe = await renderStreamProbe();

		await act(async () => {
			await probe().stream.handleSendText("打开报花月报");
		});

		const assistant = probe().snapshot.messages.find(
			(message) => message.role === "assistant",
		);
		expect(assistant).toMatchObject({
			content: "已命中资产库资产 PRS-FLOWERBIZ-LEASE-EXECUTION。",
			dataSurface: "L2_FIXED_REPORT",
			qualityLevel: "MEDIUM",
			reportCode: "prs.flowerbiz.lease_execution_monthly",
			responseKind: "FIXED_REPORT",
			routedDomain: "flowerbiz",
			sourceRefs: [
				"fixed-report:PRS-FLOWERBIZ-LEASE-EXECUTION",
				"dbt-model:public.xycyl_ads_flowerbiz_lease_summary",
			],
			targetView: "public.xycyl_ads_flowerbiz_lease_summary",
			templateCode: "PRS-FLOWERBIZ-LEASE-EXECUTION",
		});
		expect(analyticsApi.createAnalysisDraft).not.toHaveBeenCalled();
	});

	it("passes clarification answers into the stream request body", async () => {
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (_body, onEvent: (event: CopilotStreamEvent) => void) => {
				onEvent({ type: "session", sessionId: "clarified-session" });
				onEvent({ type: "token", content: "已按账期统计" });
				onEvent({ type: "done", confidence: 0.8 });
			},
		);
		const probe = await renderStreamProbe();

		await act(async () => {
			await probe().stream.handleSendText("统计本月收入", {
				clarificationAnswers: { period: "billing" },
			});
		});

		expect(aiAgentChatSendStream).toHaveBeenCalledWith(
			{
				userMessage: "统计本月收入",
				clarificationAnswers: { period: "billing" },
			},
			expect.any(Function),
			expect.any(Object),
		);
	});

	it("recomputes an existing assistant message and upserts the same artifact id", async () => {
		const sourceMessages: AiAgentChatMessage[] = [
			{
				content: "统计本月收入",
				id: "user-1",
				role: "user",
				sequenceNum: 1,
				sessionId: "session-1",
			},
			{
				assumptions: [
					{ key: "period", label: "期间", value: "2026-05", editable: true },
				],
				content: "五月收入",
				generatedSql: "select may_revenue from mart",
				id: "assistant-1",
				role: "assistant",
				sequenceNum: 2,
				sessionId: "session-1",
			},
		];
		const existingArtifact: Artifact = {
			createdAt: 1000,
			id: "artifact-1",
			sourceMessageId: "assistant-1",
			spec: { generatedSql: "select may_revenue from mart" },
			title: "五月收入",
			type: "table",
		};
		const artifactStore = {
			artifacts: [existingArtifact],
			clear: vi.fn(),
			current: existingArtifact,
			currentId: "artifact-1",
			getById: vi.fn(() => existingArtifact),
			setCurrent: vi.fn(),
			upsert: vi.fn(),
		} satisfies ArtifactStore;
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (_body, onEvent: (event: CopilotStreamEvent) => void) => {
				onEvent({ type: "session", sessionId: "session-1" });
				onEvent({ type: "token", content: "四月收入" });
				onEvent({
					type: "done",
					generatedSql: "select apr_revenue from mart",
					assumptions: [
						{ key: "period", label: "期间", value: "2026-04", editable: true },
					],
				});
			},
		);
		const probe = await renderStreamProbe({
			artifactStore,
			initialMessages: sourceMessages,
			initialSessionId: "session-1",
		});

		await act(async () => {
			await probe().stream.handleSendText("统计本月收入", {
				assumptionOverrides: { period: "2026-04" },
				recomputeArtifactId: "artifact-1",
				replaceAssistantMessageId: "assistant-1",
			});
		});

		expect(aiAgentChatSendStream).toHaveBeenCalledWith(
			{
				userMessage: "统计本月收入",
				sessionId: "session-1",
				assumptionOverrides: { period: "2026-04" },
			},
			expect.any(Function),
			expect.any(Object),
		);
		expect(probe().snapshot.messages).toHaveLength(2);
		expect(probe().snapshot.messages[1]).toMatchObject({
			id: "assistant-1",
			content: "四月收入",
			generatedSql: "select apr_revenue from mart",
			assumptions: [
				{ key: "period", label: "期间", value: "2026-04", editable: true },
			],
		});
		expect(artifactStore.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				createdAt: 1000,
				id: "artifact-1",
				sourceMessageId: "assistant-1",
				spec: expect.objectContaining({
					generatedSql: "select apr_revenue from mart",
				}),
			}),
		);
	});

	it("falls back to the synchronous API when SSE fails before any stream event", async () => {
		vi.mocked(aiAgentChatSendStream).mockRejectedValue(new Error("network"));
		vi.mocked(analyticsApi.aiAgentChatSend).mockResolvedValue({
			agentMessage: "同步回答",
			requiresApproval: false,
			sessionId: "sync-session",
			toolCalls: [],
		});
		const probe = await renderStreamProbe();

		await act(async () => {
			await probe().stream.handleSendText("同步回退问题");
		});

		expect(analyticsApi.aiAgentChatSend).toHaveBeenCalledWith({
			userMessage: "同步回退问题",
		});
		expect(probe().snapshot.sessionId).toBe("sync-session");
		expect(probe().reloadMessages).toHaveBeenCalledWith("sync-session");
		expect(probe().reloadSessions).toHaveBeenCalledTimes(1);
		expect(probe().snapshot.error).toBeNull();
	});

	it("aborts an active stream and renders the stopped notice on the assistant placeholder", async () => {
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (
				_body,
				onEvent: (event: CopilotStreamEvent) => void,
				options?: { signal?: AbortSignal },
			) => {
				onEvent({ type: "session", sessionId: "slow-session" });
				await new Promise<void>((_resolve, reject) => {
					options?.signal?.addEventListener("abort", () => {
						reject(new DOMException("aborted", "AbortError"));
					});
				});
			},
		);
		const probe = await renderStreamProbe();
		let sendPromise: Promise<void> | null = null;

		act(() => {
			sendPromise = probe().stream.handleSendText("慢查询");
		});
		await waitFor(() => {
			expect(probe().snapshot.sending).toBe(true);
		});

		await act(async () => {
			probe().stream.handleStopStreaming();
			await sendPromise;
		});

		await waitFor(() => {
			expect(probe().snapshot.sending).toBe(false);
		});
		const assistant = probe().snapshot.messages.find(
			(message) => message.role === "assistant",
		);

		expect(probe().snapshot.error).toBe("已停止本次回答生成。");
		expect(assistant).toMatchObject({
			content: "已停止本次回答生成。",
			reasoningContent: undefined,
		});
	});

	it("persists generated report drafts after REPORT_DRAFT done events", async () => {
		vi.mocked(analyticsApi.createAnalysisDraft).mockResolvedValue({
			id: 101,
		} as Awaited<ReturnType<typeof analyticsApi.createAnalysisDraft>>);
		vi.mocked(aiAgentChatSendStream).mockImplementation(
			async (_body, onEvent: (event: CopilotStreamEvent) => void) => {
				onEvent({ type: "session", sessionId: "report-session" });
				onEvent({ type: "token", content: "报表已生成" });
				onEvent({
					type: "done",
					dataSurface: "xycyl_dws_summary",
					generatedSql: "select * from xycyl_dws_summary",
					responseKind: "REPORT_DRAFT",
					suggestedDisplay: "table",
				});
			},
		);
		const probe = await renderStreamProbe({
			databases: [
				{ id: 7, name: "main", engine: "mysql" },
				{ id: 9, name: "联邦查询入口", engine: "trino" },
			],
			selectedDbId: 9,
		});

		await act(async () => {
			await probe().stream.handleSendText("生成报花月报");
		});

		await waitFor(() => {
			expect(analyticsApi.createAnalysisDraft).toHaveBeenCalled();
		});
		await waitFor(() => {
			const assistant = probe().snapshot.messages.find(
				(message) => message.role === "assistant",
			);
			expect(assistant).toMatchObject({
				analysisDraftId: 101,
				analysisDraftStatus: "saved",
				content: "报表已生成",
				responseKind: "REPORT_DRAFT",
			});
		});
	});
});
