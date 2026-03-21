export type FixedReportSurface = 'dashboard' | 'reportFactory' | 'screen'

export const FIXED_REPORT_TEMPLATE_QUERY_KEY = 'fixedReportTemplate'

export function buildFixedReportRunPath(templateCode: string): string {
	return `/fixed-reports/${encodeURIComponent(templateCode)}/run`
}

export function buildFixedReportCreationFlowPath(surface: FixedReportSurface, templateCode: string): string {
	const params = new URLSearchParams({ [FIXED_REPORT_TEMPLATE_QUERY_KEY]: templateCode })
	switch (surface) {
		case 'dashboard':
			return `/dashboards/new?${params.toString()}`
		case 'reportFactory':
			return `/report-factory?${params.toString()}`
		case 'screen':
			return `/screens?${params.toString()}`
		default:
			return buildFixedReportRunPath(templateCode)
	}
}

export function readSelectedFixedReportTemplate(search: string): string | null {
	const params = new URLSearchParams(search)
	const value = String(params.get(FIXED_REPORT_TEMPLATE_QUERY_KEY) ?? '').trim()
	return value || null
}
