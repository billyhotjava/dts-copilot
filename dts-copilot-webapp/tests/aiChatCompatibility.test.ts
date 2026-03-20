import test from 'node:test'
import assert from 'node:assert/strict'
import {
	normalizeLegacyAiChatResponse,
	normalizeLegacyAiChatSession,
	normalizeLegacyAiChatSessionDetail,
	resolveCopilotUserIdFromSharedStores,
} from '../src/api/aiChatCompatibility.ts'

test('resolves copilot user id from shared user stores', () => {
	const store = JSON.stringify({
		state: {
			userInfo: {
				username: 'zhangsan',
				email: 'zhangsan@example.com',
			},
		},
	})
	assert.equal(resolveCopilotUserIdFromSharedStores([null, store]), 'zhangsan')
	assert.equal(resolveCopilotUserIdFromSharedStores([null, '{"state":{"userInfo":{"email":"ops@example.com"}}}']), 'ops@example.com')
	assert.equal(resolveCopilotUserIdFromSharedStores([null, '{}']), 'standalone-user')
})

test('normalizes legacy AI session payloads to current webapp shape', () => {
	const normalized = normalizeLegacyAiChatSession({
		sessionId: 'sess-1',
		title: 'demo',
		status: 'ACTIVE',
		dataSourceId: 12,
		createdAt: '2026-03-14T12:00:00Z',
		updatedAt: '2026-03-14T12:30:00Z',
	})
	assert.deepEqual(normalized, {
		id: 'sess-1',
		title: 'demo',
		status: 'ACTIVE',
		lastActiveAt: '2026-03-14T12:30:00Z',
		createdAt: '2026-03-14T12:00:00Z',
		datasourceId: '12',
		schemaName: undefined,
	})
})

test('normalizes legacy AI chat detail and response payloads', () => {
	const detail = normalizeLegacyAiChatSessionDetail({
		sessionId: 'sess-2',
		title: 'trace',
		status: 'ACTIVE',
		dataSourceId: 9,
		createdAt: '2026-03-14T10:00:00Z',
		updatedAt: '2026-03-14T10:05:00Z',
		messages: [
			{ id: 1, role: 'user', content: 'hello', createdAt: '2026-03-14T10:00:01Z' },
			{
				id: 2,
				role: 'assistant',
				content: 'world',
				responseKind: 'BUSINESS_DIRECT_RESPONSE',
				createdAt: '2026-03-14T10:00:02Z',
			},
		],
	})
	assert.deepEqual(detail, {
		session: {
			id: 'sess-2',
			title: 'trace',
			status: 'ACTIVE',
			lastActiveAt: '2026-03-14T10:05:00Z',
			createdAt: '2026-03-14T10:00:00Z',
			datasourceId: '9',
			schemaName: undefined,
		},
		messages: [
			{ id: '1', sessionId: 'sess-2', role: 'user', content: 'hello', createdAt: '2026-03-14T10:00:01Z' },
			{
				id: '2',
				sessionId: 'sess-2',
				role: 'assistant',
				content: 'world',
				responseKind: 'BUSINESS_DIRECT_RESPONSE',
				createdAt: '2026-03-14T10:00:02Z',
			},
		],
		pendingAction: null,
	})

	const response = normalizeLegacyAiChatResponse({
		sessionId: 'sess-2',
		response: 'done',
	})
	assert.deepEqual(response, {
		sessionId: 'sess-2',
		agentMessage: 'done',
		toolCalls: [],
		requiresApproval: false,
		pendingAction: null,
	})
})
