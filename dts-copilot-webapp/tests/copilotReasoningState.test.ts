import test from 'node:test'
import assert from 'node:assert/strict'
import {
	appendReasoningDelta,
	appendToolProgressLine,
} from '../src/components/copilot/copilotReasoningState.ts'

test('appends reasoning deltas without losing prior fragments', () => {
	assert.equal(
		appendReasoningDelta('先定位业务域', '，再决定查询路径'),
		'先定位业务域，再决定查询路径',
	)
})

test('converts tool progress events into lightweight reasoning lines', () => {
	assert.equal(
		appendToolProgressLine('先定位业务域', { tool: 'schema_lookup', status: 'running' }),
		'先定位业务域\n[工具] schema_lookup · running',
	)
})
