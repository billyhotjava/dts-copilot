import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	buildAnalysisDraftProvenanceModel,
	buildFixedReportProvenanceModel,
} from '../src/pages/analysisProvenanceModel.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds query-draft provenance with draft status and dirty summary', () => {
	const model = buildAnalysisDraftProvenanceModel(
		{
			id: 7,
			title: '中石油项目在摆绿植',
			question: '中石油项目有多少在摆的绿植',
			status: 'DRAFT',
			session_id: '25',
			message_id: 'msg-1',
		},
		{ surface: 'query', isDirty: true },
	)

	assert.equal(model.heading, 'Copilot 草稿来源')
	assert.equal(model.title, '中石油项目在摆绿植')
	assert.equal(model.badges[0]?.label, 'AI Copilot')
	assert.equal(model.badges[1]?.label, '草稿')
	assert.match(model.summary, /已脱离原始草稿/)
	assert.deepEqual(
		model.details.map((item) => item.label),
		['原始问题', '分析会话', '来源回答'],
	)
})

test('builds query-draft provenance with promoted summary after save-card', () => {
	const model = buildAnalysisDraftProvenanceModel(
		{
			id: 11,
			title: '采购汇总',
			question: '最近 30 天采购汇总',
			status: 'SAVED_QUERY',
			session_id: '55',
			message_id: 'msg-9',
			linked_card_id: 201,
		},
		{ surface: 'query', isDirty: false },
	)

	assert.deepEqual(
		model.badges.map((item) => item.label),
		['AI Copilot', '已转正式查询'],
	)
	assert.match(model.summary, /可返回来源对话/)
	assert.deepEqual(
		model.details.map((item) => item.label),
		['原始问题', '分析会话', '来源回答', '已转正查询'],
	)
})

test('builds dashboard provenance with linked card hint and suggested display badge', () => {
	const model = buildAnalysisDraftProvenanceModel(
		{
			id: 9,
			question: '采购汇总',
			status: 'SAVED_QUERY',
			linked_card_id: 88,
			suggested_display: 'bar',
		},
		{ surface: 'dashboard' },
	)

	assert.equal(model.heading, '分析草稿创建上下文')
	assert.match(model.summary, /优先复用草稿对应的查询卡片/)
	assert.deepEqual(
		model.badges.map((item) => item.label),
		['已转正式查询', 'bar'],
	)
	assert.deepEqual(
		model.details.map((item) => item.label),
		['原始问题', '已转正查询'],
	)
})

test('builds fixed-report provenance with legacy page hint', () => {
	const model = buildFixedReportProvenanceModel(
		{
			templateCode: 'PROC-SUMMARY-001',
			name: '采购汇总',
			legacyPagePath: '/purchase/summary',
		},
		{ surface: 'screen' },
	)

	assert.equal(model.heading, '固定报表创建上下文')
	assert.equal(model.title, '采购汇总')
	assert.match(model.summary, /生成关联大屏草稿/)
	assert.deepEqual(model.badges.map((item) => item.label), ['固定报表', '现网页面可追溯'])
	assert.deepEqual(model.details.map((item) => item.label), ['模板编码', '现网页面'])
})

test('four pages adopt the shared provenance panel and model builders', () => {
	const files = [
		'src/pages/CardEditorPage.tsx',
		'src/pages/DashboardEditorPage.tsx',
		'src/pages/ReportFactoryPage.tsx',
		'src/pages/screens/ScreensPage.tsx',
	]

	for (const relativePath of files) {
		const source = readFileSync(resolve(WEBAPP_ROOT, relativePath), 'utf8')
		assert.match(source, /AnalysisProvenancePanel/)
		assert.match(source, /buildAnalysisDraftProvenanceModel|buildFixedReportProvenanceModel/)
	}
})
