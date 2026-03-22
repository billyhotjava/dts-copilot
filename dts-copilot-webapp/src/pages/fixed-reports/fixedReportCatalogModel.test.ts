import {
	isPlaceholderFixedReport,
	getFixedReportTemplateAvailability,
	buildFixedReportParameterFields,
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
