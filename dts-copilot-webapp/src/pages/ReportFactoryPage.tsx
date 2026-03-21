import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { analyticsApi, type AnalysisDraftDetail, type FixedReportCatalogItem, type ReportRunItem, type ReportTemplateItem } from "../api/analyticsApi";
import { AnalysisProvenancePanel } from "../components/analysis/AnalysisProvenancePanel";
import { ErrorNotice } from "../components/ErrorNotice";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import { buildFixedReportQuickStartItems } from "./fixed-reports/fixedReportCatalogModel";
import { buildFixedReportCreationFlowPath, buildFixedReportRunPath, readSelectedFixedReportTemplate } from "./fixed-reports/fixedReportSurfaceEntry";
import { readSelectedAnalysisDraft } from "./analysisDraftSurfaceEntry";
import { resolveAnalysisDraftReportSource } from "./analysisDraftReuseModel";
import { buildAnalysisDraftProvenanceModel, buildFixedReportProvenanceModel } from "./analysisProvenanceModel";
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

function statusVariant(status: string | undefined): "success" | "warning" | "error" | "default" {
	if (!status) return "default";
	if (status === "completed") return "success";
	if (status === "failed" || status === "error") return "error";
	if (status === "running" || status === "pending") return "warning";
	return "default";
}

type RunDetailViewProps = {
	run: ReportRunItem;
};

