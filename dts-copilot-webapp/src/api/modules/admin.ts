import { fetchJson, sendJson, requestJson } from "../httpClient.ts";
import type {
	CopilotProvider,
	CopilotProviderTemplate,
	CopilotProviderPayload,
	CopilotProviderTestResult,
	CopilotApiKeyItem,
	CopilotApiKeyReveal,
	CopilotApiKeyCreatePayload,
} from "../types.ts";

export const adminApi = {
	listCopilotProviders: () => fetchJson<CopilotProvider[]>("/api/admin/copilot/providers"),
	listCopilotProviderTemplates: () =>
		fetchJson<CopilotProviderTemplate[]>("/api/admin/copilot/providers/templates"),
	createCopilotProvider: (body: CopilotProviderPayload) =>
		sendJson<CopilotProvider>("/api/admin/copilot/providers", body),
	updateCopilotProvider: (id: string | number, body: CopilotProviderPayload) =>
		requestJson<CopilotProvider>("/api/admin/copilot/providers/" + encodeURIComponent(String(id)), "PUT", body),
	deleteCopilotProvider: (id: string | number) =>
		requestJson<{ id?: number; deleted?: boolean }>(
			"/api/admin/copilot/providers/" + encodeURIComponent(String(id)),
			"DELETE",
		),
	testCopilotProvider: (id: string | number) =>
		sendJson<CopilotProviderTestResult>(
			"/api/admin/copilot/providers/" + encodeURIComponent(String(id)) + "/test",
			{},
		),
	listCopilotApiKeys: () => fetchJson<CopilotApiKeyItem[]>("/api/admin/copilot/api-keys"),
	createCopilotApiKey: (body: CopilotApiKeyCreatePayload) =>
		sendJson<CopilotApiKeyReveal>("/api/admin/copilot/api-keys", body),
	rotateCopilotApiKey: (id: string | number) =>
		requestJson<CopilotApiKeyReveal>(
			"/api/admin/copilot/api-keys/" + encodeURIComponent(String(id)) + "/rotate",
			"PUT",
		),
	revokeCopilotApiKey: (id: string | number) =>
		requestJson<{ id?: number; revoked?: boolean }>(
			"/api/admin/copilot/api-keys/" + encodeURIComponent(String(id)),
			"DELETE",
		),
};
