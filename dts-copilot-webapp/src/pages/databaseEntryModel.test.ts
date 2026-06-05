import { describe, expect, it } from "vitest";
import {
	buildDatabaseDetailsWithLogicalAliases,
	normalizeLogicalSourceAliases,
} from "./databaseEntryModel";

describe("databaseEntryModel logical datasource aliases", () => {
	it("normalizes logical datasource aliases from arrays and comma text", () => {
		expect(normalizeLogicalSourceAliases([" prs.flowerbiz.federated ", "PRS.FLOWERBIZ.FEDERATED", "prs.flowerbiz.mart"]))
			.toEqual(["prs.flowerbiz.federated", "PRS.FLOWERBIZ.FEDERATED", "prs.flowerbiz.mart"]);

		expect(normalizeLogicalSourceAliases("prs.flowerbiz.federated, prs.flowerbiz.mart\nprs.finance.federated"))
			.toEqual(["prs.flowerbiz.federated", "prs.flowerbiz.mart", "prs.finance.federated"]);
	});

	it("builds analytics database details with dataSourceId and optional logical aliases", () => {
		expect(buildDatabaseDetailsWithLogicalAliases(18, "prs.flowerbiz.federated, prs.flowerbiz.mart"))
			.toEqual({
				dataSourceId: 18,
				logicalSourceAliases: ["prs.flowerbiz.federated", "prs.flowerbiz.mart"],
			});

		expect(buildDatabaseDetailsWithLogicalAliases(18, ""))
			.toEqual({ dataSourceId: 18 });
	});
});
