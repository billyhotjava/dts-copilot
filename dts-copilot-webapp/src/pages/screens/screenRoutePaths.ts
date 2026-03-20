type RouteValue = string | number | boolean | null | undefined

function encodePathId(value: string | number): string {
	return encodeURIComponent(String(value))
}

function buildQueryString(query?: Record<string, RouteValue>): string {
	if (!query) {
		return ''
	}
	const params = new URLSearchParams()
	for (const [key, value] of Object.entries(query)) {
		if (value == null) {
			continue
		}
		const text = String(value).trim()
		if (text.length === 0) {
			continue
		}
		params.set(key, text)
	}
	const qs = params.toString()
	return qs ? `?${qs}` : ''
}

export function buildScreenPreviewPath(
	id: string | number,
	query?: { device?: string | null },
): string {
	return `/screens/${encodePathId(id)}/preview${buildQueryString(query)}`
}

export function buildScreenExportPath(
	id: string | number,
	query?: Record<string, RouteValue>,
): string {
	return `/screens/${encodePathId(id)}/export${buildQueryString(query)}`
}

export function buildPublicScreenPath(uuid: string): string {
	return `/public/screen/${encodeURIComponent(String(uuid))}`
}

export function buildAbsoluteScreenAppUrl(origin: string, path: string): string {
	const base = String(origin || '').replace(/\/$/, '')
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	return `${base}${normalizedPath}`
}

function rewriteLegacyPathname(pathname: string): string {
	if (pathname.startsWith('/analytics/screens/')) {
		return pathname.replace('/analytics/screens/', '/screens/')
	}
	if (pathname.startsWith('/analytics/public/screen/')) {
		return pathname.replace('/analytics/public/screen/', '/public/screen/')
	}
	return pathname
}

export function normalizeLegacyScreenAppPath(rawPath: string): string {
	const trimmed = String(rawPath || '').trim()
	if (trimmed.length === 0) {
		return ''
	}

	if (/^https?:\/\//i.test(trimmed)) {
		const url = new URL(trimmed)
		url.pathname = rewriteLegacyPathname(url.pathname)
		return `${url.pathname}${url.search}${url.hash}`
	}

	const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
	return rewriteLegacyPathname(withLeadingSlash)
}
