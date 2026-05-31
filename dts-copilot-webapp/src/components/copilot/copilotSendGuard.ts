export interface CopilotSendGuardInput {
	copilotEnabled: boolean;
	requestInFlight: boolean;
	streamInFlight: boolean;
	text: string;
}

export type CopilotSendBlockReason =
	| "copilot-disabled"
	| "empty-input"
	| "request-in-flight"
	| "stream-in-flight";

export type CopilotSendGuardDecision =
	| { action: "send"; text: string }
	| { action: "block"; reason: CopilotSendBlockReason };

export function resolveCopilotSendGuard(
	input: CopilotSendGuardInput,
): CopilotSendGuardDecision {
	if (!input.copilotEnabled) {
		return {
			action: "block",
			reason: "copilot-disabled",
		};
	}

	const text = input.text.trim();
	if (!text) {
		return {
			action: "block",
			reason: "empty-input",
		};
	}

	if (input.requestInFlight) {
		return {
			action: "block",
			reason: "request-in-flight",
		};
	}

	if (input.streamInFlight) {
		return {
			action: "block",
			reason: "stream-in-flight",
		};
	}

	return {
		action: "send",
		text,
	};
}
