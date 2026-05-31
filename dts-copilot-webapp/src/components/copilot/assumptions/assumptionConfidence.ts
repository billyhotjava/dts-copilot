export const OPTIMISTIC_CONFIDENCE_THRESHOLD = 0.6;

export function shouldExecuteOptimistically(
	confidence: number | null | undefined,
): boolean {
	if (confidence == null) {
		return true;
	}
	return Number.isFinite(confidence) && confidence >= OPTIMISTIC_CONFIDENCE_THRESHOLD;
}
