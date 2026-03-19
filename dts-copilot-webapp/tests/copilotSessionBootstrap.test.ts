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

test('does not restore stale greeting clarification session', async () => {
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
				content:
					'您的问题可能涉及以下方面，请确认：\n1. 项目和客户信息\n2. 报花业务（加花/换花/减花）\n3. 租金和结算\n4. 任务进度\n5. 养护情况\n6. 初摆进度',
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
				content:
					'您的问题可能涉及以下方面，请确认：\n1. 项目和客户信息\n2. 报花业务（加花/换花/减花）\n3. 租金和结算\n4. 任务进度\n5. 养护情况\n6. 初摆进度',
			},
		],
	}

	assert.equal(shouldRestorePersistedCopilotSession(detail), true)
})
