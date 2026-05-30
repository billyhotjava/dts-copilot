import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CardQueryResponse } from "../../api/analyticsApi";
import { analyticsApi } from "../../api/analyticsApi";
import { Button } from "../../ui/Button/Button";
import { DataTable } from "../DataTable";
import {
	buildCopilotAnalysisDraftPayload,
	buildCopilotDraftEditorHref,
} from "./copilotAnalysisDraft";
import {
	resolveInlineSqlPreviewPresentation,
	type InlineSqlPreviewVariant,
} from "./inlineSqlPreviewPresentation";
import "./InlineSqlPreview.css";

interface Props {
	sql: string;
	databaseId?: number;
	question?: string;
	explanationText?: string;
	sessionId?: string;
	messageId?: string;
	suggestedDisplay?: string;
	responseKind?: string;
	dataSurface?: string;
	qualityLevel?: string;
	qualityNotes?: string[] | string;
	reportCode?: string;
	variant?: InlineSqlPreviewVariant;
	initialDraftId?: number | string | null;
	autoRun?: boolean;
}

type RunState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; result: CardQueryResponse; durationMs: number }
	| { status: "error"; message: string };

export type InlineSqlPreviewDatasetQuery = {
	database: number;
	type: "native";
	native: { query: string };
	context: "copilot-inline";
};

