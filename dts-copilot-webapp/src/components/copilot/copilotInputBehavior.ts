export function shouldSubmitCopilotInputOnEnter(args: {
	key: string
	shiftKey?: boolean
	isComposing?: boolean
	keyCode?: number
}): boolean {
	if (args.key !== 'Enter') return false
	if (args.shiftKey) return false
	if (args.isComposing) return false
	if (args.keyCode === 229) return false
	return true
}
