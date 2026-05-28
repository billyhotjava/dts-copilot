import { describe, expect, it } from "vitest";
import { resolveCopilotSqlDatabaseId } from "./copilotReportDatabase";

describe("copilotReportDatabase", () => {
	it("routes dbt mart report drafts to the DTS dbt model database", () => {
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
				],
			}),
		).toBe(8);
	});

	it("keeps the selected datasource for non dbt SQL", () => {
		expect(
			resolveCopilotSqlDatabaseId({
				selectedDatabaseId: 6,
				dataSurface: "L0_ADMINAPI_READONLY",
				sql: "select * from a_invoice_info limit 20",
				databases: [
					{ id: 6, name: "ptr_mysql", engine: "mysql" },
					{ id: 8, name: "DTS dbt模型库", engine: "postgres" },
				],
			}),
		).toBe(6);
	});
});
