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

test('requests current user from analytics standalone user endpoint', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	let requestedUrl = ''

	Object.defineProperty(globalThis, 'localStorage', {
		value: emptyStorage,
		configurable: true,
	})

	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL) => {
			requestedUrl = String(input)
			return new Response(JSON.stringify({ is_superuser: true }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		const user = await analyticsApi.getCurrentUser()
		assert.equal(requestedUrl, '/api/user/current')
		assert.equal(user.is_superuser, true)
	} finally {
		Object.defineProperty(globalThis, 'fetch', {
			value: originalFetch,
			configurable: true,
		})
		Object.defineProperty(globalThis, 'localStorage', {
			value: originalLocalStorage,
			configurable: true,
		})
	}
})
