import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { analyticsApi, type FixedReportCatalogItem, type FixedReportRunResponse } from "../../api/analyticsApi"
import { ErrorNotice } from "../../components/ErrorNotice"
import { EmptyState } from "../../components/EmptyState"
import { PageContainer, PageHeader } from "../../components/PageContainer/PageContainer"
import {
	buildFixedReportLegacyPageHref,
	buildFixedReportInitialParameterValues,
	buildFixedReportParameterFields,
	getFixedReportTemplateAvailability,
	getFixedReportRunActionState,
} from "./fixedReportCatalogModel"
import { getEffectiveLocale, t, type Locale } from "../../i18n"
import { Badge } from "../../ui/Badge/Badge"
import { Button } from "../../ui/Button/Button"
import { Card, CardBody } from "../../ui/Card/Card"
import { Input, TextArea } from "../../ui/Input/Input"
import { NativeSelect } from "../../ui/Input/Select"
import { Spinner } from "../../ui/Loading/Spinner"

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown }

export default function FixedReportRunPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), [])
	const { templateCode = "" } = useParams()
	const [templateState, setTemplateState] = useState<LoadState<FixedReportCatalogItem>>({ state: "loading" })
	const [runState, setRunState] = useState<LoadState<FixedReportRunResponse> | null>(null)
	const [formValues, setFormValues] = useState<Record<string, string>>({})
	const [running, setRunning] = useState(false)

	useEffect(() => {
		if (!templateCode.trim()) {
			setTemplateState({ state: "error", error: new Error("Missing template code") })
			return
		}
		analyticsApi
			.getFixedReportCatalogItem(templateCode)
			.then((template) => {
				setTemplateState({ state: "loaded", value: template })
			})
			.catch((error) => {
				setTemplateState({ state: "error", error })
			})
	}, [templateCode])

	const template = templateState.state === "loaded"
		? templateState.value
		: undefined
	const legacyPageHref = buildFixedReportLegacyPageHref(template?.legacyPagePath)
	const fields = buildFixedReportParameterFields(template?.parameterSchemaJson, template)
	const availability = getFixedReportTemplateAvailability(template, {
		backedLabel: t(locale, "fixedReports.backed"),
		placeholderLabel: t(locale, "fixedReports.placeholder"),
	})
	const actionState = getFixedReportRunActionState(
		running,
		template?.placeholderReviewRequired === true,
		{
			idleLabel: t(locale, "fixedReports.runAction"),
			runningLabel: t(locale, "fixedReports.runActionRunning"),
			placeholderLabel: t(locale, "fixedReports.placeholder"),
		},
	)

	const previewColumns = runState?.state === "loaded"
		? (runState.value.resultPreview?.columns ?? [])
		: []
	const previewRows = runState?.state === "loaded"
		? (runState.value.resultPreview?.rows ?? [])
		: []
	const previewRowCount = runState?.state === "loaded"
		? (runState.value.resultPreview?.rowCount ?? previewRows.length)
		: 0

	useEffect(() => {
		setFormValues(buildFixedReportInitialParameterValues(fields))
	}, [fields])

	async function handleRun() {
		if (!templateCode || running) {
			return
		}
		setRunning(true)
		setRunState(null)
		try {
			const parameters = Object.fromEntries(
				Object.entries(formValues).filter(([, value]) => value.trim().length > 0),
			)
			const response = await analyticsApi.runFixedReport(template?.templateCode ?? templateCode, { parameters })
			setRunState({ state: "loaded", value: response })
		} catch (error) {
			setRunState({ state: "error", error })
		} finally {
			setRunning(false)
		}
	}

	return (
		<PageContainer>
			<PageHeader
				title={template?.name ?? t(locale, "fixedReports.runTitle")}
				subtitle={template?.description ?? t(locale, "fixedReports.runSubtitle")}
				actions={
					<Link to="/fixed-reports">
						<Button variant="secondary">{t(locale, "fixedReports.back")}</Button>
					</Link>
				}
			/>

			{templateState.state === "loading" && (
				<Card>
					<CardBody>
						<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}>
							<Spinner size="lg" />
						</div>
					</CardBody>
				</Card>
			)}

			{templateState.state === "error" && <ErrorNotice locale={locale} error={templateState.error} />}

			{templateState.state === "loaded" && !template && (
				<EmptyState title={t(locale, "fixedReports.notFound")} description={t(locale, "fixedReports.notFoundDesc")} />
			)}

			{templateState.state === "loaded" && template && (
				<div
					className="col"
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "var(--spacing-lg)",
						alignItems: "stretch",
					}}
				>
					<Card>
						<CardBody>
							<div style={{ display: "flex", gap: "var(--spacing-xs)", flexWrap: "wrap", marginBottom: "var(--spacing-md)" }}>
								<Badge variant="default" size="sm">{template.domain ?? "-"}</Badge>
								<Badge variant="default" size="sm">{template.category ?? "-"}</Badge>
								<Badge variant="default" size="sm">{template.refreshPolicy ?? "-"}</Badge>
								<Badge variant={availability.badgeVariant} size="sm">{availability.badgeLabel}</Badge>
							</div>

							{template.placeholderReviewRequired === true && (
								<div
									style={{
										marginBottom: "var(--spacing-md)",
										padding: "var(--spacing-md)",
										borderRadius: "var(--radius-md)",
										border: "1px solid color-mix(in srgb, var(--color-warning-500) 40%, transparent)",
										background: "color-mix(in srgb, var(--color-warning-500) 8%, white)",
										color: "var(--color-text-primary)",
										fontSize: "var(--font-size-sm)",
									}}
								>
									{t(locale, "fixedReports.placeholderNotice")}
								</div>
							)}

							{legacyPageHref && (
								<div
									style={{
										marginBottom: "var(--spacing-md)",
										padding: "var(--spacing-md)",
										borderRadius: "var(--radius-md)",
										border: "1px solid var(--color-border)",
										background: "var(--color-surface-subtle, #f8fafc)",
										fontSize: "var(--font-size-sm)",
									}}
								>
									<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>
										{t(locale, "fixedReports.legacyPage")}
									</div>
									<a href={legacyPageHref} target="_blank" rel="noreferrer">
										{t(locale, "fixedReports.openLegacyPage")}
										{template?.legacyPageTitle ? `：${template.legacyPageTitle}` : ""}
									</a>
								</div>
							)}

							{fields.length === 0 ? (
								<div className="text-muted">{t(locale, "fixedReports.noParameters")}</div>
							) : (
								<div className="col" style={{ gap: "var(--spacing-md)" }}>
									{fields.map((field) =>
										field.type === "select" ? (
											<NativeSelect
												key={field.key}
												label={field.label}
												value={formValues[field.key] ?? ""}
												options={field.options.map((option) => ({
													label: option.label,
													value: String(option.value),
												}))}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										) : field.type === "textarea" ? (
											<TextArea
												key={field.key}
												label={field.label}
												required={field.required}
												value={formValues[field.key] ?? ""}
												placeholder={field.placeholder}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										) : (
											<Input
												key={field.key}
												label={field.label}
												required={field.required}
												type={
													field.type === "date"
														? "date"
														: field.type === "month"
															? "month"
															: field.type === "number"
																? "number"
																: "text"
												}
												value={formValues[field.key] ?? ""}
												placeholder={
													field.placeholder
													?? (field.type === "daterange" ? t(locale, "fixedReports.dateRangePlaceholder") : undefined)
												}
												helperText={field.type === "daterange" ? t(locale, "fixedReports.dateRangeHelp") : undefined}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										),
									)}
								</div>
							)}

							<div style={{ marginTop: "var(--spacing-lg)", display: "flex", justifyContent: "flex-end" }}>
								<Button variant="primary" disabled={actionState.disabled} onClick={handleRun}>
									{actionState.label}
								</Button>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--spacing-md)" }}>
								{t(locale, "fixedReports.resultTitle")}
							</div>

							{runState == null && (
								<div className="text-muted">
									{template.placeholderReviewRequired === true
										? t(locale, "fixedReports.resultPlaceholderBacking")
										: t(locale, "fixedReports.resultPlaceholder")}
								</div>
							)}
							{runState?.state === "error" && <ErrorNotice locale={locale} error={runState.error} />}
							{runState?.state === "loaded" && (
								<div className="col" style={{ gap: "var(--spacing-sm)" }}>
									{/* 执行状态摘要 - 只显示关键信息 */}
									<div style={{ display: "flex", gap: "var(--spacing-md)", alignItems: "center", flexWrap: "wrap" }}>
										<Badge variant={runState.value.executionStatus === "COMPLETED" ? "success" : "default"} size="sm">
											{runState.value.executionStatus === "COMPLETED" ? "执行成功" : (runState.value.executionStatus ?? "-")}
										</Badge>
										{runState.value.resultPreview?.databaseName && (
											<span className="small muted">数据源: {runState.value.resultPreview.databaseName}</span>
										)}
										<span className="small muted">共 {previewRowCount} 条记录</span>
									</div>

									{runState.value.resultPreview && (
										<div style={{ marginTop: "var(--spacing-sm)" }}>
											{previewColumns.length === 0 || previewRows.length === 0 ? (
												<div className="text-muted">{t(locale, "fixedReports.previewEmpty")}</div>
											) : (
												<div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
													<table
														style={{
															width: "100%",
															borderCollapse: "collapse",
															fontSize: "var(--font-size-sm)",
														}}
													>
														<thead>
															<tr>
																{previewColumns.map((column) => (
																	<th
																		key={column.key ?? column.label ?? "column"}
																		style={{
																			textAlign: "left",
																			padding: "10px 12px",
																			borderBottom: "2px solid var(--color-border)",
																			background: "var(--color-bg-secondary, #f5f7fa)",
																			color: "var(--color-text-secondary)",
																			fontWeight: 600,
																			fontSize: "12px",
																			whiteSpace: "nowrap",
																		}}
																	>
																		{translateColumnLabel(column.label ?? column.key ?? "-")}
																	</th>
																))}
															</tr>
														</thead>
														<tbody>
															{previewRows.map((row, rowIndex) => (
																<tr
																	key={`preview-row-${rowIndex}`}
																	style={{
																		background: rowIndex % 2 === 0 ? "transparent" : "var(--color-bg-secondary, #fafbfc)",
																	}}
																>
																	{previewColumns.map((column) => (
																		<td
																			key={`${rowIndex}-${column.key ?? column.label ?? "column"}`}
																			style={{
																				padding: "8px 12px",
																				borderBottom: "1px solid color-mix(in srgb, var(--color-border) 40%, transparent)",
																				verticalAlign: "top",
																				fontSize: "13px",
																			}}
																		>
																			{formatCellValue(row[column.key ?? ""])}
																		</td>
																	))}
																</tr>
															))}
														</tbody>
													</table>
												</div>
											)}
										</div>
									)}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}
		</PageContainer>
	)
}

