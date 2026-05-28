import { describe, expect, it } from "vitest";
import {
	readPrsScreenRequest,
	resolvePrsScreenFromList,
	resolvePrsScreenRequestLabel,
} from "./prsScreenShortcuts";

describe("prsScreenShortcuts", () => {
	it("从查询参数读取 PRS 大屏定位信息", () => {
		const request = readPrsScreenRequest(
			"?screen=prs-flowerbiz-overview-v1&name=PRS+%E7%A7%9F%E8%B5%81%E7%BB%8F%E8%90%A5%E6%80%BB%E8%A7%88",
		);

		expect(request).toEqual({
			slug: "prs-flowerbiz-overview-v1",
			name: "PRS 租赁经营总览",
		});
		expect(resolvePrsScreenRequestLabel(request)).toBe("PRS 租赁经营总览");
	});

	it("按导入后的中文大屏名称定位实际 screen id", () => {
		const screen = resolvePrsScreenFromList(
			[
				{ id: 101, name: "PRS 租赁经营总览", description: "运营大屏" },
				{ id: 102, name: "其他大屏", description: "prs-flowerbiz-overview-v1" },
			],
			{
				slug: "prs-flowerbiz-overview-v1",
				name: "PRS 租赁经营总览",
			},
		);

		expect(screen?.id).toBe(101);
	});

	it("中文名称缺失时回退到描述中的 slug", () => {
		const screen = resolvePrsScreenFromList(
			[
				{
					id: 201,
					name: "导入副本",
					description: "source: prs-flowerbiz-finance-cost-v1",
				},
			],
			{
				slug: "prs-flowerbiz-finance-cost-v1",
			},
		);

		expect(screen?.id).toBe(201);
	});
});
