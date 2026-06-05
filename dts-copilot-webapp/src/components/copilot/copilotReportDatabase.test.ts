import { describe, expect, it } from "vitest";
import { resolveCopilotSqlDatabaseId } from "./copilotReportDatabase";

describe("copilotReportDatabase", () => {
	it("routes dbt mart report drafts to the federated query entry", () => {
		expect(
			resolveCopilotSqlDatabaseId({
				selectedDatabaseId: 6,
				dataSurface: "L1_DBT_MART",
				sql: "select project_name from public.xycyl_dws_flowerbiz_project_monthly",
				sourceRefs: ["dbt-model:public.xycyl_dws_flowerbiz_project_monthly"],
				databases: [
					{ id: 6, name: "ptr_mysql", engine: "mysql" },
					{
						id: 8,
						name: "DTS dbt模型库",
						engine: "postgres",
						database_role: "BUSINESS_SECONDARY",
					},
					{ id: 9, name: "联邦查询入口", engine: "trino" },
				],
			}),
		).toBe(9);
	});

	it("routes non dbt SQL to the federated query entry too", () => {
		expect(
			resolveCopilotSqlDatabaseId({
				selectedDatabaseId: 6,
				dataSurface: "L0_ADMINAPI_READONLY",
				sql: "select * from a_invoice_info limit 20",
				databases: [
					{ id: 6, name: "ptr_mysql", engine: "mysql" },
					{ id: 8, name: "DTS dbt模型库", engine: "postgres" },
					{ id: 9, name: "联邦查询入口", engine: "trino" },
				],
			}),
		).toBe(9);
	});

	it("does not silently fall back to a legacy datasource when the federated entry is missing", () => {
		expect(
			resolveCopilotSqlDatabaseId({
				selectedDatabaseId: 6,
				sql: "select * from a_invoice_info limit 20",
				databases: [
					{ id: 6, name: "ptr_mysql", engine: "mysql" },
					{ id: 8, name: "DTS dbt模型库", engine: "postgres" },
				],
			}),
		).toBeNull();
	});

	it("keeps the selected datasource only while the database list has not loaded", () => {
		expect(
			resolveCopilotSqlDatabaseId({
				selectedDatabaseId: 9,
				sql: "SELECT \"财务月份\", SUM(\"收款金额\") FROM public.xycyl_ads_finance_summary GROUP BY \"财务月份\"",
				databases: [],
			}),
		).toBe(9);
	});
});
