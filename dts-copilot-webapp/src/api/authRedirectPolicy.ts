function normalizePathname(url: string): string {
	const raw = String(url ?? '').trim()
	if (!raw) return ''

	try {
		if (/^https?:\/\//i.test(raw)) {
			return new URL(raw).pathname
		}
		if (raw.startsWith('//')) {
			return new URL(`http:${raw}`).pathname
		}
	} catch {
		// Fall through to string normalization.
	}

	const noOrigin = raw.replace(/^[a-z]+:\/\/[^/]+/i, '')
	const withLeadingSlash = noOrigin.startsWith('/') ? noOrigin : `/${noOrigin.replace(/^\.\//, '')}`
	return withLeadingSlash.split('?')[0]?.split('#')[0] ?? withLeadingSlash
}

export function isCopilotAiRoute(url: string): boolean {
	const pathname = normalizePathname(url)
	return pathname.startsWith('/api/ai/')
}

export function shouldRedirectToLoginOnUnauthorized(url: string): boolean {
	const pathname = normalizePathname(url)
	if (!pathname) return true

	// AI Copilot APIs are authenticated separately from analytics session-cookie login.
	// Their 401s should surface inline instead of forcing the whole analytics app back to /auth/login.
	if (isCopilotAiRoute(url)) {
		return false
	}

	return true
}
