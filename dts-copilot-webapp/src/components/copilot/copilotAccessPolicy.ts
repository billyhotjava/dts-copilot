export function canUseCopilot(
	accessToken: string | null | undefined,
	hasSessionAccess = false,
): boolean {
	return (typeof accessToken === 'string' && accessToken.trim().length > 0) || hasSessionAccess
}

export function resolveInitialCopilotExpanded(
	storedExpanded: boolean,
	accessToken: string | null | undefined,
	hasSessionAccess = false,
): boolean {
	return canUseCopilot(accessToken, hasSessionAccess) && storedExpanded
}
