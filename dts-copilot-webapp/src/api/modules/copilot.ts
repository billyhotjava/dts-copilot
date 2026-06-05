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
	CopilotAssumption,
	CopilotAssumptionOption,
	CopilotClarification,
	CopilotClarificationOption,
	CopilotSuggestedQuestion,
	CopilotSignalSummary,
	CopilotStreamEvent,
	CopilotTrace,
	CopilotTraceFinanceAudit,
	CopilotTraceSource,
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

function asObject(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: null;
}

function pickNonEmptyString(
	obj: Record<string, unknown>,
	key: string,
): string | undefined {
	const value = obj[key];
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeAssumptionOptions(
	value: unknown,
): CopilotAssumptionOption[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const options = value.flatMap((item) => {
		const row = asObject(item);
		if (!row) {
			return [];
		}
		const optionValue = pickNonEmptyString(row, "value");
		const label = pickNonEmptyString(row, "label");
		if (!optionValue || !label) {
			return [];
		}
		return [{ value: optionValue, label }];
	});
	return options.length > 0 ? options : undefined;
}

function normalizeCopilotAssumptions(
	value: unknown,
): CopilotAssumption[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const assumptions = value.flatMap((item) => {
		const row = asObject(item);
		if (!row) {
			return [];
		}
		const key = pickNonEmptyString(row, "key");
		const label = pickNonEmptyString(row, "label");
		const assumptionValue = pickNonEmptyString(row, "value");
		if (!key || !label || !assumptionValue) {
			return [];
		}
		return [
			{
				key,
				label,
				value: assumptionValue,
				...(typeof row.editable === "boolean" ? { editable: row.editable } : {}),
				...(pickNonEmptyString(row, "sourceHint")
					? { sourceHint: pickNonEmptyString(row, "sourceHint") }
					: {}),
				...(normalizeAssumptionOptions(row.options)
					? { options: normalizeAssumptionOptions(row.options) }
					: {}),
			},
		];
	});
	return assumptions.length > 0 ? assumptions : undefined;
}

function normalizeClarificationOptions(
	value: unknown,
): CopilotClarificationOption[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const options = value.flatMap((item) => {
		const row = asObject(item);
		if (!row) {
			return [];
		}
		const optionValue = pickNonEmptyString(row, "value");
		const label = pickNonEmptyString(row, "label");
		if (!optionValue || !label) {
			return [];
		}
		return [{ value: optionValue, label }];
	});
	return options.length > 0 ? options : undefined;
}

function normalizeCopilotClarifications(
	value: unknown,
): CopilotClarification[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const clarifications = value.flatMap((item) => {
		const row = asObject(item);
		if (!row) {
			return [];
		}
		const key = pickNonEmptyString(row, "key");
		const question = pickNonEmptyString(row, "question");
		const options = normalizeClarificationOptions(row.options);
		if (!key || !question || !options) {
			return [];
		}
		return [{ key, question, options }];
	});
	return clarifications.length > 0 ? clarifications : undefined;
}

function normalizeTraceSources(value: unknown): CopilotTraceSource[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const sources = value.flatMap((item) => {
		const row = asObject(item);
		if (!row) {
			return [];
		}
		const table = pickNonEmptyString(row, "table");
		if (!table) {
			return [];
		}
		const rawFields = Array.isArray(row.fields) ? row.fields : [];
		const fields = rawFields
			.map((field) => (typeof field === "string" ? field.trim() : ""))
			.filter(Boolean);
		return [
			{
				table,
				...(fields.length > 0 ? { fields } : {}),
				...(pickNonEmptyString(row, "role")
					? { role: pickNonEmptyString(row, "role") }
					: {}),
			},
		];
	});
	return sources.length > 0 ? sources : undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const values = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter(Boolean);
	return values.length > 0 ? values : undefined;
}

function normalizeFinanceAudit(value: unknown): CopilotTraceFinanceAudit | undefined {
	const row = asObject(value);
	if (!row) {
		return undefined;
	}
	const oracleStatusRow = asObject(row.oracleStatus);
	const oracleStatus = oracleStatusRow
		? {
				...(pickNonEmptyString(oracleStatusRow, "bindingId")
					? { bindingId: pickNonEmptyString(oracleStatusRow, "bindingId") }
					: {}),
				...(pickNonEmptyString(oracleStatusRow, "reportName")
					? { reportName: pickNonEmptyString(oracleStatusRow, "reportName") }
					: {}),
				...(pickNonEmptyString(oracleStatusRow, "oracleLevel")
					? { oracleLevel: pickNonEmptyString(oracleStatusRow, "oracleLevel") }
					: {}),
				...(pickNonEmptyString(oracleStatusRow, "chain")
					? { chain: pickNonEmptyString(oracleStatusRow, "chain") }
					: {}),
				...(typeof oracleStatusRow.covered === "boolean" ? { covered: oracleStatusRow.covered } : {}),
				...(pickNonEmptyString(oracleStatusRow, "healthStatus")
					? { healthStatus: pickNonEmptyString(oracleStatusRow, "healthStatus") }
					: {}),
				...(typeof oracleStatusRow.maxDifference === "number" || typeof oracleStatusRow.maxDifference === "string"
					? { maxDifference: oracleStatusRow.maxDifference }
					: {}),
				...(pickNonEmptyString(oracleStatusRow, "failureMessage")
					? { failureMessage: pickNonEmptyString(oracleStatusRow, "failureMessage") }
					: {}),
			}
		: undefined;
	const appliedRules = Array.isArray(row.appliedRules)
		? row.appliedRules.flatMap((item) => {
				const rule = asObject(item);
				const ruleId = rule ? pickNonEmptyString(rule, "ruleId") : undefined;
				if (!rule || !ruleId) {
					return [];
				}
				return [{
					ruleId,
					...(pickNonEmptyString(rule, "description") ? { description: pickNonEmptyString(rule, "description") } : {}),
					...(pickNonEmptyString(rule, "severity") ? { severity: pickNonEmptyString(rule, "severity") } : {}),
					...(pickNonEmptyString(rule, "guardrailText") ? { guardrailText: pickNonEmptyString(rule, "guardrailText") } : {}),
					...(normalizeStringArray(rule.appliesTo) ? { appliesTo: normalizeStringArray(rule.appliesTo) } : {}),
				}];
			})
		: undefined;
	const appliedInvariants = Array.isArray(row.appliedInvariants)
		? row.appliedInvariants.flatMap((item) => {
				const invariant = asObject(item);
				const invariantId = invariant ? pickNonEmptyString(invariant, "invariantId") : undefined;
				if (!invariant || !invariantId) {
					return [];
				}
				return [{
					invariantId,
					...(pickNonEmptyString(invariant, "statement") ? { statement: pickNonEmptyString(invariant, "statement") } : {}),
					...(pickNonEmptyString(invariant, "severity") ? { severity: pickNonEmptyString(invariant, "severity") } : {}),
					...(normalizeStringArray(invariant.sourceRuleIds) ? { sourceRuleIds: normalizeStringArray(invariant.sourceRuleIds) } : {}),
					...(normalizeStringArray(invariant.sourceRefs) ? { sourceRefs: normalizeStringArray(invariant.sourceRefs) } : {}),
				}];
			})
		: undefined;
	const lineage = Array.isArray(row.lineage)
		? row.lineage.flatMap((item) => {
				const node = asObject(item);
				const name = node ? pickNonEmptyString(node, "name") : undefined;
				if (!node || !name) {
					return [];
				}
				return [{
					name,
					...(pickNonEmptyString(node, "level") ? { level: pickNonEmptyString(node, "level") } : {}),
					...(pickNonEmptyString(node, "role") ? { role: pickNonEmptyString(node, "role") } : {}),
					...(normalizeStringArray(node.refs) ? { refs: normalizeStringArray(node.refs) } : {}),
				}];
			})
		: undefined;
	const financeAudit: CopilotTraceFinanceAudit = {
		...(oracleStatus && Object.keys(oracleStatus).length > 0 ? { oracleStatus } : {}),
		...(appliedRules && appliedRules.length > 0 ? { appliedRules } : {}),
		...(appliedInvariants && appliedInvariants.length > 0 ? { appliedInvariants } : {}),
		...(lineage && lineage.length > 0 ? { lineage } : {}),
	};
	return Object.keys(financeAudit).length > 0 ? financeAudit : undefined;
}

function normalizeCopilotTrace(value: unknown): CopilotTrace | undefined {
	const row = asObject(value);
	if (!row) {
		return undefined;
	}
	const metricCaliberRow = asObject(row.metricCaliber);
	const metricCaliber = metricCaliberRow
		? {
				...(pickNonEmptyString(metricCaliberRow, "name")
					? { name: pickNonEmptyString(metricCaliberRow, "name") }
					: {}),
				...(pickNonEmptyString(metricCaliberRow, "formula")
					? { formula: pickNonEmptyString(metricCaliberRow, "formula") }
					: {}),
				...(pickNonEmptyString(metricCaliberRow, "domain")
					? { domain: pickNonEmptyString(metricCaliberRow, "domain") }
					: {}),
				...(pickNonEmptyString(metricCaliberRow, "version")
					? { version: pickNonEmptyString(metricCaliberRow, "version") }
					: {}),
				...(pickNonEmptyString(metricCaliberRow, "ontologyRef")
					? { ontologyRef: pickNonEmptyString(metricCaliberRow, "ontologyRef") }
					: {}),
			}
		: undefined;
	const sources = normalizeTraceSources(row.sources);
	const sql = pickNonEmptyString(row, "sql");
	const financeAudit = normalizeFinanceAudit(row.financeAudit);
	const trace: CopilotTrace = {
		...(metricCaliber && Object.keys(metricCaliber).length > 0
			? { metricCaliber }
			: {}),
		...(sources ? { sources } : {}),
		...(sql ? { sql } : {}),
		...(financeAudit ? { financeAudit } : {}),
	};
	return Object.keys(trace).length > 0 ? trace : undefined;
}

function pickFiniteNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function copyStringField<
	TKey extends keyof Extract<CopilotStreamEvent, { type: "done" }>,
>(
	event: Extract<CopilotStreamEvent, { type: "done" }>,
	parsed: Record<string, unknown>,
	key: TKey,
): void {
	const value = parsed[key];
	if (typeof value === "string" && value.trim()) {
		(event as Record<string, unknown>)[key] = value;
	}
}

export function normalizeCopilotDoneStreamEvent(
	payload: unknown,
): Extract<CopilotStreamEvent, { type: "done" }> {
	const parsed = asObject(payload) ?? {};
	const event: Extract<CopilotStreamEvent, { type: "done" }> = { type: "done" };
	[
		"generatedSql",
		"templateCode",
		"routedDomain",
		"targetView",
		"responseKind",
		"suggestedDisplay",
		"dataSurface",
		"qualityLevel",
		"reportCode",
	].forEach((key) =>
		copyStringField(
			event,
			parsed,
			key as keyof Extract<CopilotStreamEvent, { type: "done" }>,
		),
	);
	if (typeof parsed.qualityNotes === "string" || Array.isArray(parsed.qualityNotes)) {
		event.qualityNotes = parsed.qualityNotes as string[] | string;
	}
	if (typeof parsed.sourceRefs === "string" || Array.isArray(parsed.sourceRefs)) {
		event.sourceRefs = parsed.sourceRefs as string[] | string;
	}
	const assumptions = normalizeCopilotAssumptions(parsed.assumptions);
	if (assumptions) {
		event.assumptions = assumptions;
	}
	const confidence = pickFiniteNumber(parsed.confidence);
	if (confidence !== undefined) {
		event.confidence = confidence;
	}
	const clarifications = normalizeCopilotClarifications(parsed.clarifications);
	if (clarifications) {
		event.clarifications = clarifications;
	}
	const trace = normalizeCopilotTrace(parsed.trace);
	if (trace) {
		event.trace = trace;
	}
	return event;
}

async function sendAiAgentChatViaSessionProxy(body: {
	sessionId?: string;
	userMessage: string;
	datasourceId?: string;
	clarificationAnswers?: Record<string, string>;
	assumptionOverrides?: Record<string, string>;
}): Promise<AiAgentChatResponse> {
	const legacy = await sendJson<Record<string, unknown>>("/api/copilot/chat/send", {
		sessionId: body.sessionId,
		userMessage: body.userMessage,
		datasourceId: body.datasourceId,
		clarificationAnswers: body.clarificationAnswers,
		assumptionOverrides: body.assumptionOverrides,
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
	datasourceId?: string;
	clarificationAnswers?: Record<string, string>;
	assumptionOverrides?: Record<string, string>;
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
			clarificationAnswers: body.clarificationAnswers,
			assumptionOverrides: body.assumptionOverrides,
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
		clarificationAnswers?: Record<string, string>;
		assumptionOverrides?: Record<string, string>;
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
	listCopilotSignals: (domain = "flowerbiz") =>
		fetchJson<CopilotSignalSummary[] | AiApiEnvelope<CopilotSignalSummary[]>>(
			"/api/ai/copilot/signals?domain=" + encodeURIComponent(domain),
		).then(unwrapAiApiEnvelope),
	submitChatFeedback: (body: {
		sessionId: string;
		messageId: string;
		rating: string;
		reason?: string;
		detail?: string;
		generatedSql?: string;
		correctedSql?: string;
		correctionKind?: string;
		metricCaliberRef?: string;
		suggestedCaliber?: string;
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
	submitCaliberCorrection: (body: {
		sessionId: string;
		messageId: string;
		correctionKind: string;
		reason?: string;
		detail?: string;
		generatedSql?: string;
		correctedSql?: string;
		metricCaliberRef?: string;
		suggestedCaliber?: string;
		routedDomain?: string;
		targetView?: string;
		templateCode?: string;
		userId?: string;
		userName?: string;
	}) =>
		// TODO(P2/sprint-26 adminapi): replace this feedback-first stub with
		// ontology caliber draft / NL2SQL eval-case writeback.
		sendJson<void>("/api/ai/nl2sql/feedback", {
			...body,
			rating: "negative",
			correctedSql: body.correctedSql ?? body.suggestedCaliber,
			userId: body.userId ?? resolveLegacyAiUserId(),
			userName: body.userName ?? resolveLegacyAiUserName(),
		}).then(() => ({ accepted: true, queued: false as const })),
};

// ── CS-09: SSE streaming for copilot chat ────────────────────────────

export async function aiAgentChatSendStream(
	body: {
		sessionId?: string;
		userMessage: string;
		datasourceId?: string;
		clarificationAnswers?: Record<string, string>;
		assumptionOverrides?: Record<string, string>;
	},
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
					onEvent(normalizeCopilotDoneStreamEvent(parsed));
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
