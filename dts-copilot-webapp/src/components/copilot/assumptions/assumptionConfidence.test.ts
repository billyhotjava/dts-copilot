import { describe, expect, it } from "vitest";
import {
	OPTIMISTIC_CONFIDENCE_THRESHOLD,
	shouldExecuteOptimistically,
} from "./assumptionConfidence";

describe("shouldExecuteOptimistically", () => {
	it("keeps optimistic execution when confidence is missing for backward compatibility", () => {
		expect(shouldExecuteOptimistically(undefined)).toBe(true);
		expect(shouldExecuteOptimistically(null)).toBe(true);
	});

	it("executes optimistically at or above the threshold", () => {
		expect(shouldExecuteOptimistically(OPTIMISTIC_CONFIDENCE_THRESHOLD)).toBe(
			true,
		);
		expect(shouldExecuteOptimistically(0.91)).toBe(true);
	});

	it("defers low confidence questions to the clarification flow", () => {
		expect(
			shouldExecuteOptimistically(OPTIMISTIC_CONFIDENCE_THRESHOLD - 0.01),
		).toBe(false);
	});
});
