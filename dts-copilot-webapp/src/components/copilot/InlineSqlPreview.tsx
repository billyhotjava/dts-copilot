import { useState } from "react";
import type { CardQueryResponse } from "../../api/analyticsApi";
import { analyticsApi } from "../../api/analyticsApi";
import { Button } from "../../ui/Button/Button";
import { DataTable } from "../DataTable";
import "./InlineSqlPreview.css";

interface Props {
	sql: string;
	databaseId?: number;
}

type RunState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "success"; result: CardQueryResponse; durationMs: number }
	| { status: "error"; message: string };

export function InlineSqlPreview({ sql, databaseId }: Props) {
	const [editing, setEditing] = useState(false);
	const [editableSql, setEditableSql] = useState(sql);
	const [runState, setRunState] = useState<RunState>({ status: "idle" });
	const [copied, setCopied] = useState(false);

	const currentSql = editing ? editableSql : sql;

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

	function handleCopy() {
		if (navigator.clipboard?.writeText) {
			void navigator.clipboard.writeText(currentSql);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	}

	function handleCreateViz() {
		const dbId = databaseId != null ? String(databaseId) : "";
		const params = new URLSearchParams({
			sql: currentSql,
			...(dbId ? { db: dbId } : {}),
			autorun: "1",
		});
		window.location.href = `/questions/new?${params.toString()}`;
	}

	return (
		<div className="inline-sql-preview">
			<div className="inline-sql-preview__header">
				<span className="inline-sql-preview__label">生成的 SQL</span>
				<div className="inline-sql-preview__actions">
					<button
						type="button"
						className={`inline-sql-preview__action-btn${editing ? " inline-sql-preview__action-btn--active" : ""}`}
						onClick={() => {
							if (!editing) setEditableSql(sql);
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

			{editing ? (
				<textarea
					className="inline-sql-preview__editor"
					value={editableSql}
					onChange={(e) => setEditableSql(e.target.value)}
					rows={Math.min(editableSql.split("\n").length + 1, 12)}
				/>
			) : (
				<pre className="inline-sql-preview__code">
					<code>{sql}</code>
				</pre>
			)}

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
				<Button variant="secondary" size="sm" onClick={handleCreateViz}>
					创建可视化
				</Button>
			</div>

			{runState.status === "success" && (
				<div className="inline-sql-preview__result">
					<div className="inline-sql-preview__result-info">
						{runState.result.row_count ?? 0} 行结果，耗时 {runState.durationMs}ms
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
					<div className="inline-sql-preview__error-msg">{runState.message}</div>
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
