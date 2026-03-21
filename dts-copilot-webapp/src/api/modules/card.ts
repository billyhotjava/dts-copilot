import { fetchJson, sendJson, requestJson } from "../httpClient.ts";
import type {
	CollectionListItem,
	CollectionItem,
	CardListItem,
	CardDetail,
	CardQueryResponse,
	PublicCardDetail,
	AnalysisDraftListItem,
	AnalysisDraftDetail,
	AnalysisDraftRunResponse,
	AnalysisDraftSaveCardResponse,
	SearchResponse,
	TrashResponse,
	QueryTraceFailureSummary,
	ExplainabilityResponse,
	ExploreSessionItem,
	ReportTemplateItem,
	FixedReportCatalogItem,
	FixedReportRunResponse,
	ReportRunItem,
	MetricLensSummary,
	MetricLensDetail,
	MetricLensCompare,
	Nl2SqlEvalCaseItem,
	Nl2SqlEvalRunSummary,
	Nl2SqlEvalGateRunResponse,
	Nl2SqlEvalRunRecord,
	Nl2SqlEvalCompareResponse,
} from "../types.ts";
import {
	buildFixedReportCatalogItemUrl,
	buildFixedReportCatalogUrl,
	buildFixedReportRunRequest,
} from "../../pages/fixed-reports/fixedReportApi.ts";

