import type {
	CopilotAssumption,
	CopilotAssumptionOption,
	CopilotClarification,
	CopilotClarificationOption,
	CopilotTrace,
	CopilotTraceFinanceAudit,
	CopilotTraceSource,
} from './types.ts'

type AnyObject = Record<string, unknown>

function asObject(value: unknown): AnyObject | null {
	return value && typeof value === 'object' ? (value as AnyObject) : null
}

function pickString(obj: AnyObject | null, keys: string[]): string {
	if (!obj) return ''
	for (const key of keys) {
		const value = obj[key]
		if (typeof value === 'string' && value.trim()) {
			return value.trim()
		}
	}
	return ''
}

export function resolveCopilotUserIdFromSharedStores(
	rawStores: Array<string | null | undefined>,
): string {
	for (const raw of rawStores) {
		if (!raw) continue
		try {
			const store = JSON.parse(raw)
			const state = asObject(asObject(store)?.state)
			const userInfo = asObject(state?.userInfo)
			const userId =
				pickString(userInfo, ['username', 'userName', 'email']) ||
				pickString(state, ['username', 'userName', 'email'])
			if (userId) {
				return userId
			}
		} catch {
			// Ignore malformed stores.
		}
	}
	return 'standalone-user'
}

function toStringId(value: unknown): string {
	if (typeof value === 'string' && value.trim()) return value.trim()
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	return ''
}

function pickFiniteNumber(obj: AnyObject | null, keys: string[]): number | undefined {
	if (!obj) return undefined
	for (const key of keys) {
		const value = obj[key]
		if (typeof value === 'number' && Number.isFinite(value)) {
			return value
		}
	}
	return undefined
}

function normalizeAssumptionOptions(value: unknown): CopilotAssumptionOption[] | undefined {
	if (!Array.isArray(value)) return undefined
	const options = value.flatMap((item) => {
		const row = asObject(item)
		if (!row) return []
		const optionValue = pickString(row, ['value'])
		const label = pickString(row, ['label'])
		if (!optionValue || !label) return []
		return [{ value: optionValue, label }]
	})
	return options.length > 0 ? options : undefined
}

function normalizeAssumptions(value: unknown): CopilotAssumption[] | undefined {
	if (!Array.isArray(value)) return undefined
	const assumptions = value.flatMap((item) => {
		const row = asObject(item)
		if (!row) return []
		const key = pickString(row, ['key'])
		const label = pickString(row, ['label'])
		const assumptionValue = pickString(row, ['value'])
		if (!key || !label || !assumptionValue) return []
		return [
			{
				key,
				label,
				value: assumptionValue,
				...(typeof row.editable === 'boolean' ? { editable: row.editable } : {}),
				...(pickString(row, ['sourceHint'])
					? { sourceHint: pickString(row, ['sourceHint']) }
					: {}),
				...(normalizeAssumptionOptions(row.options)
					? { options: normalizeAssumptionOptions(row.options) }
					: {}),
			},
		]
	})
	return assumptions.length > 0 ? assumptions : undefined
}

function normalizeClarificationOptions(value: unknown): CopilotClarificationOption[] | undefined {
	if (!Array.isArray(value)) return undefined
	const options = value.flatMap((item) => {
		const row = asObject(item)
		if (!row) return []
		const optionValue = pickString(row, ['value'])
		const label = pickString(row, ['label'])
		if (!optionValue || !label) return []
		return [{ value: optionValue, label }]
	})
	return options.length > 0 ? options : undefined
}

function normalizeClarifications(value: unknown): CopilotClarification[] | undefined {
	if (!Array.isArray(value)) return undefined
	const clarifications = value.flatMap((item) => {
		const row = asObject(item)
		if (!row) return []
		const key = pickString(row, ['key'])
		const question = pickString(row, ['question'])
		const options = normalizeClarificationOptions(row.options)
		if (!key || !question || !options) return []
		return [{ key, question, options }]
	})
	return clarifications.length > 0 ? clarifications : undefined
}

