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
									'data: {"templateCode":"FIN-CUSTOMER-AR-RANK","responseKind":"FIXED_REPORT","routedDomain":"财务","targetView":"mart.finance.customer_ar_rank_daily"}',
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
			{ userMessage: '客户欠款排行', datasourceId: '7' },
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
			templateCode: 'FIN-CUSTOMER-AR-RANK',
			responseKind: 'FIXED_REPORT',
			routedDomain: '财务',
			targetView: 'mart.finance.customer_ar_rank_daily',
		},
	])
})

test('fixed report shortcut only shows for fixed-report response messages', () => {
	const fixedReportMessage: AiAgentChatMessage = {
		id: 'msg-1',
		sessionId: 'sess-1',
		role: 'assistant',
		content: '已命中固定报表模板。',
		templateCode: 'FIN-CUSTOMER-AR-RANK',
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
			'当前更适合先查看已沉淀的固定报表（财务），可以先试这几个：',
			'- 财务结算汇总',
			'- 财务结算列表待收款明细',
			'- 开票管理',
			'',
			'如果这些都不符合，再继续进入探索式分析。',
		].join('\n'),
	}

	assert.deepEqual(getFixedReportCandidates(candidateMessage), [
		{ label: '财务结算汇总', templateCode: 'FIN-AR-OVERVIEW' },
		{ label: '财务结算列表待收款明细', templateCode: 'FIN-PENDING-RECEIPTS-DETAIL' },
		{ label: '开票管理', templateCode: 'FIN-INVOICE-RECONCILIATION' },
	])
})
