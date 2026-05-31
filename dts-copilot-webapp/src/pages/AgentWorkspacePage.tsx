import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
	analyticsApi,
	type AiAgentChatMessage,
	type AiAgentChatSession,
	type CardDetail,
	type CopilotSignalSummary,
	type FixedReportCatalogItem,
} from "../api/analyticsApi";
import {
	AssetActionModals,
	type AssetActionKind,
} from "../components/asset/AssetActionModals";
import { CanvasPanel } from "../components/canvas/CanvasPanel";
import { ConversationThread } from "../components/copilot/ConversationThread";
import { TracePanel } from "../components/copilot/TracePanel";
import ColdStartHome from "../components/copilot/cold-start/ColdStartHome";
import { SessionsView } from "../components/copilot/sessions/SessionsView";
import { SignalsView } from "../components/copilot/signals/SignalsView";
import {
	getToolMessagesForAssistant,
	sortMessages,
} from "../components/copilot/CopilotChat.helpers";
import {
	buildCopilotPromptRequest,
	type CopilotPromptRequest,
} from "../components/copilot/copilotPromptRequest";
import type { CopilotSessionFocusRequest } from "../components/copilot/copilotSessionFocus";
import { useArtifactStore } from "../hooks/useArtifactStore";
import type { CanvasActionEvent } from "../types/artifact";
import { getEffectiveLocale, t } from "../i18n";
import { FIXED_REPORT_TEMPLATE_QUERY_KEY } from "./fixed-reports/fixedReportSurfaceEntry";
import { getPrsScreenShortcutByTemplateCode } from "../shared/prsScreenShortcuts";
import "./AgentWorkspacePage.css";

export type AgentWorkspaceView = "home" | "sessions" | "signals";
type FixedReportRouteSource = "fixedReport" | "fixedReportTemplate";
type FixedReportRoute =
	| { state: "absent" }
	| { state: "invalid"; message: string }
	| {
			state: "present";
			source: FixedReportRouteSource;
			templateCode: string;
	  };
type FixedReportRouteState =
	| { state: "idle" }
	| { state: "loading"; templateCode: string }
	| { state: "error"; message: string; templateCode?: string }
	| {
			state: "ready";
			promptRequest: CopilotPromptRequest;
			templateCode: string;
	  };

export function normalizeAgentWorkspaceView(value: string | null): AgentWorkspaceView {
	return value === "sessions" || value === "signals" ? value : "home";
}

export function resolveFixedReportRoute(searchParams: URLSearchParams): FixedReportRoute {
	if (searchParams.has("fixedReport")) {
		return buildFixedReportRoute("fixedReport", searchParams.get("fixedReport"));
	}
	if (searchParams.has(FIXED_REPORT_TEMPLATE_QUERY_KEY)) {
		return buildFixedReportRoute(
			"fixedReportTemplate",
			searchParams.get(FIXED_REPORT_TEMPLATE_QUERY_KEY),
		);
	}
	return { state: "absent" };
}

function buildFixedReportRoute(
	source: FixedReportRouteSource,
	rawValue: string | null,
): FixedReportRoute {
	const templateCode = rawValue?.trim() ?? "";
	if (!templateCode) {
		return {
			state: "invalid",
			message: "固定报表模板参数为空",
		};
	}
	return {
		state: "present",
		source,
		templateCode,
	};
}

function buildFixedReportPromptRequest(
	route: Extract<FixedReportRoute, { state: "present" }>,
	report: FixedReportCatalogItem,
): CopilotPromptRequest {
	const label =
		report.name?.trim() ||
		getPrsScreenShortcutByTemplateCode(route.templateCode)?.name ||
		route.templateCode;
	const source =
		route.source === "fixedReportTemplate"
			? "agent-workspace-fixed-report-template"
			: "agent-workspace-fixed-report";
	const request = buildCopilotPromptRequest(`打开${label}`, {
		notice: `已带入固定报表 ${route.templateCode},正在交给 Agent BI 执行。`,
		reportIntentId: route.templateCode,
		source,
		submit: true,
	});
	if (!request) {
		return {
			prompt: `打开${route.templateCode}`,
			notice: `已带入固定报表 ${route.templateCode},正在交给 Agent BI 执行。`,
			reportIntentId: route.templateCode,
			source,
			submit: true,
		};
	}
	return request;
}

