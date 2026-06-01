import { createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsApi } from "../../../api/analyticsApi";
import type { DataSourceConfig } from "../types";
import { useCardDataSource } from "./useCardDataSource";

vi.mock("../../../api/analyticsApi", () => ({
	analyticsApi: {
		runDatasetQuery: vi.fn(),
		queryCard: vi.fn(),
	},
	HttpError: class HttpError extends Error {
		status = 500;
		code?: string;
		bodyText?: string;
		requestId?: string;
	},
	isRetryableHttpError: () => false,
}));

describe("useCardDataSource", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(analyticsApi.runDatasetQuery).mockResolvedValue({
			data: {
				rows: [["2026-06", 3]],
				cols: [
					{ name: "月份", display_name: "月份", base_type: "type/Text" },
					{ name: "单数", display_name: "单数", base_type: "type/Integer" },
				],
			},
		});
	});

	it("passes a logical datasource alias through to dataset query", async () => {
		const dataSource: DataSourceConfig = {
			type: "sql",
			sourceType: "sql",
			sqlConfig: {
				databaseId: "prs.flowerbiz.federated",
				query: "SELECT 1 AS value",
				queryTimeoutSeconds: 10,
				maxRows: 100,
			},
		};

		render(createElement(DataSourceProbe, { dataSource }));
		await screen.findByTestId("data-source-probe");

		await waitFor(() => {
			expect(analyticsApi.runDatasetQuery).toHaveBeenCalledWith(
				expect.objectContaining({
					database: "prs.flowerbiz.federated",
					type: "native",
					native: { query: "SELECT 1 AS value" },
				}),
			);
		});
		await waitFor(() => expect(currentResult?.error).toBeNull());
	});

	it("uses databaseAlias when it is configured separately from numeric databaseId", async () => {
		const dataSource: DataSourceConfig = {
			type: "sql",
			sourceType: "sql",
			sqlConfig: {
				databaseAlias: "prs.flowerbiz.federated",
				query: "SELECT 1 AS value",
			},
		};

		render(createElement(DataSourceProbe, { dataSource }));
		await screen.findByTestId("data-source-probe");

		await waitFor(() => {
			expect(analyticsApi.runDatasetQuery).toHaveBeenCalledWith(
				expect.objectContaining({
					database: "prs.flowerbiz.federated",
				}),
			);
		});
	});
});

let currentResult: ReturnType<typeof useCardDataSource> | null = null;

function DataSourceProbe(props: { dataSource: DataSourceConfig }) {
	currentResult = useCardDataSource(props.dataSource);
	return createElement("span", { "data-testid": "data-source-probe" }, currentResult.error ?? "");
}
