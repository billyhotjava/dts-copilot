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
		const createdAt = pickString(message, ['createdAt'])
		if (content) normalized.content = content
		if (reasoningContent) normalized.reasoningContent = reasoningContent
		if (responseKind) normalized.responseKind = responseKind
		if (generatedSql) normalized.generatedSql = generatedSql
		if (routedDomain) normalized.routedDomain = routedDomain
		if (targetView) normalized.targetView = targetView
		if (templateCode) normalized.templateCode = templateCode
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
	return {
		sessionId: toStringId(row.sessionId || row.id),
		agentMessage: pickString(row, ['response', 'content', 'message']),
		toolCalls: [],
		requiresApproval: false,
		pendingAction: null,
	}
}
