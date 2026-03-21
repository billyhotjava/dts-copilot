export type FixedReportCatalogItem = {
	id?: number | string
	name?: string
	description?: string | null
	templateCode?: string
	domain?: string | null
	category?: string | null
	dataSourceType?: string | null
	targetObject?: string | null
	refreshPolicy?: string | null
	certificationStatus?: string | null
	published?: boolean
	archived?: boolean
	updatedAt?: string | null
	parameterSchemaJson?: string | null
	placeholderReviewRequired?: boolean
	legacyPageTitle?: string | null
	legacyPagePath?: string | null
}

export type FixedReportDomainTab = {
	id: string
	label: string
	count: number
}

export type FixedReportParameterOption = {
	label: string
	value: string
}

export type FixedReportParameterField = {
	key: string
	label: string
	type: "text" | "number" | "date" | "month" | "daterange" | "select" | "textarea"
	required: boolean
	options: FixedReportParameterOption[]
	placeholder?: string
	defaultValue?: string
}

export type FixedReportExecuteActionState = {
	label: string
	disabled: boolean
}

export type FixedReportTemplateAvailability = {
	badgeLabel: string
	badgeVariant: "success" | "warning"
	canRun: boolean
}

type FixedReportFieldType = FixedReportParameterField["type"]
type FixedReportDomainLabels = {
	allLabel?: string
	uncategorizedLabel?: string
}
type FixedReportRunActionLabels = {
	idleLabel?: string
	runningLabel?: string
	placeholderLabel?: string
}
type FixedReportAvailabilityLabels = {
	backedLabel?: string
	placeholderLabel?: string
}

const DOMAIN_PRIORITY = new Map([
	["财务", 0],
	["采购", 1],
	["仓库", 2],
	["报花", 3],
	["任务", 4],
	["项目点", 5],
	["运营", 6],
])

function normalizeText(value: string | null | undefined): string {
	return String(value ?? "").trim()
}

function normalizeKey(value: string | null | undefined): string {
	return normalizeText(value).toLowerCase()
}

function isCertifiedTemplate(item: FixedReportCatalogItem): boolean {
	if (item.archived === true) {
		return false
	}
	if (item.published === false) {
		return false
	}
	const status = normalizeKey(item.certificationStatus)
	return !status || status === "certified"
}

function sortTemplates(rows: FixedReportCatalogItem[]): FixedReportCatalogItem[] {
	return [...rows].sort((left, right) => {
		const leftTime = normalizeText(left.updatedAt)
		const rightTime = normalizeText(right.updatedAt)
		if (leftTime !== rightTime) {
			return rightTime.localeCompare(leftTime)
		}
		return normalizeText(left.templateCode).localeCompare(normalizeText(right.templateCode))
	})
}

function compareBusinessPriority(left: FixedReportCatalogItem, right: FixedReportCatalogItem): number {
	const leftDomain = normalizeText(left.domain)
	const rightDomain = normalizeText(right.domain)
	const leftPriority = DOMAIN_PRIORITY.get(leftDomain) ?? 99
	const rightPriority = DOMAIN_PRIORITY.get(rightDomain) ?? 99
	if (leftPriority !== rightPriority) {
		return leftPriority - rightPriority
	}
	const leftTime = normalizeText(left.updatedAt)
	const rightTime = normalizeText(right.updatedAt)
	if (leftTime !== rightTime) {
		return rightTime.localeCompare(leftTime)
	}
	return normalizeText(left.templateCode).localeCompare(normalizeText(right.templateCode))
}

function matchesDomain(row: FixedReportCatalogItem, domain: string): boolean {
	if (!domain || domain === "all") {
		return true
	}
	return normalizeText(row.domain) === normalizeText(domain)
}

export function isPlaceholderFixedReport(item?: FixedReportCatalogItem | null): boolean {
	return Boolean(item?.placeholderReviewRequired)
}