function buildSignalPrompt(signal: CopilotSignalSummary): string {
	const parts = [
		`查看主动信号「${signal.title}」`,
		signal.description ? `信号说明：${signal.description}` : null,
		signal.source ? `来源：${signal.source}` : null,
		signal.linkedActions?.length
			? `关联动作：${signal.linkedActions.join("、")}`
			: null,
		"请分析命中原因、风险对象、建议动作，并在需要处理时生成待确认动作草稿。",
	];
	return parts.filter(Boolean).join("\n");
}

function FixedReportRouteStatus({
	onBack,
	state,
}: {
	onBack: () => void;
	state: FixedReportRouteState;
}) {
	const isError = state.state === "error";
	const title = isError ? state.message : "正在读取固定报表模板...";
	const description = isError
		? "请从固定报表目录重新进入,或回到新问题继续分析。"
		: "正在保留模板上下文并准备进入对话脊柱。";

	return (
		<section
			className="agent-fixed-report-route"
			aria-labelledby="agent-fixed-report-route-title"
		>
			<div className="agent-fixed-report-route__panel">
				<p className="agent-fixed-report-route__eyebrow">Fixed Report</p>
				<h1 id="agent-fixed-report-route-title">{title}</h1>
				<p>{description}</p>
				{isError ? (
					<button
						type="button"
						className="agent-fixed-report-route__action"
						onClick={onBack}
					>
						回到新问题
					</button>
				) : null}
			</div>
		</section>
	);
}

