import type { CopilotAssumption } from "../../../api/analyticsApi";

export type { CopilotAssumption };

export function formatAssumptionChipLabel(
	assumption: CopilotAssumption,
): string {
	return `${assumption.label}=${assumption.value}`;
}

export function hasAssumptionChanged(
	assumption: CopilotAssumption,
	nextValue: string,
): boolean {
	return assumption.value.trim() !== nextValue.trim();
}
