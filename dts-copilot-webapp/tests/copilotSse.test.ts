import test from 'node:test'
import assert from 'node:assert/strict'
import { createSseEventParser } from '../src/api/copilotSse.ts'

test('parses SSE events split across arbitrary chunks', () => {
	const events: Array<{ event: string; data: string }> = []
	const parser = createSseEventParser((event) => events.push(event))

	parser.push('event: sess')
	parser.push('ion\ndata: {"sessionId":"sess-1"}\n')
	parser.push('\n')
	parser.push('event: token\ndata: {"content":"hel')
	parser.push('lo"}\n\n')
	parser.finish()

	assert.deepEqual(events, [
		{ event: 'session', data: '{"sessionId":"sess-1"}' },
		{ event: 'token', data: '{"content":"hello"}' },
	])
})

test('parses CRLF and multi-line data payloads', () => {
	const events: Array<{ event: string; data: string }> = []
	const parser = createSseEventParser((event) => events.push(event))

	parser.push('event: error\r\ndata: first line\r\ndata: second line\r\n\r\n')
	parser.finish()

	assert.deepEqual(events, [
		{ event: 'error', data: 'first line\nsecond line' },
	])
})
