import type { CopilotAssumption } from "./assumptionTypes";
import {
	formatAssumptionChipLabel,
	hasAssumptionChanged,
} from "./assumptionTypes";

describe("assumption chip model", () => {
	const assumption: CopilotAssumption = {
		key: "period",
		label: "本月",
		value: "2026-05",
	};

	it("formats assumption labels as readable caliber chips", () => {
		expect(formatAssumptionChipLabel(assumption)).toBe("本月=2026-05");
	});

	it("compares committed values after trimming whitespace", () => {
		expect(hasAssumptionChanged(assumption, " 2026-05 ")).toBe(false);
		expect(hasAssumptionChanged(assumption, "2026-04")).toBe(true);
	});
});
