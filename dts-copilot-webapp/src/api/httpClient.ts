import { isCopilotAiRoute, shouldRedirectToLoginOnUnauthorized } from "./authRedirectPolicy.ts";
import { getCopilotHeaders } from "./copilotAuth.ts";
import { getPlatformTokens, refreshPlatformAccessToken } from "./platformSession.ts";
import type { ScreenExportRenderResult } from "./types.ts";

export class HttpError extends Error {
	status: number;
	bodyText: string;
	requestId?: string;
	code?: string;
	retryable?: boolean;
	constructor(
		status: number,
		message: string,
		bodyText: string,
		requestId?: string,
		code?: string,
		retryable?: boolean,
	) {
		super(message);
		this.status = status;
		this.bodyText = bodyText;
		this.requestId = requestId;
		this.code = code;
		this.retryable = retryable;
	}
}

export class AuthError extends HttpError { }

export type PlatformApiEnvelope<T> = {
	status?: number;
	message?: string;
	code?: string;
	data?: T;
};

export type AiApiEnvelope<T> = {
	success?: boolean;
	data?: T;
	error?: string | null;
};

export function unwrapPlatformApiEnvelope<T>(payload: T | PlatformApiEnvelope<T>): T {
	if (!payload || typeof payload !== "object") {
		return payload as T;
	}
	const envelope = payload as PlatformApiEnvelope<T>;
	if (typeof envelope.status !== "number") {
		return payload as T;
	}
	if (envelope.status !== 200) {
		const code = typeof envelope.code === "string" && envelope.code.trim().length > 0 ? envelope.code.trim() : undefined;
		const message = typeof envelope.message === "string" && envelope.message.trim().length > 0
			? envelope.message.trim()
			: "请求失败";
		throw new Error(code ? `${message} [code=${code}]` : message);
	}
	return (envelope.data ?? ({} as T)) as T;
}

export function unwrapAiApiEnvelope<T>(payload: T | AiApiEnvelope<T>): T {
	if (!payload || typeof payload !== "object" || !("success" in payload)) {
		return payload as T;
	}
	const envelope = payload as AiApiEnvelope<T>;
	if (envelope.success === false) {
		const message = typeof envelope.error === "string" && envelope.error.trim().length > 0
			? envelope.error.trim()
			: "请求失败";
		throw new Error(message);
	}
	return (envelope.data ?? ([] as unknown as T)) as T;
}

let _redirectingToLogin = false;
function redirectToLogin() {
	if (_redirectingToLogin) return;
	_redirectingToLogin = true;
	const tokens = getPlatformTokens();
	if (tokens.accessToken) {
		// Platform integration mode — don't redirect, just warn.
		console.warn("[dts-copilot] 认证失败 (401)，平台 token 可能已过期");
		setTimeout(() => { _redirectingToLogin = false; }, 5000);
		return;
	}
	// Standalone mode — redirect to login page.
	const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";
	window.location.href = `${basePath}/auth/login`;
}

function normalizeLegacyAnalyticsApiPath(url: string): string {
	if (!url.startsWith("/api/analytics/")) {
		return url;
	}
	return "/api/" + url.slice("/api/analytics/".length);
}

async function apiFetch(url: string, init: RequestInit, allowRefresh: boolean): Promise<Response> {
	const normalizedUrl = normalizeLegacyAnalyticsApiPath(url);
	const tokens = getPlatformTokens();
	const headers = new Headers(init.headers ?? {});
	const shouldRedirectOnUnauthorized = shouldRedirectToLoginOnUnauthorized(normalizedUrl);
	const copilotAiRoute = isCopilotAiRoute(normalizedUrl);
	if (!headers.has("accept")) headers.set("accept", "application/json");
	if (copilotAiRoute) {
		const copilotHeaders = getCopilotHeaders();
		for (const [key, value] of Object.entries(copilotHeaders)) {
			if (!headers.has(key)) {
				headers.set(key, String(value));
			}
		}
	} else if (tokens.accessToken && !headers.has("authorization")) {
		headers.set("authorization", `Bearer ${tokens.accessToken}`);
	}

	const response = await fetch(normalizedUrl, { ...init, credentials: "include", headers });
	if (response.status !== 401 || !allowRefresh || copilotAiRoute) {
		return response;
	}

	if (!tokens.refreshToken) {
		if (shouldRedirectOnUnauthorized) {
			redirectToLogin();
		}
		return response;
	}

	const refreshed = await refreshPlatformAccessToken(tokens.refreshToken);
	if (!refreshed?.accessToken) {
		if (shouldRedirectOnUnauthorized) {
			redirectToLogin();
		}
		return response;
	}

	const retryHeaders = new Headers(init.headers ?? {});
	if (!retryHeaders.has("accept")) retryHeaders.set("accept", "application/json");
	retryHeaders.set("authorization", `Bearer ${refreshed.accessToken}`);
	return await fetch(normalizedUrl, { ...init, credentials: "include", headers: retryHeaders });
}

async function readErrorText(response: Response): Promise<string> {
	return await response.text().catch(() => "");
}

function extractRequestId(response: Response): string | undefined {
	const headers = ["x-request-id", "x-requestid", "x-correlation-id"];
	for (const header of headers) {
		const value = response.headers.get(header);
		if (value && value.trim().length > 0) {
			return value.trim();
		}
	}
	return undefined;
}

