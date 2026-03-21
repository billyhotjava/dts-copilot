import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
	analyticsApi,
	type AiAgentChatResponse,
	type Nl2SqlEvalCaseItem,
	type Nl2SqlEvalCompareResponse,
	type Nl2SqlEvalGateRunResponse,
	type Nl2SqlEvalRunRecord,
	type Nl2SqlEvalRunSummary,
} from "../api/analyticsApi";
import { ErrorNotice } from "../components/ErrorNotice";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import { formatTime, toIdString, type LoadState } from "../shared/utils";
import { Badge } from "../ui/Badge/Badge";
import { Button } from "../ui/Button/Button";
import { Card, CardBody, CardFooter, CardHeader } from "../ui/Card/Card";
import { Input, TextArea } from "../ui/Input/Input";
import { NativeSelect } from "../ui/Input/Select";
import { Spinner } from "../ui/Loading/Spinner";
import "./page.css";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type FieldRowProps = {
	label: string;
	value: string;
};

function FieldRow({ label, value }: FieldRowProps) {
	return (
		<div>
			<div className="small muted">{label}</div>
			<div style={{ marginTop: "var(--spacing-xxs)" }}>{value || "-"}</div>
		</div>
	);
}

type RunSummaryViewProps = {
	summary: Nl2SqlEvalRunSummary;
	title?: string;
};

