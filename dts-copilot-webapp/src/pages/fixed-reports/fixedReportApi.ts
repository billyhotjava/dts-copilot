export function buildFixedReportCatalogUrl(params?: { domain?: string; category?: string; limit?: number }) {
	const search = new URLSearchParams()
	if (params?.domain?.trim()) {
		search.set("domain", params.domain.trim())
	}
	if (params?.category?.trim()) {
		search.set("category", params.category.trim())
	}
	search.set("limit", String(params?.limit ?? 100))
	return "/api/report-catalog?" + search.toString()
}

export function buildFixedReportCatalogItemUrl(templateCode: string) {
	return "/api/report-catalog/" + encodeURIComponent(templateCode)
}

export function buildFixedReportRunRequest(
	templateCode: string,
	parameters?: Record<string, unknown>,
) {
	return {
		url: "/api/fixed-reports/" + encodeURIComponent(templateCode) + "/run",
		body: {
			parameters: parameters ?? {},
		},
	}
}
