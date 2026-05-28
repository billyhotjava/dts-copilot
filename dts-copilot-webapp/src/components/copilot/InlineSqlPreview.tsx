import { useEffect, useMemo, useState } from "react";
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
}

type RunState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; result: CardQueryResponse; durationMs: number }
	| { status: "error"; message: string };

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

	const currentSql = editing ? editableSql : sql;
	const effectiveQuestion = question?.trim() || "Copilot SQL 草稿";
	const isReportDraft = variant === "report";

	useEffect(() => {
		if (normalizedInitialDraftId == null || draftId != null) {
			return;
		}
		setDraftId(normalizedInitialDraftId);
		setDraftSaved(true);
	}, [normalizedInitialDraftId, draftId]);

	async function handleRun() {
		if (!databaseId || !currentSql.trim()) return;
		setRunState({ status: "loading" });
		const start = Date.now();
		try {
			const res = await analyticsApi.runDatasetQuery({
				database: databaseId,
				type: "native",
				native: { query: currentSql.trim() },
				context: "copilot-inline",
			});
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
	}

	async function ensureDraft(): Promise<number | null> {
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
					suggestedDisplay,
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

	async function handleSaveDraft() {
		await ensureDraft();
	}

	async function handleOpenInQuestions() {
		const nextDraftId = await ensureDraft();
		if (nextDraftId == null) return;
		window.location.href = buildCopilotDraftEditorHref(nextDraftId, {
			autorun: true,
		});
	}

	async function handleCreateViz() {
		const nextDraftId = await ensureDraft();
		if (nextDraftId == null) return;
		window.location.href = buildCopilotDraftEditorHref(nextDraftId, {
			autorun: true,
			focusVisualization: true,
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
							if (!editing) setEditableSql(sql);
							if (isReportDraft) setSqlVisible(true);
							setEditing(!editing);
						}}
					>
						编辑
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
					<code>{sql}</code>
				</pre>
			) : null}

			<div className="inline-sql-preview__toolbar">
				<Button
					variant="primary"
					size="sm"
					onClick={() => void handleRun()}
					disabled={runState.status === "loading" || !databaseId}
					loading={runState.status === "loading"}
				>
					{runState.status === "loading" ? "执行中..." : "执行查询"}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => void handleSaveDraft()}
					disabled={draftBusy || !databaseId}
					loading={draftBusy}
				>
					{draftSaved
						? "草稿已保存"
						: isReportDraft
							? "保存报表草稿"
							: "保存草稿"}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => void handleOpenInQuestions()}
					disabled={draftBusy || !databaseId}
				>
					{draftSaved
						? "在查询中继续编辑"
						: isReportDraft
							? "打开报表草稿"
							: "在查询中打开"}
				</Button>
				<Button
					variant="secondary"
					size="sm"
					onClick={handleCreateViz}
					disabled={draftBusy || !databaseId}
				>
					{isReportDraft ? "创建图表" : "创建可视化"}
				</Button>
			</div>

			{draftSaved && draftId != null && (
				<div className="inline-sql-preview__result-info">
					草稿已保存，可在查询中继续编辑；可视化请进入 BI 侧处理。#{draftId}
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
				</div>
			)}
		</div>
	);
}
