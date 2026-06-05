import { useEffect, useMemo, useRef, useState } from "react";
import type {
	AiAgentChatMessage,
	CopilotTraceSource,
} from "../../api/analyticsApi";
import { FeedbackButtons } from "./FeedbackButtons";
import "./TracePanel.css";

interface Props {
	message?: AiAgentChatMessage | null;
	onClose?: () => void;
	open?: boolean;
	sessionId?: string | null;
	toolMessages: AiAgentChatMessage[];
}

export function TracePanel({
	message = null,
	onClose,
	open,
	sessionId = null,
	toolMessages,
}: Props) {
	const [correctionOpen, setCorrectionOpen] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement | null>(null);
	const panelRef = useRef<HTMLElement | null>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const isDrawer = open !== undefined;
	const traceModel = useMemo(() => buildTraceModel(message), [message]);

	useEffect(() => {
		if (!open || !onClose) return;
		previousFocusRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const frame = requestAnimationFrame(() => {
			closeButtonRef.current?.focus();
		});
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				return;
			}
			if (event.key !== "Tab") {
				return;
			}
			const focusable = getFocusableElements(panelRef.current);
			if (focusable.length === 0) {
				return;
			}
			const first = focusable[0];
			const last = focusable[focusable.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
				return;
			}
			if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			cancelAnimationFrame(frame);
			document.removeEventListener("keydown", handleKeyDown);
			previousFocusRef.current?.focus();
		};
	}, [onClose, open]);

	if (open === false) return null;
	if (!isDrawer && toolMessages.length === 0) return null;

	if (!isDrawer) {
		return (
			<div className="trace-panel">
				<ToolSteps showParams toolMessages={toolMessages} />
			</div>
		);
	}

	return (
		<div className="trace-panel-drawer">
			<button
				type="button"
				aria-label="关闭遮罩"
				className="trace-panel-drawer__backdrop"
				onClick={onClose}
			/>
			<aside
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label="SQL·溯源"
				className="trace-panel trace-panel--drawer"
			>
				<header className="trace-panel__header">
					<div>
						<div className="trace-panel__eyebrow">SQL Trace</div>
						<h2>SQL·溯源</h2>
					</div>
					<button
						ref={closeButtonRef}
						type="button"
						aria-label="关闭溯源面板"
						className="trace-panel__close"
						onClick={onClose}
					>
						{"\u00D7"}
					</button>
				</header>

				<section className="trace-panel__section trace-panel__section--caliber">
					<div className="trace-panel__section-label">指标口径</div>
					<div className="trace-panel__caliber">{traceModel.caliberText}</div>
				</section>

				<section className="trace-panel__section">
					<div className="trace-panel__section-label">数据来源</div>
					{traceModel.sources.length > 0 ? (
						<div className="trace-panel__source-list">
							{traceModel.sources.map((source, index) => (
								<div
									key={`${source.table}-${index}`}
									className="trace-panel__source-row"
								>
									<div className="trace-panel__source-table">{source.table}</div>
									{source.fields?.length ? (
										<div className="trace-panel__source-fields">
											{source.fields.map((field) => (
												<span key={`${source.table}-${field}`}>{field}</span>
											))}
										</div>
									) : null}
									{source.role ? (
										<div className="trace-panel__source-role">{source.role}</div>
									) : null}
								</div>
							))}
						</div>
					) : (
						<div className="trace-panel__empty">暂无结构化来源</div>
					)}
				</section>

				<details className="trace-panel__sql">
					<summary>生成 SQL</summary>
					<pre className="trace-panel__json">{traceModel.sql || "暂无生成 SQL"}</pre>
				</details>

				{traceModel.financeAudit ? (
					<section className="trace-panel__section">
						<div className="trace-panel__section-label">财务审计</div>
						<div className="trace-panel__audit">
							{traceModel.financeAudit.oracleStatus ? (
								<div className="trace-panel__audit-status">
									{formatOracleStatus(traceModel.financeAudit.oracleStatus)}
								</div>
							) : null}
							{traceModel.financeAudit.appliedRules?.length ? (
								<div className="trace-panel__audit-group">
									<div className="trace-panel__audit-group-label">口径规则</div>
									<div className="trace-panel__audit-list">
										{traceModel.financeAudit.appliedRules.map((rule) => (
											<div
												key={rule.ruleId}
												className="trace-panel__audit-row"
											>
												<span className="trace-panel__audit-code">{rule.ruleId}</span>
												{rule.description ? <span>{rule.description}</span> : null}
											</div>
										))}
									</div>
								</div>
							) : null}
							{traceModel.financeAudit.appliedInvariants?.length ? (
								<div className="trace-panel__audit-group">
									<div className="trace-panel__audit-group-label">不变量</div>
									<div className="trace-panel__audit-list">
										{traceModel.financeAudit.appliedInvariants.map((invariant) => (
											<div
												key={invariant.invariantId}
												className="trace-panel__audit-row"
											>
												<span className="trace-panel__audit-code">
													{invariant.invariantId}
												</span>
												{invariant.statement ? <span>{invariant.statement}</span> : null}
											</div>
										))}
									</div>
								</div>
							) : null}
							{traceModel.financeAudit.lineage?.length ? (
								<div className="trace-panel__audit-group">
									<div className="trace-panel__audit-group-label">Lineage</div>
									<div className="trace-panel__audit-list">
										{traceModel.financeAudit.lineage.map((node, index) => (
											<div
												key={`${node.level ?? "node"}-${node.name}-${index}`}
												className="trace-panel__audit-row trace-panel__audit-row--lineage"
											>
												<span className="trace-panel__audit-code">
													{node.level || "NODE"}
												</span>
												<span>{node.name}</span>
												{node.role ? (
													<span className="trace-panel__audit-muted">{node.role}</span>
												) : null}
											</div>
										))}
									</div>
								</div>
							) : null}
						</div>
					</section>
				) : null}

				<section className="trace-panel__section">
					<div className="trace-panel__section-label">口径纠正</div>
					{correctionOpen ? (
						<FeedbackButtons
							messageId={message?.id ?? ""}
							sessionId={sessionId ?? message?.sessionId ?? ""}
							correctionKind="metric_caliber"
							generatedSql={traceModel.sql}
							metricCaliberRef={message?.trace?.metricCaliber?.ontologyRef}
							suggestedCaliber={traceModel.caliberText}
							variant="correction"
						/>
					) : (
						<button
							type="button"
							className="trace-panel__correction-btn"
							onClick={() => setCorrectionOpen(true)}
						>
							⚑口径不对？纠正
						</button>
					)}
				</section>

				<section className="trace-panel__section">
					<div className="trace-panel__section-label">工具步骤</div>
					{toolMessages.length > 0 ? (
						<ToolSteps toolMessages={toolMessages} />
					) : (
						<div className="trace-panel__empty">暂无工具调用记录</div>
					)}
				</section>
			</aside>
		</div>
	);
}

