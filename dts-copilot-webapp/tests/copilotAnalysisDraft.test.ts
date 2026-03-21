import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	buildCopilotAnalysisDraftPayload,
	buildCopilotDraftEditorHref,
} from '../src/components/copilot/copilotAnalysisDraft.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds copilot analysis draft payload from sql answer context', () => {
	const payload = buildCopilotAnalysisDraftPayload({
		question: '中石油项目有多少在摆的绿植',
		sql: 'select * from p_project_green',
		databaseId: 7,
		explanationText: '按项目统计在摆绿植数量',
		sessionId: 'sess-1',
		messageId: 'msg-2',
		suggestedDisplay: 'table',
	})

	assert.deepEqual(payload, {
		title: '中石油项目有多少在摆的绿植',
		source_type: 'copilot',
		session_id: 'sess-1',
		message_id: 'msg-2',
		question: '中石油项目有多少在摆的绿植',
		database_id: 7,
		sql_text: 'select * from p_project_green',
		explanation_text: '按项目统计在摆绿植数量',
		suggested_display: 'table',
	})
})

test('builds query editor handoff link from draft id', () => {
	assert.equal(
		buildCopilotDraftEditorHref(88, { autorun: true }),
		'/questions/new?draft=88&autorun=1',
	)
	assert.equal(
		buildCopilotDraftEditorHref(88, { autorun: true, focusVisualization: true }),
		'/questions/new?draft=88&autorun=1&focus=visualization',
	)
})

test('inline sql preview exposes save-draft handoff actions', () => {
	const source = readFileSync(resolve(WEBAPP_ROOT, 'src/components/copilot/InlineSqlPreview.tsx'), 'utf8')

	assert.match(source, /createAnalysisDraft/)
	assert.match(source, /保存草稿/)
	assert.match(source, /草稿已保存/)
	assert.match(source, /在查询中打开/)
	assert.match(source, /在查询中继续编辑/)
	assert.match(source, /buildCopilotDraftEditorHref/)
	assert.match(source, /focusVisualization:\s*true/)
})
