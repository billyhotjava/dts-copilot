const ANALYSIS_DRAFT_QUERY_KEY = 'analysisDraft'
const FIXED_REPORT_TEMPLATE_QUERY_KEY = 'fixedReportTemplate'
export const SOURCE_CARD_QUERY_KEY = 'sourceCard'

export type AnalysisAssetProvenanceContext = {
	analysisDraftId?: string | number | null
	fixedReportTemplate?: string | null
	sourceCardId?: string | number | null
}

function appendIfPresent(params: URLSearchParams, key: string, value: string | number | null | undefined) {
	const normalized = String(value ?? '').trim()
	if (normalized) {
		params.set(key, normalized)
	}
}

export function buildAnalysisAssetProvenanceSearch(context: AnalysisAssetProvenanceContext): string {
	const params = new URLSearchParams()
	appendIfPresent(params, ANALYSIS_DRAFT_QUERY_KEY, context.analysisDraftId)
	appendIfPresent(params, FIXED_REPORT_TEMPLATE_QUERY_KEY, context.fixedReportTemplate)
	appendIfPresent(params, SOURCE_CARD_QUERY_KEY, context.sourceCardId)
	const serialized = params.toString()
	return serialized ? `?${serialized}` : ''
}

export function appendAnalysisAssetProvenance(path: string, context: AnalysisAssetProvenanceContext): string {
	const [pathname, search = ''] = path.split('?', 2)
	const params = new URLSearchParams(search)
	appendIfPresent(params, ANALYSIS_DRAFT_QUERY_KEY, context.analysisDraftId)
	appendIfPresent(params, FIXED_REPORT_TEMPLATE_QUERY_KEY, context.fixedReportTemplate)
	appendIfPresent(params, SOURCE_CARD_QUERY_KEY, context.sourceCardId)
	const serialized = params.toString()
	return serialized ? `${pathname}?${serialized}` : pathname
}

export function readSelectedSourceCard(search: string): string | null {
	const params = new URLSearchParams(search)
	const value = String(params.get(SOURCE_CARD_QUERY_KEY) ?? '').trim()
	return value || null
}