/** 列名英文→中文映射 */
const COLUMN_LABEL_MAP: Record<string, string> = {
	// 库存相关
	STOREHOUSENAME: "所属库房",
	GOODNAME: "物品名称",
	GOODSPECS: "规格",
	GOODNORMS: "花盆",
	GOODNUMBER: "库存数量",
	OUTCOST: "成本价",
	SALEPRICE: "售价",
	GOODUNIT: "单位",
	GOODTYPE: "物品类型",
	STOREHOUSE_TYPE: "库房类型",
	// 项目相关
	PROJECT_NAME: "项目名称",
	PROJECT_CODE: "项目编号",
	CUSTOMER_NAME: "客户名称",
	CONTRACT_TITLE: "合同名称",
	MANAGER_NAME: "项目经理",
	BIZ_USER_NAME: "业务经理",
	POSITION_NAME: "摆位名称",
	POSITION_FULL_NAME: "摆位全称",
	// 绿植相关
	GREEN_NAME: "绿植名称",
	GOOD_NAME: "物品名称",
	GOOD_NORMS: "规格",
	GOOD_SPECS: "花盆",
	GOOD_NUMBER: "数量",
	RENT: "月租金",
	COST: "成本",
	POSE_TIME: "摆放时间",
	// 报花业务
	BIZ_CODE: "业务单号",
	BIZ_TYPE_NAME: "业务类型",
	BIZ_STATUS_NAME: "业务状态",
	APPLY_USER_NAME: "发起人",
	APPLY_TIME: "发起时间",
	FINISH_TIME: "完成时间",
	PLANT_NUMBER: "数量",
	BIZ_TOTAL_RENT: "总租金",
	BIZ_TOTAL_COST: "总成本",
	// 结算
	SETTLEMENT_MONTH: "结算月份",
	TOTAL_RENT: "应收租金",
	RECEIVED_AMOUNT: "已收金额",
	OUTSTANDING_AMOUNT: "未收金额",
	// 任务
	TASK_CODE: "任务编号",
	TASK_TITLE: "任务标题",
	TASK_TYPE_NAME: "任务类型",
	TASK_STATUS_NAME: "任务状态",
	// 养护
	CURING_USER_NAME: "养护人",
	CURING_TIME: "养护时间",
	CURING_COUNT: "养护次数",
	// 通用
	ID: "编号",
	NAME: "名称",
	CODE: "编号",
	STATUS: "状态",
	CREATE_TIME: "创建时间",
	UPDATE_TIME: "更新时间",
	REMARK: "备注",
}

function translateColumnLabel(raw: string): string {
	const upper = raw.toUpperCase()
	return COLUMN_LABEL_MAP[upper] ?? COLUMN_LABEL_MAP[raw] ?? raw
}

function formatCellValue(value: unknown): string {
	if (value == null) return "-"
	if (typeof value === "number") return value.toLocaleString("zh-CN")
	const str = String(value)
	if (str === "" || str === "null" || str === "undefined") return "-"
	return str
}
