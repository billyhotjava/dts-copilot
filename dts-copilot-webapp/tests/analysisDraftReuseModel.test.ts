import test from 'node:test'
import assert from 'node:assert/strict'
import {
	buildAnalysisDraftScreenPrompt,
	resolveAnalysisDraftDashboardSeedCardId,
	resolveAnalysisDraftReportSource,
} from '../src/pages/analysisDraftReuseModel.ts'

test('prefers linked query card as dashboard seed when dashboard is empty', () => {
	assert.equal(
		resolveAnalysisDraftDashboardSeedCardId(
			{ linked_card_id: 28 },
			[],
		),
		28,
	)

	assert.equal(
		resolveAnalysisDraftDashboardSeedCardId(
			{ linked_card_id: 28 },
			[{ card_id: 28 }],
		),
		null,
	)
})

test('prefills report factory source from numeric analysis draft session id', () => {
	assert.deepEqual(
		resolveAnalysisDraftReportSource({
			session_id: '105',
			title: '中石油项目在摆绿植',
		}),
		{
			sourceType: 'session',
			sourceId: '105',
			label: '分析草稿会话',
		},
	)

	assert.equal(
		resolveAnalysisDraftReportSource({
			session_id: 'session-abc',
			title: '中石油项目在摆绿植',
		}),
		null,
	)
})

test('builds screen ai prompt from analysis draft business context', () => {
	const prompt = buildAnalysisDraftScreenPrompt({
		title: '中石油项目在摆绿植',
		question: '中石油项目目前有多少在摆的绿植',
		explanation_text: '按项目统计在摆数量',
		suggested_display: 'bar',
	})

	assert.match(prompt, /中石油项目在摆绿植/)
	assert.match(prompt, /核心指标/)
	assert.match(prompt, /趋势图/)
	assert.match(prompt, /bar/)
})
