import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	buildCopilotSessionFocusRequest,
	buildCopilotSessionReturnLabel,
} from '../src/components/copilot/copilotSessionFocus.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds copilot session focus request from analysis draft provenance', () => {
	assert.deepEqual(
		buildCopilotSessionFocusRequest({
			sessionId: 'sess-12',
			messageId: 'msg-8',
			question: '中石油项目有多少在摆绿植',
		}),
		{
			sessionId: 'sess-12',
			messageId: 'msg-8',
			notice: '已回到来源对话：中石油项目有多少在摆绿植',
		},
	)
})

test('builds readable return label for copilot session handoff', () => {
	assert.equal(buildCopilotSessionReturnLabel(true), '返回 Copilot 对话')
	assert.equal(buildCopilotSessionReturnLabel(false), '查看 Copilot 对话')
})

test('copilot sidebar and chat wire session focus requests into the global sidebar', () => {
	const sidebarSource = readFileSync(resolve(WEBAPP_ROOT, 'src/components/copilot/CopilotSidebar.tsx'), 'utf8')
	const chatSource = readFileSync(resolve(WEBAPP_ROOT, 'src/components/copilot/CopilotChat.tsx'), 'utf8')

	assert.match(sidebarSource, /COPILOT_SESSION_FOCUS_EVENT/)
	assert.match(sidebarSource, /setExpanded\(true\)/)
	assert.match(sidebarSource, /focusRequest/)
	assert.match(chatSource, /focusRequest/)
	assert.match(chatSource, /setFocusNotice/)
	assert.match(chatSource, /copilot-chat__msg--focused/)
})
