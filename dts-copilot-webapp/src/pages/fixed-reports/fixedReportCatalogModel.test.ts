import {
	buildFixedReportOpenPath,
	buildFixedReportQuickStartItems,
	isPlaceholderFixedReport,
	isScreenBackedFixedReport,
	getFixedReportTemplateAvailability,
	buildFixedReportParameterFields,
	buildFixedReportAssetGroups,
	buildFixedReportDomainTabs,
	filterFixedReportTemplates,
	type FixedReportCatalogItem,
} from "./fixedReportCatalogModel";

describe("isPlaceholderFixedReport", () => {
	it("placeholderReviewRequired 为 true 时返回 true", () => {
		expect(isPlaceholderFixedReport({ placeholderReviewRequired: true })).toBe(true);
	});

	it("placeholderReviewRequired 为 false 时返回 false", () => {
		expect(isPlaceholderFixedReport({ placeholderReviewRequired: false })).toBe(false);
	});

	it("参数为 null 或 undefined 时返回 false", () => {
		expect(isPlaceholderFixedReport(null)).toBe(false);
		expect(isPlaceholderFixedReport(undefined)).toBe(false);
	});
});

describe("getFixedReportTemplateAvailability", () => {
	it("占位报表返回 warning 徽标", () => {
		const result = getFixedReportTemplateAvailability({ placeholderReviewRequired: true });
		expect(result.badgeLabel).toBe("待补数据面");
		expect(result.badgeVariant).toBe("warning");
		expect(result.canRun).toBe(false);
	});

	it("非占位报表返回 success 徽标", () => {
		const result = getFixedReportTemplateAvailability({ placeholderReviewRequired: false });
		expect(result.badgeLabel).toBe("已接通");
		expect(result.badgeVariant).toBe("success");
		expect(result.canRun).toBe(true);
	});

	it("支持自定义标签文本", () => {
		const result = getFixedReportTemplateAvailability(
			{ placeholderReviewRequired: true },
			{ placeholderLabel: "自定义占位" },
		);
		expect(result.badgeLabel).toBe("自定义占位");
	});

	it("参数为空时默认为已接通", () => {
		const result = getFixedReportTemplateAvailability(null);
		expect(result.badgeLabel).toBe("已接通");
		expect(result.canRun).toBe(true);
	});
});

describe("buildFixedReportParameterFields", () => {
	it("有效 parameterSchemaJson 解析出字段", () => {
		const schema = JSON.stringify({
			params: [
				{ name: "startDate", label: "开始日期", type: "date", required: true },
				{ name: "status", label: "状态", type: "select", required: false, options: [{ label: "活跃", value: "active" }] },
			],
		});
		const fields = buildFixedReportParameterFields(schema);
		expect(fields).toHaveLength(2);
		expect(fields[0].key).toBe("startDate");
		expect(fields[0].type).toBe("date");
		expect(fields[0].required).toBe(true);
		expect(fields[1].type).toBe("select");
		expect(fields[1].options).toEqual([{ label: "活跃", value: "active" }]);
	});

	it("空 schema 时根据模板 domain 返回默认字段", () => {
		const template: FixedReportCatalogItem = { domain: "财务" };
		const fields = buildFixedReportParameterFields(null, template);
		expect(fields.length).toBeGreaterThanOrEqual(1);
		expect(fields[0].key).toBe("asOfDate");
		expect(fields[0].type).toBe("date");
	});

	it("采购领域返回包含供应商和仓库的默认字段", () => {
		const template: FixedReportCatalogItem = { domain: "采购" };
		const fields = buildFixedReportParameterFields(null, template);
		const keys = fields.map((f) => f.key);
		expect(keys).toContain("asOfDate");
		expect(keys).toContain("supplierId");
		expect(keys).toContain("warehouseId");
	});

	it("无效 JSON 回退到默认字段", () => {
		const fields = buildFixedReportParameterFields("not valid json");
		expect(fields.length).toBeGreaterThanOrEqual(1);
		expect(fields[0].key).toBe("asOfDate");
	});

	it("normalizeFieldType 正确映射 number 类型别名", () => {
		const schema = JSON.stringify({
			params: [
				{ name: "count", label: "数量", type: "integer", required: false },
			],
		});
		const fields = buildFixedReportParameterFields(schema);
		expect(fields[0].type).toBe("number");
	});
});

