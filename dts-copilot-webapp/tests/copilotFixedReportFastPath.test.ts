import test from 'node:test'
import assert from 'node:assert/strict'
import {
	aiAgentChatSendStream,
	type AiAgentChatMessage,
} from '../src/api/analyticsApi.ts'
import {
	getFixedReportCandidates,
	shouldShowFixedReportShortcut,
} from '../src/components/copilot/copilotFixedReportMessage.ts'

test('stream done event carries fixed report metadata', async () => {
	const originalFetch = globalThis.fetch
	const events: unknown[] = []

	Object.defineProperty(globalThis, 'fetch', {
		value: async () =>
			new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(
							new TextEncoder().encode(
								[
									'event: session',
									'data: {"sessionId":"sess-1"}',
									'',
									'event: done',
									'data: {"templateCode":"PRS-FLOWERBIZ-OVERVIEW","responseKind":"FIXED_REPORT","routedDomain":"flowerbiz","targetView":"screen.prs-flowerbiz-overview-v1"}',
									'',
								].join('\n'),
							),
						)
						controller.close()
					},
				}),
				{
					status: 200,
					headers: { 'content-type': 'text/event-stream' },
				},
			),
		configurable: true,
	})

	try {
		await aiAgentChatSendStream(
			{ userMessage: '打开PRS租赁经营总览大屏', datasourceId: '7' },
			(event) => events.push(event),
		)
	} finally {
		Object.defineProperty(globalThis, 'fetch', {
			value: originalFetch,
			configurable: true,
		})
	}

	assert.deepEqual(events, [
		{ type: 'session', sessionId: 'sess-1' },
		{
			type: 'done',
			templateCode: 'PRS-FLOWERBIZ-OVERVIEW',
			responseKind: 'FIXED_REPORT',
			routedDomain: 'flowerbiz',
			targetView: 'screen.prs-flowerbiz-overview-v1',
		},
	])
})

test('fixed report shortcut only shows for fixed-report response messages', () => {
	const fixedReportMessage: AiAgentChatMessage = {
		id: 'msg-1',
		sessionId: 'sess-1',
		role: 'assistant',
		content: '已命中固定报表模板。',
		templateCode: 'PRS-FLOWERBIZ-OVERVIEW',
		responseKind: 'FIXED_REPORT',
	}
	const sqlTemplateMessage: AiAgentChatMessage = {
		id: 'msg-2',
		sessionId: 'sess-1',
		role: 'assistant',
		content: '```sql\\nselect 1\\n```',
		templateCode: 'TPL-FIN-001',
		responseKind: 'TEMPLATE_SQL',
	}

	assert.equal(shouldShowFixedReportShortcut(fixedReportMessage), true)
	assert.equal(shouldShowFixedReportShortcut(sqlTemplateMessage), false)
})

test('fixed report candidate response extracts page-aligned report links', () => {
	const candidateMessage: AiAgentChatMessage = {
		id: 'msg-3',
		sessionId: 'sess-1',
		role: 'assistant',
		responseKind: 'FIXED_REPORT_CANDIDATES',
		content: [
			'当前更适合先查看已沉淀的固定报表（flowerbiz），可以先试这几个：',
			'- PRS 租赁经营总览',
			'- PRS 租赁报花执行看板',
			'- PRS 销售坏账与费用看板',
			'',
			'如果这些都不符合，再继续进入探索式分析。',
		].join('\n'),
	}

	assert.deepEqual(getFixedReportCandidates(candidateMessage), [
			{
				label: 'PRS 租赁经营总览',
				templateCode: 'PRS-FLOWERBIZ-OVERVIEW',
				href: '/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW',
			},
			{
				label: 'PRS 租赁报花执行看板',
				templateCode: 'PRS-FLOWERBIZ-LEASE-EXECUTION',
				href: '/agent-bi?fixedReport=PRS-FLOWERBIZ-LEASE-EXECUTION',
			},
			{
				label: 'PRS 销售坏账与费用看板',
				templateCode: 'PRS-FLOWERBIZ-FINANCE-COST',
				href: '/agent-bi?fixedReport=PRS-FLOWERBIZ-FINANCE-COST',
			},
	])
})
