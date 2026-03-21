import type { AnalysisDraftDetail, DashboardCard } from '../api/analyticsApi'

export function resolveAnalysisDraftDashboardSeedCardId(
	draft: Pick<AnalysisDraftDetail, 'linked_card_id'> | null | undefined,
	existingDashcards: Array<Pick<DashboardCard, 'card_id'>>,
): number | null {
	const linkedCardId = Number(draft?.linked_card_id ?? 0)
	if (!Number.isFinite(linkedCardId) || linkedCardId <= 0) {
		return null
	}
	if (existingDashcards.some((item) => Number(item.card_id ?? 0) === linkedCardId)) {
		return null
	}
	return linkedCardId
}

export function resolveAnalysisDraftReportSource(
	draft: Pick<AnalysisDraftDetail, 'session_id' | 'title' | 'question'> | null | undefined,
): { sourceType: 'session'; sourceId: string; label: string } | null {
	const rawSessionId = String(draft?.session_id ?? '').trim()
	if (!/^\d+$/.test(rawSessionId)) {
		return null
	}
	return {
		sourceType: 'session',
		sourceId: rawSessionId,
		label: '分析草稿会话',
	}
}

export function buildAnalysisDraftScreenPrompt(
	draft: Pick<AnalysisDraftDetail, 'title' | 'question' | 'explanation_text' | 'suggested_display'> | null | undefined,
): string {
	const title = String(draft?.title ?? '').trim()
	const question = String(draft?.question ?? '').trim()
	const explanation = String(draft?.explanation_text ?? '').trim()
	const suggestedDisplay = String(draft?.suggested_display ?? '').trim()
	const subject = title || question || '当前分析草稿'
	const displayHint = suggestedDisplay ? `优先使用 ${suggestedDisplay} 图表样式。` : ''
	const explanationHint = explanation ? `分析说明：${explanation}。` : ''
	return `基于分析草稿“${subject}”生成一张业务大屏，包含核心指标、趋势图和明细列表，适合运营查看。${explanationHint}${displayHint}`.trim()
}
