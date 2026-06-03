import type { ReactNode, RefObject } from "react";
import { Link } from "react-router";
import type {
	AiAgentChatMessage,
	DatabaseListItem,
} from "../../api/analyticsApi";
import { extractSqlFromMarkdown } from "../../utils/sqlExtractor";
import { CopilotMessageContent } from "./CopilotMessageContent";
import { FeedbackButtons } from "./FeedbackButtons";
import { InlineIndicatorPreview } from "./InlineIndicatorPreview";
import { InlineSqlPreview } from "./InlineSqlPreview";
import { WelcomeCard } from "./WelcomeCard";
import { ClarificationChips } from "./assumptions/ClarificationChips";
import { EditableAssumptionChips } from "./assumptions/EditableAssumptionChips";
import { shouldExecuteOptimistically } from "./assumptions/assumptionConfidence";
import {
	getFixedReportCandidates,
	getFixedReportShortcut,
} from "./copilotFixedReportMessage";
import {
	getGeneratedReportDraftNotice,
	inferGeneratedReportSuggestedDisplay,
	isGeneratedReportDraftMessage,
} from "./copilotGeneratedReportMessage";
import { resolveCopilotSqlDatabaseId } from "./copilotReportDatabase";
import {
	STREAM_PENDING_REASONING,
	getUserQuestionForAssistant,
} from "./CopilotChat.helpers";

interface MessageListProps {
	children?: ReactNode;
	copilotDisabledMessage: string;
	copilotEnabled: boolean;
	compactReasoning: boolean;
	databases: DatabaseListItem[];
	focusNotice: string | null;
	focusedMessageId: string | null;
	latestSqlMessageId: string | null;
	scrollRef: RefObject<HTMLDivElement | null>;
	selectedDbId: number | null;
	sessionId: string | null;
	sortedMessages: AiAgentChatMessage[];
	chatMessages: AiAgentChatMessage[];
	activeArtifactMessageId?: string | null;
	recomputingMessageId?: string | null;
	onSelectArtifact?: (messageId: string) => void;
	onAssumptionCommit?: (messageId: string, key: string, nextValue: string) => void;
	onClarificationAnswer?: (
		messageId: string,
		question: string,
		answers: Record<string, string>,
	) => void;
	onWelcomeQuestion: (question: string) => void;
}

