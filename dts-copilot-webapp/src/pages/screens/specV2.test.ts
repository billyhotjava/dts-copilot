import { describe, expect, it } from "vitest";
import { normalizeScreenConfig } from "./specV2";

describe("normalizeScreenConfig", () => {
	it("retains richtext components used by PRS v1 screen prototypes", () => {
		const result = normalizeScreenConfig({
			schemaVersion: 2,
			width: 1920,
			height: 1080,
			components: [
				{
					id: "prs_header_note",
					type: "richtext",
					name: "PRS 大屏说明",
					x: 16,
					y: 16,
					width: 420,
					height: 64,
					config: { html: "<strong>PRS</strong>" },
				},
			],
		});

		expect(result.warnings).toEqual([]);
		expect(result.config.components).toHaveLength(1);
		expect(result.config.components[0].type).toBe("richtext");
	});
});
