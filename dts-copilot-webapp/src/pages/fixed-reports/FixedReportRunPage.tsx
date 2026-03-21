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
	const fields = useMemo(
		() => buildFixedReportParameterFields(template?.parameterSchemaJson, template),
		[template],
	)
	const initialFormValues = useMemo(
		() => buildFixedReportInitialParameterValues(fields),
		[fields],
	)
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
		setFormValues(initialFormValues)
	}, [initialFormValues])

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

/**
 * 列名英文→中文映射
 * 覆盖所有 16 个固定报表模板可能查询到的字段
 */
const COLUMN_LABEL_MAP: Record<string, string> = {
	// ========== 库存/仓库 (WH-*) ==========
	STOREHOUSENAME: "所属库房",
	STOREHOUSE_NAME: "库房名称",
	STOREHOUSE_TYPE: "库房类型",
	STOREHOUSE_INFO_ID: "库房ID",
	GOODNAME: "物品名称",
	GOODSPECS: "规格",
	GOODNORMS: "花盆",
	GOODNUMBER: "库存数量",
	GOODUNIT: "单位",
	GOODTYPE: "物品类型",
	OUTCOST: "成本价",
	OUT_COST: "成本价",
	SALEPRICE: "售价",
	SALE_PRICE: "售价",
	STOCK_INFO_ID: "库存ID",
	IN_STOCK_TIME: "入库时间",
	OUT_STOCK_TIME: "出库时间",

	// ========== 项目/合同/客户 ==========
	PROJECT_ID: "项目ID",
	PROJECT_NAME: "项目名称",
	PROJECT_CODE: "项目编号",
	PROJECT_STATUS_NAME: "项目状态",
	PROJECT_TYPE_NAME: "项目类型",
	CONTRACT_ID: "合同ID",
	CONTRACT_TITLE: "合同名称",
	CONTRACT_CODE: "合同编号",
	CONTRACT_STATUS_NAME: "合同状态",
	CONTRACT_START_DATE: "合同开始日期",
	CONTRACT_END_DATE: "合同到期日期",
	CUSTOMER_ID: "客户ID",
	CUSTOMER_NAME: "客户名称",
	CUSTOMER_CODE: "客户编号",
	COMPANY_NAME: "公司名称",
	ABBREVIATION: "简称",

	// ========== 人员 ==========
	MANAGER_NAME: "项目经理",
	MANAGER_ID: "项目经理ID",
	BIZ_USER_NAME: "业务经理",
	BIZ_USER_ID: "业务经理ID",
	SUPERVISOR_NAME: "监理",
	SUPERVISOR_ID: "监理ID",
	CURING_USER_NAME: "养护人",
	CURING_USER_ID: "养护人ID",
	CURING_DIRECTOR_NAME: "养护主管",
	APPLY_USER_NAME: "发起人",
	APPLY_USE_NAME: "发起人",
	APPLY_USE_ID: "发起人ID",
	LAUNCH_USER_NAME: "发起人",
	LEADING_USER_NAME: "负责人",
	PROJECT_MANAGE_NAME: "项目经理",
	PROJECT_MANAGE_USER_NAME: "项目经理",
	BIZ_MANAGE_NAME: "业务经理",
	SUPERVISE_USER_NAME: "监管人",
	EXAMINE_USER_NAME: "审核人",
	REVIEW_USER_NAME: "复核人",
	BUSINESS_PERSONNEL_NAME: "业务员",
	DELIVERY_USER_NAME: "配送人",
	RECEIVE_USER_NAME: "接收人",
	TAKE_GOODS_USER_NAME: "提货人",
	UPDATE_USER_NAME: "更新人",

	// ========== 摆位/楼层 ==========
	POSITION_ID: "摆位ID",
	POSITION_NAME: "摆位名称",
	POSITION_FULL_NAME: "摆位全称",
	FLOOR_NUMBER_NAME: "楼栋",
	FLOOR_LAYER_NAME: "楼层",
	REGION: "区域",

	// ========== 绿植 ==========
	GREEN_NAME: "绿植名称",
	GREEN_TYPE: "绿植类型",
	GREEN_TYPE_NAME: "绿植类型",
	GREEN_COUNT: "绿植数量",
	GOOD_NAME: "物品名称",
	GOOD_NORMS: "规格",
	GOOD_SPECS: "花盆",
	GOOD_UNIT: "单位",
	GOOD_TYPE: "物品类型",
	GOOD_NUMBER: "数量",
	GOOD_PRICE_ID: "价格ID",
	POSE_TIME: "摆放时间",
	RENT: "月租金",
	COST: "成本",
	RENT_MODE: "租赁方式",
	LAST_COST: "最近成本",

	// ========== 报花业务 ==========
	BIZ_ID: "业务ID",
	BIZ_CODE: "业务单号",
	BIZ_TYPE: "业务类型码",
	BIZ_TYPE_NAME: "业务类型",
	BIZ_STATUS_NAME: "业务状态",
	APPLY_TIME: "发起时间",
	FINISH_TIME: "完成时间",
	PLAN_FINISH_TIME: "计划完成时间",
	PLANT_NUMBER: "植物数量",
	PLANT_TYPE: "植物类型",
	BIZ_TOTAL_RENT: "业务总租金",
	BIZ_TOTAL_COST: "业务总成本",
	BEAR_COST_TYPE_NAME: "费用承担方",
	IS_URGENT: "是否紧急",
	URGENT: "是否紧急",
	RENT_UPDATE_TYPE: "租金变更类型",
	RENT_DISCOUNT_RATIO: "租金折扣率",
	LABOR_COST: "人工费",
	CLEANING_FEE: "清洁费",
	TOTAL_EXTRA_COST: "额外成本",
	TOTAL_EXTRA_PRICE: "额外费用",
	FARE: "运费",
	PRINT_STATUS: "打印状态",
	ACCOUNTING_STATUS: "核算状态",
	CUT_CONFIRM_STATUS: "减花确认状态",
	BATCH_CODE: "批次号",

	// ========== 结算/财务 (FIN-*) ==========
	SETTLEMENT_MONTH: "结算月份",
	SETTLEMENT_YEAR: "结算年份",
	YEAR_AND_MONTH: "年月",
	SETTLEMENT_TYPE_NAME: "结算方式",
	SETTLEMENT_STATUS_NAME: "结算状态",
	TOTAL_RENT: "应收租金",
	REGULAR_RENT: "常规租金",
	RECEIVED_AMOUNT: "已收金额",
	NET_RECEIPT_TOTAL_AMOUNT: "净收总额",
	OUTSTANDING_AMOUNT: "未收金额",
	RECEIVABLE_TOTAL_AMOUNT: "应收总额",
	FOLDING_AFTER_TOTAL_AMOUNT: "折后总额",
	DISCOUNT_RATE: "折扣率",
	DISCOUNT_RATIO: "折扣率",
	MONTH_SETTLEMENT_MONEY: "固定月租金",
	PERIOD_TOTAL_AMOUNT: "期间总额",
	ADD_TOTAL_AMOUNT: "加花总额",
	CUT_TOTAL_AMOUNT: "减花总额",
	SALE_TOTAL_AMOUNT: "销售总额",
	TOTAL_DAY: "结算天数",
	TOTAL_AMOUNT: "总金额",
	AMOUNT_INCLUDING_TAX: "含税金额",
	AMOUNT_EXCLUDING_TAX: "不含税金额",
	TAX_RATE: "税率",
	INVOICE_TYPE: "发票类型",

	// ========== 收款 ==========
	PAY_TIME: "付款时间",
	PAY_AMONEY: "付款金额",
	PAY_MODE: "付款方式",
	PAYMENT_TYPE: "账户类型",
	INCOME_TYPE: "收入类型",
	WITH_INVOICE: "是否开票",
	COLLOECTION_NAME: "收款方",
	COLLOECTION_BANK_ACCOUNT: "收款账号",

	// ========== 预支 ==========
	ADVANCE_AMOUNT: "预支金额",
	OFFSET_AMOUNT: "冲抵金额",
	BALANCE_AMOUNT: "余额",

	// ========== 采购/配送 (PROC-*) ==========
	PURCHASE_NUMBER: "采购数量",
	PURCHASE_PRICE: "采购单价",
	REAL_PURCHASE_NUMBER: "实购数量",
	REAL_PURCHASE_PRICE: "实购单价",
	DISTRIBUTE_PURCHASE_NUMBER: "分配采购量",
	DISTRIBUTE_BASE_NUMBER: "分配基地量",
	EXWAREHOUSE_NUMBER: "出库数量",
	DELIVERY_TIME: "配送时间",
	DELIVERY_MODE: "配送方式",
	START_DELIVERY_TIME: "开始配送时间",
	RECEIVE_TIME: "接收时间",
	PLAN_PURCHASE_TIME: "计划采购时间",
	SUPPLY_NAME: "供应商",
	SUPPLY_COST: "采购成本",
	SOURCE_ADDRESS: "来源地址",

	// ========== 入库/出库 ==========
	WAREHOUSING_TYPE: "入库类型",
	EX_WAREHOUSE_TYPE: "出库类型",
	PRICE: "单价",

	// ========== 任务 ==========
	TASK_CODE: "任务编号",
	TASK_TITLE: "任务标题",
	TASK_TYPE: "任务类型码",
	TASK_TYPE_NAME: "任务类型",
	TASK_STATUS_NAME: "任务状态",
	LAUNCH_TIME: "发起时间",
	START_TIME: "开始时间",
	END_TIME: "结束时间",
	TOTAL_NUMBER: "总数",
	FINISH_NUMBER: "完成数",
	COMPLETION_RATE: "完成率",
	TOTAL_BUDGET: "预算",

	// ========== 养护/监管 ==========
	CURING_TIME: "养护时间",
	CURING_COUNT: "养护次数",
	CURING_MONTH: "养护月份",
	TOTAL_POSITION_COUNT: "摆位总数",
	TOTAL_POSITION_NUMBER: "摆位总数",
	COVERAGE_RATE: "覆盖率",
	SUPERVISE_TIME: "监管时间",
	ZLDF: "质量得分",
	HYDF: "黄叶得分",
	WSDF: "卫生得分",

	// ========== 初摆 ==========
	APPLICANT_NAME: "申请人",
	APPLICANT_DATE: "申请日期",
	TOTAL_BUDGET_COST: "预算金额",
	ACTUAL_COST: "实际花费",
	BALANCE_COST: "余额",
	YEAR_RENT: "年租金",
	PENDULUM_STATUS_NAME: "初摆状态",

	// ========== 通用 ==========
	ID: "编号",
	NAME: "名称",
	CODE: "编号",
	TITLE: "标题",
	STATUS: "状态",
	TYPE: "类型",
	ADDRESS: "地址",
	AREA: "面积",
	BUDGET_AMOUNT: "预算金额",
	CREATE_BY: "创建人",
	CREATE_TIME: "创建时间",
	UPDATE_BY: "更新人",
	UPDATE_TIME: "更新时间",
	REMARK: "备注",
	DEL_FLAG: "删除标记",
	SIGNING_TIME: "签约时间",
	START_DATE: "开始日期",
	END_DATE: "结束日期",
	DESCRIPTION: "说明",
	CATEGORY: "分类",
	SORT: "排序",
	TENANT_ID: "租户ID",

	// ========== 视图层翻译字段 ==========
	SETTLEMENT_TYPE: "结算方式",
	CHECK_CYCLE: "盘点周期",
	VERIFY_TYPE: "核实方式",
	POSITION_COUNT: "摆位数",
	MONTHLY_RECEIVABLE: "月应收",
	MONTHLY_RECEIVED: "月已收",
	MONTHLY_OUTSTANDING: "月未收",
	BIZ_MONTH: "业务月份",
	EVENT_DATE: "事件日期",
	EVENT_MONTH: "事件月份",
	EVENT_YEAR: "事件年份",
	SNAPSHOT_DATE: "快照日期",

	// ========== 无下划线拼接列名（Java 端返回的驼峰/拼接格式） ==========
	// 财务结算
	ACCOUNTPERIOD: "账期",
	PROJECTNAME: "项目名称",
	BIZTYPENAME: "业务类型",
	SUBJECTFULLNAME: "科目全称",
	SUBJECTNAME: "科目名称",
	FEENAME: "费用名称",
	FEENUMBER: "费用金额",
	FEEBELONGNAME: "费用归属",
	FEEBELONGTYPE: "费用归属类型",
	SETTLEHOLDERNAME: "结算方",
	SETTLEHOLDERID: "结算方ID",
	SETTLESTATUS: "结算状态",
	SETTLETYPE: "结算方式",
	SETTLETIME: "结算时间",
	SETTLEAMOUNT: "结算金额",
	SETTLEPERIOD: "结算周期",
	INVOICESTATUS: "开票状态",
	INVOICETYPE: "发票类型",
	INVOICEAMOUNT: "发票金额",
	COLLECTIONSTATUS: "收款状态",
	COLLECTIONAMOUNT: "收款金额",
	RECEIVABLEAMOUNT: "应收金额",
	RECEIPTAMOUNT: "已收金额",
	ARREARSAMOUNT: "欠款金额",
	DISCOUNTAMOUNT: "折后金额",
	CONTRACTNAME: "合同名称",
	CONTRACTCODE: "合同编号",
	CUSTOMERNAME: "客户名称",
	CUSTOMERCODE: "客户编号",
	// 新报表 SQL 别名
	PLANCODE: "采购计划编号",
	PLANNUMBER: "计划数量",
	PURCHASENUMBER: "采购数量",
	PLANPURCHASETIME: "计划采购时间",
	PURCHASEUSERNAME: "采购人",
	ITEMSTATUS: "明细状态",
	PLANSTATUS: "计划状态",
	WAREHOUSINGCODE: "入库单号",
	WAREHOUSINGTITLE: "入库标题",
	EXPENSECODE: "支出单号",
	EXPENSETITLE: "支出标题",
	DELIVERYCODE: "配送单号",
	DELIVERYMONTH: "配送月份",
	TOTALDELIVERIES: "总配送数",
	COMPLETEDDELIVERIES: "已完成配送",
	COMPLETIONRATE: "完成率",
	COLLECTIONRATE: "回款率",
	TOTALARREARS: "欠款总额",
	PROJECTCOUNT: "项目数",
	TOTALRECEIVABLE: "应收总额",
	TOTALRECEIPT: "已收总额",
	// 库存（无下划线补充，STOREHOUSENAME 等已在上面定义）
	GOODPRICE: "物品单价",
	GOODTOTALAMOUNT: "物品总价",
	PURCHASEPRICE: "采购价",
	STOCKNUMBER: "库存数",
	// 采购
	PURCHASEAMOUNT: "采购金额",
	SUPPLIERNAME: "供应商",
	DELIVERYTIME: "配送时间",
	DELIVERYUSERNAME: "配送人",
	RECEIVEUSERNAME: "接收人",
	RECEIVETIME: "接收时间",
	// 人员
	MANAGERNAME: "项目经理",
	BIZUSERNAME: "业务经理",
	CURINGUSERNAME: "养护人",
	APPLYUSERNAME: "发起人",
	LAUNCHUSERNAME: "发起人",
	LEADINGUSERNAME: "负责人",
	SUPERVISORUSERNAME: "监管人",
	EXAMINEUSERNAME: "审核人",
	REVIEWUSERNAME: "复核人",
	UPDATEUSERNAME: "更新人",
	// 项目/摆位
	PROJECTCODE: "项目编号",
	POSITIONNAME: "摆位名称",
	POSITIONFULLNAME: "摆位全称",
	FLOORNUMBERNAME: "楼栋",
	FLOORLAYERNAME: "楼层",
	// 业务
	BIZCODE: "业务单号",
	BIZSTATUSNAME: "业务状态",
	BIZTOTALRENT: "业务总租金",
	BIZTOTALCOST: "业务总成本",
	PLANTNUMBER: "植物数量",
	BEARCOSTTYPENAME: "费用承担方",
	APPLYTIME: "发起时间",
	FINISHTIME: "完成时间",
	CREATETIME: "创建时间",
	UPDATETIME: "更新时间",
	STARTTIME: "开始时间",
	ENDTIME: "结束时间",
	LAUNCHTIME: "发起时间",
	POSETIME: "摆放时间",
	SIGNINGTIME: "签约时间",
	// 结算
	SETTLEMENTMONTH: "结算月份",
	TOTALRENT: "应收租金",
	REGULARRENT: "常规租金",
	DISCOUNTRATE: "折扣率",
	TOTALDAY: "结算天数",
	TOTALAMOUNT: "总金额",
	YEARANDMONTH: "年月",
	NETRECEIPTTOTALAMOUNT: "净收总额",
	RECEIVABLETOTALAMOUNT: "应收总额",
	FOLDINGAFTERTOTALAMOUNT: "折后总额",
	PERIODTOTALAMOUNT: "期间总额",
	ADDTOTALAMOUNT: "加花总额",
	CUTTOTALAMOUNT: "减花总额",
	SALETOTALAMOUNT: "销售总额",
	MONTHSETTLEMENTMONEY: "固定月租金",
}

function translateColumnLabel(raw: string): string {
	// 1. 精确匹配（大写）
	const upper = raw.toUpperCase()
	const exact = COLUMN_LABEL_MAP[upper]
	if (exact) return exact

	// 2. 原始值匹配
	const direct = COLUMN_LABEL_MAP[raw]
	if (direct) return direct

	// 3. 尝试驼峰转下划线后匹配: projectName → PROJECT_NAME
	const underscored = raw.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()
	if (underscored !== upper) {
		const fromCamel = COLUMN_LABEL_MAP[underscored]
		if (fromCamel) return fromCamel
	}

	return raw
}

function formatCellValue(value: unknown): string {
	if (value == null) return "-"
	if (typeof value === "number") return value.toLocaleString("zh-CN")
	const str = String(value)
	if (str === "" || str === "null" || str === "undefined") return "-"
	return str
}
