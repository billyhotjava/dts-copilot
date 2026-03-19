export function canEditCopilotComposer(input: {
	copilotEnabled: boolean;
	requestInFlight: boolean;
}): boolean {
	return input.copilotEnabled;
}

export function canSubmitCopilotComposer(input: {
	copilotEnabled: boolean;
	requestInFlight: boolean;
	input: string;
}): boolean {
	if (!input.copilotEnabled) {
		return false;
	}
	if (input.requestInFlight) {
		return false;
	}
	return input.input.trim().length > 0;
}
