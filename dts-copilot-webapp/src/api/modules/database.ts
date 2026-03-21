import { fetchJson, sendJson, requestJson } from "../httpClient.ts";
import type {
	DatabaseListResponse,
	DatabaseMetadataResponse,
	DatabaseValidateResponse,
	DatabaseCreateResponse,
	ManagedDataSourceCreatePayload,
	PlatformDataSourceItem,
	TableSummary,
	TableDetail,
	FieldDetail,
	FieldValuesResponse,
	Metric,
	PlatformMetric,
	VisibleTable,
	DatasetCacheStats,
	DatasetCachePolicy,
} from "../types.ts";

export const databaseApi = {
	listDatabases: () => fetchJson<DatabaseListResponse>("/api/analytics/database"),
	listPlatformDataSources: () => fetchJson<PlatformDataSourceItem[]>("/api/analytics/platform/data-sources"),
	createManagedDataSource: (body: ManagedDataSourceCreatePayload) =>
		sendJson<PlatformDataSourceItem>("/api/platform/data-sources", body),
	updateManagedDataSource: (id: string | number, body: ManagedDataSourceCreatePayload) =>
		requestJson<PlatformDataSourceItem>(`/api/platform/data-sources/${encodeURIComponent(String(id))}`, "PUT", body),
	getDatabase: (dbId: string | number) =>
		fetchJson<DatabaseCreateResponse>(`/api/analytics/database/${encodeURIComponent(String(dbId))}`),
	getPlatformDataSource: (id: string | number) =>
		fetchJson<PlatformDataSourceItem>(`/api/platform/data-sources/${encodeURIComponent(String(id))}`),
	listTables: (dbId: string | number) =>
		fetchJson<TableSummary[]>(`/api/analytics/table?db_id=${encodeURIComponent(String(dbId))}`),
	getTable: (tableId: string | number) =>
		fetchJson<TableDetail>(`/api/analytics/table/${encodeURIComponent(String(tableId))}`),
	getField: (fieldId: string | number) =>
		fetchJson<FieldDetail>(`/api/analytics/field/${encodeURIComponent(String(fieldId))}`),
	getFieldValues: (fieldId: string | number) =>
		fetchJson<FieldValuesResponse>(`/api/analytics/field/${encodeURIComponent(String(fieldId))}/values`),
	validateDatabase: (body: unknown) => sendJson<DatabaseValidateResponse>("/api/analytics/database/validate", body),
	createDatabase: (body: unknown) => sendJson<DatabaseCreateResponse>("/api/analytics/database", body),
	syncDatabaseSchema: (dbId: string | number) =>
		sendJson<Record<string, unknown>>(`/api/analytics/database/${encodeURIComponent(String(dbId))}/sync_schema`, {}),
	updateDatabase: (id: string | number, body: unknown) =>
		requestJson<DatabaseCreateResponse>(`/api/analytics/database/${encodeURIComponent(String(id))}`, "PUT", body),
	deleteDatabase: (id: string | number) =>
		requestJson<void>(`/api/analytics/database/${encodeURIComponent(String(id))}`, "DELETE"),
	getDatabaseMetadata: (dbId: string | number) =>
		fetchJson<DatabaseMetadataResponse>(`/api/analytics/database/${encodeURIComponent(String(dbId))}/metadata`),
	listMetrics: () => fetchJson<Metric[]>("/api/analytics/metric"),
	listMetricVersions: (metricId: string | number) =>
		fetchJson<string[]>("/api/analytics/query-trace/metric/" + encodeURIComponent(String(metricId)) + "/versions"),
	listPlatformMetrics: () => fetchJson<PlatformMetric[]>("/api/analytics/platform/metrics"),
	listVisibleTables: () => fetchJson<Array<number | VisibleTable>>("/api/analytics/platform/visible-tables"),
	getDatasetCacheStats: () => fetchJson<DatasetCacheStats>("/api/analytics/dataset/cache/stats"),
	getDatasetCachePolicy: (databaseId: string | number) =>
		fetchJson<DatasetCachePolicy>("/api/analytics/dataset/cache/policy/" + encodeURIComponent(String(databaseId))),
	setDatasetCachePolicy: (databaseId: string | number, body: unknown) =>
		sendJson<DatasetCachePolicy>("/api/analytics/dataset/cache/policy/" + encodeURIComponent(String(databaseId)), body),
	warmupDatasetCache: (body: unknown) => sendJson<Record<string, unknown>>("/api/analytics/dataset/cache/warmup", body),
};
