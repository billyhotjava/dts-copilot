import {
	normalizeLegacyAiChatResponse,
	normalizeLegacyAiChatSession,
	normalizeLegacyAiChatSessionDetail,
	resolveCopilotUserIdFromSharedStores,
} from "../aiChatCompatibility.ts";
import { getCopilotApiKey, hasCopilotSessionAccess } from "../copilotAuth.ts";
import { createSseEventParser } from "../copilotSse.ts";
import {
	fetchJson,
	sendJson,
	requestJson,
	unwrapPlatformApiEnvelope,
	unwrapAiApiEnvelope,
	isAiCompatFallbackError,
	HttpError,
	type PlatformApiEnvelope,
	type AiApiEnvelope,
} from "../httpClient.ts";
import type {
	AiAgentChatResponse,
	AiAgentChatSession,
	AiAgentChatSessionDetail,
	CopilotSuggestedQuestion,
	CopilotStreamEvent,
} from "../types.ts";

function resolveLegacyAiUserId(): string {
	try {
		return resolveCopilotUserIdFromSharedStores([
			window.localStorage.getItem("platformUserStore"),
			window.localStorage.getItem("userStore"),
			window.sessionStorage.getItem("dts.copilot.login.username")
				? JSON.stringify({
					state: { userInfo: { username: window.sessionStorage.getItem("dts.copilot.login.username") } },
				})
				: null,
		]);
	} catch {
		return "standalone-user";
	}
}

function resolveLegacyAiUserName(): string {
	try {
		const loginUser = window.sessionStorage.getItem("dts.copilot.login.username");
		if (loginUser && loginUser.trim().length > 0) {
			return loginUser.trim();
		}
		return resolveLegacyAiUserId();
	} catch {
		return resolveLegacyAiUserId();
	}
}

function shouldUseSessionCopilotProxy(): boolean {
	return !getCopilotApiKey() && hasCopilotSessionAccess();
}

async function sendAiAgentChatViaSessionProxy(body: {
	sessionId?: string;
	userMessage: string;
	datasourceId?: string;
}): Promise<AiAgentChatResponse> {
	const legacy = await sendJson<Record<string, unknown>>("/api/copilot/chat/send", {
		sessionId: body.sessionId,
		userMessage: body.userMessage,
		datasourceId: body.datasourceId,
	});
	return normalizeLegacyAiChatResponse(legacy) as AiAgentChatResponse;
}

async function listAiAgentSessionsViaSessionProxy(limit = 50): Promise<AiAgentChatSession[]> {
	const legacy = await fetchJson<Record<string, unknown>[]>(
		"/api/copilot/chat/sessions?limit=" + encodeURIComponent(String(limit)),
	);
	return legacy.map((item) => normalizeLegacyAiChatSession(item) as AiAgentChatSession);
}

async function getAiAgentSessionViaSessionProxy(id: string): Promise<AiAgentChatSessionDetail> {
	const legacy = await fetchJson<Record<string, unknown>>(
		"/api/copilot/chat/" + encodeURIComponent(String(id)),
	);
	return normalizeLegacyAiChatSessionDetail(legacy) as AiAgentChatSessionDetail;
}

async function deleteAiAgentSessionViaSessionProxy(id: string): Promise<void> {
	await requestJson<void>("/api/copilot/chat/" + encodeURIComponent(String(id)), "DELETE");
}

async function sendAiAgentChatCompat(body: {
	sessionId?: string;
	userMessage: string;
}): Promise<AiAgentChatResponse> {
	if (shouldUseSessionCopilotProxy()) {
		return sendAiAgentChatViaSessionProxy(body);
	}
	try {
		const value = await sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat", body ?? {});
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacyBody = {
			sessionId: body.sessionId,
			userId: resolveLegacyAiUserId(),
			message: body.userMessage,
		};
		const legacy = await sendJson<Record<string, unknown>>("/api/ai/agent/chat/send", legacyBody);
		return normalizeLegacyAiChatResponse(legacy) as AiAgentChatResponse;
	}
}

async function listAiAgentSessionsCompat(limit = 50): Promise<AiAgentChatSession[]> {
	if (shouldUseSessionCopilotProxy()) {
		return listAiAgentSessionsViaSessionProxy(limit);
	}
	try {
		const value = await fetchJson<AiAgentChatSession[] | PlatformApiEnvelope<AiAgentChatSession[]>>(
			"/api/ai/agent/sessions?limit=" + encodeURIComponent(String(limit)),
		);
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacy = await fetchJson<Record<string, unknown>[]>(
			"/api/ai/agent/chat/sessions?userId=" + encodeURIComponent(resolveLegacyAiUserId()),
		);
		return legacy.map((item) => normalizeLegacyAiChatSession(item) as AiAgentChatSession).slice(0, limit);
	}
}

async function getAiAgentSessionCompat(id: string): Promise<AiAgentChatSessionDetail> {
	if (shouldUseSessionCopilotProxy()) {
		return getAiAgentSessionViaSessionProxy(id);
	}
	try {
		const value = await fetchJson<AiAgentChatSessionDetail | PlatformApiEnvelope<AiAgentChatSessionDetail>>(
			"/api/ai/agent/sessions/" + encodeURIComponent(String(id)),
		);
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacy = await fetchJson<Record<string, unknown>>(
			"/api/ai/agent/chat/" + encodeURIComponent(String(id)),
		);
		return normalizeLegacyAiChatSessionDetail(legacy) as AiAgentChatSessionDetail;
	}
}

