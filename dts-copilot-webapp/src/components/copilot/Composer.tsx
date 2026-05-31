import type { RefObject } from "react";
import { VoiceInputButton } from "./VoiceInputButton";
import { shouldSubmitCopilotInputOnEnter } from "./copilotInputBehavior";
import type { CopilotSendAction } from "./copilotStreamControl";

interface ComposerProps {
	canEditComposer: boolean;
	copilotEnabled: boolean;
	input: string;
	inputRef: RefObject<HTMLTextAreaElement | null>;
	sendAction: CopilotSendAction;
	sending: boolean;
	onInputChange: (value: string) => void;
	onNewChat: () => void;
	onStop: () => void;
	onSubmit: () => void | Promise<void>;
	onVoiceTranscript: (text: string, isFinal: boolean) => void;
}

export function Composer({
	canEditComposer,
	copilotEnabled,
	input,
	inputRef,
	sendAction,
	sending,
	onInputChange,
	onNewChat,
	onStop,
	onSubmit,
	onVoiceTranscript,
}: ComposerProps) {
	return (
		<div className="copilot-chat__input-area">
			<button
				type="button"
				className="copilot-chat__new-btn"
				onClick={onNewChat}
				title="新对话"
				disabled={sending}
			>
				+
			</button>
			<textarea
				ref={inputRef}
				className="copilot-chat__input"
				rows={1}
				value={input}
				onChange={(event) => {
					onInputChange(event.target.value);
					const el = event.target;
					el.style.height = "auto";
					el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
				}}
				onKeyDown={(event) => {
					const nativeEvent = event.nativeEvent as KeyboardEvent & {
						isComposing?: boolean;
						keyCode?: number;
					};
					if (
						shouldSubmitCopilotInputOnEnter({
							key: event.key,
							shiftKey: event.shiftKey,
							isComposing: nativeEvent.isComposing,
							keyCode: nativeEvent.keyCode,
						})
					) {
						event.preventDefault();
						void onSubmit();
						const el = event.target as HTMLTextAreaElement;
						requestAnimationFrame(() => {
							el.style.height = "auto";
						});
					}
				}}
				placeholder={
					copilotEnabled
						? "输入问题..."
						: "需要先登录或配置 copilot API Key 才能使用 AI Copilot"
				}
				disabled={!canEditComposer}
			/>
			<VoiceInputButton
				onTranscript={onVoiceTranscript}
				disabled={!canEditComposer || sending}
			/>
			<button
				type="button"
				className="copilot-chat__send-btn"
				onClick={sendAction.mode === "stop" ? onStop : () => void onSubmit()}
				disabled={sendAction.disabled}
			>
				{sendAction.label}
			</button>
		</div>
	);
}
