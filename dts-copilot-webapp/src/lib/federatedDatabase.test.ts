import { describe, expect, it } from "vitest";
import type { DatabaseListItem } from "../api/analyticsApi";
import {
	FEDERATED_DATABASE_NAME,
	resolveFederatedDatabase,
	resolveFederatedDatabaseId,
} from "./federatedDatabase";

describe("federated database selection", () => {
	it("uses the federated query entry instead of the first available database", () => {
		const databases = [
			{ engine: "mysql", id: 6, name: "ptr_mysql" },
			{ engine: "postgres", id: 8, name: "DTS dbt模型库" },
			{ engine: "trino", id: 9, name: FEDERATED_DATABASE_NAME },
		] satisfies DatabaseListItem[];

		expect(resolveFederatedDatabaseId(databases)).toBe(9);
		expect(resolveFederatedDatabase(databases)).toMatchObject({
			engine: "trino",
			id: 9,
			name: FEDERATED_DATABASE_NAME,
		});
	});

	it("ignores persisted legacy databases when the federated entry is present", () => {
		const databases = [
			{ engine: "mysql", id: 6, name: "ptr_mysql" },
			{ engine: "trino", id: 9, name: FEDERATED_DATABASE_NAME },
		] satisfies DatabaseListItem[];

		expect(resolveFederatedDatabaseId(databases, 6)).toBe(9);
	});

	it("returns null when the federated entry is not configured", () => {
		const databases = [
			{ engine: "mysql", id: 6, name: "ptr_mysql" },
			{ engine: "postgres", id: 8, name: "DTS dbt模型库" },
		] satisfies DatabaseListItem[];

		expect(resolveFederatedDatabaseId(databases)).toBeNull();
	});
});