export function InlineSqlPreview({
	sql,
	databaseId,
	question,
	explanationText,
	sessionId,
	messageId,
	suggestedDisplay,
	responseKind,
	dataSurface,
	qualityLevel,
	qualityNotes,
	reportCode,
	variant = "sql",
	initialDraftId = null,
	autoRun = false,
}: Props) {
	const normalizedInitialDraftId = useMemo(() => {
		if (initialDraftId == null || initialDraftId === "") {
			return null;
		}
		const parsed = Number(initialDraftId);
		return Number.isFinite(parsed) ? parsed : null;
	}, [initialDraftId]);
	const [editing, setEditing] = useState(false);
	const [editableSql, setEditableSql] = useState(sql);
	const [committedSql, setCommittedSql] = useState(sql);
	const [runState, setRunState] = useState<RunState>({ status: "idle" });
	const [copied, setCopied] = useState(false);
	const [draftId, setDraftId] = useState<number | null>(
		normalizedInitialDraftId,
	);
	const [draftBusy, setDraftBusy] = useState(false);
	const [draftError, setDraftError] = useState<string | null>(null);
	const [draftSaved, setDraftSaved] = useState(
		normalizedInitialDraftId != null,
	);
	const presentation = useMemo(
		() =>
			resolveInlineSqlPreviewPresentation({
				variant,
				suggestedDisplay,
				dataSurface,
				qualityLevel,
				reportCode,
			}),
		[variant, suggestedDisplay, dataSurface, qualityLevel, reportCode],
	);
	const [sqlVisible, setSqlVisible] = useState(
		presentation.sqlVisibleByDefault,
	);
	const [displayMode, setDisplayMode] = useState(() =>
		normalizeInlineDisplayType(suggestedDisplay),
	);
	const lastAutoRunKeyRef = useRef<string | null>(null);

	const currentSql = editing ? editableSql : committedSql;
	const effectiveQuestion = question?.trim() || "Copilot SQL 草稿";
	const isReportDraft = variant === "report";

	useEffect(() => {
		setCommittedSql(sql);
		setEditableSql(sql);
		setRunState((state) => (state.status === "idle" ? state : { status: "idle" }));
		lastAutoRunKeyRef.current = null;
	}, [sql]);

	useEffect(() => {
		setDisplayMode(normalizeInlineDisplayType(suggestedDisplay));
	}, [suggestedDisplay]);

	useEffect(() => {
		if (normalizedInitialDraftId == null || draftId != null) {
			return;
		}
		setDraftId(normalizedInitialDraftId);
		setDraftSaved(true);
	}, [normalizedInitialDraftId, draftId]);

	const runSql = useCallback(async (sqlToRun: string) => {
		const payload = buildInlineSqlPreviewDatasetQuery(databaseId, sqlToRun);
		if (!payload) return;
		setRunState({ status: "loading" });
		const start = Date.now();
		try {
			const res = await analyticsApi.runDatasetQuery(payload);
			const durationMs = Date.now() - start;
			if (res.error) {
				setRunState({ status: "error", message: String(res.error) });
			} else {
				setRunState({ status: "success", result: res, durationMs });
			}
		} catch (e) {
			setRunState({
				status: "error",
				message: e instanceof Error ? e.message : "查询执行失败",
			});
		}
	}, [databaseId]);

	useEffect(() => {
		if (!autoRun || editing || !databaseId || !committedSql.trim()) {
			return;
		}
		const autoRunKey = `${databaseId}:${committedSql.trim()}`;
		if (lastAutoRunKeyRef.current === autoRunKey) {
			return;
		}
		lastAutoRunKeyRef.current = autoRunKey;
		void runSql(committedSql.trim());
	}, [autoRun, committedSql, databaseId, editing, runSql]);

	async function ensureDraft(displayOverride?: InlineDisplayType): Promise<number | null> {
		if (!databaseId || !currentSql.trim()) return null;
		if (draftId != null) return draftId;
		setDraftBusy(true);
		setDraftError(null);
		try {
			const draft = await analyticsApi.createAnalysisDraft(
				buildCopilotAnalysisDraftPayload({
					question: effectiveQuestion,
					sql: currentSql.trim(),
					databaseId,
					explanationText,
					sessionId,
					messageId,
					suggestedDisplay: displayOverride ?? suggestedDisplay,
					responseKind,
					dataSurface,
					qualityLevel,
					qualityNotes,
					reportCode,
				}),
			);
			const nextDraftId = Number(draft.id);
			setDraftId(nextDraftId);
			setDraftSaved(true);
			return nextDraftId;
		} catch (e) {
			setDraftError(e instanceof Error ? e.message : "保存草稿失败");
			return null;
		} finally {
			setDraftBusy(false);
		}
	}

	function handleCopy() {
		if (navigator.clipboard?.writeText) {
			void navigator.clipboard.writeText(currentSql);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}

	async function handleCreateViz(nextDisplay: InlineDisplayType) {
		setDisplayMode(nextDisplay);
		const nextDraftId = await ensureDraft(nextDisplay);
		if (nextDraftId == null) return;
		window.location.href = buildCopilotDraftEditorHref(nextDraftId, {
			autorun: true,
			focusVisualization: true,
			display: nextDisplay,
		});
	}

	return (
		<div className="inline-sql-preview">
			<div className="inline-sql-preview__header">
				<span className="inline-sql-preview__label">{presentation.label}</span>
				<div className="inline-sql-preview__actions">
					{isReportDraft && !editing && (
						<button
							type="button"
							className="inline-sql-preview__action-btn"
							onClick={() => setSqlVisible((visible) => !visible)}
						>
							{sqlVisible ? "隐藏 SQL" : "查看 SQL"}
						</button>
					)}
					<button
						type="button"
						className={`inline-sql-preview__action-btn${editing ? " inline-sql-preview__action-btn--active" : ""}`}
						onClick={() => {
							if (!editing) {
								setEditableSql(committedSql);
							} else {
								setCommittedSql(editableSql);
							}
							if (isReportDraft) setSqlVisible(true);
							setEditing(!editing);
						}}
					>
						{editing ? "完成" : "编辑"}
					</button>
					<button
						type="button"
						className="inline-sql-preview__action-btn"
						onClick={handleCopy}
					>
						{copied ? "已复制" : "复制"}
					</button>
				</div>
			</div>

			{isReportDraft && presentation.summaryItems.length > 0 && !editing && (
				<div className="inline-sql-preview__summary">
					{presentation.summaryItems.map((item) => (
						<span key={item}>{item}</span>
					))}
				</div>
			)}

			{editing ? (
				<textarea
					className="inline-sql-preview__editor"
					value={editableSql}
					onChange={(e) => setEditableSql(e.target.value)}
					rows={Math.min(editableSql.split("\n").length + 1, 12)}
				/>
			) : sqlVisible ? (
				<pre className="inline-sql-preview__code">
					<code>{committedSql}</code>
				</pre>
			) : null}

			<div className="inline-sql-preview__toolbar">
				<div className="inline-sql-preview__auto-state" aria-live="polite">
					{resolveAutoRunText(runState, Boolean(databaseId))}
				</div>
				<div className="inline-sql-preview__viz-switch" aria-label="切换可视化组件">
					{INLINE_DISPLAY_OPTIONS.map((option) => (
						<Button
							key={option.value}
							variant={displayMode === option.value ? "primary" : "secondary"}
							size="sm"
							onClick={() => void handleCreateViz(option.value)}
							disabled={draftBusy || !databaseId}
							loading={draftBusy && displayMode === option.value}
						>
							{option.label}
						</Button>
					))}
				</div>
			</div>

			{draftSaved && draftId != null && (
				<div className="inline-sql-preview__result-info">
					草稿已保存，可直接切换为 BI 侧可视化组件。#{draftId}
				</div>
			)}

			{draftError && (
				<div className="inline-sql-preview__error">
					<div className="inline-sql-preview__error-msg">{draftError}</div>
				</div>
			)}

			{runState.status === "success" && (
				<div className="inline-sql-preview__result">
					<div className="inline-sql-preview__result-info">
						{runState.result.row_count ?? 0} 行结果，耗时 {runState.durationMs}
						ms
					</div>
					<DataTable
						cols={runState.result.data?.cols ?? []}
						rows={runState.result.data?.rows ?? []}
						maxRows={100}
						pageSize={10}
					/>
				</div>
			)}

			{runState.status === "error" && (
				<div className="inline-sql-preview__error">
					<div className="inline-sql-preview__error-msg">
						{runState.message}
					</div>
					<button
						type="button"
						className="inline-sql-preview__action-btn"
						onClick={() => {
							if (!editing) setEditableSql(currentSql);
							setEditing(true);
						}}
					>
						编辑 SQL 修正
						</button>
						<button
							type="button"
							className="inline-sql-preview__action-btn"
							onClick={() => void runSql(currentSql)}
							disabled={!databaseId}
						>
							重新预览
						</button>
				</div>
			)}
		</div>
	);
}

export type InlineDisplayType = "table" | "bar" | "line" | "pie";

export const INLINE_DISPLAY_OPTIONS: { value: InlineDisplayType; label: string }[] = [
	{ value: "table", label: "表格" },
	{ value: "bar", label: "柱图" },
	{ value: "line", label: "折线" },
	{ value: "pie", label: "饼图" },
];

export function normalizeInlineDisplayType(value?: string | null): InlineDisplayType {
	const normalized = String(value ?? "").trim().toLowerCase();
	if (normalized === "bar" || normalized === "line" || normalized === "pie") {
		return normalized;
	}
	return "table";
}

export function buildInlineSqlPreviewDatasetQuery(
	databaseId: number | undefined,
	sqlToRun: string,
): InlineSqlPreviewDatasetQuery | null {
	const query = sqlToRun.trim();
	if (!databaseId || !query) {
		return null;
	}
	return {
		database: databaseId,
		type: "native",
		native: { query },
		context: "copilot-inline",
	};
}

export function resolveAutoRunText(runState: RunState, hasDatabase: boolean): string {
	if (!hasDatabase) {
		return "缺少数据源，无法自动预览";
	}
	if (runState.status === "loading") {
		return "正在自动预览";
	}
	if (runState.status === "success") {
		return "已自动预览";
	}
	if (runState.status === "error") {
		return "自动预览失败";
	}
	return "等待自动预览";
}
