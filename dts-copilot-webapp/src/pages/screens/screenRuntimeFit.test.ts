import { describe, expect, it } from "vitest";
import { resolveRuntimeFitScale } from "./screenRuntimeFit";

describe("resolveRuntimeFitScale", () => {
	it("按运行容器的实际可视区域等比适配固定大屏", () => {
		const scale = resolveRuntimeFitScale({
			viewportWidth: 1884,
			viewportHeight: 948,
			contentWidth: 1920,
			contentHeight: 1080,
		});

		expect(scale).toBeCloseTo(0.8778, 4);
	});

	it("浏览器大于固定画布时允许自动放大，而不是卡在 100%", () => {
		const scale = resolveRuntimeFitScale({
			viewportWidth: 2560,
			viewportHeight: 1440,
			contentWidth: 1920,
			contentHeight: 1080,
		});

		expect(scale).toBeCloseTo(1.3333, 4);
	});
});
