import { fetchJson, sendJson, requestJson, requestBinary } from "../httpClient.ts";
import type {
	ScreenListItem,
	ScreenDetail,
	ScreenVersion,
	ScreenVersionDiff,
	ScreenWarmupSummary,
	ScreenAclEntry,
	ScreenEditLock,
	ScreenAuditEntry,
	ScreenComment,
	ScreenCommentChanges,
	ScreenCollaborationPresence,
	ScreenPublicLinkPolicy,
	ScreenHealthReport,
	ScreenExportPrepareRequest,
	ScreenExportPrepareResult,
	ScreenExportReportRequest,
	ScreenExportReportResult,
	ScreenExportRenderRequest,
	ScreenSpecValidationResponse,
	ScreenAiGenerationRequest,
	ScreenAiRevisionRequest,
	ScreenAiGenerationResponse,
	ScreenTemplateItem,
	ScreenTemplateVersionItem,
	ScreenPluginManifest,
	ScreenPluginValidationResult,
	ScreenIndustryPack,
	ScreenIndustryPackImportResult,
	ScreenIndustryPackPresets,
	ScreenIndustryPackValidationResult,
	ScreenIndustryPackAuditRow,
	ScreenIndustryConnectorPlan,
	ScreenIndustryConnectorProbe,
	ScreenIndustryOpsHealth,
	ScreenIndustryRuntimeProbe,
	ScreenCompliancePolicy,
	ScreenComplianceReport,
	ScreenComplianceReportQuery,
	PublicScreenDetail,
} from "../types.ts";

