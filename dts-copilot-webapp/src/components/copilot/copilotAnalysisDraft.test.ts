import { describe, expect, it } from 'vitest'
import {
	buildCopilotAnalysisDraftPayload,
} from './copilotAnalysisDraft'

describe('copilotAnalysisDraft', () => {
	it('builds analysis draft payload with Agent BI metadata', () => {
		expect(
			buildCopilotAnalysisDraftPayload({
				question: '租赁收入按月趋势怎么样',
				sql: 'select month_id, lease_amount from public.xycyl_dws_flowerbiz_project_monthly',
				databaseId: 6,
				explanationText: '按月汇总租赁收入',
				sessionId: 'sess-1',
				messageId: 'msg-1',
				suggestedDisplay: 'line',
				responseKind: 'REPORT_DRAFT',
				dataSurface: 'L1_DBT_MART',
				qualityLevel: 'MEDIUM',
				qualityNotes: ['2025年5月以后数据较可用'],
				reportCode: 'prs.flowerbiz.lease_execution_monthly',
			}),
		).toMatchObject({
			source_type: 'copilot',
			question: '租赁收入按月趋势怎么样',
			database_id: 6,
			suggested_display: 'line',
			response_kind: 'REPORT_DRAFT',
			data_surface: 'L1_DBT_MART',
			quality_level: 'MEDIUM',
			quality_notes: ['2025年5月以后数据较可用'],
			report_code: 'prs.flowerbiz.lease_execution_monthly',
		})
	})

})