function normalizeTraceSources(value: unknown): CopilotTraceSource[] | undefined {
	if (!Array.isArray(value)) return undefined
	const sources = value.flatMap((item) => {
		const row = asObject(item)
		if (!row) return []
		const table = pickString(row, ['table'])
		if (!table) return []
		const rawFields = Array.isArray(row.fields) ? row.fields : []
		const fields = rawFields
			.map((field) => (typeof field === 'string' ? field.trim() : ''))
			.filter(Boolean)
		return [
			{
				table,
				...(fields.length > 0 ? { fields } : {}),
				...(pickString(row, ['role']) ? { role: pickString(row, ['role']) } : {}),
			},
		]
	})
	return sources.length > 0 ? sources : undefined
}

function normalizeStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) return undefined
	const values = value
		.map((item) => (typeof item === 'string' ? item.trim() : ''))
		.filter(Boolean)
	return values.length > 0 ? values : undefined
}

function normalizeFinanceAudit(value: unknown): CopilotTraceFinanceAudit | undefined {
	const row = asObject(value)
	if (!row) return undefined
	const oracleStatusRow = asObject(row.oracleStatus)
	const oracleStatus = oracleStatusRow
		? {
				...(pickString(oracleStatusRow, ['bindingId'])
					? { bindingId: pickString(oracleStatusRow, ['bindingId']) }
					: {}),
				...(pickString(oracleStatusRow, ['reportName'])
					? { reportName: pickString(oracleStatusRow, ['reportName']) }
					: {}),
				...(pickString(oracleStatusRow, ['oracleLevel'])
					? { oracleLevel: pickString(oracleStatusRow, ['oracleLevel']) }
					: {}),
				...(pickString(oracleStatusRow, ['chain'])
					? { chain: pickString(oracleStatusRow, ['chain']) }
					: {}),
				...(typeof oracleStatusRow.covered === 'boolean' ? { covered: oracleStatusRow.covered } : {}),
				...(pickString(oracleStatusRow, ['healthStatus'])
					? { healthStatus: pickString(oracleStatusRow, ['healthStatus']) }
					: {}),
				...(typeof oracleStatusRow.maxDifference === 'number' || typeof oracleStatusRow.maxDifference === 'string'
					? { maxDifference: oracleStatusRow.maxDifference }
					: {}),
				...(pickString(oracleStatusRow, ['failureMessage'])
					? { failureMessage: pickString(oracleStatusRow, ['failureMessage']) }
					: {}),
			}
		: undefined
	const appliedRules = Array.isArray(row.appliedRules)
		? row.appliedRules.flatMap((item) => {
				const rule = asObject(item)
				const ruleId = rule ? pickString(rule, ['ruleId']) : undefined
				if (!rule || !ruleId) return []
				return [{
					ruleId,
					...(pickString(rule, ['description']) ? { description: pickString(rule, ['description']) } : {}),
					...(pickString(rule, ['severity']) ? { severity: pickString(rule, ['severity']) } : {}),
					...(pickString(rule, ['guardrailText']) ? { guardrailText: pickString(rule, ['guardrailText']) } : {}),
					...(normalizeStringArray(rule.appliesTo) ? { appliesTo: normalizeStringArray(rule.appliesTo) } : {}),
				}]
			})
		: undefined
	const appliedInvariants = Array.isArray(row.appliedInvariants)
		? row.appliedInvariants.flatMap((item) => {
				const invariant = asObject(item)
				const invariantId = invariant ? pickString(invariant, ['invariantId']) : undefined
				if (!invariant || !invariantId) return []
				return [{
					invariantId,
					...(pickString(invariant, ['statement']) ? { statement: pickString(invariant, ['statement']) } : {}),
					...(pickString(invariant, ['severity']) ? { severity: pickString(invariant, ['severity']) } : {}),
					...(normalizeStringArray(invariant.sourceRuleIds) ? { sourceRuleIds: normalizeStringArray(invariant.sourceRuleIds) } : {}),
					...(normalizeStringArray(invariant.sourceRefs) ? { sourceRefs: normalizeStringArray(invariant.sourceRefs) } : {}),
				}]
			})
		: undefined
	const lineage = Array.isArray(row.lineage)
		? row.lineage.flatMap((item) => {
				const node = asObject(item)
				const name = node ? pickString(node, ['name']) : undefined
				if (!node || !name) return []
				return [{
					name,
					...(pickString(node, ['level']) ? { level: pickString(node, ['level']) } : {}),
					...(pickString(node, ['role']) ? { role: pickString(node, ['role']) } : {}),
					...(normalizeStringArray(node.refs) ? { refs: normalizeStringArray(node.refs) } : {}),
				}]
			})
		: undefined
	const financeAudit: CopilotTraceFinanceAudit = {
		...(oracleStatus && Object.keys(oracleStatus).length > 0 ? { oracleStatus } : {}),
		...(appliedRules && appliedRules.length > 0 ? { appliedRules } : {}),
		...(appliedInvariants && appliedInvariants.length > 0 ? { appliedInvariants } : {}),
		...(lineage && lineage.length > 0 ? { lineage } : {}),
	}
	return Object.keys(financeAudit).length > 0 ? financeAudit : undefined
}