export const screenApi = {
	// Screen Designer API
	listScreenPlugins: () => fetchJson<ScreenPluginManifest[]>("/api/analytics/screen-plugins"),
	validateScreenPlugin: (body: unknown) =>
		sendJson<ScreenPluginValidationResult>("/api/analytics/screen-plugins/validate", body),
	exportScreenIndustryPack: (body?: unknown) =>
		sendJson<ScreenIndustryPack>("/api/analytics/screen-packs/export", body ?? {}),
	importScreenIndustryPack: (body: unknown) =>
		sendJson<ScreenIndustryPackImportResult>("/api/analytics/screen-packs/import", body),
	getScreenIndustryPackPresets: () =>
		fetchJson<ScreenIndustryPackPresets>("/api/analytics/screen-packs/presets"),
	validateScreenIndustryPack: (body: unknown) =>
		sendJson<ScreenIndustryPackValidationResult>("/api/analytics/screen-packs/validate", body),
	listScreenIndustryPackAudit: (limit = 100) =>
		fetchJson<ScreenIndustryPackAuditRow[]>(
			"/api/analytics/screen-packs/audit?limit=" + encodeURIComponent(String(limit)),
		),
	generateScreenIndustryConnectorPlan: (body?: unknown) =>
		sendJson<ScreenIndustryConnectorPlan>("/api/analytics/screen-packs/connectors/plan", body ?? {}),
	probeScreenIndustryConnectors: (body?: unknown) =>
		sendJson<ScreenIndustryConnectorProbe>("/api/analytics/screen-packs/connectors/probe", body ?? {}),
	getScreenIndustryOpsHealth: (deploymentMode?: string, includeRuntime = false) => {
		const qs = new URLSearchParams();
		if (deploymentMode && String(deploymentMode).trim().length > 0) {
			qs.set("deploymentMode", String(deploymentMode));
		}
		if (includeRuntime) {
			qs.set("includeRuntime", "true");
		}
		const query = qs.toString();
		const suffix = query.length > 0 ? `?${query}` : "";
		return fetchJson<ScreenIndustryOpsHealth>("/api/analytics/screen-packs/ops/health" + suffix);
	},
	probeScreenIndustryRuntime: (body?: unknown) =>
		sendJson<ScreenIndustryRuntimeProbe>("/api/analytics/screen-packs/ops/runtime-probe", body ?? {}),
	getScreenCompliancePolicy: () =>
		fetchJson<ScreenCompliancePolicy>("/api/analytics/screen-compliance/policy"),
	updateScreenCompliancePolicy: (body: unknown) =>
		requestJson<ScreenCompliancePolicy>("/api/analytics/screen-compliance/policy", "PUT", body),
	getScreenComplianceReport: (query?: ScreenComplianceReportQuery) => {
		const qs = new URLSearchParams();
		if (query?.screenId !== undefined && query?.screenId !== null && String(query.screenId).trim() !== "") {
			qs.set("screenId", String(query.screenId));
		}
		if (query?.days !== undefined) {
			qs.set("days", String(query.days));
		}
		if (query?.limit !== undefined) {
			qs.set("limit", String(query.limit));
		}
		const suffix = qs.toString();
		const url = suffix.length > 0
			? "/api/analytics/screen-compliance/report?" + suffix
			: "/api/analytics/screen-compliance/report";
		return fetchJson<ScreenComplianceReport>(url);
	},
	generateScreenSpec: (body: ScreenAiGenerationRequest) =>
		sendJson<ScreenAiGenerationResponse>("/api/analytics/screens/ai/generate", body),
	reviseScreenSpec: (body: ScreenAiRevisionRequest) =>
		sendJson<ScreenAiGenerationResponse>("/api/analytics/screens/ai/revise", body),
	listScreens: () => fetchJson<ScreenListItem[]>("/api/analytics/screens"),
	listScreenTemplates: (params?: {
		q?: string;
		category?: string;
		tag?: string;
		visibility?: string;
		listed?: boolean;
	}) => {
		const qs = new URLSearchParams();
		if (params?.q) qs.set("q", String(params.q));
		if (params?.category) qs.set("category", String(params.category));
		if (params?.tag) qs.set("tag", String(params.tag));
		if (params?.visibility) qs.set("visibility", String(params.visibility));
		if (typeof params?.listed === "boolean") qs.set("listed", String(params.listed));
		const query = qs.toString();
		const url = query.length > 0 ? "/api/analytics/screen-templates?" + query : "/api/analytics/screen-templates";
		return fetchJson<ScreenTemplateItem[]>(url);
	},
	getScreenTemplate: (id: string | number) =>
		fetchJson<ScreenTemplateItem>("/api/analytics/screen-templates/" + encodeURIComponent(String(id))),
	createScreenTemplate: (body: unknown) =>
		sendJson<ScreenTemplateItem>("/api/analytics/screen-templates", body),
	createScreenTemplateFromScreen: (screenId: string | number, body?: unknown) =>
		sendJson<ScreenTemplateItem>("/api/analytics/screen-templates/from-screen/" + encodeURIComponent(String(screenId)), body ?? {}),
	updateScreenTemplate: (id: string | number, body: unknown) =>
		requestJson<ScreenTemplateItem>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)), "PUT", body),
	updateScreenTemplateListing: (id: string | number, listed: boolean) =>
		requestJson<ScreenTemplateItem>(
			"/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/listing",
			"PUT",
			{ listed },
		),
	listScreenTemplateVersions: (id: string | number, limit = 50) =>
		fetchJson<ScreenTemplateVersionItem[]>(
			"/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/versions?limit=" + encodeURIComponent(String(limit)),
		),
	restoreScreenTemplateVersion: (id: string | number, versionNo: number) =>
		sendJson<ScreenTemplateItem>(
			"/api/analytics/screen-templates/"
				+ encodeURIComponent(String(id))
				+ "/restore/"
				+ encodeURIComponent(String(versionNo)),
			{},
		),
	deleteScreenTemplate: (id: string | number) =>
		requestJson<void>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)), "DELETE"),
	createScreenFromTemplate: (id: string | number, body?: unknown) =>
		sendJson<ScreenDetail>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/create-screen", body ?? {}),
	getScreen: (
		id: string | number,
		options?: { mode?: "draft" | "published" | "preview" | string; fallbackDraft?: boolean },
	) => {
		const params = new URLSearchParams();
		if (options?.mode) params.set("mode", String(options.mode));
		if (options?.fallbackDraft !== undefined) params.set("fallbackDraft", String(options.fallbackDraft));
		const qs = params.toString();
		const base = `/api/analytics/screens/${encodeURIComponent(String(id))}`;
		return fetchJson<ScreenDetail>(qs ? `${base}?${qs}` : base);
	},
	getScreenHealth: (id: string | number) =>
		fetchJson<ScreenHealthReport>(`/api/analytics/screens/${encodeURIComponent(String(id))}/health`),
	prepareScreenExport: (id: string | number, body?: ScreenExportPrepareRequest) =>
		sendJson<ScreenExportPrepareResult>(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-prepare`, body ?? {}),
	reportScreenExport: (id: string | number, body: ScreenExportReportRequest) =>
		sendJson<ScreenExportReportResult>(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-report`, body),
	renderScreenExport: (id: string | number, body?: ScreenExportRenderRequest) =>
		requestBinary(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-render`, "POST", body ?? {}),
	validateScreenSpec: (body: unknown) =>
		sendJson<ScreenSpecValidationResponse>("/api/analytics/screens/validate-spec", body),
	createScreen: (body: unknown) => sendJson<ScreenDetail>("/api/analytics/screens", body),
	listScreenVersions: (id: string | number) =>
		fetchJson<ScreenVersion[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/versions`),
	compareScreenVersions: (id: string | number, fromVersionId: string | number, toVersionId: string | number) =>
		fetchJson<ScreenVersionDiff>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/versions/compare`
			+ `?fromVersionId=${encodeURIComponent(String(fromVersionId))}`
			+ `&toVersionId=${encodeURIComponent(String(toVersionId))}`,
		),
	publishScreen: (id: string | number) =>
		sendJson<{ screen: ScreenDetail; version: ScreenVersion; warmup?: ScreenWarmupSummary }>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/publish`,
			{},
		),
	rollbackScreenVersion: (id: string | number, versionId: string | number) =>
		sendJson<{ screen: ScreenDetail; version: ScreenVersion; warmup?: ScreenWarmupSummary }>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/rollback/${encodeURIComponent(String(versionId))}`,
			{},
		),
	updateScreen: (id: string | number, body: unknown) =>
		requestJson<ScreenDetail>(`/api/analytics/screens/${encodeURIComponent(String(id))}`, "PUT", body),
	deleteScreen: (id: string | number) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}`, "DELETE"),
	getScreenAcl: (id: string | number) =>
		fetchJson<ScreenAclEntry[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/acl`),
	updateScreenAcl: (id: string | number, body: { entries: ScreenAclEntry[] }) =>
		requestJson<ScreenAclEntry[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/acl`, "PUT", body),
	getScreenEditLock: (id: string | number) =>
		fetchJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock`),
	acquireScreenEditLock: (id: string | number, body?: { ttlSeconds?: number; forceTakeover?: boolean }) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/acquire`, body ?? {}),
	heartbeatScreenEditLock: (id: string | number, body?: { ttlSeconds?: number }) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/heartbeat`, body ?? {}),
	releaseScreenEditLock: (id: string | number) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/release`, {}),
	getScreenAuditLogs: (id: string | number, limit = 200) =>
		fetchJson<ScreenAuditEntry[]>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/audit?limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenComments: (id: string | number, limit = 200) =>
		fetchJson<ScreenComment[]>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments?limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenCommentChanges: (id: string | number, sinceId = 0, limit = 200) =>
		fetchJson<ScreenCommentChanges>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/changes`
			+ `?sinceId=${encodeURIComponent(String(sinceId))}`
			+ `&limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenCommentChangesLive: (id: string | number, sinceId = 0, limit = 200, waitMs = 12000) =>
		fetchJson<ScreenCommentChanges>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/live`
			+ `?sinceId=${encodeURIComponent(String(sinceId))}`
			+ `&limit=${encodeURIComponent(String(limit))}`
			+ `&waitMs=${encodeURIComponent(String(waitMs))}`,
		),
	getScreenCollaborationPresence: (id: string | number, ttlSeconds = 45, sessionId?: string) =>
		fetchJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`
			+ `${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`,
		),
	heartbeatScreenCollaborationPresence: (
		id: string | number,
		body: {
			sessionId?: string;
			componentId?: string | null;
			typing?: boolean;
			clientType?: string;
			selectedIds?: string[];
		},
		ttlSeconds = 45,
	) =>
		sendJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence/heartbeat`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`,
			body ?? {},
		),
	leaveScreenCollaborationPresence: (
		id: string | number,
		body?: {
			sessionId?: string;
		},
		ttlSeconds = 45,
	) =>
		sendJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence/leave`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`,
			body ?? {},
		),
	createScreenComment: (id: string | number, body: {
		message: string;
		componentId?: string | null;
		anchor?: Record<string, unknown>;
		mentions?: Array<Record<string, unknown>>;
	}) =>
		sendJson<ScreenComment>(`/api/analytics/screens/${encodeURIComponent(String(id))}/comments`, body),
	resolveScreenComment: (id: string | number, commentId: string | number, body?: { note?: string }) =>
		sendJson<ScreenComment>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/${encodeURIComponent(String(commentId))}/resolve`,
			body ?? {},
		),
	reopenScreenComment: (id: string | number, commentId: string | number, body?: { note?: string }) =>
		sendJson<ScreenComment>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/${encodeURIComponent(String(commentId))}/reopen`,
			body ?? {},
		),
	createScreenPublicLink: (id: string | number, body?: unknown) =>
		sendJson<ScreenPublicLinkPolicy>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link`, body ?? {}),
	updateScreenPublicLinkPolicy: (id: string | number, body: unknown) =>
		requestJson<ScreenPublicLinkPolicy>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link/policy`, "PUT", body),
	deleteScreenPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	getPublicScreen: (uuid: string) =>
		fetchJson<PublicScreenDetail>(`/api/analytics/public/screen/${encodeURIComponent(uuid)}`),
	// Snapshot API
	createSnapshot: (id: string | number, body: unknown) =>
		sendJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot`, body),
	getSnapshotTask: (taskId: string) =>
		fetchJson<unknown>(`/api/analytics/screens/snapshot-tasks/${encodeURIComponent(taskId)}`),
	listSnapshotSchedules: (id: string | number) =>
		fetchJson<unknown[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules`),
	createSnapshotSchedule: (id: string | number, body: unknown) =>
		sendJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules`, body),
	updateSnapshotSchedule: (id: string | number, scheduleId: string, body: unknown) =>
		requestJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules/${encodeURIComponent(scheduleId)}`, "PUT", body),
	deleteSnapshotSchedule: (id: string | number, scheduleId: string) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules/${encodeURIComponent(scheduleId)}`, "DELETE"),
	listSnapshotTasks: (id: string | number) =>
		fetchJson<unknown[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-tasks`),
	// Marketplace API
	listMarketplaceComponents: (params?: { search?: string; category?: string }) => {
		const qs = new URLSearchParams();
		if (params?.search) qs.set('search', params.search);
		if (params?.category) qs.set('category', params.category);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return fetchJson<unknown[]>(`/api/analytics/marketplace/components${suffix}`);
	},
	listMarketplaceTemplates: (params?: { search?: string; category?: string }) => {
		const qs = new URLSearchParams();
		if (params?.search) qs.set('search', params.search);
		if (params?.category) qs.set('category', params.category);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return fetchJson<unknown[]>(`/api/analytics/marketplace/templates${suffix}`);
	},
	installMarketplaceComponent: (id: string) =>
		sendJson<unknown>(`/api/analytics/marketplace/components/${encodeURIComponent(id)}/install`, {}),
	installMarketplaceTemplate: (id: string) =>
		sendJson<unknown>(`/api/analytics/marketplace/templates/${encodeURIComponent(id)}/install`, {}),
};