export function buildFixedReportLegacyPageHref(path?: string | null): string | null {
	const normalizedPath = normalizeText(path)
	if (!normalizedPath) {
		return null
	}
	const routePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
	return `https://app.xycyl.com/#${routePath}`
}

export function getFixedReportTemplateAvailability(
	item?: FixedReportCatalogItem | null,
	labels: FixedReportAvailabilityLabels = {},
): FixedReportTemplateAvailability {
	if (isPlaceholderFixedReport(item)) {
		return {
			badgeLabel: normalizeText(labels.placeholderLabel) || "待补数据面",
			badgeVariant: "warning",
			canRun: false,
		}
	}
	return {
		badgeLabel: normalizeText(labels.backedLabel) || "已接通",
		badgeVariant: "success",
		canRun: true,
	}
}

function parseParameterOptions(options: unknown): FixedReportParameterOption[] {
	if (!Array.isArray(options)) {
		return []
	}
	return options
		.map((item) => {
			if (!item || typeof item !== "object") {
				return null
			}
			const entry = item as Record<string, unknown>
			const label = normalizeText(entry.label as string | undefined)
			const value = normalizeText(entry.value as string | undefined)
			if (!label && !value) {
				return null
			}
			return {
				label: label || value,
				value: value || label,
			}
		})
		.filter((item): item is FixedReportParameterOption => item !== null)
}

function parseParameterSchema(parameterSchemaJson?: string | null): Record<string, unknown>[] {
	const raw = normalizeText(parameterSchemaJson)
	if (!raw) {
		return []
	}
	try {
		const parsed = JSON.parse(raw)
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return []
		}
		const params = (parsed as Record<string, unknown>).params
		if (!Array.isArray(params)) {
			return []
		}
		return params.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
	} catch {
		return []
	}
}

function normalizeFieldType(typeRaw: string): FixedReportFieldType {
	switch (typeRaw) {
		case "date":
			return "date"
		case "month":
			return "month"
		case "select":
		case "enum":
			return "select"
		case "textarea":
		case "text-area":
		case "text_area":
			return "textarea"
		case "daterange":
		case "date-range":
		case "date_range":
			return "daterange"
		case "number":
		case "int":
		case "integer":
		case "long":
		case "float":
		case "double":
		case "decimal":
			return "number"
		default:
			return "text"
	}
}

function normalizeDefaultValue(value: unknown): string | undefined {
	if (value == null) {
		return undefined
	}
	const normalized = normalizeText(String(value))
	return normalized || undefined
}

function fallbackFieldsForTemplate(template?: FixedReportCatalogItem): FixedReportParameterField[] {
	const domain = normalizeText(template?.domain)
	const category = normalizeKey(template?.category)
	const targetObject = normalizeKey(template?.targetObject)

	if (domain === "财务" || domain.toLowerCase().includes("finance")) {
		if (category === "detail" || targetObject.includes("receivable") || targetObject.includes("payable")) {
			return [
				{
					key: "asOfDate",
					label: "统计日期",
					type: "date",
					required: true,
					options: [],
				},
				{
					key: "projectId",
					label: "项目",
					type: "text",
					required: false,
					options: [],
				},
				{
					key: "customerId",
					label: "客户",
					type: "text",
					required: false,
					options: [],
				},
			]
		}
		return [
			{
				key: "asOfDate",
				label: "统计日期",
				type: "date",
				required: true,
				options: [],
			},
		]
	}

	if (domain === "采购" || domain.toLowerCase().includes("procurement")) {
		return [
			{
				key: "asOfDate",
				label: "统计日期",
				type: "date",
				required: true,
				options: [],
			},
			{
				key: "supplierId",
				label: "供应商",
				type: "text",
				required: false,
				options: [],
			},
			{
				key: "warehouseId",
				label: "仓库",
				type: "text",
				required: false,
				options: [],
			},
		]
	}

	if (domain === "仓库" || domain.toLowerCase().includes("warehouse") || domain.toLowerCase().includes("inventory")) {
		return [
			{
				key: "asOfDate",
				label: "统计日期",
				type: "date",
				required: true,
				options: [],
			},
			{
				key: "warehouseId",
				label: "仓库",
				type: "text",
				required: false,
				options: [],
			},
			{
				key: "sku",
				label: "物料编码",
				type: "text",
				required: false,
				options: [],
			},
		]
	}

	return [
		{
			key: "asOfDate",
			label: "统计日期",
			type: "date",
			required: true,
			options: [],
		},
	]
}

