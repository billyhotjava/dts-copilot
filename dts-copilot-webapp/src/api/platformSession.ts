export type PlatformTokens = {
	accessToken: string;
	refreshToken: string;
};

const DEFAULT_STORE_KEY = "platformUserStore";
const LEGACY_STORE_KEY = "userStore";

type AnyObject = Record<string, unknown>;

function normalizeAccessToken(value: string): string {
	const token = String(value ?? "").trim();
	if (!token) return "";
	if (token.toLowerCase().startsWith("bearer ")) {
		return token.slice(7).trim();
	}
	return token;
}

function readJson(raw: string | null): AnyObject | null {
	if (!raw) return null;
	try {
		const v = JSON.parse(raw);
		return v && typeof v === "object" ? (v as AnyObject) : null;
	} catch {
		return null;
	}
}

function asObject(v: unknown): AnyObject | null {
	return v && typeof v === "object" ? (v as AnyObject) : null;
}

function pickString(obj: AnyObject | null, keys: string[]): string {
	if (!obj) return "";
	for (const key of keys) {
		const v = obj[key];
		if (typeof v === "string" && v.trim()) return v.trim();
	}
	return "";
}

function resolveStoreKeys(preferredStoreKey?: string): string[] {
	const ordered = [
		preferredStoreKey || DEFAULT_STORE_KEY,
		DEFAULT_STORE_KEY,
		LEGACY_STORE_KEY,
	];
	return Array.from(
		new Set(
			ordered.filter((key) => typeof key === "string" && key.trim().length > 0),
		),
	);
}

function extractTokensFromStore(store: AnyObject | null): PlatformTokens {
	const state = asObject(store?.state);
	const userToken = asObject(state?.userToken);
	// Prefer portal access token for platform forward-auth (opaque token expected by dts-platform).
	// Fall back to adminAccessToken only when portal token is missing.
	const accessToken = normalizeAccessToken(
		pickString(userToken, [
			"accessToken",
			"access_token",
			"token",
			"adminAccessToken",
		]),
	);
	// Refresh should use portal refresh token; adminRefreshToken is not accepted by platform refresh endpoint.
	const refreshToken = pickString(userToken, ["refreshToken", "refresh_token"]);
	return { accessToken, refreshToken };
}

export function getPlatformTokens(
	storeKey: string = DEFAULT_STORE_KEY,
): PlatformTokens {
	for (const key of resolveStoreKeys(storeKey)) {
		const store = readJson(localStorage.getItem(key));
		const tokens = extractTokensFromStore(store);
		if (tokens.accessToken || tokens.refreshToken) {
			return tokens;
		}
	}
	return { accessToken: "", refreshToken: "" };
}

export function setPlatformTokens(
	tokens: Partial<PlatformTokens>,
	storeKey: string = DEFAULT_STORE_KEY,
) {
	for (const key of resolveStoreKeys(storeKey)) {
		const store = readJson(localStorage.getItem(key)) ?? {
			state: {},
			version: 0,
		};
		const state = (asObject(store.state) ?? {}) as AnyObject;
		const userToken = (asObject(state.userToken) ?? {}) as AnyObject;

		if (tokens.accessToken !== undefined)
			userToken.accessToken = normalizeAccessToken(tokens.accessToken);
		if (tokens.refreshToken !== undefined)
			userToken.refreshToken = tokens.refreshToken;

		state.userToken = userToken;
		(store as AnyObject).state = state;
		localStorage.setItem(key, JSON.stringify(store));
	}
}

function pickTokenFromResponse(body: unknown): PlatformTokens | null {
	const obj = asObject(body);
	const data =
		asObject(obj?.data) ?? asObject(obj?.result) ?? asObject(obj?.payload);

	const accessToken = normalizeAccessToken(
		pickString(obj, ["accessToken", "access_token", "token"]) ||
			pickString(data, ["accessToken", "access_token", "token"]),
	);
	if (!accessToken) return null;

	const refreshToken =
		pickString(obj, ["refreshToken", "refresh_token"]) ||
		pickString(data, ["refreshToken", "refresh_token"]);
	return { accessToken, refreshToken };
}

export async function refreshPlatformAccessToken(
	refreshToken: string,
): Promise<PlatformTokens | null> {
	const rt = String(refreshToken ?? "").trim();
	if (!rt) return null;

	const response = await fetch("/api/keycloak/auth/refresh", {
		method: "POST",
		credentials: "include",
		headers: { "content-type": "application/json", accept: "application/json" },
		body: JSON.stringify({ refreshToken: rt }),
	});
	if (!response.ok) return null;

	const body = await response.json().catch(() => null);
	const tokens = pickTokenFromResponse(body);
	if (!tokens) return null;

	setPlatformTokens({
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken || rt,
	});
	return {
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken || rt,
	};
}
