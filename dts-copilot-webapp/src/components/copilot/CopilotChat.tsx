import {
	ConversationThread,
	type CopilotChatProps,
} from "./ConversationThread";

export type { CopilotChatProps };

export function CopilotChat(props: CopilotChatProps) {
	return <ConversationThread {...props} />;
}