function extractErrorCode(response: Response, bodyText: string): string | undefined {
	const headerCode = response.headers.get("x-error-code");
	if (headerCode && headerCode.trim().length > 0) {
		return headerCode.trim();
	}
	if (!bodyText) {
		return undefined;
	}
	try {
		const payload = JSON.parse(bodyText) as { code?: unknown };
		if (typeof payload.code === "string" && payload.code.trim().length > 0) {
			return payload.code.trim();
		}
	} catch {
		// ignore non-JSON error bodies
	}
	return undefined;
}

function extractErrorRetryable(response: Response, bodyText: string): boolean | undefined {
	const headerValue = response.headers.get("x-error-retryable");
	if (headerValue != null && headerValue.trim().length > 0) {
		const normalized = headerValue.trim().toLowerCase();
		if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
		if (normalized === "false" || normalized === "0" || normalized === "no") return false;
	}
	if (!bodyText) {
		return undefined;
	}
	try {
		const payload = JSON.parse(bodyText) as { retryable?: unknown };
		if (typeof payload.retryable === "boolean") {
			return payload.retryable;
		}
	} catch {
		// ignore non-JSON error bodies
	}
	return undefined;
}

function buildHttpError(response: Response, bodyText: string): HttpError {
	const requestId = extractRequestId(response);
	const errorCode = extractErrorCode(response, bodyText);
	const retryable = extractErrorRetryable(response, bodyText);
	const baseMsg = "HTTP " + response.status + " " + response.statusText + ": " + bodyText;
	const taggedMsg = errorCode ? baseMsg + " [code=" + errorCode + "]" : baseMsg;
	const retryableTag = typeof retryable === "boolean" ? " [retryable=" + String(retryable) + "]" : "";
	const requestTag = requestId ? " [requestId=" + requestId + "]" : "";
	const msg = taggedMsg + retryableTag + requestTag;
	if (response.status === 401 || response.status === 403) {
		return new AuthError(response.status, msg, bodyText, requestId, errorCode, retryable);
	}
	return new HttpError(response.status, msg, bodyText, requestId, errorCode, retryable);
}

export function isRetryableHttpError(error: unknown): boolean {
	if (!(error instanceof HttpError)) {
		return false;
	}
	if (typeof error.retryable === "boolean") {
		return error.retryable;
	}
	return [408, 429, 502, 503, 504].includes(error.status);
}

export async function fetchJson<T>(url: string): Promise<T> {
	const response = await apiFetch(url, { method: "GET" }, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	return (await response.json()) as T;
}

export async function sendJson<T>(url: string, body: unknown): Promise<T> {
	return await requestJson<T>(url, "POST", body);
}

export async function requestJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
	const init: RequestInit = {
		method,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
		},
	};
	if (method !== "DELETE") {
		init.body = JSON.stringify(body ?? {});
	}
	const response = await apiFetch(url, init, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	if (response.status === 204) {
		return undefined as T;
	}
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		return (await response.text()) as unknown as T;
	}
	return (await response.json()) as T;
}

function parseContentDispositionFilename(headerValue: string | null): string | undefined {
	if (!headerValue) return undefined;
	const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(headerValue);
	if (utf8Match && utf8Match[1]) {
		try {
			return decodeURIComponent(utf8Match[1].trim());
		} catch {
			return utf8Match[1].trim();
		}
	}
	const plainMatch = /filename="?([^\";]+)"?/i.exec(headerValue);
	if (plainMatch && plainMatch[1]) {
		return plainMatch[1].trim();
	}
	return undefined;
}

export async function requestBinary(
	url: string,
	method: "POST" | "PUT",
	body?: unknown,
): Promise<ScreenExportRenderResult> {
	const response = await apiFetch(url, {
		method,
		headers: {
			accept: "application/octet-stream",
			"content-type": "application/json",
		},
		body: JSON.stringify(body ?? {}),
	}, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	const blob = await response.blob();
	return {
		blob,
		contentType: response.headers.get("content-type") ?? undefined,
		fileName: parseContentDispositionFilename(response.headers.get("content-disposition")),
		requestId: response.headers.get("x-request-id") ?? undefined,
		specDigest: response.headers.get("x-screen-spec-digest") ?? undefined,
		resolvedMode: response.headers.get("x-screen-resolved-mode") ?? undefined,
		renderEngine: response.headers.get("x-screen-render-engine") ?? undefined,
		pixelRatio: (() => {
			const raw = response.headers.get("x-screen-render-pixel-ratio");
			if (!raw) return undefined;
			const value = Number.parseFloat(raw);
			return Number.isFinite(value) ? value : undefined;
		})(),
		deviceMode: response.headers.get("x-screen-device-mode") ?? undefined,
		hiddenByDevice: (() => {
			const raw = response.headers.get("x-screen-hidden-by-device");
			if (!raw) return undefined;
			const value = Number.parseInt(raw, 10);
			return Number.isFinite(value) ? value : undefined;
		})(),
	};
}

export function isAiCompatFallbackError(error: unknown): boolean {
	return error instanceof HttpError && [404, 405].includes(error.status);
}
