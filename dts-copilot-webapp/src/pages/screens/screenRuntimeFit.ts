type RuntimeFitScaleInput = {
	viewportWidth: number;
	viewportHeight: number;
	contentWidth: number;
	contentHeight: number;
	minScale?: number;
	maxScale?: number;
};

const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 3;

function positiveNumber(value: number, fallback: number): number {
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function resolveRuntimeFitScale(input: RuntimeFitScaleInput): number {
	const viewportWidth = positiveNumber(input.viewportWidth, 1);
	const viewportHeight = positiveNumber(input.viewportHeight, 1);
	const contentWidth = positiveNumber(input.contentWidth, 1920);
	const contentHeight = positiveNumber(input.contentHeight, 1080);
	const minScale = positiveNumber(input.minScale ?? DEFAULT_MIN_SCALE, DEFAULT_MIN_SCALE);
	const maxScale = Math.max(minScale, positiveNumber(input.maxScale ?? DEFAULT_MAX_SCALE, DEFAULT_MAX_SCALE));

	const scale = Math.min(viewportWidth / contentWidth, viewportHeight / contentHeight);
	return Math.max(minScale, Math.min(scale, maxScale));
}