describe("PRS fixed report screen entries", () => {
	it("按 dts dbt 大屏清单顺序展示 PRS 固定报表", () => {
		const templates: FixedReportCatalogItem[] = [
			{ templateCode: "PRS-FLOWERBIZ-FINANCE-COST", domain: "PRS租赁", certificationStatus: "CERTIFIED", published: true },
			{ templateCode: "PRS-FLOWERBIZ-OVERVIEW", domain: "PRS租赁", certificationStatus: "CERTIFIED", published: true },
			{ templateCode: "PRS-FLOWERBIZ-DRILL-AUDIT-TRAIL", domain: "PRS租赁", certificationStatus: "CERTIFIED", published: true },
		];

		const visible = filterFixedReportTemplates(templates, "all");

		expect(visible.map((item) => item.templateCode)).toEqual([
			"PRS-FLOWERBIZ-OVERVIEW",
			"PRS-FLOWERBIZ-FINANCE-COST",
			"PRS-FLOWERBIZ-DRILL-AUDIT-TRAIL",
		]);
	});

	it("固定报表入口统一回到 AI 报表入口", () => {
		expect(buildFixedReportOpenPath({
			templateCode: "PRS-FLOWERBIZ-OVERVIEW",
			targetObject: "screen.prs-flowerbiz-overview-v1",
		})).toBe("/agent-bi?fixedReport=PRS-FLOWERBIZ-OVERVIEW");

		expect(buildFixedReportOpenPath({ templateCode: "FIN-AR-OVERVIEW" }))
			.toBe("/agent-bi?fixedReport=FIN-AR-OVERVIEW");
	});

	it("识别 screen-backed 的 PRS 大屏固定报表", () => {
		expect(isScreenBackedFixedReport({
			templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			targetObject: "screen.prs-flowerbiz-project-customer-v1",
		})).toBe(true);

		expect(isScreenBackedFixedReport({
			templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			assetKind: "DBT_SCREEN_TABLE",
		})).toBe(true);

		expect(isScreenBackedFixedReport({
			templateCode: "FIN-AR-OVERVIEW",
			targetObject: "authority.finance.ar_overview",
		})).toBe(false);
	});

	it("将同一个 dbt 报表资产的主报表和细分报表合并成一个资产组", () => {
		const templates: FixedReportCatalogItem[] = [
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER-TOP",
				name: "PRS 项目经营 TOP",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SPLIT",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				assetGroupName: "PRS 项目客户经营",
				parentTemplateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				primaryDbtModel: "public.xycyl_ads_flowerbiz_project_customer",
				outputColumnCount: 11,
				dataSourceType: "DBT_ADS",
			},
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				name: "PRS 项目客户经营看板",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SCREEN_TABLE",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				assetGroupName: "PRS 项目客户经营",
				primaryDbtModel: "public.xycyl_ads_flowerbiz_project_customer",
				dataSourceType: "DBT_SCREEN",
			},
		];

		const groups = buildFixedReportAssetGroups(templates, "all");

		expect(groups).toHaveLength(1);
		expect(groups[0].name).toBe("PRS 项目客户经营");
		expect(groups[0].primary.templateCode).toBe("PRS-FLOWERBIZ-PROJECT-CUSTOMER");
		expect(groups[0].children.map((item) => item.templateCode)).toEqual([
			"PRS-FLOWERBIZ-PROJECT-CUSTOMER-TOP",
		]);
		expect(groups[0].sourceTypes).toEqual(["DBT_SCREEN", "DBT_ADS"]);
	});

	it("快捷入口按资产组展示主报表，不把 DBT_SPLIT 子报表挤占大屏入口", () => {
		const templates: FixedReportCatalogItem[] = [
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER-TOP",
				name: "PRS 项目经营 TOP",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SPLIT",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				parentTemplateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			},
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				name: "PRS 项目客户经营看板",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SCREEN_TABLE",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			},
			{
				templateCode: "PRS-FLOWERBIZ-OVERVIEW",
				name: "PRS 租赁经营总览",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SCREEN_TABLE",
				assetGroupCode: "PRS-FLOWERBIZ-OVERVIEW",
			},
		];

		const quickStarts = buildFixedReportQuickStartItems(templates, 6);

		expect(quickStarts.map((item) => item.templateCode)).toEqual([
			"PRS-FLOWERBIZ-OVERVIEW",
			"PRS-FLOWERBIZ-PROJECT-CUSTOMER",
		]);
	});

	it("领域 Tab 统计按合并后的报表资产计数", () => {
		const templates: FixedReportCatalogItem[] = [
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			},
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER-TOP",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				parentTemplateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			},
			{
				templateCode: "PRS-FLOWERBIZ-FINANCE-COST",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetGroupCode: "PRS-FLOWERBIZ-FINANCE-COST",
			},
		];

		const tabs = buildFixedReportDomainTabs(templates, { allLabel: "全部" });

		expect(tabs.find((tab) => tab.id === "all")?.count).toBe(2);
		expect(tabs.find((tab) => tab.id === "PRS租赁")?.count).toBe(2);
	});
});
