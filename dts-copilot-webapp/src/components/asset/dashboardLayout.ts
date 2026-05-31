import type { DashboardCard, DashboardDetail } from "../../api/analyticsApi";

export interface AppendDashboardCardOptions {
	size_x?: number;
	size_y?: number;
}

export function appendCardToDashboardLayout(
	existing: DashboardCard[],
	cardId: number | string,
	options: AppendDashboardCardOptions = {},
): DashboardCard[] {
	const sizeX = options.size_x ?? 12;
	const sizeY = options.size_y ?? 6;
	const row = existing.reduce((max, item) => {
		const itemRow = item.row ?? 0;
		const itemHeight = item.size_y ?? 6;
		return Math.max(max, itemRow + itemHeight);
	}, 0);
	return [
		...existing,
		{
			card_id: normalizeCardId(cardId),
			col: 0,
			id: 0,
			row,
			size_x: sizeX,
			size_y: sizeY,
		},
	];
}

export function buildSaveDashboardPayload(
	dashboard: DashboardDetail,
	dashcards: DashboardCard[],
) {
	return {
		dashboard: {
			id: normalizeCardId(dashboard.id),
			name: dashboard.name ?? "未命名看板",
			description: dashboard.description ?? null,
			collection_id: dashboard.collection_id ?? null,
		},
		dashcards: dashcards.map((dc, index) => ({
			...(dc.id && dc.id > 0 ? { id: dc.id } : {}),
			card_id: normalizeCardId(dc.card_id ?? dc.card?.id ?? 0),
			row: dc.row ?? 0,
			col: dc.col ?? 0,
			size_x: dc.size_x ?? 12,
			size_y: dc.size_y ?? 6,
			parameter_mappings: dc.parameter_mappings ?? [],
			visualization_settings: readVisualizationSettings(dc),
			_seriesIndex: index,
		})),
	};
}

function readVisualizationSettings(dc: DashboardCard) {
	const loose = dc as DashboardCard & { visualization_settings?: unknown };
	return loose.visualization_settings ?? {};
}

function normalizeCardId(value: number | string): number {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : 0;
}
