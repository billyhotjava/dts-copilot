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

const sessionStorageWithLogin = {
	...emptyStorage,
	getItem(key: string) {
		if (key === 'dts.copilot.login.username') {
			return 'billy.xiezhimin@gmail.com'
		}
		return null
	},
}

const sessionStorageWithSessionAccess = {
	...emptyStorage,
	getItem(key: string) {
		if (key === 'dts.copilot.sessionAccess') {
			return 'true'
		}
		return null
	},
}

test('routes copilot chat through analytics session proxy when no api key is configured', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	const originalSessionStorage = globalThis.sessionStorage
	const originalWindow = globalThis.window
	const requestedUrls: string[] = []

	Object.defineProperty(globalThis, 'localStorage', {
		value: emptyStorage,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'sessionStorage', {
		value: sessionStorageWithLogin,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'window', {
		value: {
			localStorage: emptyStorage,
			sessionStorage: sessionStorageWithLogin,
		},
		configurable: true,
	})
	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL) => {
			requestedUrls.push(String(input))
			return new Response(JSON.stringify({
				sessionId: 'sess-session-proxy',
				response: 'proxy ok',
			}), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		const response = await analyticsApi.aiAgentChatSend({ userMessage: 'hello' })
		assert.deepEqual(requestedUrls, ['/api/copilot/chat/send'])
		assert.equal(response.sessionId, 'sess-session-proxy')
		assert.equal(response.agentMessage, 'proxy ok')
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

test('routes copilot chat through analytics session proxy when standalone session access is cached', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	const originalSessionStorage = globalThis.sessionStorage
	const originalWindow = globalThis.window
	const requestedUrls: string[] = []

	Object.defineProperty(globalThis, 'localStorage', {
		value: emptyStorage,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'sessionStorage', {
		value: sessionStorageWithSessionAccess,
		configurable: true,
	})
	Object.defineProperty(globalThis, 'window', {
		value: {
			localStorage: emptyStorage,
			sessionStorage: sessionStorageWithSessionAccess,
		},
		configurable: true,
	})
	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL) => {
			requestedUrls.push(String(input))
			return new Response(JSON.stringify({
				sessionId: 'sess-session-flag',
				response: 'proxy ok',
			}), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})

	try {
		const response = await analyticsApi.aiAgentChatSend({ userMessage: 'hello again' })
		assert.deepEqual(requestedUrls, ['/api/copilot/chat/send'])
		assert.equal(response.sessionId, 'sess-session-flag')
		assert.equal(response.agentMessage, 'proxy ok')
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
