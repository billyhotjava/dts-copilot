export function appendReasoningDelta(current: string | undefined, delta: string): string {
	return `${current ?? ''}${delta}`
}

export function appendToolProgressLine(
	current: string | undefined,
	event: { tool: string; status: string },
): string {
	const line = `[工具] ${event.tool} · ${event.status}`
	if (!current || current.length === 0) {
		return line
	}
	return `${current}\n${line}`
}
