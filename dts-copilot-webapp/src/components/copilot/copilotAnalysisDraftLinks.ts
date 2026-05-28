import type {
	AiAgentChatMessage,
	AnalysisDraftListItem,
} from "../../api/analyticsApi";

export function attachAnalysisDraftLinksToMessages(
	messages: AiAgentChatMessage[],
	drafts: AnalysisDraftListItem[],
): AiAgentChatMessage[] {
	if (!messages.length || !drafts.length) {
		return messages;
	}
	const draftBySessionSql = buildDraftLookup(drafts);
	return messages.map((message) => {
		if (message.role !== "assistant" || message.responseKind !== "REPORT_DRAFT") {
			return message;
		}
		const key = buildSessionSqlKey(message.sessionId, message.generatedSql);
		if (!key) {
			return message;
		}
		const draft = draftBySessionSql.get(key);
		if (!draft) {
			return message;
		}
		return {
			...message,
			analysisDraftId: message.analysisDraftId ?? draft.id,
			analysisDraftStatus: message.analysisDraftStatus ?? "saved",
			suggestedDisplay: message.suggestedDisplay ?? draft.suggested_display ?? undefined,
			dataSurface: message.dataSurface ?? draft.data_surface ?? undefined,
			qualityLevel: message.qualityLevel ?? draft.quality_level ?? undefined,
			qualityNotes: message.qualityNotes ?? draft.quality_notes ?? undefined,
			reportCode: message.reportCode ?? draft.report_code ?? undefined,
		};
	});
}

function buildDraftLookup(drafts: AnalysisDraftListItem[]): Map<string, AnalysisDraftListItem> {
	const lookup = new Map<string, AnalysisDraftListItem>();
	for (const draft of [...drafts].sort(compareDraftsByUpdatedAtDesc)) {
		const key = buildSessionSqlKey(draft.session_id, draft.sql_text);
		if (key && !lookup.has(key)) {
			lookup.set(key, draft);
		}
	}
	return lookup;
}

function buildSessionSqlKey(
	sessionId?: string | null,
	sql?: string | null,
): string | null {
	const normalizedSession = String(sessionId ?? "").trim();
	const normalizedSql = normalizeSql(sql);
	if (!normalizedSession || !normalizedSql) {
		return null;
	}
	return `${normalizedSession}::${normalizedSql}`;
}

function normalizeSql(sql?: string | null): string {
	return String(sql ?? "")
		.trim()
		.replace(/\s+/g, " ")
		.toLowerCase();
}

function compareDraftsByUpdatedAtDesc(
	left: AnalysisDraftListItem,
	right: AnalysisDraftListItem,
): number {
	return parseDate(right.updated_at) - parseDate(left.updated_at);
}

function parseDate(value?: string): number {
	const timestamp = value ? Date.parse(value) : 0;
	return Number.isFinite(timestamp) ? timestamp : 0;
}
