export function canUseCopilot(accessToken: string | null | undefined): boolean {
	return typeof accessToken === 'string' && accessToken.trim().length > 0
}

export function resolveInitialCopilotExpanded(
	storedExpanded: boolean,
	accessToken: string | null | undefined,
): boolean {
	return canUseCopilot(accessToken) && storedExpanded
}
