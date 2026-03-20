import test from 'node:test'
import assert from 'node:assert/strict'

type AiAgentChatSessionDetail = {
	session?: {
		id: string
		title?: string
	}
	messages?: Array<{
		role: string
		content?: string
		responseKind?: string
	}>
}

async function loadShouldRestorePersistedCopilotSession(): Promise<
	(detail: AiAgentChatSessionDetail | null | undefined) => boolean
> {
	try {
		const mod = await import('../src/components/copilot/copilotSessionBootstrap.ts')
		return mod.shouldRestorePersistedCopilotSession
	} catch {
		return () => true
	}
}

test('does not restore stale greeting business direct response session', async () => {
	const shouldRestorePersistedCopilotSession =
		await loadShouldRestorePersistedCopilotSession()

	const detail: AiAgentChatSessionDetail = {
		session: {
			id: 'sess-hi',
			title: 'hi',
		},
		messages: [
			{ role: 'user', content: 'hi' },
			{
				role: 'assistant',
				content: '当前已沉淀的业务分析范围包括：项目履约、现场运营、经营分析。',
				responseKind: 'BUSINESS_DIRECT_RESPONSE',
			},
		],
	}

	assert.equal(shouldRestorePersistedCopilotSession(detail), false)
})

test('keeps normal greeting guidance session restorable', async () => {
	const shouldRestorePersistedCopilotSession =
		await loadShouldRestorePersistedCopilotSession()

	const detail: AiAgentChatSessionDetail = {
		session: {
			id: 'sess-hello',
			title: '你好',
		},
		messages: [
			{ role: 'user', content: '你好' },
			{
				role: 'assistant',
				content:
					'你好，我可以帮你查询园林项目的业务数据。\n你可以直接问具体问题，比如：\n1. 本月加花最多的项目是哪个？\n2. 哪些项目的养护任务还没完成？\n3. 当前在服项目一共有多少个？',
			},
		],
	}

	assert.equal(shouldRestorePersistedCopilotSession(detail), true)
})

test('keeps non-greeting clarification sessions restorable', async () => {
	const shouldRestorePersistedCopilotSession =
		await loadShouldRestorePersistedCopilotSession()

	const detail: AiAgentChatSessionDetail = {
		session: {
			id: 'sess-biz',
			title: '帮我做个统计',
		},
		messages: [
			{ role: 'user', content: '帮我做个统计' },
			{
				role: 'assistant',
				content: '请确认统计口径',
				responseKind: 'BUSINESS_CLARIFICATION',
			},
		],
	}

	assert.equal(shouldRestorePersistedCopilotSession(detail), true)
})