export function MessageList({
	children,
	copilotDisabledMessage,
	copilotEnabled,
	compactReasoning,
	databases,
	focusNotice,
	focusedMessageId,
	latestSqlMessageId,
	scrollRef,
	selectedDbId,
	sessionId,
	sortedMessages,
	chatMessages,
	activeArtifactMessageId = null,
	recomputingMessageId = null,
	onSelectArtifact,
	onAssumptionCommit,
	onClarificationAnswer,
	onWelcomeQuestion,
}: MessageListProps) {
	return (
		<div className="copilot-chat__messages" ref={scrollRef}>
			{!copilotEnabled ? (
				<div className="copilot-chat__notice">{copilotDisabledMessage}</div>
			) : sortedMessages.length === 0 ? (
				<WelcomeCard onQuestionClick={onWelcomeQuestion} />
			) : null}
			{focusNotice ? (
				<div className="copilot-chat__notice copilot-chat__notice--focus">
					{focusNotice}
				</div>
			) : null}
			{chatMessages.map((msg) => {
				const extractedSql =
					msg.role === "assistant"
						? (msg.generatedSql ?? extractSqlFromMarkdown(msg.content ?? ""))
						: null;
				const sourceQuestion =
					msg.role === "assistant"
						? getUserQuestionForAssistant(sortedMessages, msg)
						: null;
				const fixedReportShortcut = getFixedReportShortcut(msg);
				const fixedReportCandidates = getFixedReportCandidates(msg);
				const generatedReportNotice = getGeneratedReportDraftNotice(msg);
				const platformIndicatorBadge = getPlatformIndicatorBadge(msg);
				const suggestedDisplay = extractedSql
					? inferGeneratedReportSuggestedDisplay({
							message: msg,
							question: sourceQuestion,
							sql: extractedSql,
						})
					: "table";
				const previewDatabaseId = extractedSql
					? resolveCopilotSqlDatabaseId({
							selectedDatabaseId: selectedDbId,
							databases,
							dataSurface: msg.dataSurface,
							sql: extractedSql,
							sourceRefs: msg.sourceRefs,
						})
					: selectedDbId;
				const showStreamingPlaceholder =
					msg.role === "assistant" &&
					msg.id.startsWith("stream-") &&
					!msg.content &&
					msg.reasoningContent === STREAM_PENDING_REASONING;
				const hasReasoningContent =
					msg.role === "assistant" &&
					!showStreamingPlaceholder &&
					Boolean(
						msg.reasoningContent &&
							msg.reasoningContent !== STREAM_PENDING_REASONING,
					);
				const artifactSelectable =
					Boolean(onSelectArtifact) && msg.role === "assistant" && Boolean(extractedSql);
				const showClarifications =
					msg.role === "assistant" &&
					Boolean(msg.clarifications?.length) &&
					!shouldExecuteOptimistically(msg.confidence);
				const reasoningBlock = hasReasoningContent ? (
					<div className="copilot-chat__reasoning">
						<div className="copilot-chat__reasoning-label">思考过程</div>
						<div className="copilot-chat__reasoning-content">
							{msg.reasoningContent}
						</div>
					</div>
				) : null;

				return (
					<div
						key={msg.id}
						className={`copilot-chat__msg copilot-chat__msg--${msg.role}${msg.id === focusedMessageId ? " copilot-chat__msg--focused" : ""}${msg.id === activeArtifactMessageId ? " copilot-chat__msg--artifact-active" : ""}`}
						data-copilot-message-id={msg.id}
						onClick={
							artifactSelectable ? () => onSelectArtifact?.(msg.id) : undefined
						}
					>
						<div className="copilot-chat__msg-content">
							{showStreamingPlaceholder ? (
								<div className="copilot-chat__streaming-placeholder">
									正在思考…
								</div>
							) : null}
							{compactReasoning && reasoningBlock ? (
								<details className="copilot-chat__reasoning-details">
									<summary>
										<span>思考过程</span>
										<small>工具调用与推理步骤</small>
									</summary>
									{reasoningBlock}
								</details>
							) : reasoningBlock}
							{platformIndicatorBadge ? (
								<div className="copilot-chat__platform-indicator">
									<span className="copilot-chat__platform-indicator-label">
										来自平台指标
									</span>
									<span>{platformIndicatorBadge.name}</span>
									{platformIndicatorBadge.version ? (
										<span>口径 {platformIndicatorBadge.version}</span>
									) : null}
								</div>
							) : null}
							<CopilotMessageContent content={msg.content} />
						</div>
						{showClarifications ? (
							<ClarificationChips
								clarifications={msg.clarifications}
								disabled={msg.clarificationAnswered || !onClarificationAnswer}
								onAnswer={(answers) =>
									onClarificationAnswer?.(
										msg.id,
										sourceQuestion?.trim() || msg.content?.trim() || "",
										answers,
									)
								}
							/>
						) : null}
						{!showClarifications && msg.role === "assistant" && msg.assumptions?.length ? (
							<EditableAssumptionChips
								assumptions={msg.assumptions}
								disabled={
									msg.assumptionRecomputing ||
									msg.id === recomputingMessageId
								}
								onCommit={(key, nextValue) =>
									onAssumptionCommit?.(msg.id, key, nextValue)
								}
							/>
						) : null}
						{!showClarifications && fixedReportShortcut && (
							<div className="copilot-chat__fixed-report-action">
								<Link
									className="copilot-chat__fixed-report-link"
									to={fixedReportShortcut.href}
									target={getScreenPreviewLinkTarget(fixedReportShortcut.href)}
									rel={getScreenPreviewLinkRel(fixedReportShortcut.href)}
								>
									{fixedReportShortcut.label}
								</Link>
							</div>
						)}
						{!showClarifications && fixedReportCandidates.length > 0 && (
							<div className="copilot-chat__fixed-report-candidates">
								<div className="copilot-chat__fixed-report-candidates-label">
									资产库候选
								</div>
								<div className="copilot-chat__fixed-report-candidates-list">
									{fixedReportCandidates.map((candidate) =>
										candidate.href ? (
											<Link
												key={`${msg.id}-${candidate.templateCode ?? candidate.label}`}
												className="copilot-chat__fixed-report-link"
												to={candidate.href}
												target={getScreenPreviewLinkTarget(candidate.href)}
												rel={getScreenPreviewLinkRel(candidate.href)}
											>
												{candidate.label}
											</Link>
										) : (
											<span
												key={`${msg.id}-${candidate.templateCode ?? candidate.label}`}
												className="copilot-chat__fixed-report-chip"
											>
												{candidate.label}
											</span>
										),
									)}
								</div>
							</div>
						)}
						{!showClarifications && generatedReportNotice && (
							<div className="copilot-chat__generated-report">
								<div className="copilot-chat__generated-report-title">
									{generatedReportNotice.title}
								</div>
								<div className="copilot-chat__generated-report-desc">
									{generatedReportNotice.description}
								</div>
								{generatedReportNotice.meta.length > 0 && (
									<div className="copilot-chat__generated-report-meta">
										{generatedReportNotice.meta.map((item) => (
											<span key={item}>{item}</span>
										))}
									</div>
								)}
							</div>
						)}
						{!showClarifications &&
							msg.role === "assistant" &&
							msg.responseKind === "PUBLISHED_INDICATOR" && (
								<InlineIndicatorPreview message={msg} />
							)}
						{!showClarifications && extractedSql && (
							<InlineSqlPreview
								sql={extractedSql}
								databaseId={previewDatabaseId ?? undefined}
								question={sourceQuestion ?? undefined}
								explanationText={msg.content ?? undefined}
								sessionId={sessionId ?? msg.sessionId}
								messageId={msg.id}
								suggestedDisplay={suggestedDisplay}
								responseKind={msg.responseKind}
								dataSurface={msg.dataSurface}
								qualityLevel={msg.qualityLevel}
								qualityNotes={msg.qualityNotes}
								reportCode={msg.reportCode}
								variant={isGeneratedReportDraftMessage(msg) ? "report" : "sql"}
								initialDraftId={msg.analysisDraftId}
								autoRun={msg.id === latestSqlMessageId}
							/>
						)}
						{msg.role === "assistant" && (
							<FeedbackButtons
								messageId={msg.id}
								sessionId={sessionId ?? ""}
								{...(extractedSql ? { generatedSql: extractedSql } : {})}
								{...(msg.routedDomain ? { routedDomain: msg.routedDomain } : {})}
								{...(msg.targetView ? { targetView: msg.targetView } : {})}
								{...(msg.templateCode ? { templateCode: msg.templateCode } : {})}
							/>
						)}
					</div>
				);
			})}
			{children}
		</div>
	);
}

function getPlatformIndicatorBadge(
	message: AiAgentChatMessage,
): { name: string; version?: string } | null {
	if (message.role !== "assistant") {
		return null;
	}
	const caliber = message.trace?.metricCaliber;
	const name = caliber?.name?.trim();
	if (!name) {
		return null;
	}
	const version = caliber?.version?.trim();
	return {
		name,
		...(version ? { version } : {}),
	};
}

function isScreenPreviewHref(href?: string): boolean {
	return /^\/screens\/[^/]+\/preview(?:[?#].*)?$/.test(String(href ?? ""));
}

function getScreenPreviewLinkTarget(href?: string): "_blank" | undefined {
	return isScreenPreviewHref(href) ? "_blank" : undefined;
}

function getScreenPreviewLinkRel(href?: string): "noreferrer" | undefined {
	return isScreenPreviewHref(href) ? "noreferrer" : undefined;
}
