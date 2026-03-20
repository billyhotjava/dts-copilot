import type { AiAgentChatSessionDetail } from '../../api/analyticsApi'

const GREETING_INPUTS = new Set([
	'hi',
	'hello',
	'hey',
	'hey there',
	'你好',
	'您好',
	'嗨',
	'哈喽',
	'在吗',
	'在不在',
])

function normalizeText(value: string | undefined): string {
	return value?.trim().toLowerCase() ?? ''
}

function isGreeting(value: string | undefined): boolean {
	const normalized = normalizeText(value)
	if (!normalized) return false
	if (GREETING_INPUTS.has(normalized)) return true
	return /^(hi|hello|hey)(\s+there)?[!?.]*$/.test(normalized)
		|| /^(你好|您好|嗨|哈喽|在吗|在不在)[！!。.?？]*$/.test(normalized)
}

export function shouldRestorePersistedCopilotSession(
	detail: AiAgentChatSessionDetail | null | undefined,
): boolean {
	if (!detail) return true

	const messages = Array.isArray(detail.messages) ? detail.messages : []
	if (messages.length === 0) return true

	const userMessages = messages.filter((message) => message.role === 'user')
	const assistantMessages = messages.filter((message) => message.role === 'assistant')
	if (userMessages.length === 0 || assistantMessages.length === 0) return true

	const hasNonGreetingUserMessage = userMessages.some(
		(message) => !isGreeting(message.content),
	)
	if (hasNonGreetingUserMessage) return true

	const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
	if (lastAssistantMessage?.responseKind !== 'BUSINESS_DIRECT_RESPONSE') {
		return true
	}

	const sessionTitle = detail.session?.title?.trim()
	return !isGreeting(sessionTitle)
}
