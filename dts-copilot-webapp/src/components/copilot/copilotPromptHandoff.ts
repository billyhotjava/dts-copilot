import type { CopilotPromptRequest } from "./copilotPromptRequest";

export type CopilotPromptHandoffDecision =
	| { mode: "ignore" }
	| { mode: "prefill"; prompt: string; notice: string }
	| { mode: "submit"; prompt: string; notice: string }
	| { mode: "queue"; prompt: string; notice: string };

type ResolveCopilotPromptHandoffInput = {
	request: CopilotPromptRequest | null;
	sending: boolean;
};

type PromptRequestWithNonce = CopilotPromptRequest & { nonce?: number };

const PREFILL_NOTICE = "已把问题带入 AI Copilot，可直接发送或继续修改。";
const QUEUE_NOTICE = "当前回答结束后会继续执行新的报表问题。";

export function resolveCopilotPromptHandoff({
	request,
	sending,
}: ResolveCopilotPromptHandoffInput): CopilotPromptHandoffDecision {
	const prompt = request?.prompt?.trim();
	if (!prompt) return { mode: "ignore" };
	if (!request?.submit) {
		return {
			mode: "prefill",
			prompt,
			notice: request?.notice ?? PREFILL_NOTICE,
		};
	}
	if (sending) {
		return {
			mode: "queue",
			prompt,
			notice: QUEUE_NOTICE,
		};
	}
	return {
		mode: "submit",
		prompt,
		notice: request?.notice ?? PREFILL_NOTICE,
	};
}

export function createCopilotPromptRequestGate() {
	let consumedKey: string | null = null;
	return {
		shouldConsume(request: PromptRequestWithNonce | null | undefined): boolean {
			if (!request) return false;
			const prompt = request?.prompt?.trim();
			if (!prompt) return false;
			const key = buildPromptRequestKey(request, prompt);
			if (key === consumedKey) {
				return false;
			}
			consumedKey = key;
			return true;
		},
	};
}

function buildPromptRequestKey(
	request: PromptRequestWithNonce,
	normalizedPrompt: string,
): string {
	if (request.nonce != null) {
		return `nonce:${request.nonce}`;
	}
	return [
		"prompt",
		normalizedPrompt,
		request.submit ? "submit" : "prefill",
		request.source ?? "",
		request.reportIntentId ?? "",
	].join("|");
}
