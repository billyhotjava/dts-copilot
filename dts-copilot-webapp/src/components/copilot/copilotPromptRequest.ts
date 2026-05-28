export const COPILOT_PROMPT_REQUEST_EVENT = "dts-copilot:prompt-request";

export type CopilotPromptRequest = {
	prompt: string;
	notice?: string;
	submit?: boolean;
	source?: string;
	reportIntentId?: string;
};

const DEFAULT_PROMPT_NOTICE = "已把问题带入 AI Copilot，可直接发送或继续修改。";

type CopilotPromptRequestOptions = Omit<CopilotPromptRequest, "prompt">;

export function buildCopilotPromptRequest(
	prompt: string | null | undefined,
	options: string | CopilotPromptRequestOptions = DEFAULT_PROMPT_NOTICE,
): CopilotPromptRequest | null {
	const normalizedPrompt = prompt?.trim();
	if (!normalizedPrompt) return null;
	const normalizedOptions =
		typeof options === "string" ? { notice: options } : options;
	return {
		prompt: normalizedPrompt,
		notice: normalizedOptions.notice ?? DEFAULT_PROMPT_NOTICE,
		submit: normalizedOptions.submit ?? false,
		...(normalizedOptions.source ? { source: normalizedOptions.source } : {}),
		...(normalizedOptions.reportIntentId
			? { reportIntentId: normalizedOptions.reportIntentId }
			: {}),
	};
}

export function requestCopilotPrompt(request: CopilotPromptRequest): void {
	if (typeof window === "undefined") return;
	const normalized = buildCopilotPromptRequest(request.prompt, request);
	if (!normalized) return;
	window.dispatchEvent(
		new CustomEvent<CopilotPromptRequest>(COPILOT_PROMPT_REQUEST_EVENT, {
			detail: normalized,
		}),
	);
}
