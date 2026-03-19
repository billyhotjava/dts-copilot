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
		return {
			id: toStringId(message.id),
			sessionId,
			role: pickString(message, ['role']) || 'assistant',
			content: pickString(message, ['content']) || undefined,
			generatedSql: pickString(message, ['generatedSql']) || undefined,
			routedDomain: pickString(message, ['routedDomain']) || undefined,
			targetView: pickString(message, ['targetView']) || undefined,
			templateCode: pickString(message, ['templateCode']) || undefined,
			createdAt: pickString(message, ['createdAt']) || undefined,
		}
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
