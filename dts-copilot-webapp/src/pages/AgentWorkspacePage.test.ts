import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgentWorkspacePage, { normalizeAgentWorkspaceView } from "./AgentWorkspacePage";

const PAGE_SOURCE = readFileSync(resolve(__dirname, "AgentWorkspacePage.tsx"), "utf8");

const getFixedReportCatalogItem = vi.fn();
const listAiAgentSessions = vi.fn();
const listCopilotSignals = vi.fn();
const navigate = vi.fn();
let currentSearch = "";

vi.mock("../api/analyticsApi", () => ({
	analyticsApi: {
		getFixedReportCatalogItem: (...args: unknown[]) => getFixedReportCatalogItem(...args),
		listAiAgentSessions: (...args: unknown[]) => listAiAgentSessions(...args),
		listCopilotSignals: (...args: unknown[]) => listCopilotSignals(...args),
	},
}));

vi.mock("react-router", () => ({
	useNavigate: () => navigate,
	useSearchParams: () => [new URLSearchParams(currentSearch), vi.fn()],
}));

vi.mock("../components/copilot/cold-start/ColdStartHome", () => ({
	default: () => createElement("div", { "data-testid": "cold-start-home" }, "冷启动首屏"),
}));

vi.mock("../components/copilot/ConversationThread", () => ({
	ConversationThread: ({
		artifactStore,
		focusRequest,
		promptRequest,
	}: {
		artifactStore?: unknown;
		focusRequest?: { sessionId?: string } | null;
		promptRequest?: Record<string, unknown> | null;
	}) =>
			createElement(
				"div",
				{
					"data-has-artifact-store": String(Boolean(artifactStore)),
					"data-testid": "conversation-thread",
				},
			focusRequest?.sessionId ??
				(promptRequest?.prompt != null ? String(promptRequest.prompt) : "new-session"),
			promptRequest
				? createElement(
						"pre",
						{ "data-testid": "prompt-request" },
						JSON.stringify(promptRequest),
					)
				: null,
		),
}));

vi.mock("../components/copilot/TracePanel", () => ({
	TracePanel: () => createElement("div", { "data-testid": "trace-panel" }),
}));

function renderWorkspace(path: string) {
	currentSearch = path.includes("?") ? path.slice(path.indexOf("?")) : "";
	return render(createElement(AgentWorkspacePage));
}

