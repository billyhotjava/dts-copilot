export type AnalysisDraftSurface = 'dashboard' | 'reportFactory' | 'screen'

export const ANALYSIS_DRAFT_QUERY_KEY = 'analysisDraft'

export function buildAnalysisDraftCreationFlowPath(surface: AnalysisDraftSurface, draftId: string | number): string {
	const params = new URLSearchParams({ [ANALYSIS_DRAFT_QUERY_KEY]: String(draftId) })
	switch (surface) {
		case 'dashboard':
			return `/dashboards/new?${params.toString()}`
		case 'reportFactory':
			return `/report-factory?${params.toString()}`
		case 'screen':
			return `/screens?${params.toString()}`
		default:
			return `/questions/new?draft=${encodeURIComponent(String(draftId))}`
	}
}

export function readSelectedAnalysisDraft(search: string): string | null {
	const params = new URLSearchParams(search)
	const value = String(params.get(ANALYSIS_DRAFT_QUERY_KEY) ?? '').trim()
	return value || null
}
