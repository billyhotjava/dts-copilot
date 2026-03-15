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

test('creates managed datasource through analytics datasource registry endpoint', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	let requestedUrl = ''
	let requestedMethod = ''
	let requestedBody = ''

	Object.defineProperty(globalThis, 'localStorage', {
		value: emptyStorage,
		configurable: true,
	})

	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL, init?: RequestInit) => {
			requestedUrl = String(input)
			requestedMethod = String(init?.method ?? 'GET')
			requestedBody = String(init?.body ?? '')
			return new Response(JSON.stringify({
				id: 42,
				name: '园林业务库',
				type: 'postgres',
				jdbcUrl: 'jdbc:postgresql://db.internal:5432/garden',
			}), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		await analyticsApi.createManagedDataSource({
			name: '园林业务库',
			type: 'postgres',
			host: 'db.internal',
			port: 5432,
			database: 'garden',
			username: 'readonly',
			password: 'secret-pass',
			description: '用于 NL2SQL',
		})

		assert.equal(requestedUrl, '/api/platform/data-sources')
		assert.equal(requestedMethod, 'POST')
		assert.match(requestedBody, /"name":"园林业务库"/)
		assert.match(requestedBody, /"host":"db.internal"/)
		assert.match(requestedBody, /"database":"garden"/)
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