describe("AgentWorkspacePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentSearch = "";
		getFixedReportCatalogItem.mockResolvedValue({
			templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			name: "PRS 租赁经营总览",
		});
		listAiAgentSessions.mockResolvedValue([]);
		listCopilotSignals.mockResolvedValue([]);
	});

	it("declares a single-window workspace without the artifact canvas shell", () => {
		expect(PAGE_SOURCE).toContain("agent-workspace");
		expect(PAGE_SOURCE).toContain("agent-workspace__cold-start");
		expect(PAGE_SOURCE).toContain("agent-workspace__spine");
		expect(PAGE_SOURCE).not.toContain("agent-workspace__canvas");
		expect(PAGE_SOURCE).toContain("ConversationThread");
		expect(PAGE_SOURCE).not.toContain("CanvasPanel");
		expect(PAGE_SOURCE).not.toContain("useArtifactStore");
		expect(PAGE_SOURCE).not.toContain("onArtifactAction");
		expect(PAGE_SOURCE).toContain("<TracePanel");
		expect(PAGE_SOURCE).not.toContain("<AssetActionModals");
		expect(PAGE_SOURCE).toContain('navigate("/assets")');
	});

	it("renders the sessions view when view=sessions is present", async () => {
		listAiAgentSessions.mockResolvedValue([
			{
				id: "session-1",
				title: "经营分析复盘",
				lastActiveAt: "2026-05-31T09:00:00Z",
			},
		]);

		renderWorkspace("/agent-bi?view=sessions");

		expect(await screen.findByRole("heading", { name: "历史会话" })).toBeInTheDocument();
		expect(await screen.findByText("经营分析复盘")).toBeInTheDocument();
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
		expect(listAiAgentSessions).toHaveBeenCalledWith(50);
	});

	it("opens a selected history session in the conversation spine", async () => {
		listAiAgentSessions.mockResolvedValue([
			{
				id: "session-2",
				title: "报花异常跟进",
				lastActiveAt: "2026-05-31T10:00:00Z",
			},
		]);

		renderWorkspace("/agent-bi?view=sessions");

		fireEvent.click(await screen.findByRole("button", { name: /报花异常跟进/ }));

		await waitFor(() => {
			expect(screen.getByTestId("conversation-thread")).toHaveTextContent("session-2");
		});
		expect(screen.queryByTestId("canvas-panel")).not.toBeInTheDocument();
		expect(screen.getByTestId("conversation-thread")).toHaveAttribute(
			"data-has-artifact-store",
			"false",
		);
	});

	it("normalizes the signals query view as a first-class workspace view", () => {
		expect(normalizeAgentWorkspaceView("signals")).toBe("signals");
	});

	it("renders a controlled signals view when view=signals is present", async () => {
		renderWorkspace("/agent-bi?view=signals");

		expect(await screen.findByRole("heading", { name: "主动信号" })).toBeInTheDocument();
		expect(await screen.findByText("信号数据未接通")).toBeInTheDocument();
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
		expect(screen.queryByText("资产已沉淀")).not.toBeInTheDocument();
		expect(screen.queryByText("上次分析可继续")).not.toBeInTheDocument();
	});

	it("starts a fixed report prompt when fixedReport query is present", async () => {
		getFixedReportCatalogItem.mockResolvedValue({
			templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			name: "PRS 租赁经营总览",
		});

		renderWorkspace("/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW");

		const promptRequest = JSON.parse(
			(await screen.findByTestId("prompt-request")).textContent ?? "{}",
		);
		expect(getFixedReportCatalogItem).toHaveBeenCalledWith("PRS-FLOWERBIZ-OVERVIEW");
		expect(promptRequest).toMatchObject({
			reportIntentId: "PRS-FLOWERBIZ-OVERVIEW",
			source: "agent-workspace-fixed-report",
			submit: true,
		});
		expect(promptRequest.prompt).toContain("PRS 租赁经营总览");
		expect(screen.getByTestId("conversation-thread")).toHaveTextContent("PRS 租赁经营总览");
		expect(screen.queryByTestId("canvas-panel")).not.toBeInTheDocument();
		expect(screen.getByTestId("conversation-thread")).toHaveAttribute(
			"data-has-artifact-store",
			"false",
		);
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
	});

	it("starts an asset-library metric prompt when prompt query is present", async () => {
		renderWorkspace(
			"/agent-bi?prompt=%E7%94%A8%E5%B9%B3%E5%8F%B0%E6%8C%87%E6%A0%87%E5%88%86%E6%9E%90%E5%9B%9E%E6%AC%BE%E9%87%91%E9%A2%9D&source=asset-library-metric&metric=platform%3Acash-in&submit=1",
		);

		const promptRequest = JSON.parse(
			(await screen.findByTestId("prompt-request")).textContent ?? "{}",
		);
		expect(promptRequest).toMatchObject({
			reportIntentId: "platform:cash-in",
			source: "asset-library-metric",
			submit: true,
		});
		expect(promptRequest.prompt).toContain("回款金额");
		expect(screen.getByTestId("conversation-thread")).toHaveTextContent("回款金额");
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
	});

	it("starts a fixed report prompt when fixedReportTemplate query is present", async () => {
		getFixedReportCatalogItem.mockResolvedValue({
			templateCode: "FIN-AR-OVERVIEW",
			name: "财务结算汇总",
		});

		renderWorkspace("/agent-bi?fixedReportTemplate=FIN-AR-OVERVIEW");

		const promptRequest = JSON.parse(
			(await screen.findByTestId("prompt-request")).textContent ?? "{}",
		);
		expect(getFixedReportCatalogItem).toHaveBeenCalledWith("FIN-AR-OVERVIEW");
		expect(promptRequest).toMatchObject({
			reportIntentId: "FIN-AR-OVERVIEW",
			source: "agent-workspace-fixed-report-template",
			submit: true,
		});
		expect(promptRequest.prompt).toContain("财务结算汇总");
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
	});

	it("shows a controlled error when fixedReport query is empty", async () => {
		renderWorkspace("/agent-bi?fixedReport=");

		expect(await screen.findByText("固定报表模板参数为空")).toBeInTheDocument();
		expect(getFixedReportCatalogItem).not.toHaveBeenCalled();
		expect(screen.queryByTestId("conversation-thread")).not.toBeInTheDocument();
		expect(screen.queryByTestId("cold-start-home")).not.toBeInTheDocument();
	});

	it("falls back to an agent prompt when an archived fixed report link is opened", async () => {
		getFixedReportCatalogItem.mockRejectedValue(new Error("not found"));

		renderWorkspace("/agent-bi?fixedReport=WH-LOW-STOCK-ALERT");

		const promptRequest = JSON.parse(
			(await screen.findByTestId("prompt-request")).textContent ?? "{}",
		);
		expect(getFixedReportCatalogItem).toHaveBeenCalledWith("WH-LOW-STOCK-ALERT");
		expect(promptRequest).toMatchObject({
			reportIntentId: "WH-LOW-STOCK-ALERT",
			source: "agent-workspace-fixed-report-fallback",
			submit: true,
		});
		expect(promptRequest.prompt).toContain("库存现量-低库存预警");
		expect(promptRequest.notice).toContain("未在资产目录发布");
		expect(screen.queryByText("未找到固定报表模板：WH-LOW-STOCK-ALERT")).not.toBeInTheDocument();
	});

	it("opens a selected signal in the conversation spine", async () => {
		listCopilotSignals.mockResolvedValue([
			{
				id: "flowerbiz:bad-debt",
				title: "项目坏账风险",
				severity: "high",
				description: "项目坏账率超过阈值。",
				source: "ontology.flowerbiz.signals",
				linkedActions: ["创建坏账处理单"],
			},
		]);

		renderWorkspace("/agent-bi?view=signals");

		fireEvent.click(await screen.findByRole("button", { name: /项目坏账风险/ }));

		const promptRequest = JSON.parse(
			(await screen.findByTestId("prompt-request")).textContent ?? "{}",
		);
		expect(promptRequest).toMatchObject({
			reportIntentId: "flowerbiz:bad-debt",
			source: "agent-workspace-signal",
			submit: true,
		});
		expect(promptRequest.prompt).toContain("项目坏账风险");
		expect(screen.queryByTestId("canvas-panel")).not.toBeInTheDocument();
		expect(screen.getByTestId("conversation-thread")).toHaveAttribute(
			"data-has-artifact-store",
			"false",
		);
	});
});