function RunDetailView({ run }: RunDetailViewProps) {
	const summary = run.summary ?? {};
	const summaryEntries = Object.entries(summary).filter(([, v]) => typeof v !== "object" || v === null);
	const summaryObjects = Object.entries(summary).filter(([, v]) => typeof v === "object" && v !== null);

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
				<FieldRow label="ID" value={toIdString(run.id)} />
				<FieldRow label="状态" value={run.status ?? "-"} />
				<FieldRow label="来源类型" value={run.sourceType ?? "-"} />
				<FieldRow label="来源 ID" value={toIdString(run.sourceId)} />
				<FieldRow label="模板 ID" value={toIdString(run.templateId)} />
				<FieldRow label="输出格式" value={run.outputFormat ?? "-"} />
				<FieldRow label="创建时间" value={formatTime(run.createdAt)} />
				<FieldRow label="更新时间" value={formatTime(run.updatedAt)} />
			</div>

			{run.status && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>状态标签</div>
					<Badge variant={statusVariant(run.status)}>{run.status}</Badge>
				</div>
			)}

			{(summaryEntries.length > 0 || summaryObjects.length > 0) && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-sm)" }}>摘要信息</div>
					<div
						style={{
							padding: "var(--spacing-sm)",
							background: "var(--color-bg-secondary)",
							borderRadius: "var(--radius-sm)",
						}}
					>
						{summaryEntries.map(([key, val]) => (
							<div key={key} style={{ display: "flex", gap: "var(--spacing-xs)", marginBottom: "var(--spacing-xxs)", fontSize: "var(--font-size-sm)" }}>
								<span className="muted" style={{ flexShrink: 0 }}>{key}:</span>
								<span>{String(val ?? "")}</span>
							</div>
						))}
						{summaryObjects.map(([key, val]) => (
							<div key={key} style={{ marginBottom: "var(--spacing-xs)", fontSize: "var(--font-size-sm)" }}>
								<span className="muted">{key}:</span>
								<div style={{ marginLeft: "var(--spacing-md)", wordBreak: "break-all" }}>
									{JSON.stringify(val)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
				<a
					href={analyticsApi.getReportRunExportUrl(run.id ?? "", "html")}
					target="_blank"
					rel="noreferrer"
					className="link small"
				>
					在新标签打开 HTML
				</a>
				<a
					href={analyticsApi.getReportRunExportUrl(run.id ?? "", "markdown")}
					target="_blank"
					rel="noreferrer"
					className="link small"
				>
					在新标签打开 Markdown
				</a>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReportFactoryPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const location = useLocation();
	const [templates, setTemplates] = useState<LoadState<ReportTemplateItem[]>>({ state: "loading" });
	const [runs, setRuns] = useState<LoadState<ReportRunItem[]>>({ state: "loading" });
	const [fixedReports, setFixedReports] = useState<LoadState<FixedReportCatalogItem[]>>({ state: "loading" });
	const [selectedAnalysisDraft, setSelectedAnalysisDraft] = useState<LoadState<AnalysisDraftDetail> | null>(null);
	const [selectedFixedReport, setSelectedFixedReport] = useState<LoadState<FixedReportCatalogItem> | null>(null);
	const [selectedRun, setSelectedRun] = useState<LoadState<ReportRunItem> | null>(null);

	const [templateName, setTemplateName] = useState("");
	const [templateDesc, setTemplateDesc] = useState("");
	const [templateSections, setTemplateSections] = useState("问题背景,关键洞察,风险与建议");

	const [generateTemplateId, setGenerateTemplateId] = useState("");
	const [sourceType, setSourceType] = useState("session");
	const [sourceId, setSourceId] = useState("");
	const [outputFormat, setOutputFormat] = useState("html");
	const [distributionJson, setDistributionJson] = useState("{}");

	const [saving, setSaving] = useState(false);
	const [actionError, setActionError] = useState<unknown>(null);
	const [actionMessage, setActionMessage] = useState("");

	const loadTemplates = async () => {
		try {
			setTemplates({ state: "loading" });
			const rows = await analyticsApi.listReportTemplates(200);
			setTemplates({ state: "loaded", value: Array.isArray(rows) ? rows : [] });
		} catch (e) {
			setTemplates({ state: "error", error: e });
		}
	};

	const loadRuns = async () => {
		try {
			setRuns({ state: "loading" });
			const rows = await analyticsApi.listReportRuns(200);
			setRuns({ state: "loaded", value: Array.isArray(rows) ? rows : [] });
		} catch (e) {
			setRuns({ state: "error", error: e });
		}
	};

	const loadFixedReports = async () => {
		try {
			setFixedReports({ state: "loading" });
			const rows = await analyticsApi.listFixedReportCatalog({ limit: 20 });
			setFixedReports({ state: "loaded", value: Array.isArray(rows) ? rows : [] });
		} catch (e) {
			setFixedReports({ state: "error", error: e });
		}
	};

	useEffect(() => {
		void Promise.all([loadTemplates(), loadRuns(), loadFixedReports()]);
	}, []);

	useEffect(() => {
		const analysisDraftId = readSelectedAnalysisDraft(location.search);
		if (!analysisDraftId) {
			setSelectedAnalysisDraft(null);
			return;
		}
		let cancelled = false;
		setSelectedAnalysisDraft({ state: "loading" });
		analyticsApi
			.getAnalysisDraft(analysisDraftId)
			.then((draft) => {
				if (cancelled) return;
				setSelectedAnalysisDraft({ state: "loaded", value: draft });
				setTemplateName((current) => current.trim() ? current : `${draft.title || "Copilot 草稿"} 报告模板`);
				setTemplateDesc((current) => current.trim() ? current : `基于分析草稿“${draft.title || draft.question || analysisDraftId}”沉淀的报告模板草稿。`);
			})
			.catch((error) => {
				if (cancelled) return;
				setSelectedAnalysisDraft({ state: "error", error });
			});
		return () => {
			cancelled = true;
		};
	}, [location.search]);

	useEffect(() => {
		if (selectedAnalysisDraft?.state !== "loaded") return;
		const draftSource = resolveAnalysisDraftReportSource(selectedAnalysisDraft.value);
		if (!draftSource) return;
		setSourceType("session");
		setSourceId((current) => current.trim() ? current : draftSource.sourceId);
	}, [selectedAnalysisDraft]);

	useEffect(() => {
		const templateCode = readSelectedFixedReportTemplate(location.search);
		if (!templateCode) {
			setSelectedFixedReport(null);
			return;
		}
		let cancelled = false;
		setSelectedFixedReport({ state: "loading" });
		analyticsApi
			.getFixedReportCatalogItem(templateCode)
			.then((row) => {
				if (cancelled) return;
				setSelectedFixedReport({ state: "loaded", value: row });
				setTemplateName((current) => current.trim() ? current : `${row.name || templateCode} 报告模板`);
				setTemplateDesc((current) => current.trim() ? current : `基于固定报表“${row.name || templateCode}”沉淀的报告模板草稿。`);
			})
			.catch((error) => {
				if (cancelled) return;
				setSelectedFixedReport({ state: "error", error });
			});
		return () => {
			cancelled = true;
		};
	}, [location.search]);

	const fixedReportQuickStarts = useMemo(
		() => fixedReports.state === "loaded" ? buildFixedReportQuickStartItems(fixedReports.value, 6) : [],
		[fixedReports],
	);

	const createTemplate = async () => {
		if (saving) return;
		const name = templateName.trim();
		if (!name) {
			setActionError(new Error("模板名称不能为空"));
			return;
		}
		const sections = templateSections
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length > 0);
		setSaving(true);
		setActionError(null);
		setActionMessage("");
		try {
			await analyticsApi.createReportTemplate({
				name,
				description: templateDesc.trim() || null,
				published: false,
				spec: {
					layout: "default",
					sections: sections.length > 0 ? sections : ["问题背景", "关键洞察", "风险与建议"],
				},
			});
			setTemplateName("");
			setTemplateDesc("");
			await loadTemplates();
			setActionMessage("报告模板已创建");
		} catch (e) {
			setActionError(e);
		} finally {
			setSaving(false);
		}
	};

	const parseDistribution = (): Record<string, unknown> | null => {
		const raw = distributionJson.trim();
		if (!raw) return {};
		try {
			const value = JSON.parse(raw);
			if (value && typeof value === "object" && !Array.isArray(value)) {
				return value as Record<string, unknown>;
			}
			return null;
		} catch {
			return null;
		}
	};

	const generateReport = async () => {
		if (saving) return;
		const safeSourceId = Number.parseInt(sourceId, 10);
		if (!Number.isFinite(safeSourceId) || safeSourceId <= 0) {
			setActionError(new Error("sourceId 必须是正整数"));
			return;
		}
		const distribution = parseDistribution();
		if (distribution == null) {
			setActionError(new Error("分发配置必须是 JSON 对象"));
			return;
		}
		setSaving(true);
		setActionError(null);
		setActionMessage("");
		try {
			await analyticsApi.generateReportRun({
				templateId: generateTemplateId ? Number.parseInt(generateTemplateId, 10) : null,
				sourceType,
				sourceId: safeSourceId,
				outputFormat,
				distribution,
			});
			await loadRuns();
			setActionMessage("报告生成任务已提交");
		} catch (e) {
			setActionError(e);
		} finally {
			setSaving(false);
		}
	};

	const openRunDetail = async (runId: string | number | undefined) => {
		const id = toIdString(runId);
		if (!id) return;
		try {
			setSelectedRun({ state: "loading" });
			const row = await analyticsApi.getReportRun(id);
			setSelectedRun({ state: "loaded", value: row });
		} catch (e) {
			setSelectedRun({ state: "error", error: e });
		}
	};

	const templateOptions = templates.state === "loaded"
		? [{ value: "", label: "默认模板(内置)" }, ...templates.value.map((item) => ({
			value: toIdString(item.id),
			label: `${item.name || "未命名模板"} (${item.versionNo ?? 1})`,
		}))]
		: [{ value: "", label: t(locale, "loading") }];

	const sourceTypeOptions = [
		{ value: "session", label: "会话(session)" },
		{ value: "screen", label: "大屏(screen)" },
	];

	const formatOptions = [
		{ value: "html", label: "HTML" },
		{ value: "markdown", label: "Markdown" },
	];
	const analysisDraftProvenance = selectedAnalysisDraft?.state === "loaded"
		? buildAnalysisDraftProvenanceModel(selectedAnalysisDraft.value, {
			surface: "reportFactory",
			reportSourceId: resolveAnalysisDraftReportSource(selectedAnalysisDraft.value)?.sourceId ?? null,
		})
		: null;
	const fixedReportProvenance = selectedFixedReport?.state === "loaded"
		? buildFixedReportProvenanceModel(selectedFixedReport.value, { surface: "reportFactory" })
		: null;

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "reportFactory.title")}
				subtitle={t(locale, "reportFactory.subtitle")}
				actions={
					<Button variant="secondary" size="sm" onClick={() => void Promise.all([loadTemplates(), loadRuns(), loadFixedReports()])}>
						{t(locale, "common.refresh")}
					</Button>
				}
			/>

			{Boolean(actionError) ? <ErrorNotice locale={locale} error={actionError} /> : null}
			{actionMessage && (
				<div style={{ marginBottom: "var(--spacing-md)" }}>
					<Badge variant="success">{actionMessage}</Badge>
				</div>
			)}

			<Card style={{ marginBottom: "var(--spacing-lg)" }}>
				<CardHeader
					title="固定报表快捷入口"
					action={fixedReports.state === "loaded" ? <Badge>{fixedReportQuickStarts.length}</Badge> : null}
				/>
				<CardBody>
					{fixedReports.state === "loading" && (
						<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
							<Spinner size="md" />
						</div>
					)}
					{fixedReports.state === "error" && <ErrorNotice locale={locale} error={fixedReports.error} />}
					{fixedReports.state === "loaded" && fixedReportQuickStarts.length === 0 && (
						<div className="muted">暂无可复用的固定报表快捷入口。</div>
					)}
					{fixedReports.state === "loaded" && fixedReportQuickStarts.length > 0 && (
						<div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-sm)" }}>
							{fixedReportQuickStarts.map((item) => (
								<Link
									key={item.templateCode || item.name}
									to={buildFixedReportCreationFlowPath("reportFactory", item.templateCode || "")}
									className="link"
									style={{
										display: "inline-flex",
										alignItems: "center",
										gap: "var(--spacing-xs)",
										padding: "var(--spacing-xs) var(--spacing-sm)",
										borderRadius: "var(--radius-pill)",
										background: "var(--color-bg-secondary)",
										border: "1px solid var(--color-border)",
									}}
								>
									<span>{item.name || item.templateCode || "固定报表"}</span>
									<span className="small muted">{item.domain || "未分类"}</span>
								</Link>
							))}
						</div>
					)}
				</CardBody>
			</Card>

			{selectedAnalysisDraft?.state === "loaded" && analysisDraftProvenance ? (
				<AnalysisProvenancePanel
					model={analysisDraftProvenance}
					actions={
						<>
							<Link to={`/questions/new?draft=${selectedAnalysisDraft.value.id}`}>
								<Button variant="secondary" size="sm">回到查询草稿</Button>
							</Link>
							{selectedAnalysisDraft.value.linked_card_id && (
								<Link to={`/questions/${selectedAnalysisDraft.value.linked_card_id}`}>
									<Button variant="secondary" size="sm">查看已转正查询</Button>
								</Link>
							)}
						</>
					}
				/>
			) : null}

			{selectedFixedReport?.state === "loaded" && fixedReportProvenance ? (
				<AnalysisProvenancePanel
					model={fixedReportProvenance}
					actions={
						<>
							<Link to={buildFixedReportRunPath(selectedFixedReport.value.templateCode || "")}>
								<Button variant="secondary" size="sm">查看固定报表</Button>
							</Link>
							{selectedFixedReport.value.legacyPagePath ? (
								<a
									href={`https://app.xycyl.com/#${selectedFixedReport.value.legacyPagePath.startsWith("/") ? selectedFixedReport.value.legacyPagePath : `/${selectedFixedReport.value.legacyPagePath}`}`}
									target="_blank"
									rel="noreferrer"
									className="link small"
								>
									打开现网页面
								</a>
							) : null}
						</>
					}
				/>
			) : null}
			{selectedFixedReport?.state === "error" && <ErrorNotice locale={locale} error={selectedFixedReport.error} />}
			{selectedAnalysisDraft?.state === "error" && <ErrorNotice locale={locale} error={selectedAnalysisDraft.error} />}

			<div className="grid2" style={{ marginBottom: "var(--spacing-lg)" }}>
				<Card>
					<CardHeader title="模板管理" />
					<CardBody>
						<div className="col" style={{ gap: "var(--spacing-sm)" }}>
							<Input
								label={t(locale, "common.name")}
								value={templateName}
								onChange={(event) => setTemplateName(event.target.value)}
								placeholder="周报模板"
							/>
							<TextArea
								label={t(locale, "common.description")}
								value={templateDesc}
								onChange={(event) => setTemplateDesc(event.target.value)}
								rows={3}
							/>
							<Input
								label="章节(逗号分隔)"
								value={templateSections}
								onChange={(event) => setTemplateSections(event.target.value)}
								placeholder="问题背景,关键洞察,风险与建议"
							/>
						</div>
					</CardBody>
					<CardFooter align="right">
						<Button variant="primary" onClick={createTemplate} loading={saving}>
							创建模板
						</Button>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader title="报告生成" />
					<CardBody>
						<div className="col" style={{ gap: "var(--spacing-sm)" }}>
							<NativeSelect
								label="模板"
								value={generateTemplateId}
								onChange={(event) => setGenerateTemplateId(event.target.value)}
								options={templateOptions}
							/>
							<div className="grid2">
								<NativeSelect
									label="来源类型"
									value={sourceType}
									onChange={(event) => setSourceType(event.target.value)}
									options={sourceTypeOptions}
								/>
								<Input
									label="来源ID"
									value={sourceId}
									onChange={(event) => setSourceId(event.target.value)}
									placeholder="输入 sessionId 或 screenId"
								/>
							</div>
							<NativeSelect
								label="输出格式"
								value={outputFormat}
								onChange={(event) => setOutputFormat(event.target.value)}
								options={formatOptions}
							/>
							<TextArea
								label="分发配置(JSON)"
								value={distributionJson}
								onChange={(event) => setDistributionJson(event.target.value)}
								rows={3}
							/>
						</div>
					</CardBody>
					<CardFooter align="right">
						<Button variant="primary" onClick={generateReport} loading={saving}>
							生成报告
						</Button>
					</CardFooter>
				</Card>
			</div>

			<Card style={{ marginBottom: "var(--spacing-lg)" }}>
				<CardHeader
					title="模板列表"
					action={templates.state === "loaded" ? <Badge>{templates.value.length}</Badge> : null}
				/>
				<CardBody>
					{templates.state === "loading" && (
						<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
							<Spinner size="md" />
						</div>
					)}
					{templates.state === "error" && <ErrorNotice locale={locale} error={templates.error} />}
					{templates.state === "loaded" && templates.value.length === 0 && (
						<div className="muted">{t(locale, "common.empty")}</div>
					)}
					{templates.state === "loaded" && templates.value.length > 0 && (
						<table className="table">
							<thead>
								<tr>
									<th>{t(locale, "common.name")}</th>
									<th>版本</th>
									<th>发布</th>
									<th>更新时间</th>
								</tr>
							</thead>
							<tbody>
								{templates.value.map((row, idx) => (
									<tr key={`${toIdString(row.id)}-${idx}`}>
										<td>{row.name || "未命名模板"}</td>
										<td>{row.versionNo ?? 1}</td>
										<td>{row.published ? "yes" : "no"}</td>
										<td>{formatTime(row.updatedAt)}</td>
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
						title="生成任务"
						action={runs.state === "loaded" ? <Badge>{runs.value.length}</Badge> : null}
					/>
					<CardBody>
						{runs.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{runs.state === "error" && <ErrorNotice locale={locale} error={runs.error} />}
						{runs.state === "loaded" && runs.value.length === 0 && (
							<div className="muted">{t(locale, "common.empty")}</div>
						)}
						{runs.state === "loaded" && runs.value.length > 0 && (
							<table className="table">
								<thead>
									<tr>
										<th>ID</th>
										<th>来源</th>
										<th>状态</th>
										<th>{t(locale, "common.actions")}</th>
									</tr>
								</thead>
								<tbody>
									{runs.value.map((row, idx) => {
										const id = toIdString(row.id);
										return (
											<tr key={`${id}-${idx}`}>
												<td>{id || "-"}</td>
												<td>{`${row.sourceType || "-"}:${row.sourceId || "-"}`}</td>
												<td>
													<Badge variant={statusVariant(row.status)} size="sm">
														{row.status || "-"}
													</Badge>
												</td>
												<td>
													<div style={{ display: "flex", gap: "var(--spacing-xs)", flexWrap: "wrap" }}>
														<Button size="sm" variant="tertiary" onClick={() => void openRunDetail(row.id)}>
															详情
														</Button>
														<a
															href={analyticsApi.getReportRunExportUrl(row.id || "", "html")}
															target="_blank"
															rel="noreferrer"
															className="link"
														>
															HTML
														</a>
														<a
															href={analyticsApi.getReportRunExportUrl(row.id || "", "markdown")}
															target="_blank"
															rel="noreferrer"
															className="link"
														>
															MD
														</a>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="任务详情" />
					<CardBody>
						{selectedRun == null && <div className="muted">点击左侧"详情"查看任务信息。</div>}
						{selectedRun?.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{selectedRun?.state === "error" && <ErrorNotice locale={locale} error={selectedRun.error} />}
						{selectedRun?.state === "loaded" && <RunDetailView run={selectedRun.value} />}
					</CardBody>
				</Card>
			</div>
		</PageContainer>
	);
}
