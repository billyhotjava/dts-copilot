import type {
	AnalysisDraftSaveCardResponse,
	CardDetail,
	DashboardDetail,
} from "../../api/analyticsApi";
import type { Artifact } from "../../types/artifact";
import { buildCardPayloadFromArtifact } from "./assetPayload";
import { appendCardToDashboardLayout, buildSaveDashboardPayload } from "./dashboardLayout";

export interface SaveArtifactCardOptions {
	collectionId?: number | string | null;
	name?: string;
}

export interface PinArtifactOptions {
	cardName?: string;
	collectionId?: number | string | null;
	dashboardId?: number | string | null;
	newDashboardName?: string;
}

export interface AssetCardApi {
	createCard: (body: unknown) => Promise<CardDetail>;
	saveAnalysisDraftCard: (id: string | number) => Promise<AnalysisDraftSaveCardResponse>;
	updateCard: (id: string | number, body: unknown) => Promise<CardDetail>;
}

export interface AssetDashboardApi extends AssetCardApi {
	createDashboard: (body: unknown) => Promise<DashboardDetail>;
	getDashboard: (id: string | number) => Promise<DashboardDetail>;
	saveDashboard: (body: unknown) => Promise<DashboardDetail>;
}

export async function saveArtifactCard(
	api: AssetCardApi,
	artifact: Artifact,
	options: SaveArtifactCardOptions = {},
): Promise<CardDetail> {
	return ensureArtifactCard(api, artifact, options);
}

export async function ensureArtifactCard(
	api: AssetCardApi,
	artifact: Artifact,
	options: SaveArtifactCardOptions = {},
): Promise<CardDetail> {
	const existingCardId = normalizeId(artifact.spec.cardId);
	if (existingCardId != null) {
		return api.updateCard(
			existingCardId,
			buildCardPayloadFromArtifact(artifact, {
				collectionId: options.collectionId,
				name: options.name,
			}),
		);
	}

	const draftId = normalizeId(artifact.spec.analysisDraftId);
	if (draftId != null) {
		const result = await api.saveAnalysisDraftCard(draftId);
		if (!result.card) {
			throw new Error("analysis_draft_save_card_missing_card");
		}
		return api.updateCard(
			result.card.id,
			buildCardPayloadFromArtifact(artifact, {
				collectionId: options.collectionId,
				name: options.name,
			}),
		);
	}

	return api.createCard(buildCardPayloadFromArtifact(artifact, {
		collectionId: options.collectionId,
		name: options.name,
	}));
}

export async function pinArtifactToDashboard(
	api: AssetDashboardApi,
	artifact: Artifact,
	options: PinArtifactOptions,
): Promise<{ card: CardDetail; dashboard: DashboardDetail }> {
	const card = await ensureArtifactCard(api, artifact, {
		collectionId: options.collectionId,
		name: options.cardName,
	});
	const dashboard = await resolveDashboard(api, options);
	const orderedCards = appendCardToDashboardLayout(
		dashboard.ordered_cards ?? [],
		card.id,
	);
	const savedDashboard = await api.saveDashboard(
		buildSaveDashboardPayload(dashboard, orderedCards),
	);
	return { card, dashboard: savedDashboard };
}

async function resolveDashboard(
	api: AssetDashboardApi,
	options: PinArtifactOptions,
): Promise<DashboardDetail> {
	const dashboardId = normalizeId(options.dashboardId);
	if (dashboardId != null) {
		return api.getDashboard(dashboardId);
	}

	const name = options.newDashboardName?.trim() || "Agent 沉淀看板";
	return api.createDashboard({
		collection_id: normalizeCollectionId(options.collectionId),
		description: "由 Agent 工作台创建，用于承接画布产物。",
		name,
	});
}

function normalizeId(value: number | string | null | undefined): number | null {
	if (value == null || value === "") {
		return null;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeCollectionId(value: number | string | null | undefined): number | null {
	if (value == null || value === "" || value === "root") {
		return null;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : null;
}
