import { fetchJson, HttpError } from "../httpClient.ts";
import type {
	PlatformIndicatorCatalogResponse,
	PlatformIndicatorValueMode,
	PlatformIndicatorValueResponse,
} from "../types.ts";

const BASE = "/api/analytics/platform/indicators";

export const indicatorApi = {
	listPlatformIndicators: async (): Promise<PlatformIndicatorCatalogResponse> => {
		try {
			const response = await fetchJson<PlatformIndicatorCatalogResponse>(BASE);
			return {
				...response,
				items: Array.isArray(response.items) ? response.items : [],
			};
		} catch (error) {
			return degradedCatalog(describeIndicatorError(error));
		}
	},
	getPlatformIndicatorDashboard: (days?: number) =>
		fetchIndicatorValue("dashboard", "_all", () => {
			const qs = new URLSearchParams();
			if (days != null) qs.set("days", String(days));
			return fetchJson<PlatformIndicatorValueResponse>(
				`${BASE}/dashboard${qs.size ? `?${qs.toString()}` : ""}`,
			);
		}),
	getPlatformIndicatorDetail: (id: string | number, days?: number) =>
		fetchIndicatorValue("detail", id, () => {
			const qs = new URLSearchParams();
			if (days != null) qs.set("days", String(days));
			return fetchJson<PlatformIndicatorValueResponse>(
				`${BASE}/${encodeURIComponent(String(id))}/detail${qs.size ? `?${qs.toString()}` : ""}`,
			);
		}),
	getPlatformIndicatorDrilldown: (
		id: string | number,
		dimension: string,
		period?: string,
	) =>
		fetchIndicatorValue("drilldown", id, () => {
			const qs = new URLSearchParams({ dimension });
			if (period) qs.set("period", period);
			return fetchJson<PlatformIndicatorValueResponse>(
				`${BASE}/${encodeURIComponent(String(id))}/drilldown?${qs.toString()}`,
			);
		}),
};

async function fetchIndicatorValue(
	mode: PlatformIndicatorValueMode,
	indicatorId: string | number,
	run: () => Promise<PlatformIndicatorValueResponse>,
): Promise<PlatformIndicatorValueResponse> {
	try {
		return await run();
	} catch (error) {
		return degradedValue(mode, indicatorId, describeIndicatorError(error));
	}
}

function degradedCatalog(reason: string): PlatformIndicatorCatalogResponse {
	return {
		items: [],
		degraded: true,
		degradedReason: reason,
	};
}

function degradedValue(
	mode: PlatformIndicatorValueMode,
	indicatorId: string | number,
	reason: string,
): PlatformIndicatorValueResponse {
	return {
		indicatorId,
		mode,
		cols: [],
		rows: [],
		degraded: true,
		degradedReason: reason,
	};
}

function describeIndicatorError(error: unknown): string {
	if (error instanceof HttpError) {
		return error.status >= 500 ? "平台指标服务暂不可达" : "平台指标取值失败";
	}
	return "平台指标服务暂不可达";
}
