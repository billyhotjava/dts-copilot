import { describe, expect, it } from 'vitest'

import { normalizeLegacyAiChatResponse } from './aiChatCompatibility'

describe('aiChatCompatibility', () => {
	it('preserves published indicator contract fields from legacy chat responses', () => {
		expect(
			normalizeLegacyAiChatResponse({
				sessionId: 'sess-1',
				response: 'ok',
				responseKind: 'PUBLISHED_INDICATOR',
				reportCode: 'codex_sprint29_live_metric',
				targetView: 'indicator:codex_sprint29_live_metric',
				dataSurface: 'L3_PUBLISHED_INDICATOR',
				qualityLevel: 'HIGH',
				sourceRefs: 'platform-indicator:codex_sprint29_live_metric',
				trace: {
					metricCaliber: {
						name: 'Sprint29 验证指标',
						formula: 'SUM(value)',
						domain: 'ops',
						version: 'v1',
						ontologyRef: '29000000-0000-4000-8000-000000000029',
					},
					financeAudit: {
						oracleStatus: {
							bindingId: 'month-settlement',
							healthStatus: 'PASS',
							maxDifference: '0.00',
						},
						appliedRules: [
							{ ruleId: 'CAL-MONTH-AMOUNT-TIER', description: 'amount tier' },
						],
					},
				},
			}),
		).toMatchObject({
			sessionId: 'sess-1',
			agentMessage: 'ok',
			responseKind: 'PUBLISHED_INDICATOR',
			reportCode: 'codex_sprint29_live_metric',
			targetView: 'indicator:codex_sprint29_live_metric',
			dataSurface: 'L3_PUBLISHED_INDICATOR',
			qualityLevel: 'HIGH',
			sourceRefs: 'platform-indicator:codex_sprint29_live_metric',
			trace: {
				metricCaliber: {
					name: 'Sprint29 验证指标',
					ontologyRef: '29000000-0000-4000-8000-000000000029',
				},
				financeAudit: {
					oracleStatus: {
						bindingId: 'month-settlement',
						healthStatus: 'PASS',
						maxDifference: '0.00',
					},
					appliedRules: [
						{ ruleId: 'CAL-MONTH-AMOUNT-TIER', description: 'amount tier' },
					],
				},
			},
		})
	})
})
