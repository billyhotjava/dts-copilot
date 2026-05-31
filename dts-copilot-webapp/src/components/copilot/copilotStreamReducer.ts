import type {
	AiAgentChatMessage,
	CopilotStreamEvent,
} from "../../api/analyticsApi";
import {
	appendReasoningDelta,
	appendToolProgressLine,
} from "./copilotReasoningState";

export interface CopilotStreamMessageOptions {
	assistantId: string;
	streamedContent: string;
	pendingReasoning: string;
}

export interface CopilotStreamState {
	messages: AiAgentChatMessage[];
	streamedContent: string;
	streamedSessionId: string | null;
	error: string | null;
}

export function reduceCopilotStreamContent(
	current: string,
	event: CopilotStreamEvent,
): string {
	return event.type === "token" ? `${current}${event.content}` : current;
}

export function reduceCopilotStreamMessages(
	messages: AiAgentChatMessage[],
	event: CopilotStreamEvent,
	options: CopilotStreamMessageOptions,
): AiAgentChatMessage[] {
	switch (event.type) {
		case "session":
		case "heartbeat":
			return messages;
		case "reasoning":
			return updateAssistantMessage(messages, options.assistantId, (message) => ({
				...message,
				reasoningContent: appendReasoningDelta(
					withoutPendingReasoning(message.reasoningContent, options.pendingReasoning),
					event.content,
				),
			}));
		case "token":
			return updateAssistantMessage(messages, options.assistantId, (message) => ({
				...message,
				content: options.streamedContent,
				reasoningContent: withoutPendingReasoning(
					message.reasoningContent,
					options.pendingReasoning,
				),
			}));
		case "tool":
			return updateAssistantMessage(messages, options.assistantId, (message) => ({
				...message,
				reasoningContent: appendToolProgressLine(
					withoutPendingReasoning(message.reasoningContent, options.pendingReasoning),
					{
						tool: event.tool,
						status: event.status,
					},
				),
			}));
		case "done":
			return updateAssistantMessage(messages, options.assistantId, (message) => ({
				...message,
				generatedSql: event.generatedSql,
				templateCode: event.templateCode,
				routedDomain: event.routedDomain,
				targetView: event.targetView,
				responseKind: event.responseKind,
				suggestedDisplay: event.suggestedDisplay,
				dataSurface: event.dataSurface,
				qualityLevel: event.qualityLevel,
				qualityNotes: event.qualityNotes,
				reportCode: event.reportCode,
				sourceRefs: event.sourceRefs,
				assumptions: event.assumptions,
				confidence: event.confidence,
				clarifications: event.clarifications,
				trace: event.trace,
			}));
		case "error":
			return updateAssistantMessage(messages, options.assistantId, (message) => ({
				...message,
				content: event.error,
				reasoningContent: withoutPendingReasoning(
					message.reasoningContent,
					options.pendingReasoning,
				),
			}));
	}
}

export function reduceCopilotStreamState(
	state: CopilotStreamState,
	event: CopilotStreamEvent,
	options: Omit<CopilotStreamMessageOptions, "streamedContent">,
): CopilotStreamState {
	const streamedContent = reduceCopilotStreamContent(
		state.streamedContent,
		event,
	);
	return {
		messages: reduceCopilotStreamMessages(state.messages, event, {
			...options,
			streamedContent,
		}),
		streamedContent,
		streamedSessionId:
			event.type === "session" ? event.sessionId : state.streamedSessionId,
		error: event.type === "error" ? event.error : state.error,
	};
}

function updateAssistantMessage(
	messages: AiAgentChatMessage[],
	assistantId: string,
	update: (message: AiAgentChatMessage) => AiAgentChatMessage,
): AiAgentChatMessage[] {
	return messages.map((message) =>
		message.id === assistantId ? update(message) : message,
	);
}

function withoutPendingReasoning(
	reasoningContent: string | undefined,
	pendingReasoning: string,
): string | undefined {
	return reasoningContent === pendingReasoning ? undefined : reasoningContent;
}