export function buildFixedReportDomainTabs(
	rows: FixedReportCatalogItem[],
	labels: FixedReportDomainLabels = {},
): FixedReportDomainTab[] {
	const certifiedRows = rows.filter(isCertifiedTemplate)
	const counts = new Map<string, number>()
	const uncategorizedLabel = normalizeText(labels.uncategorizedLabel) || "未分类"
	for (const row of certifiedRows) {
		const domain = normalizeText(row.domain) || uncategorizedLabel
		counts.set(domain, (counts.get(domain) ?? 0) + 1)
	}

	const orderedDomains = Array.from(counts.keys()).sort((left, right) => {
		const leftPriority = DOMAIN_PRIORITY.get(left) ?? 99
		const rightPriority = DOMAIN_PRIORITY.get(right) ?? 99
		if (leftPriority !== rightPriority) {
			return leftPriority - rightPriority
		}
		return left.localeCompare(right, "zh-CN")
	})

	return [
		{ id: "all", label: normalizeText(labels.allLabel) || "全部", count: certifiedRows.length },
		...orderedDomains.map((domain) => ({
			id: domain,
			label: domain,
			count: counts.get(domain) ?? 0,
		})),
	]
}

export function filterFixedReportTemplates(rows: FixedReportCatalogItem[], domain: string): FixedReportCatalogItem[] {
	return sortTemplates(
		rows.filter(isCertifiedTemplate).filter((row) => matchesDomain(row, domain)),
	)
}

export function buildFixedReportQuickStartItems(
	rows: FixedReportCatalogItem[],
	limit = 6,
): FixedReportCatalogItem[] {
	return [...rows]
		.filter(isCertifiedTemplate)
		.sort(compareBusinessPriority)
		.slice(0, Math.max(0, limit))
}

export function buildFixedReportParameterFields(
	parameterSchemaJson?: string | null,
	template?: FixedReportCatalogItem,
): FixedReportParameterField[] {
	const params = parseParameterSchema(parameterSchemaJson)
	if (params.length === 0) {
		return fallbackFieldsForTemplate(template)
	}

	return params
		.map<FixedReportParameterField>((param, index) => {
			const key = normalizeText(param.name as string | undefined) || `param${index + 1}`
			const label = normalizeText(param.label as string | undefined) || key
			const type = normalizeFieldType(normalizeKey(param.type as string | undefined))
			return {
				key,
				label,
				type,
				required: Boolean(param.required),
				placeholder: normalizeText(param.placeholder as string | undefined) || undefined,
				defaultValue: normalizeDefaultValue(
					(param as Record<string, unknown>).defaultValue ?? (param as Record<string, unknown>).default,
				),
				options: type === "select" ? parseParameterOptions(param.options) : [],
			}
		})
		.filter((item) => Boolean(item.key))
}

export function buildFixedReportInitialParameterValues(fields: FixedReportParameterField[]): Record<string, string> {
	return fields.reduce<Record<string, string>>((acc, field) => {
		acc[field.key] = field.defaultValue ?? ""
		return acc
	}, {})
}

export function getFixedReportRunActionState(
	running: boolean,
	placeholderReviewRequired = false,
	labels: FixedReportRunActionLabels = {},
): FixedReportExecuteActionState {
	if (placeholderReviewRequired) {
		return {
			label: normalizeText(labels.placeholderLabel) || "待补数据面",
			disabled: true,
		}
	}
	return running
		? { label: normalizeText(labels.runningLabel) || "执行中…", disabled: true }
		: { label: normalizeText(labels.idleLabel) || "执行报表", disabled: false }
}
