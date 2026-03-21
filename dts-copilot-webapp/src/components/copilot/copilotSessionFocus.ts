export const COPILOT_SESSION_FOCUS_EVENT = 'dts-copilot:focus-session'

export type CopilotSessionFocusRequest = {
	sessionId: string
	messageId?: string
	notice: string
}

type BuildCopilotSessionFocusInput = {
	sessionId?: string | null
	messageId?: string | null
	question?: string | null
}

export function buildCopilotSessionReturnLabel(hasMessageId: boolean): string {
	return hasMessageId ? '返回 Copilot 对话' : '查看 Copilot 对话'
}

export function buildCopilotSessionFocusRequest(
	input: BuildCopilotSessionFocusInput,
): CopilotSessionFocusRequest | null {
	const sessionId = input.sessionId?.trim()
	if (!sessionId) return null
	const messageId = input.messageId?.trim() || undefined
	const question = input.question?.trim()
	return {
		sessionId,
		...(messageId ? { messageId } : {}),
		notice: question ? `已回到来源对话：${question}` : '已回到来源对话',
	}
}

export function requestCopilotSessionFocus(request: CopilotSessionFocusRequest): void {
	if (typeof window === 'undefined') return
	window.dispatchEvent(
		new CustomEvent<CopilotSessionFocusRequest>(COPILOT_SESSION_FOCUS_EVENT, {
			detail: request,
		}),
	)
}
