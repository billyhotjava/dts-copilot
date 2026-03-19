import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsApi } from '../src/api/analyticsApi.js'

test('requests copilot suggested questions from the nl2sql suggestions endpoint', async () => {
	const originalFetch = globalThis.fetch
	let requestedUrl = ''

	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL) => {
			requestedUrl = String(input)
			return new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		await analyticsApi.listSuggestedQuestions(6)
		assert.equal(requestedUrl, '/api/ai/nl2sql/suggestions?limit=6')
	} finally {
		Object.defineProperty(globalThis, 'fetch', {
			value: originalFetch,
			configurable: true,
		})
	}
})