function ToolSteps({
	showParams = false,
	toolMessages,
}: {
	showParams?: boolean;
	toolMessages: AiAgentChatMessage[];
}) {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	return (
		<div className="trace-panel__steps">
			{toolMessages.map((msg, idx) => {
				const isExpanded = expandedIndex === idx;
				const isSuccess = !msg.toolResult?.includes('"success":false') &&
					!msg.toolResult?.includes('"errorMessage"');
				return (
					<div key={msg.id} className="trace-panel__step">
						<button
							type="button"
							className="trace-panel__step-header"
							onClick={() => setExpandedIndex(isExpanded ? null : idx)}
						>
							<span className={`trace-panel__status ${isSuccess ? "trace-panel__status--ok" : "trace-panel__status--err"}`}>
								{isSuccess ? "\u2713" : "\u2717"}
							</span>
							<span className="trace-panel__tool-name">{msg.toolName || "unknown"}</span>
							<span className="trace-panel__step-num">#{idx + 1}</span>
							<span className="trace-panel__expand">{isExpanded ? "\u25B2" : "\u25BC"}</span>
						</button>

						{isExpanded && (
							<div className="trace-panel__detail">
								{showParams && msg.toolParams ? (
									<div className="trace-panel__section">
										<div className="trace-panel__section-label">Parameters</div>
										<pre className="trace-panel__json">{formatJson(msg.toolParams)}</pre>
									</div>
								) : null}
								{msg.toolResult ? (
									<div className="trace-panel__section">
										<div className="trace-panel__section-label">Result</div>
										<ExpandableJson json={msg.toolResult} maxLines={8} />
									</div>
								) : null}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

function ExpandableJson({ json, maxLines }: { json: string; maxLines: number }) {
	const [expanded, setExpanded] = useState(false);
	const formatted = formatJson(json);
	const lines = formatted.split("\n");
	const needsTruncation = lines.length > maxLines;

	return (
		<div>
			<pre className="trace-panel__json">
				{needsTruncation && !expanded ? lines.slice(0, maxLines).join("\n") + "\n..." : formatted}
			</pre>
			{needsTruncation && (
				<button
					type="button"
					className="trace-panel__expand-btn"
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? "Collapse" : `Show all (${lines.length} lines)`}
				</button>
			)}
		</div>
	);
}

function buildTraceModel(message: AiAgentChatMessage | null) {
	const structuredSources = message?.trace?.sources ?? [];
	const fallbackSources = normalizeSourceRefs(message?.sourceRefs);
	return {
		caliberText: formatCaliber(message),
		sources: structuredSources.length > 0 ? structuredSources : fallbackSources,
		sql: message?.trace?.sql ?? message?.generatedSql ?? "",
		financeAudit: message?.trace?.financeAudit,
	};
}

function formatOracleStatus(
	oracleStatus: NonNullable<NonNullable<AiAgentChatMessage["trace"]>["financeAudit"]>["oracleStatus"],
): string {
	const status = oracleStatus?.healthStatus || "UNKNOWN";
	const difference = oracleStatus?.maxDifference ?? "0.00";
	return `对账状态 ${status} · 差异 ${difference}`;
}

function formatCaliber(message: AiAgentChatMessage | null): string {
	const caliber = message?.trace?.metricCaliber;
	if (!caliber) {
		return "口径结构化待后台补充";
	}
	const nameFormula = [caliber.name, caliber.formula].filter(Boolean).join("=");
	const parts = [
		nameFormula,
		caliber.domain,
		caliber.version ? `口径 ${caliber.version}` : undefined,
	].filter(Boolean);
	return parts.length > 0 ? parts.join(" · ") : "口径结构化待后台补充";
}

function normalizeSourceRefs(
	value: AiAgentChatMessage["sourceRefs"],
): CopilotTraceSource[] {
	if (Array.isArray(value)) {
		return value.map((item) => ({ table: item.trim() })).filter((item) => item.table);
	}
	if (!value) {
		return [];
	}
	return String(value)
		.split(/[；;\n]/)
		.map((item) => ({ table: item.trim() }))
		.filter((item) => item.table);
}

function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
	if (!root) {
		return [];
	}
	return Array.from(
		root.querySelectorAll<HTMLElement>(
			[
				"a[href]",
				"button:not([disabled])",
				"textarea:not([disabled])",
				"input:not([disabled])",
				"select:not([disabled])",
				"[tabindex]:not([tabindex='-1'])",
			].join(","),
		),
	).filter((element) => !element.hasAttribute("aria-hidden"));
}

function formatJson(raw: string): string {
	try {
		return JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return raw;
	}
}
