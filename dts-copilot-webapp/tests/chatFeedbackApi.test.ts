import test from 'node:test'
import assert from 'node:assert/strict'
import { analyticsApi } from '../src/api/analyticsApi.js'

const emptyStorage = {
	getItem() {
		return null
	},
	setItem() {},
	removeItem() {},
	clear() {},
	key() {
		return null
	},
	length: 0,
}

test('submits copilot chat feedback to the nl2sql feedback endpoint', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	const originalSessionStorage = globalThis.sessionStorage
	const originalWindow = globalThis.window
	let requestedUrl = ''

	Object.defineProperty(globalThis, 'localStorage', {
		value: emptyStorage,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'sessionStorage', {
		value: emptyStorage,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'window', {
		value: {
			localStorage: emptyStorage,
			sessionStorage: emptyStorage,
		},
		configurable: true,
	})
	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL) => {
			requestedUrl = String(input)
			return new Response(JSON.stringify({ ok: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		await analyticsApi.submitChatFeedback({
			sessionId: 'sess-1',
			messageId: 'msg-1',
			rating: 'positive',
		})
		assert.equal(requestedUrl, '/api/ai/nl2sql/feedback')
	} finally {
		Object.defineProperty(globalThis, 'fetch', {
			value: originalFetch,
			configurable: true,
		})
		Object.defineProperty(globalThis, 'localStorage', {
			value: originalLocalStorage,
			configurable: true,
		})
		Object.defineProperty(globalThis, 'sessionStorage', {
			value: originalSessionStorage,
			configurable: true,
		})
		Object.defineProperty(globalThis, 'window', {
			value: originalWindow,
			configurable: true,
		})
	}
})