async function deleteAiAgentSessionCompat(id: string): Promise<void> {
	if (shouldUseSessionCopilotProxy()) {
		await deleteAiAgentSessionViaSessionProxy(id);
		return;
	}
	try {
		const value = await requestJson<unknown>("/api/ai/agent/sessions/" + encodeURIComponent(String(id)), "DELETE");
		unwrapPlatformApiEnvelope(value as PlatformApiEnvelope<unknown>);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		await requestJson<void>("/api/ai/agent/chat/" + encodeURIComponent(String(id)), "DELETE");
	}
}

export const copilotApi = {
	aiAgentChatSend: (body: {
		sessionId?: string;
		userMessage: string;
		datasourceId?: string;
		schemaName?: string;
		objectContext?: {
			typeId?: string;
			instanceId?: string | null;
			displayName?: string | null;
		};
		pageContext?: {
			module: string;
			resourceType?: string;
			resourceId?: string;
			resourceName?: string;
			extras?: Record<string, string>;
		};
	}) =>
		sendAiAgentChatCompat(body),
	aiAgentChatApprove: (
		sessionId: string,
		actionId: string,
		formData?: Record<string, unknown>,
	) =>
		sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat/approve", {
			sessionId,
			actionId,
			formData,
		})
			.then(unwrapPlatformApiEnvelope),
	aiAgentChatCancel: (sessionId: string, actionId: string) =>
		sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat/cancel", { sessionId, actionId })
			.then(unwrapPlatformApiEnvelope),
	listAiAgentSessions: (limit = 50) => listAiAgentSessionsCompat(limit),
	getAiAgentSession: (id: string) => getAiAgentSessionCompat(id),
	deleteAiAgentSession: (id: string) => deleteAiAgentSessionCompat(id),
	listSuggestedQuestions: (limit = 12) =>
		fetchJson<CopilotSuggestedQuestion[] | AiApiEnvelope<CopilotSuggestedQuestion[]>>(
			"/api/ai/nl2sql/suggestions?limit=" + encodeURIComponent(String(limit)),
		).then(unwrapAiApiEnvelope),
	submitChatFeedback: (body: {
		sessionId: string;
		messageId: string;
		rating: string;
		reason?: string;
		detail?: string;
		generatedSql?: string;
		correctedSql?: string;
		routedDomain?: string;
		targetView?: string;
		templateCode?: string;
		userId?: string;
		userName?: string;
	}) => sendJson<void>("/api/ai/nl2sql/feedback", {
		...body,
		userId: body.userId ?? resolveLegacyAiUserId(),
		userName: body.userName ?? resolveLegacyAiUserName(),
	}),
};

// ── CS-09: SSE streaming for copilot chat ────────────────────────────

export async function aiAgentChatSendStream(
	body: { sessionId?: string; userMessage: string; datasourceId?: string },
	onEvent: (event: CopilotStreamEvent) => void,
	options?: { signal?: AbortSignal },
): Promise<void> {
	const basePath = import.meta.env?.VITE_BASE_PATH?.replace(/\/$/, "") || "";
	const response = await fetch(`${basePath}/api/copilot/chat/send-stream`, {
		method: "POST",
		credentials: "include",
		headers: { "content-type": "application/json", accept: "text/event-stream" },
		body: JSON.stringify(body),
		signal: options?.signal,
	});

	if (!response.ok || !response.body) {
		throw new Error(`HTTP ${response.status}: ${await response.text()}`);
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let receivedEvents = 0;
	const parser = createSseEventParser(({ event, data }) => {
		receivedEvents++;
		try {
			const parsed = JSON.parse(data);
				switch (event) {
					case "session":
						onEvent({ type: "session", sessionId: parsed.sessionId });
						break;
					case "heartbeat":
						onEvent({ type: "heartbeat" });
						break;
					case "reasoning":
						onEvent({ type: "reasoning", content: parsed.content });
						break;
				case "token":
					onEvent({ type: "token", content: parsed.content });
					break;
				case "tool":
					onEvent({ type: "tool", tool: parsed.tool, status: parsed.status });
					break;
				case "done":
					onEvent({
						type: "done",
						...(parsed.generatedSql ? { generatedSql: parsed.generatedSql } : {}),
						...(parsed.templateCode ? { templateCode: parsed.templateCode } : {}),
						...(parsed.routedDomain ? { routedDomain: parsed.routedDomain } : {}),
						...(parsed.targetView ? { targetView: parsed.targetView } : {}),
						...(parsed.responseKind ? { responseKind: parsed.responseKind } : {}),
					});
					break;
				case "error":
					onEvent({ type: "error", error: parsed.error });
					break;
			}
		} catch {
			// ignore malformed events
		}
	});

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			parser.push(decoder.decode(value, { stream: true }));
		}
		parser.push(decoder.decode());
		parser.finish();
	} catch (err) {
		// In reverse-proxy environments (Traefik/Nginx), the server closing
		// the connection after the last SSE chunk can surface as a TypeError
		// ("network error").  If we already received events, the response was
		// delivered — swallow the error instead of triggering the sync fallback.
		parser.finish();
		if (receivedEvents === 0) {
			throw err;
		}
	}
}
