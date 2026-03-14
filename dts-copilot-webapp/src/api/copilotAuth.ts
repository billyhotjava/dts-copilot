import { resolveCopilotUserIdFromSharedStores } from './aiChatCompatibility'

const COPILOT_API_KEY_STORAGE_KEY = 'dts.copilot.apiKey'
const SHARED_STORE_KEYS = ['platformUserStore', 'userStore'] as const

function readLocalStorage(key: string): string | null {
	try {
		return window.localStorage.getItem(key)
	} catch {
		return null
	}
}

function readSessionStorage(key: string): string | null {
	try {
		return window.sessionStorage.getItem(key)
	} catch {
		return null
	}
}

function pickConfiguredApiKey(): string {
	const runtime = readLocalStorage(COPILOT_API_KEY_STORAGE_KEY)
	if (runtime && runtime.trim()) {
		return runtime.trim()
	}
	const envKey = String(import.meta.env.VITE_API_KEY ?? '').trim()
	return envKey
}

function resolveUserInfo(): { userId: string; userName: string; displayName: string } {
	const sharedUserId = resolveCopilotUserIdFromSharedStores(
		SHARED_STORE_KEYS.map((key) => readLocalStorage(key)),
	)
	const loginUser = String(readSessionStorage('dts.copilot.login.username') ?? '').trim()
	const userId = sharedUserId || loginUser || 'standalone-user'
	return {
		userId,
		userName: userId,
		displayName: userId,
	}
}

export function getCopilotApiKey(): string {
	return pickConfiguredApiKey()
}

export function getCopilotHeaders(): Record<string, string> {
	const apiKey = getCopilotApiKey()
	if (!apiKey) {
		return {}
	}
	const user = resolveUserInfo()
	return {
		Authorization: `Bearer ${apiKey}`,
		'X-DTS-User-Id': user.userId,
		'X-DTS-User-Name': user.userName,
		'X-DTS-Display-Name': user.displayName,
	}
}
