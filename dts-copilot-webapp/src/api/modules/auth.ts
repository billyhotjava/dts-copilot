import { fetchJson, sendJson, requestJson } from "../httpClient.ts";
import type {
	CurrentUser,
	CopilotSiteSettings,
} from "../types.ts";

export const authApi = {
	getCurrentUser: () => fetchJson<CurrentUser>("/api/user/current"),
	listUsers: () => fetchJson<CurrentUser[]>("/api/user"),
	getUser: (id: number) => fetchJson<CurrentUser>(`/api/user/${id}`),
	createUser: (body: { first_name: string; last_name: string; username: string; password?: string }) =>
		sendJson<CurrentUser>("/api/user", body),
	updateUser: (id: number, body: Record<string, unknown>) =>
		requestJson<CurrentUser>(`/api/user/${id}`, "PUT", body),
	deactivateUser: (id: number) =>
		requestJson<void>(`/api/user/${id}`, "DELETE"),
	reactivateUser: (id: number) =>
		requestJson<CurrentUser>(`/api/user/${id}/reactivate`, "PUT"),
	changeUserPassword: (id: number, body: { password: string; old_password?: string }) =>
		requestJson<void>(`/api/user/${id}/password`, "PUT", body),
	getHealth: () => fetchJson<{ status?: string }>("/api/analytics/health"),
	getCopilotSiteSettings: () => fetchJson<CopilotSiteSettings>("/api/admin/copilot/settings/site"),
	updateCopilotSiteSettings: (body: CopilotSiteSettings) =>
		requestJson<CopilotSiteSettings>("/api/admin/copilot/settings/site", "PUT", body),
};