function normalizeTrace(value: unknown): CopilotTrace | undefined {
	const row = asObject(value)
	if (!row) return undefined
	const metricCaliberRow = asObject(row.metricCaliber)
	const metricCaliber = metricCaliberRow
		? {
				...(pickString(metricCaliberRow, ['name'])
					? { name: pickString(metricCaliberRow, ['name']) }
					: {}),
				...(pickString(metricCaliberRow, ['formula'])
					? { formula: pickString(metricCaliberRow, ['formula']) }
					: {}),
				...(pickString(metricCaliberRow, ['domain'])
					? { domain: pickString(metricCaliberRow, ['domain']) }
					: {}),
				...(pickString(metricCaliberRow, ['version'])
					? { version: pickString(metricCaliberRow, ['version']) }
					: {}),
				...(pickString(metricCaliberRow, ['ontologyRef'])
					? { ontologyRef: pickString(metricCaliberRow, ['ontologyRef']) }
					: {}),
			}
		: undefined
	const sources = normalizeTraceSources(row.sources)
	const sql = pickString(row, ['sql'])
	const financeAudit = normalizeFinanceAudit(row.financeAudit)
	const trace: CopilotTrace = {
		...(metricCaliber && Object.keys(metricCaliber).length > 0
			? { metricCaliber }
			: {}),
		...(sources ? { sources } : {}),
		...(sql ? { sql } : {}),
		...(financeAudit ? { financeAudit } : {}),
	}
	return Object.keys(trace).length > 0 ? trace : undefined
}

export function normalizeLegacyAiChatSession(payload: unknown) {
	const row = asObject(payload) ?? {}
	return {
		id: toStringId(row.sessionId || row.id),
		title: pickString(row, ['title']) || undefined,
		status: pickString(row, ['status']) || undefined,
		lastActiveAt: pickString(row, ['updatedAt', 'lastActiveAt']) || undefined,
		createdAt: pickString(row, ['createdAt']) || undefined,
		datasourceId: toStringId(row.dataSourceId) || undefined,
		schemaName: pickString(row, ['schemaName']) || undefined,
	}
}

