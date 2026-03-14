import { getPlatformTokens } from "./platformSession";

// ── Hub Summary types ────────────────────────────────────────────────

export interface ObjectTypeSummary {
	typeId: string;
	displayName: string;
	icon: string;
	instanceCount: number;
	alertCount: number;
}

export interface PendingAction {
	type: string;
	severity: string;
	title: string;
	count: number;
}

export interface KeyMetric {
	metricId: string;
	name: string;
	value: number;
	unit: string;
	trend: string;
}

export interface HubSummary {
	objectTypes: ObjectTypeSummary[];
	pendingActions: PendingAction[];
	keyMetrics: KeyMetric[];
	totalActionTypes: number;
}

// ── Instance types ───────────────────────────────────────────────────

export interface ObjectInstance {
	id: string;
	typeId: string;
	externalId: string;
	displayName: string;
	properties: Record<string, unknown>;
	datasourceId: string | null;
	sourceTable: string | null;
	sourceIdColumn: string | null;
	createdAt: string;
	updatedAt: string;
}

// ── Action types ─────────────────────────────────────────────────────

export interface ActionTypeDef {
	actionTypeId: string;
	objectTypeId: string;
	displayName: string;
	description: string;
	agentToolId: string;
	paramsSchema: Record<string, unknown>;
	confirmRequired: string;
	appPackId: string;
}

export interface ActionExecutionResult {
	status: "SUCCESS" | "PENDING";
	result?: {
		success: boolean;
		actionTypeId: string;
		toolId: string;
		payload: unknown;
		message: string;
	};
	request?: {
		requestId: string;
		status: string;
		riskLevel: string;
	};
}

// ── Quality Signal types ─────────────────────────────────────────────

export interface QualitySignal {
	id: string;
	anomalyType: string;
	severity: string;
	description: string;
	metricName: string | null;
	currentValue: number | null;
	expectedRange: string | null;
	columnName: string | null;
	status: string;
}

// ── Graph types ──────────────────────────────────────────────────────

export interface GraphNode {
	id: string;
	typeId: string;
	displayName: string;
	properties: Record<string, unknown>;
}

export interface GraphEdge {
	source: string;
	target: string;
	linkTypeId: string;
	displayName: string;
}

export interface GraphView {
	nodes: GraphNode[];
	edges: GraphEdge[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
	const headers: Record<string, string> = { Accept: "application/json" };
	const { accessToken } = getPlatformTokens();
	if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
	return headers;
}

function jsonHeaders(): Record<string, string> {
	return {
		...authHeaders(),
		"Content-Type": "application/json",
	};
}

async function unwrap<T>(res: Response, fallback: T): Promise<T> {
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const json = (await res.json()) as { data?: T };
	return json.data ?? fallback;
}

// ── API calls ────────────────────────────────────────────────────────

export async function fetchHubSummary(packId: string): Promise<HubSummary> {
	const res = await fetch(
		`/api/ontology/hub/summary?packId=${encodeURIComponent(packId)}`,
		{ headers: authHeaders(), credentials: "include" },
	);
	return unwrap(res, {
		objectTypes: [],
		pendingActions: [],
		keyMetrics: [],
		totalActionTypes: 0,
	});
}

export async function fetchInstances(
	typeId: string,
	keyword?: string,
	limit = 50,
): Promise<ObjectInstance[]> {
	const params = new URLSearchParams({ typeId, limit: String(limit) });
	if (keyword) params.set("q", keyword);
	const res = await fetch(`/api/ontology/instances?${params}`, {
		headers: authHeaders(),
		credentials: "include",
	});
	return unwrap(res, []);
}

export async function fetchInstance(
	id: string,
): Promise<ObjectInstance | null> {
	const res = await fetch(`/api/ontology/instances/${encodeURIComponent(id)}`, {
		headers: authHeaders(),
		credentials: "include",
	});
	return unwrap<ObjectInstance | null>(res, null);
}

export async function fetchInstanceGraph(
	id: string,
	depth = 2,
): Promise<GraphView> {
	const res = await fetch(
		`/api/ontology/instances/${encodeURIComponent(id)}/graph?depth=${depth}`,
		{ headers: authHeaders(), credentials: "include" },
	);
	return unwrap(res, { nodes: [], edges: [] });
}

export async function fetchActionTypes(
	typeId: string,
): Promise<ActionTypeDef[]> {
	const res = await fetch(
		`/api/ontology/types/${encodeURIComponent(typeId)}/actions`,
		{ headers: authHeaders(), credentials: "include" },
	);
	return unwrap(res, []);
}

export async function executeAction(
	instanceId: string,
	actionId: string,
	params: Record<string, unknown> = {},
): Promise<ActionExecutionResult> {
	const res = await fetch(
		`/api/ontology/instances/${encodeURIComponent(instanceId)}/actions/${encodeURIComponent(actionId)}`,
		{
			method: "POST",
			headers: jsonHeaders(),
			credentials: "include",
			body: JSON.stringify(params),
		},
	);
	return unwrap(res, { status: "SUCCESS" });
}

export async function fetchQualitySignals(
	objectTypeId: string,
	severity?: string,
): Promise<QualitySignal[]> {
	const params = new URLSearchParams({ objectTypeId });
	if (severity) params.set("severity", severity);
	const res = await fetch(`/api/quality/signals?${params}`, {
		headers: authHeaders(),
		credentials: "include",
	});
	return unwrap(res, []);
}

export async function fetchInstanceSignals(
	instanceId: string,
): Promise<QualitySignal[]> {
	const res = await fetch(
		`/api/quality/signals/instance?instanceId=${encodeURIComponent(instanceId)}`,
		{ headers: authHeaders(), credentials: "include" },
	);
	return unwrap(res, []);
}
