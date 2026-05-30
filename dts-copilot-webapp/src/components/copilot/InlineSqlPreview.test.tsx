import { describe, expect, it } from "vitest";
import {
	INLINE_DISPLAY_OPTIONS,
	buildInlineSqlPreviewDatasetQuery,
	normalizeInlineDisplayType,
	resolveAutoRunText,
} from "./InlineSqlPreview";

describe("InlineSqlPreview behavior", () => {
	it("只保留表格、柱图、折线、饼图四种可视化切换入口", () => {
		expect(INLINE_DISPLAY_OPTIONS).toEqual([
			{ value: "table", label: "表格" },
			{ value: "bar", label: "柱图" },
			{ value: "line", label: "折线" },
			{ value: "pie", label: "饼图" },
		]);
	});

	it("规范化推荐图表类型，未知值回退到表格", () => {
		expect(normalizeInlineDisplayType("bar")).toBe("bar");
		expect(normalizeInlineDisplayType("LINE")).toBe("line");
		expect(normalizeInlineDisplayType("pie")).toBe("pie");
		expect(normalizeInlineDisplayType("scatter")).toBe("table");
		expect(normalizeInlineDisplayType(undefined)).toBe("table");
	});

	it("构建自动预览查询 payload，并裁剪 SQL 空白", () => {
		expect(buildInlineSqlPreviewDatasetQuery(1, " SELECT 1 \n")).toEqual({
			database: 1,
			type: "native",
			native: { query: "SELECT 1" },
			context: "copilot-inline",
		});
	});

	it("缺少数据源或 SQL 时不自动执行查询", () => {
		expect(buildInlineSqlPreviewDatasetQuery(undefined, "SELECT 1")).toBeNull();
		expect(buildInlineSqlPreviewDatasetQuery(1, "   ")).toBeNull();
	});

	it("输出自动预览状态文案", () => {
		expect(resolveAutoRunText({ status: "idle" }, true)).toBe("等待自动预览");
		expect(resolveAutoRunText({ status: "loading" }, true)).toBe("正在自动预览");
		expect(resolveAutoRunText({ status: "error", message: "boom" }, true)).toBe("自动预览失败");
		expect(resolveAutoRunText({ status: "idle" }, false)).toBe("缺少数据源，无法自动预览");
	});
});
