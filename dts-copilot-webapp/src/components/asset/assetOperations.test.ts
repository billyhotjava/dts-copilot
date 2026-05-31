import { describe, expect, it, vi } from "vitest";
import type { Artifact } from "../../types/artifact";
import {
	ensureArtifactCard,
	pinArtifactToDashboard,
	saveArtifactCard,
} from "./assetOperations";

const baseArtifact: Artifact = {
	createdAt: 1,
	id: "artifact:1",
	sourceMessageId: "message-1",
	title: "利润趋势",
	type: "chart",
	spec: {
		databaseId: 9,
		display: "bar",
		generatedSql: "select month, profit from ads_profit",
	},
};

describe("assetOperations", () => {
	it("saves analysis draft artifacts through the draft save-card API", async () => {
		const api = {
			saveAnalysisDraftCard: vi.fn().mockResolvedValue({
				card: { id: 21, name: "利润趋势" },
			}),
			createCard: vi.fn(),
			updateCard: vi.fn().mockResolvedValue({ id: 21, name: "利润趋势" }),
		};

		const card = await saveArtifactCard(api, {
			...baseArtifact,
			spec: { ...baseArtifact.spec, analysisDraftId: 12 },
		}, { name: "利润趋势", collectionId: "root" });

		expect(card.id).toBe(21);
		expect(api.saveAnalysisDraftCard).toHaveBeenCalledWith(12);
		expect(api.updateCard).toHaveBeenCalledWith(
			21,
			expect.objectContaining({ collection_id: null, name: "利润趋势" }),
		);
		expect(api.createCard).not.toHaveBeenCalled();
	});

	it("creates a card directly when the artifact has no analysis draft", async () => {
		const api = {
			saveAnalysisDraftCard: vi.fn(),
			createCard: vi.fn().mockResolvedValue({ id: 22, name: "利润趋势" }),
			updateCard: vi.fn(),
		};

		await saveArtifactCard(api, baseArtifact, { name: "利润趋势", collectionId: 3 });

		expect(api.createCard).toHaveBeenCalledWith(
			expect.objectContaining({
				collection_id: 3,
				display: "bar",
				name: "利润趋势",
			}),
		);
		expect(api.saveAnalysisDraftCard).not.toHaveBeenCalled();
	});

	it("pins the ensured card to the bottom of an existing dashboard layout", async () => {
		const api = {
			createCard: vi.fn().mockResolvedValue({ id: 31, name: "利润趋势" }),
			createDashboard: vi.fn(),
			getDashboard: vi.fn().mockResolvedValue({
				id: 8,
				name: "经营看板",
				collection_id: null,
				ordered_cards: [
					{ id: 101, card_id: 1, row: 0, col: 0, size_x: 12, size_y: 4 },
				],
			}),
			saveAnalysisDraftCard: vi.fn(),
			saveDashboard: vi.fn().mockResolvedValue({ id: 8, name: "经营看板" }),
			updateCard: vi.fn(),
		};

		const result = await pinArtifactToDashboard(api, baseArtifact, {
			dashboardId: 8,
			cardName: "利润趋势",
			collectionId: "root",
		});

		expect(result.card.id).toBe(31);
		expect(api.getDashboard).toHaveBeenCalledWith(8);
		expect(api.saveDashboard).toHaveBeenCalledWith({
			dashboard: expect.objectContaining({ id: 8, name: "经营看板" }),
			dashcards: expect.arrayContaining([
				expect.objectContaining({ card_id: 31, row: 4, col: 0 }),
			]),
		});
	});

	it("uses an existing artifact card id without creating a duplicate card", async () => {
		const api = {
			createCard: vi.fn(),
			saveAnalysisDraftCard: vi.fn(),
			updateCard: vi.fn().mockResolvedValue({ id: 41, name: "利润趋势" }),
		};

		const card = await ensureArtifactCard(api, {
			...baseArtifact,
			spec: { ...baseArtifact.spec, cardId: "41" },
		}, { name: "利润趋势" });

		expect(card).toMatchObject({ id: 41, name: "利润趋势" });
		expect(api.createCard).not.toHaveBeenCalled();
		expect(api.saveAnalysisDraftCard).not.toHaveBeenCalled();
		expect(api.updateCard).toHaveBeenCalledWith(
			41,
			expect.objectContaining({ name: "利润趋势" }),
		);
	});
});
