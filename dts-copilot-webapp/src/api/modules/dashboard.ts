import { fetchJson, sendJson, requestJson } from "../httpClient.ts";
import type {
	DashboardListItem,
	DashboardDetail,
	DashboardQueryResponse,
	PublicDashboardDetail,
} from "../types.ts";

export const dashboardApi = {
	listDashboards: () => fetchJson<DashboardListItem[]>("/api/analytics/dashboard"),
	getDashboard: (id: string | number) => fetchJson<DashboardDetail>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}`),
	createDashboard: (body: unknown) => sendJson<DashboardDetail>("/api/analytics/dashboard", body),
	saveDashboard: (body: unknown) => sendJson<DashboardDetail>("/api/analytics/dashboard/save", body),
	listDashboardParamValues: (dashId: string | number, paramId: string) =>
		fetchJson<string[]>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashId))}/params/${encodeURIComponent(String(paramId))}/values`,
		),
	searchDashboardParamValues: (dashId: string | number, paramId: string, query: string) =>
		fetchJson<string[]>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashId))}/params/${encodeURIComponent(String(paramId))}/search/${encodeURIComponent(String(query))}`,
		),
	queryDashcard: (dashboardId: string | number, dashcardId: string | number, cardId: string | number, body?: unknown) =>
		sendJson<DashboardQueryResponse>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashboardId))}/dashcard/${encodeURIComponent(String(dashcardId))}/card/${encodeURIComponent(String(cardId))}/query`,
			body ?? {},
		),
	createDashboardPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}/public_link`, {}),
	deleteDashboardPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	getPublicDashboard: (uuid: string) =>
		fetchJson<PublicDashboardDetail>(`/api/analytics/public/dashboard/${encodeURIComponent(uuid)}`),
	queryPublicDashboardDashcard: (uuid: string, dashcardId: string | number, cardId: string | number, body?: unknown) =>
		sendJson<DashboardQueryResponse>(
			`/api/analytics/public/dashboard/${encodeURIComponent(uuid)}/dashcard/${encodeURIComponent(String(dashcardId))}/card/${encodeURIComponent(String(cardId))}/query`,
			body ?? {},
		),
};
