export type CopilotAnalysisDraftPayloadInput = {
	question: string
	sql: string
	databaseId: number
	explanationText?: string | null
	sessionId?: string | null
	messageId?: string | null
	suggestedDisplay?: string | null
	responseKind?: string | null
	dataSurface?: string | null
	qualityLevel?: string | null
	qualityNotes?: string[] | string | null
	reportCode?: string | null
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
		response_kind: input.responseKind ?? undefined,
		data_surface: input.dataSurface ?? undefined,
		quality_level: input.qualityLevel ?? undefined,
		quality_notes: input.qualityNotes ?? undefined,
		report_code: input.reportCode ?? undefined,
	}
}

export function buildCopilotDraftEditorHref(
	draftId: string | number,
	options?: { autorun?: boolean; focusVisualization?: boolean; display?: string },
): string {
	const params = new URLSearchParams({ draft: String(draftId) })
	if (options?.autorun) {
		params.set('autorun', '1')
	}
	if (options?.focusVisualization) {
		params.set('focus', 'visualization')
	}
	if (options?.display) {
		params.set('display', options.display)
	}
	return `/questions/new?${params.toString()}`
}