function RunSummaryView({ summary, title }: RunSummaryViewProps) {
	const passRate = summary.passRate != null ? `${(summary.passRate * 100).toFixed(1)}%` : "-";
	const avgScore = summary.averageScore != null ? summary.averageScore.toFixed(2) : "-";

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			{title && <div className="small muted" style={{ fontWeight: "var(--font-weight-semibold)" }}>{title}</div>}
			<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
				<FieldRow label="通过率" value={passRate} />
				<FieldRow label="平均得分" value={avgScore} />
				<FieldRow label="总样例数" value={summary.total != null ? String(summary.total) : "-"} />
				<FieldRow label="通过数" value={summary.passed != null ? String(summary.passed) : "-"} />
				<FieldRow label="失败数" value={summary.failed != null ? String(summary.failed) : "-"} />
				<FieldRow label="执行时间" value={formatTime(summary.executedAt)} />
			</div>

			{Array.isArray(summary.rows) && summary.rows.length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>样例结果</div>
					<table className="table">
						<thead>
							<tr>
								<th>样例</th>
								<th>通过</th>
								<th>得分</th>
								<th>检查项</th>
							</tr>
						</thead>
						<tbody>
							{summary.rows.map((row, idx) => (
								<tr key={`row-${toIdString(row.id)}-${idx}`}>
									<td>{row.name || toIdString(row.id) || "-"}</td>
									<td>
										<Badge variant={row.passed ? "success" : "error"} size="sm">
											{row.passed ? "pass" : "fail"}
										</Badge>
									</td>
									<td>{row.score != null ? row.score.toFixed(2) : "-"}</td>
									<td>{row.passedChecks != null && row.totalChecks != null ? `${row.passedChecks}/${row.totalChecks}` : "-"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

type GateSummaryViewProps = {
	gate: Nl2SqlEvalGateRunResponse;
};

function GateSummaryView({ gate }: GateSummaryViewProps) {
	const gateInfo = gate.gate;
	const passed = gateInfo?.passed;
	return (
		<div className="col" style={{ gap: "var(--spacing-sm)" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
				<span className="small muted">Gate 结果:</span>
				{passed == null
					? <Badge size="sm">未知</Badge>
					: <Badge variant={passed ? "success" : "error"} size="sm">{passed ? "通过" : "未通过"}</Badge>
				}
			</div>
			{Array.isArray(gateInfo?.reasons) && gateInfo.reasons.length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>原因</div>
					<ul style={{ margin: 0, paddingLeft: "var(--spacing-lg)", fontSize: "var(--font-size-sm)" }}>
						{gateInfo.reasons.map((r, idx) => <li key={idx}>{r}</li>)}
					</ul>
				</div>
			)}
			{gate.summary && <RunSummaryView summary={gate.summary} title="评测摘要" />}
		</div>
	);
}

type CompareViewProps = {
	result: Nl2SqlEvalCompareResponse;
};

function CompareView({ result }: CompareViewProps) {
	const metrics = result.metrics;
	const changes = result.changes;
	const fmt = (v: number | null | undefined, decimals = 3) =>
		v == null ? "-" : (v >= 0 ? "+" : "") + v.toFixed(decimals);

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			{metrics && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-sm)" }}>指标对比</div>
					<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
						<FieldRow label="通过率变化" value={fmt(metrics.passRateDelta)} />
						<FieldRow label="平均得分变化" value={fmt(metrics.averageScoreDelta, 2)} />
						<FieldRow label="失败数变化" value={fmt(metrics.failedDelta, 0)} />
						<FieldRow label="阻塞率变化" value={fmt(metrics.blockedRateDelta)} />
					</div>
				</div>
			)}

			{changes && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-sm)" }}>变更统计</div>
					<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
						<FieldRow label="退步数" value={changes.regressionCount != null ? String(changes.regressionCount) : "-"} />
						<FieldRow label="提升数" value={changes.improvementCount != null ? String(changes.improvementCount) : "-"} />
						<FieldRow label="无变化数" value={changes.unchangedCount != null ? String(changes.unchangedCount) : "-"} />
						<FieldRow label="总对比数" value={changes.totalCompared != null ? String(changes.totalCompared) : "-"} />
					</div>

					{Array.isArray(changes.rows) && changes.rows.length > 0 && (
						<div style={{ marginTop: "var(--spacing-sm)" }}>
							<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>样例变更明细</div>
							<table className="table">
								<thead>
									<tr>
										<th>样例</th>
										<th>变化</th>
										<th>基线得分</th>
										<th>候选得分</th>
									</tr>
								</thead>
								<tbody>
									{changes.rows.map((row, idx) => {
										const changeType = String(row.changeType ?? row.change ?? "-");
										const variant =
											changeType === "regression" ? "error" :
											changeType === "improvement" ? "success" :
											"default";
										return (
											<tr key={idx}>
												<td>{String(row.name ?? row.caseId ?? "-")}</td>
												<td><Badge variant={variant} size="sm">{changeType}</Badge></td>
												<td>{row.baselineScore != null ? Number(row.baselineScore).toFixed(2) : "-"}</td>
												<td>{row.candidateScore != null ? Number(row.candidateScore).toFixed(2) : "-"}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

type TranslateResultViewProps = {
	result: Record<string, unknown>;
};

function TranslateResultView({ result }: TranslateResultViewProps) {
	// Show scalar fields first, then structured sections
	const scalarFields: Array<[string, string]> = [];
	const structuredSections: Array<[string, unknown]> = [];

	for (const [key, val] of Object.entries(result)) {
		if (val == null || typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
			scalarFields.push([key, val == null ? "-" : String(val)]);
		} else {
			structuredSections.push([key, val]);
		}
	}

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			{scalarFields.length > 0 && (
				<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
					{scalarFields.map(([key, val]) => (
						<FieldRow key={key} label={key} value={val} />
					))}
				</div>
			)}
			{structuredSections.map(([key, val]) => (
				<div key={key}>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>{key}</div>
					<div
						style={{
							padding: "var(--spacing-sm)",
							background: "var(--color-bg-secondary)",
							borderRadius: "var(--radius-sm)",
							fontSize: "var(--font-size-sm)",
							whiteSpace: "pre-wrap",
							wordBreak: "break-word",
						}}
					>
						{Array.isArray(val)
							? val.length === 0
								? <span className="muted">（空）</span>
								: val.map((item, i) => (
										<div key={i} style={{ marginBottom: "var(--spacing-xs)", paddingBottom: "var(--spacing-xs)", borderBottom: i < val.length - 1 ? "1px solid var(--color-border)" : "none" }}>
											{typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
										</div>
									))
							: typeof val === "object"
								? JSON.stringify(val, null, 2)
								: String(val)
						}
					</div>
				</div>
			))}
		</div>
	);
}

function parseCaseIds(raw: string): Array<number> {
	return raw
		.split(",")
		.map((item) => Number.parseInt(item.trim(), 10))
		.filter((item) => Number.isFinite(item) && item > 0);
}

function parseExpectedJson(raw: string): Record<string, unknown> | null {
	const text = raw.trim();
	if (!text) return {};
	try {
		const value = JSON.parse(text);
		if (value && typeof value === "object" && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return null;
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/** Extract the first usable SQL from a translate result's sqlBlueprints array. */
function extractFirstSql(result: Record<string, unknown>): string | null {
	const blueprints = result.sqlBlueprints;
	if (!Array.isArray(blueprints)) return null;
	for (const bp of blueprints) {
		const sql = typeof bp === "object" && bp != null ? (bp as Record<string, unknown>).sql : null;
		if (typeof sql === "string" && sql.trim()) return sql.trim();
	}
	return null;
}

function parseJsonLike(value: unknown): unknown {
	if (typeof value !== "string") return value;
	const text = value.trim();
	if (!text) return "";
	if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
		try {
			return JSON.parse(text);
		} catch {
			return value;
		}
	}
	return value;
}

function collectBlueprintsFromAgent(result: AiAgentChatResponse): Array<Record<string, unknown>> {
	const out: Array<Record<string, unknown>> = [];
	const toolCalls = Array.isArray(result.toolCalls) ? result.toolCalls : [];
	for (const call of toolCalls) {
		const payload = parseJsonLike(call?.result?.data);
		if (payload && typeof payload === "object") {
			const row = payload as Record<string, unknown>;
			const blueprints = row.sqlBlueprints;
			if (Array.isArray(blueprints)) {
				for (const item of blueprints) {
					if (item && typeof item === "object") {
						const bp = item as Record<string, unknown>;
						const sql = typeof bp.sql === "string" ? bp.sql.trim() : "";
						if (!sql) continue;
						out.push({
							queryId: bp.queryId ?? bp.id ?? `q${out.length + 1}`,
							purpose: bp.purpose ?? call.toolId ?? "业务查询",
							sql,
						});
					}
				}
			}
			const sql = typeof row.sql === "string" ? row.sql.trim() : "";
			if (sql) {
				out.push({
					queryId: `q${out.length + 1}`,
					purpose: call.toolId ?? "业务查询",
					sql,
				});
			}
		}

		const summary = typeof call?.result?.textSummary === "string" ? call.result.textSummary : "";
		if (summary && /\bselect\b/i.test(summary)) {
			out.push({
				queryId: `q${out.length + 1}`,
				purpose: call.toolId ?? "业务查询",
				sql: summary,
			});
		}
	}
	return out;
}

function toTranslateView(prompt: string, response: AiAgentChatResponse): Record<string, unknown> {
	const toolCalls = Array.isArray(response.toolCalls) ? response.toolCalls : [];
	const sqlBlueprints = collectBlueprintsFromAgent(response);
	return {
		engine: "ai-agent-chat",
		prompt,
		sessionId: response.sessionId,
		agentMessage: response.agentMessage,
		reasoning: response.reasoning ?? "",
		requiresApproval: response.requiresApproval,
		pendingAction: response.pendingAction ?? null,
		toolCalls,
		sqlBlueprints,
		nl2sqlDiagnostics: {
			status: response.requiresApproval ? "needs-approval" : "safe",
			sqlBlueprintCount: sqlBlueprints.length,
			toolCallCount: toolCalls.length,
		},
	};
}

export default function Nl2SqlEvalPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const navigate = useNavigate();
	const [casesState, setCasesState] = useState<LoadState<Nl2SqlEvalCaseItem[]>>({ state: "loading" });
	const [runsState, setRunsState] = useState<LoadState<Nl2SqlEvalRunRecord[]>>({ state: "loading" });

	const [translatePrompt, setTranslatePrompt] = useState("");
	const [translateResult, setTranslateResult] = useState<Record<string, unknown> | null>(null);
	const [translateLoading, setTranslateLoading] = useState(false);
	const [translateError, setTranslateError] = useState<unknown>(null);

	const [runSummary, setRunSummary] = useState<Nl2SqlEvalRunSummary | null>(null);
	const [gateSummary, setGateSummary] = useState<Nl2SqlEvalGateRunResponse | null>(null);
	const [compareState, setCompareState] = useState<LoadState<Nl2SqlEvalCompareResponse> | null>(null);

	const [caseName, setCaseName] = useState("");
	const [caseDomain, setCaseDomain] = useState("");
	const [casePrompt, setCasePrompt] = useState("");
	const [caseNotes, setCaseNotes] = useState("");
	const [caseExpected, setCaseExpected] = useState("{}");

	const [enabledOnly, setEnabledOnly] = useState(true);
	const [limit, setLimit] = useState("100");
	const [caseIdsCsv, setCaseIdsCsv] = useState("");
	const [baselineRunId, setBaselineRunId] = useState("");
	const [candidateRunId, setCandidateRunId] = useState("");

	const [saving, setSaving] = useState(false);
	const [actionError, setActionError] = useState<unknown>(null);
	const [actionMessage, setActionMessage] = useState("");

	const loadCases = async () => {
		try {
			setCasesState({ state: "loading" });
			const rows = await analyticsApi.listNl2SqlEvalCases(false, 500);
			setCasesState({ state: "loaded", value: Array.isArray(rows) ? rows : [] });
		} catch (e) {
			setCasesState({ state: "error", error: e });
		}
	};

	const loadRuns = async () => {
		try {
			setRunsState({ state: "loading" });
			const rows = await analyticsApi.listNl2SqlEvalRuns(100);
			const safeRows = Array.isArray(rows) ? rows : [];
			setRunsState({ state: "loaded", value: safeRows });
			if (!baselineRunId && safeRows.length > 0) {
				setBaselineRunId(toIdString(safeRows[0]?.id));
			}
			if (!candidateRunId && safeRows.length > 1) {
				setCandidateRunId(toIdString(safeRows[1]?.id));
			}
		} catch (e) {
			setRunsState({ state: "error", error: e });
		}
	};

	useEffect(() => {
		void Promise.all([loadCases(), loadRuns()]);
	}, []);

	const buildRunPayload = () => {
		const safeLimit = Number.parseInt(limit, 10);
		return {
			enabledOnly,
			limit: Number.isFinite(safeLimit) && safeLimit > 0 ? safeLimit : 100,
			caseIds: parseCaseIds(caseIdsCsv),
		};
	};

	const createCase = async () => {
		if (saving) return;
		const name = caseName.trim();
		const promptText = casePrompt.trim();
		if (!name || !promptText) {
			setActionError(new Error("name 和 promptText 不能为空"));
			return;
		}
		const expected = parseExpectedJson(caseExpected);
		if (expected == null) {
			setActionError(new Error("expected 必须是 JSON 对象"));
			return;
		}
		setSaving(true);
		setActionError(null);
		setActionMessage("");
		try {
			await analyticsApi.createNl2SqlEvalCase({
				name,
				domain: caseDomain.trim() || null,
				promptText,
				notes: caseNotes.trim() || null,
				expected,
				enabled: true,
			});
			setCaseName("");
			setCaseDomain("");
			setCasePrompt("");
			setCaseNotes("");
			setCaseExpected("{}");
			await loadCases();
			setActionMessage("评测样例已创建");
		} catch (e) {
			setActionError(e);
		} finally {
			setSaving(false);
		}
	};

	const runEval = async () => {
		if (saving) return;
		setSaving(true);
		setActionError(null);
		setActionMessage("");
		try {
			const result = await analyticsApi.runNl2SqlEvaluation(buildRunPayload());
			setRunSummary(result);
			setGateSummary(null);
			await loadRuns();
			setActionMessage("评测执行完成");
		} catch (e) {
			setActionError(e);
		} finally {
			setSaving(false);
		}
	};

	const runEvalGated = async () => {
		if (saving) return;
		setSaving(true);
		setActionError(null);
		setActionMessage("");
		try {
			const result = await analyticsApi.runNl2SqlEvaluationWithGate({
				...buildRunPayload(),
				version: {
					label: "ui-gated",
				},
			});
			setGateSummary(result);
			setRunSummary(result.summary ?? null);
			await loadRuns();
			setActionMessage("Gated 评测执行完成");
		} catch (e) {
			setActionError(e);
		} finally {
			setSaving(false);
		}
	};

	const compareRuns = async () => {
		if (!baselineRunId || !candidateRunId) return;
		try {
			setCompareState({ state: "loading" });
			const value = await analyticsApi.compareNl2SqlEvalRuns(baselineRunId, candidateRunId);
			setCompareState({ state: "loaded", value });
		} catch (e) {
			setCompareState({ state: "error", error: e });
		}
	};

	const runTranslate = async () => {
		const prompt = translatePrompt.trim();
		if (!prompt) {
			setTranslateError(new Error("请输入自然语言描述"));
			return;
		}
		setTranslateLoading(true);
		setTranslateError(null);
		try {
			const result = await analyticsApi.aiAgentChatSend({ userMessage: prompt });
			setTranslateResult(toTranslateView(prompt, result));
		} catch (e) {
			setTranslateError(e);
			setTranslateResult(null);
		} finally {
			setTranslateLoading(false);
		}
	};

	const runOptions = runsState.state === "loaded"
		? runsState.value.map((run) => ({
			value: toIdString(run.id),
			label: `#${toIdString(run.id)} ${run.label || ""}`.trim(),
		}))
		: [{ value: "", label: t(locale, "loading") }];

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "nl2sqlEval.title")}
				subtitle={t(locale, "nl2sqlEval.subtitle")}
				actions={
					<Button variant="secondary" size="sm" onClick={() => void Promise.all([loadCases(), loadRuns()])}>
						{t(locale, "common.refresh")}
					</Button>
				}
			/>

			<Card style={{ marginBottom: "var(--spacing-lg)" }}>
				<CardHeader title="实时 AI Agent 对话" />
				<CardBody>
					<div className="col" style={{ gap: "var(--spacing-sm)" }}>
						<TextArea
							label="自然语言描述"
							value={translatePrompt}
							onChange={(event) => setTranslatePrompt(event.target.value)}
							rows={3}
							placeholder="例：统计近30天各省销售额与订单数"
						/>
						<div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center" }}>
							<Button variant="primary" onClick={runTranslate} loading={translateLoading}>
								发送到 Agent
							</Button>
							{translateError ? <ErrorNotice locale={locale} error={translateError} /> : null}
						</div>
						{translateResult ? (
							<>
								{extractFirstSql(translateResult) && (
									<div style={{ display: "flex", gap: "var(--spacing-sm)", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
										<Button
											variant="secondary"
											size="sm"
											onClick={() => {
												const sql = extractFirstSql(translateResult);
												if (!sql) return;
												const params = new URLSearchParams({ sql });
												if (translatePrompt.trim()) params.set("name", translatePrompt.trim().slice(0, 80));
												navigate(`/questions/new?${params.toString()}`);
											}}
										>
											SQL 创建可视化
										</Button>
										<Button
											variant="tertiary"
											size="sm"
											onClick={() => {
												const sql = extractFirstSql(translateResult);
												if (sql && navigator.clipboard?.writeText) {
													void navigator.clipboard.writeText(sql);
												}
											}}
										>
											复制 SQL
										</Button>
									</div>
								)}
								<TranslateResultView result={translateResult} />
							</>
						) : (
							<p style={{ color: "var(--color-text-secondary)", margin: 0 }}>运行后将显示 Agent 回复、工具调用和 SQL 蓝图信息。</p>
						)}
					</div>
				</CardBody>
			</Card>

			{Boolean(actionError) ? <ErrorNotice locale={locale} error={actionError} /> : null}
			{actionMessage && (
				<div style={{ marginBottom: "var(--spacing-md)" }}>
					<Badge variant="success">{actionMessage}</Badge>
				</div>
			)}

			<div className="grid2" style={{ marginBottom: "var(--spacing-lg)" }}>
				<Card>
					<CardHeader title="评测样例管理" />
					<CardBody>
						<div className="col" style={{ gap: "var(--spacing-sm)" }}>
							<Input label={t(locale, "common.name")} value={caseName} onChange={(event) => setCaseName(event.target.value)} placeholder="制造日报趋势评测" />
							<Input label="业务域" value={caseDomain} onChange={(event) => setCaseDomain(event.target.value)} placeholder="manufacturing" />
							<TextArea label="提示词" value={casePrompt} onChange={(event) => setCasePrompt(event.target.value)} rows={3} />
							<TextArea label={t(locale, "common.description")} value={caseNotes} onChange={(event) => setCaseNotes(event.target.value)} rows={2} />
							<TextArea label="期望结果(JSON)" value={caseExpected} onChange={(event) => setCaseExpected(event.target.value)} rows={3} />
						</div>
					</CardBody>
					<CardFooter align="right">
						<Button variant="primary" onClick={createCase} loading={saving}>
							创建样例
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader title="执行参数" />
					<CardBody>
						<div className="col" style={{ gap: "var(--spacing-sm)" }}>
							<label style={{ display: "inline-flex", gap: "var(--spacing-xs)", alignItems: "center", fontSize: "var(--font-size-sm)" }}>
								<input type="checkbox" checked={enabledOnly} onChange={(event) => setEnabledOnly(event.target.checked)} />
								仅执行 enabled 样例
							</label>
							<Input label="样例上限" value={limit} onChange={(event) => setLimit(event.target.value)} />
							<Input label="指定 CaseIds(逗号分隔，可选)" value={caseIdsCsv} onChange={(event) => setCaseIdsCsv(event.target.value)} placeholder="1,2,5" />
						</div>
					</CardBody>
					<CardFooter align="right">
						<div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
							<Button variant="secondary" onClick={runEval} loading={saving}>执行评测</Button>
							<Button variant="primary" onClick={runEvalGated} loading={saving}>执行 Gated</Button>
						</div>
					</CardFooter>
				</Card>
			</div>

			<Card style={{ marginBottom: "var(--spacing-lg)" }}>
				<CardHeader
					title="样例列表"
					action={casesState.state === "loaded" ? <Badge>{casesState.value.length}</Badge> : null}
				/>
				<CardBody>
					{casesState.state === "loading" && (
						<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
							<Spinner size="md" />
						</div>
					)}
					{casesState.state === "error" && <ErrorNotice locale={locale} error={casesState.error} />}
					{casesState.state === "loaded" && casesState.value.length === 0 && (
						<div className="muted">{t(locale, "common.empty")}</div>
					)}
					{casesState.state === "loaded" && casesState.value.length > 0 && (
						<table className="table">
							<thead>
								<tr>
									<th>ID</th>
									<th>{t(locale, "common.name")}</th>
									<th>Domain</th>
									<th>Prompt 预览</th>
									<th>Enabled</th>
								</tr>
							</thead>
							<tbody>
								{casesState.value.map((item, idx) => (
									<tr key={`${toIdString(item.id)}-${idx}`}>
										<td>{toIdString(item.id)}</td>
										<td>{item.name || "-"}</td>
										<td>{item.domain || "-"}</td>
										<td
											className="small muted truncate"
											style={{ maxWidth: 240 }}
											title={item.promptText}
										>
											{item.promptText ? item.promptText.slice(0, 60) + (item.promptText.length > 60 ? "…" : "") : "-"}
										</td>
										<td>
											<Badge variant={item.enabled ? "success" : "default"} size="sm">
												{item.enabled ? "yes" : "no"}
											</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</CardBody>
			</Card>

			<div className="grid2">
				<Card>
					<CardHeader
						title="Run 历史与对比"
						action={runsState.state === "loaded" ? <Badge>{runsState.value.length}</Badge> : null}
					/>
					<CardBody>
						{runsState.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{runsState.state === "error" && <ErrorNotice locale={locale} error={runsState.error} />}
						{runsState.state === "loaded" && (
							<div className="col" style={{ gap: "var(--spacing-sm)" }}>
								<div className="grid2">
									<NativeSelect label="基准运行" value={baselineRunId} onChange={(event) => setBaselineRunId(event.target.value)} options={runOptions} />
									<NativeSelect label="候选运行" value={candidateRunId} onChange={(event) => setCandidateRunId(event.target.value)} options={runOptions} />
								</div>
								<Button variant="primary" onClick={() => void compareRuns()} disabled={!baselineRunId || !candidateRunId}>
									执行 Run 对比
								</Button>
								<table className="table">
									<thead>
										<tr>
											<th>ID</th>
											<th>PassRate</th>
											<th>AvgScore</th>
											<th>Gate</th>
											<th>创建时间</th>
										</tr>
									</thead>
									<tbody>
										{runsState.value.map((run, idx) => (
											<tr key={`${toIdString(run.id)}-${idx}`}>
												<td>{toIdString(run.id)}</td>
												<td>{run.passRate == null ? "-" : `${(run.passRate * 100).toFixed(1)}%`}</td>
												<td>{run.averageScore == null ? "-" : run.averageScore.toFixed(2)}</td>
												<td>
													{run.gatePassed == null
														? <Badge size="sm">-</Badge>
														: <Badge variant={run.gatePassed ? "success" : "error"} size="sm">{run.gatePassed ? "pass" : "fail"}</Badge>
													}
												</td>
												<td className="small muted">{formatTime(run.createdAt)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="执行与对比结果" />
					<CardBody>
						{compareState?.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{compareState?.state === "error" && <ErrorNotice locale={locale} error={compareState.error} />}

						{!runSummary && !gateSummary && compareState == null && (
							<div className="muted">执行评测或对比后结果将显示在此处。</div>
						)}

						<div className="col" style={{ gap: "var(--spacing-lg)" }}>
							{runSummary && !gateSummary && (
								<div>
									<div className="small muted" style={{ marginBottom: "var(--spacing-sm)", fontWeight: "var(--font-weight-semibold)" }}>
										最近评测摘要
									</div>
									<RunSummaryView summary={runSummary} />
								</div>
							)}
							{gateSummary && (
								<div>
									<div className="small muted" style={{ marginBottom: "var(--spacing-sm)", fontWeight: "var(--font-weight-semibold)" }}>
										Gated 评测结果
									</div>
									<GateSummaryView gate={gateSummary} />
								</div>
							)}
							{compareState?.state === "loaded" && (
								<div>
									<div className="small muted" style={{ marginBottom: "var(--spacing-sm)", fontWeight: "var(--font-weight-semibold)" }}>
										Run 对比结果
									</div>
									<CompareView result={compareState.value} />
								</div>
							)}
						</div>
					</CardBody>
				</Card>
			</div>
		</PageContainer>
	);
}