export const cardApi = {
	listCollections: () => fetchJson<CollectionListItem[]>("/api/analytics/collection"),
	getCollectionItems: (id: string | number) =>
		fetchJson<CollectionItem[]>(`/api/analytics/collection/${encodeURIComponent(String(id))}/items`),
	listCards: () => fetchJson<CardListItem[]>("/api/analytics/card"),
	getCard: (id: string | number) => fetchJson<CardDetail>(`/api/analytics/card/${encodeURIComponent(String(id))}`),
	createCard: (body: unknown) => sendJson<CardDetail>("/api/analytics/card", body),
	updateCard: (id: string | number, body: unknown) =>
		requestJson<CardDetail>(`/api/analytics/card/${encodeURIComponent(String(id))}`, "PUT", body),
	listAnalysisDrafts: () => fetchJson<AnalysisDraftListItem[]>("/api/analytics/analysis-drafts"),
	getAnalysisDraft: (id: string | number) =>
		fetchJson<AnalysisDraftDetail>(`/api/analytics/analysis-drafts/${encodeURIComponent(String(id))}`),
	createAnalysisDraft: (body: unknown) => sendJson<AnalysisDraftDetail>("/api/analytics/analysis-drafts", body),
	archiveAnalysisDraft: (id: string | number) =>
		sendJson<AnalysisDraftDetail>(`/api/analytics/analysis-drafts/${encodeURIComponent(String(id))}/archive`, {}),
	deleteAnalysisDraft: (id: string | number) =>
		requestJson<void>(`/api/analytics/analysis-drafts/${encodeURIComponent(String(id))}`, "DELETE"),
	runAnalysisDraft: (id: string | number, body?: unknown) =>
		sendJson<AnalysisDraftRunResponse>(`/api/analytics/analysis-drafts/${encodeURIComponent(String(id))}/run`, body ?? {}),
	saveAnalysisDraftCard: (id: string | number) =>
		sendJson<AnalysisDraftSaveCardResponse>(`/api/analytics/analysis-drafts/${encodeURIComponent(String(id))}/save-card`, {}),
	queryCard: (id: string | number, body?: unknown) =>
		sendJson<CardQueryResponse>(`/api/analytics/card/${encodeURIComponent(String(id))}/query`, body ?? {}),
	runDatasetQuery: (body: unknown) => sendJson<CardQueryResponse>("/api/analytics/dataset", body),
	search: (q: string) =>
		fetchJson<SearchResponse>(`/api/analytics/search?q=${encodeURIComponent(String(q ?? ""))}&limit=25&offset=0`),
	getTrash: () => fetchJson<TrashResponse>("/api/analytics/trash"),
	createCardPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>(`/api/analytics/card/${encodeURIComponent(String(id))}/public_link`, {}),
	deleteCardPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/card/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	getPublicCard: (uuid: string) => fetchJson<PublicCardDetail>(`/api/analytics/public/card/${encodeURIComponent(uuid)}`),
	queryPublicCard: (uuid: string, body?: unknown) =>
		sendJson<CardQueryResponse>(`/api/analytics/public/card/${encodeURIComponent(uuid)}/query`, body ?? {}),
	getQueryTraceFailureSummary: (days = 7, topN = 10, chain?: string) => {
		const qs = new URLSearchParams();
		qs.set("days", String(days));
		qs.set("topN", String(topN));
		if (chain && chain.trim().length > 0) {
			qs.set("chain", chain.trim());
		}
		return fetchJson<QueryTraceFailureSummary>("/api/analytics/query-trace/failure-summary?" + qs.toString());
	},
	explainCard: (cardId: string | number, body?: unknown) =>
		sendJson<ExplainabilityResponse>("/api/analytics/explain/card/" + encodeURIComponent(String(cardId)), body ?? {}),
	listExploreSessions: (params?: {
		includeArchived?: boolean;
		dept?: string;
		projectKey?: string;
		limit?: number;
	}) => {
		const qs = new URLSearchParams();
		qs.set("includeArchived", String(Boolean(params?.includeArchived)));
		if (params?.dept && params.dept.trim()) {
			qs.set("dept", params.dept.trim());
		}
		if (params?.projectKey && params.projectKey.trim()) {
			qs.set("projectKey", params.projectKey.trim());
		}
		qs.set("limit", String(params?.limit ?? 100));
		return fetchJson<ExploreSessionItem[]>("/api/analytics/explore-session?" + qs.toString());
	},
	getExploreSession: (id: string | number) =>
		fetchJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id))),
	createExploreSession: (body: unknown) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session", body ?? {}),
	updateExploreSession: (id: string | number, body: unknown) =>
		requestJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)), "PUT", body),
	appendExploreSessionStep: (id: string | number, body: unknown) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/steps", body ?? {}),
	replayExploreSessionStep: (id: string | number, stepIndex: number) =>
		sendJson<Record<string, unknown>>(
			"/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/replay",
			{ stepIndex },
		),
	archiveExploreSession: (id: string | number) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/archive", {}),
	cloneExploreSession: (id: string | number) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/clone", {}),
	createExploreSessionPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/public_link", {}),
	deleteExploreSessionPublicLink: (id: string | number) =>
		requestJson<void>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/public_link", "DELETE"),
	getPublicExploreSession: (uuid: string) =>
		fetchJson<ExploreSessionItem>("/api/analytics/explore-session/public/" + encodeURIComponent(String(uuid))),
	listReportTemplates: (limit = 100) =>
		fetchJson<ReportTemplateItem[]>("/api/analytics/report-factory/templates?limit=" + encodeURIComponent(String(limit))),
	listFixedReportCatalog: (params?: { domain?: string; category?: string; limit?: number }) =>
		fetchJson<FixedReportCatalogItem[]>(buildFixedReportCatalogUrl(params)),
	getFixedReportCatalogItem: (templateCode: string) =>
		fetchJson<FixedReportCatalogItem>(buildFixedReportCatalogItemUrl(templateCode)),
	runFixedReport: (
		templateCode: string,
		body?: { parameters?: Record<string, unknown> },
	) => {
		const request = buildFixedReportRunRequest(templateCode, body?.parameters)
		return sendJson<FixedReportRunResponse>(request.url, request.body)
	},
	createReportTemplate: (body: unknown) =>
		sendJson<ReportTemplateItem>("/api/analytics/report-factory/templates", body ?? {}),
	updateReportTemplate: (id: string | number, body: unknown) =>
		requestJson<ReportTemplateItem>("/api/analytics/report-factory/templates/" + encodeURIComponent(String(id)), "PUT", body),
	deleteReportTemplate: (id: string | number) =>
		requestJson<void>("/api/analytics/report-factory/templates/" + encodeURIComponent(String(id)), "DELETE"),
	generateReportRun: (body: unknown) =>
		sendJson<ReportRunItem>("/api/analytics/report-factory/generate", body ?? {}),
	listReportRuns: (limit = 100) =>
		fetchJson<ReportRunItem[]>("/api/analytics/report-factory/runs?limit=" + encodeURIComponent(String(limit))),
	getReportRun: (id: string | number) =>
		fetchJson<ReportRunItem>("/api/analytics/report-factory/runs/" + encodeURIComponent(String(id))),
	getReportRunExportUrl: (id: string | number, format: "html" | "markdown" = "html") =>
		"/api/analytics/report-factory/runs/"
		+ encodeURIComponent(String(id))
		+ "/export?format="
		+ encodeURIComponent(String(format)),
	listMetricLens: () =>
		fetchJson<MetricLensSummary[]>("/api/analytics/metric-lens"),
	getMetricLens: (metricId: string | number) =>
		fetchJson<MetricLensDetail>("/api/analytics/metric-lens/" + encodeURIComponent(String(metricId))),
	compareMetricLensVersions: (metricId: string | number, leftVersion: string, rightVersion: string) =>
		fetchJson<MetricLensCompare>(
			"/api/analytics/metric-lens/"
			+ encodeURIComponent(String(metricId))
			+ "/compare?leftVersion="
			+ encodeURIComponent(String(leftVersion))
			+ "&rightVersion="
			+ encodeURIComponent(String(rightVersion)),
		),
	getMetricLensConflicts: () =>
		fetchJson<Array<Record<string, unknown>>>("/api/analytics/metric-lens/conflicts"),
	listNl2SqlEvalCases: (enabledOnly = false, limit = 200) =>
		fetchJson<Nl2SqlEvalCaseItem[]>(
			"/api/analytics/nl2sql-eval/cases?enabledOnly="
			+ encodeURIComponent(String(enabledOnly))
			+ "&limit="
			+ encodeURIComponent(String(limit)),
		),
	createNl2SqlEvalCase: (body: unknown) =>
		sendJson<Nl2SqlEvalCaseItem>("/api/analytics/nl2sql-eval/cases", body ?? {}),
	updateNl2SqlEvalCase: (id: string | number, body: unknown) =>
		requestJson<Nl2SqlEvalCaseItem>("/api/analytics/nl2sql-eval/cases/" + encodeURIComponent(String(id)), "PUT", body),
	deleteNl2SqlEvalCase: (id: string | number) =>
		requestJson<void>("/api/analytics/nl2sql-eval/cases/" + encodeURIComponent(String(id)), "DELETE"),
	runNl2SqlEvaluation: (body?: unknown) =>
		sendJson<Nl2SqlEvalRunSummary>("/api/analytics/nl2sql-eval/run", body ?? {}),
	runNl2SqlEvaluationWithGate: (body?: unknown) =>
		sendJson<Nl2SqlEvalGateRunResponse>("/api/analytics/nl2sql-eval/run-gated", body ?? {}),
	listNl2SqlEvalRuns: (limit = 20) =>
		fetchJson<Nl2SqlEvalRunRecord[]>(
			"/api/analytics/nl2sql-eval/runs?limit=" + encodeURIComponent(String(limit)),
		),
	compareNl2SqlEvalRuns: (baselineRunId: string | number, candidateRunId: string | number) =>
		fetchJson<Nl2SqlEvalCompareResponse>(
			"/api/analytics/nl2sql-eval/compare?baselineRunId="
			+ encodeURIComponent(String(baselineRunId))
			+ "&candidateRunId="
			+ encodeURIComponent(String(candidateRunId)),
		),
};
