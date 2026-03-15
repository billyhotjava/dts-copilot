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

test('normalizes legacy analytics database endpoint to root api path', async () => {
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
			return new Response(JSON.stringify({ data: [], total: 0 }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		await analyticsApi.listDatabases()
		assert.equal(requestedUrl, '/api/database')
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
