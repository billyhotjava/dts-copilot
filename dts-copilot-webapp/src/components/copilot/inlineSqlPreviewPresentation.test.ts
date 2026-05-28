import { describe, expect, it } from "vitest";
import { resolveInlineSqlPreviewPresentation } from "./inlineSqlPreviewPresentation";

describe("resolveInlineSqlPreviewPresentation", () => {
	it("keeps ordinary SQL visible by default", () => {
		expect(resolveInlineSqlPreviewPresentation({ variant: "sql" })).toEqual({
			label: "生成的 SQL",
			sqlVisibleByDefault: true,
			summaryItems: [],
		});
	});

	it("summarizes report drafts and hides SQL by default", () => {
		expect(
			resolveInlineSqlPreviewPresentation({
				variant: "report",
				suggestedDisplay: "line",
				dataSurface: "L1_DBT_MART",
				qualityLevel: "MEDIUM",
				reportCode: "prs.flowerbiz.lease_execution_monthly",
			}),
		).toEqual({
			label: "报表草稿",
			sqlVisibleByDefault: false,
			summaryItems: [
				"推荐图表：line",
				"数据层：L1_DBT_MART",
				"质量等级：MEDIUM",
				"报表编码：prs.flowerbiz.lease_execution_monthly",
			],
		});
	});
});
