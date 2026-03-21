export type CopilotAnalysisDraftPayloadInput = {
	question: string
	sql: string
	databaseId: number
	explanationText?: string | null
	sessionId?: string | null
	messageId?: string | null
	suggestedDisplay?: string | null
}

export function buildCopilotAnalysisDraftPayload(input: CopilotAnalysisDraftPayloadInput) {
	return {
		title: input.question,
		source_type: 'copilot',
		session_id: input.sessionId ?? undefined,
		message_id: input.messageId ?? undefined,
		question: input.question,
		database_id: input.databaseId,
		sql_text: input.sql,
		explanation_text: input.explanationText ?? undefined,
		suggested_display: input.suggestedDisplay ?? 'table',
	}
}

export function buildCopilotDraftEditorHref(
	draftId: string | number,
	options?: { autorun?: boolean; focusVisualization?: boolean },
): string {
	const params = new URLSearchParams({ draft: String(draftId) })
	if (options?.autorun) {
		params.set('autorun', '1')
	}
	if (options?.focusVisualization) {
		params.set('focus', 'visualization')
	}
	return `/questions/new?${params.toString()}`
}