export default function AgentWorkspacePage() {
	const locale = getEffectiveLocale();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const workspaceView = normalizeAgentWorkspaceView(searchParams.get("view"));
	const fixedReportRoute = resolveFixedReportRoute(searchParams);
	const artifactStore = useArtifactStore();
	const [conversationMessages, setConversationMessages] = useState<AiAgentChatMessage[]>([]);
	const [fixedReportState, setFixedReportState] = useState<FixedReportRouteState>({
		state: "idle",
	});
	const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
	const [promptRequest, setPromptRequest] = useState<CopilotPromptRequest | null>(null);
	const [sessionFocusRequest, setSessionFocusRequest] =
		useState<CopilotSessionFocusRequest | null>(null);
	const [traceOpen, setTraceOpen] = useState(false);
	const [assetAction, setAssetAction] = useState<AssetActionKind>(null);
	const sortedMessages = useMemo(
		() => sortMessages(conversationMessages),
		[conversationMessages],
	);
	const currentTraceMessage = useMemo(() => {
		const sourceMessageId = artifactStore.current?.sourceMessageId;
		if (!sourceMessageId) return null;
		return sortedMessages.find((message) => message.id === sourceMessageId) ?? null;
	}, [artifactStore.current?.sourceMessageId, sortedMessages]);
	const traceToolMessages = useMemo(
		() =>
			currentTraceMessage
				? getToolMessagesForAssistant(sortedMessages, currentTraceMessage)
				: [],
		[currentTraceMessage, sortedMessages],
	);
	const hasFixedReportRoute = fixedReportRoute.state !== "absent";
	const fixedReportPromptRequest =
		hasFixedReportRoute && fixedReportState.state === "ready"
			? fixedReportState.promptRequest
			: null;
	const activePromptRequest = fixedReportPromptRequest ?? promptRequest;
	const hasActiveConversation =
		Boolean(fixedReportPromptRequest) ||
		(workspaceView === "sessions" ? Boolean(sessionFocusRequest) : Boolean(submittedPrompt));
	const showColdStart =
		!hasFixedReportRoute && workspaceView === "home" && !hasActiveConversation;
	const showSessionsView =
		!hasFixedReportRoute && workspaceView === "sessions" && !sessionFocusRequest;
	const showSignalsView =
		!hasFixedReportRoute && workspaceView === "signals" && !hasActiveConversation;
	const showFixedReportStatus =
		hasFixedReportRoute && fixedReportState.state !== "ready";

	useEffect(() => {
		if (workspaceView === "sessions") return;
		setSessionFocusRequest(null);
	}, [workspaceView]);

	useEffect(() => {
		if (fixedReportRoute.state === "absent") {
			setFixedReportState({ state: "idle" });
			return;
		}
		if (fixedReportRoute.state === "invalid") {
			setFixedReportState({
				state: "error",
				message: fixedReportRoute.message,
			});
			return;
		}

		let active = true;
		setFixedReportState({
			state: "loading",
			templateCode: fixedReportRoute.templateCode,
		});
		void (async () => {
			try {
				const report = await analyticsApi.getFixedReportCatalogItem(
					fixedReportRoute.templateCode,
				);
				if (!active) return;
				setSubmittedPrompt(null);
				setPromptRequest(null);
				setSessionFocusRequest(null);
				setFixedReportState({
					state: "ready",
					templateCode: fixedReportRoute.templateCode,
					promptRequest: buildFixedReportPromptRequest(fixedReportRoute, report),
				});
			} catch {
				if (!active) return;
				setFixedReportState({
					state: "error",
					templateCode: fixedReportRoute.templateCode,
					message: `未找到固定报表模板：${fixedReportRoute.templateCode}`,
				});
			}
		})();
		return () => {
			active = false;
		};
	}, [
		fixedReportRoute.state,
		fixedReportRoute.state === "invalid" ? fixedReportRoute.message : "",
		fixedReportRoute.state === "present" ? fixedReportRoute.source : "",
		fixedReportRoute.state === "present" ? fixedReportRoute.templateCode : "",
	]);

	const startQuestion = (text: string) => {
		const prompt = text.trim();
		if (!prompt) return;
		setSessionFocusRequest(null);
		setSubmittedPrompt(prompt);
		setPromptRequest({
			prompt,
			submit: true,
			source: `agent-workspace-${Date.now()}`,
			notice: "已进入 Agent 工作台并开始执行。",
		});
	};

	const openSession = (session: AiAgentChatSession) => {
		const sessionId = session.id.trim();
		if (!sessionId) return;
		const title = session.title?.trim();
		setSubmittedPrompt(null);
		setPromptRequest(null);
		setSessionFocusRequest({
			sessionId,
			notice: title ? `已打开历史会话：${title}` : "已打开历史会话",
		});
	};

	const openSignal = (signal: CopilotSignalSummary) => {
		const title = signal.title?.trim();
		if (!title) return;
		const prompt = buildSignalPrompt(signal);
		setSessionFocusRequest(null);
		setSubmittedPrompt(prompt);
		setPromptRequest({
			prompt,
			submit: true,
			source: "agent-workspace-signal",
			reportIntentId: signal.id,
			notice: `已打开信号：${title}`,
		});
	};

	const showHome = () => {
		setSubmittedPrompt(null);
		setPromptRequest(null);
		setSessionFocusRequest(null);
		navigate("/agent-bi");
	};

	const handleArtifactAction = (event: CanvasActionEvent) => {
		if (event.action === "trace-sql") {
			setTraceOpen(true);
			return;
		}
		setAssetAction(event.action);
	};

	const rememberCard = (card: CardDetail, artifact = artifactStore.current) => {
		if (!artifact) return;
		artifactStore.upsert({
			...artifact,
			spec: {
				...artifact.spec,
				cardId: card.id,
			},
		});
	};

	return (
		<main className="agent-workspace" aria-label={t(locale, "agentWorkspace.title")}>
			{showSessionsView ? (
				<SessionsView
					onNewQuestion={showHome}
					onOpenSession={openSession}
				/>
			) : null}
			{showSignalsView ? <SignalsView onOpenSignal={openSignal} /> : null}
			{showFixedReportStatus ? (
				<FixedReportRouteStatus
					onBack={showHome}
					state={fixedReportState}
				/>
			) : null}
			{showColdStart ? (
				<section className="agent-workspace__cold-start">
					<ColdStartHome
						onSubmit={startQuestion}
						onOpenAssets={() => navigate("/assets")}
					/>
				</section>
			) : null}
			{hasActiveConversation ? (
				<div className="agent-workspace__body">
					<section
						className="agent-workspace__spine"
						aria-label={t(locale, "agentWorkspace.spineTitle")}
					>
						<ConversationThread
							artifactStore={artifactStore}
							compactReasoning
							focusRequest={sessionFocusRequest}
							onMessagesChange={setConversationMessages}
							presentation="workbench"
							promptRequest={activePromptRequest}
						/>
					</section>
					<section
						className="agent-workspace__canvas"
						aria-label={t(locale, "agentWorkspace.canvasTitle")}
					>
						<CanvasPanel
							store={artifactStore}
							onArtifactAction={handleArtifactAction}
						/>
					</section>
				</div>
			) : null}
			<TracePanel
				message={currentTraceMessage}
				onClose={() => setTraceOpen(false)}
				open={traceOpen}
				sessionId={currentTraceMessage?.sessionId ?? null}
				toolMessages={traceToolMessages}
			/>
			<AssetActionModals
				action={assetAction}
				artifact={artifactStore.current}
				onCardSaved={rememberCard}
				onClose={() => setAssetAction(null)}
				onPinned={({ card }) => rememberCard(card)}
			/>
		</main>
	);
}