export function normalizeLegacyAiChatSessionDetail(payload: unknown) {
	const row = asObject(payload) ?? {}
	const session = normalizeLegacyAiChatSession(row)
	const sessionId = session.id
	const rawMessages = Array.isArray(row.messages) ? row.messages : []
	const messages = rawMessages.map((item) => {
		const message = asObject(item) ?? {}
		const normalized: {
			id: string
			sessionId: string
			role: string
			content?: string
			reasoningContent?: string
			responseKind?: string
			generatedSql?: string
			routedDomain?: string
			targetView?: string
			templateCode?: string
			dataSurface?: string
			qualityLevel?: string
			qualityNotes?: string
			suggestedDisplay?: string
			reportCode?: string
			sourceRefs?: string
			assumptions?: CopilotAssumption[]
			confidence?: number
			clarifications?: CopilotClarification[]
			trace?: CopilotTrace
			createdAt?: string
		} = {
			id: toStringId(message.id),
			sessionId,
			role: pickString(message, ['role']) || 'assistant',
		}
		const content = pickString(message, ['content'])
		const reasoningContent = pickString(message, ['reasoningContent'])
		const responseKind = pickString(message, ['responseKind'])
		const generatedSql = pickString(message, ['generatedSql'])
		const routedDomain = pickString(message, ['routedDomain'])
		const targetView = pickString(message, ['targetView'])
		const templateCode = pickString(message, ['templateCode'])
		const dataSurface = pickString(message, ['dataSurface'])
		const qualityLevel = pickString(message, ['qualityLevel'])
		const qualityNotes = pickString(message, ['qualityNotes'])
		const suggestedDisplay = pickString(message, ['suggestedDisplay'])
		const reportCode = pickString(message, ['reportCode'])
		const sourceRefs = pickString(message, ['sourceRefs'])
		const assumptions = normalizeAssumptions(message.assumptions)
		const confidence = pickFiniteNumber(message, ['confidence'])
		const clarifications = normalizeClarifications(message.clarifications)
		const trace = normalizeTrace(message.trace)
		const createdAt = pickString(message, ['createdAt'])
		if (content) normalized.content = content
		if (reasoningContent) normalized.reasoningContent = reasoningContent
		if (responseKind) normalized.responseKind = responseKind
		if (generatedSql) normalized.generatedSql = generatedSql
		if (routedDomain) normalized.routedDomain = routedDomain
		if (targetView) normalized.targetView = targetView
		if (templateCode) normalized.templateCode = templateCode
		if (dataSurface) normalized.dataSurface = dataSurface
		if (qualityLevel) normalized.qualityLevel = qualityLevel
		if (qualityNotes) normalized.qualityNotes = qualityNotes
		if (suggestedDisplay) normalized.suggestedDisplay = suggestedDisplay
		if (reportCode) normalized.reportCode = reportCode
		if (sourceRefs) normalized.sourceRefs = sourceRefs
		if (assumptions) normalized.assumptions = assumptions
		if (confidence !== undefined) normalized.confidence = confidence
		if (clarifications) normalized.clarifications = clarifications
		if (trace) normalized.trace = trace
		if (createdAt) normalized.createdAt = createdAt
		return normalized
	})
	return {
		session,
		messages,
		pendingAction: null,
	}
}

export function normalizeLegacyAiChatResponse(payload: unknown) {
	const row = asObject(payload) ?? {}
	const generatedSql = pickString(row, ['generatedSql'])
	const responseKind = pickString(row, ['responseKind'])
	const routedDomain = pickString(row, ['routedDomain'])
	const targetView = pickString(row, ['targetView'])
	const templateCode = pickString(row, ['templateCode'])
	const dataSurface = pickString(row, ['dataSurface'])
	const qualityLevel = pickString(row, ['qualityLevel'])
	const qualityNotes = pickString(row, ['qualityNotes'])
	const suggestedDisplay = pickString(row, ['suggestedDisplay'])
	const reportCode = pickString(row, ['reportCode'])
	const sourceRefs = pickString(row, ['sourceRefs'])
	const assumptions = normalizeAssumptions(row.assumptions)
	const confidence = pickFiniteNumber(row, ['confidence'])
	const clarifications = normalizeClarifications(row.clarifications)
	const trace = normalizeTrace(row.trace)
	return {
		sessionId: toStringId(row.sessionId || row.id),
		agentMessage: pickString(row, ['response', 'content', 'message']),
		toolCalls: [],
		requiresApproval: false,
		pendingAction: null,
		...(generatedSql ? { generatedSql } : {}),
		...(responseKind ? { responseKind } : {}),
		...(routedDomain ? { routedDomain } : {}),
		...(targetView ? { targetView } : {}),
		...(templateCode ? { templateCode } : {}),
		...(dataSurface ? { dataSurface } : {}),
		...(qualityLevel ? { qualityLevel } : {}),
		...(qualityNotes ? { qualityNotes } : {}),
		...(suggestedDisplay ? { suggestedDisplay } : {}),
		...(reportCode ? { reportCode } : {}),
		...(sourceRefs ? { sourceRefs } : {}),
		...(assumptions ? { assumptions } : {}),
		...(confidence !== undefined ? { confidence } : {}),
		...(clarifications ? { clarifications } : {}),
		...(trace ? { trace } : {}),
	}
}
