import { useState } from "react";
import { SendIcon } from "../../../layouts/AppLayout.icons";
import { VoiceInputButton } from "../VoiceInputButton";
import { mergeTranscript } from "./coldStartComposerModel";

type ColdStartComposerProps = {
	onSubmit: (text: string) => void;
};

export function ColdStartComposer({ onSubmit }: ColdStartComposerProps) {
	const [value, setValue] = useState("");
	const [interimTranscript, setInterimTranscript] = useState("");

	const visibleValue = interimTranscript
		? mergeTranscript(value, interimTranscript)
		: value;
	const canSubmit = value.trim().length > 0;

	const submit = () => {
		const text = value.trim();
		if (!text) return;
		onSubmit(text);
		setValue("");
		setInterimTranscript("");
	};

	const handleTranscript = (text: string, isFinal: boolean) => {
		if (isFinal) {
			setValue((current) => mergeTranscript(current, text));
			setInterimTranscript("");
			return;
		}
		setInterimTranscript(text);
	};

	return (
		<div className="cold-start-composer">
			<textarea
				className="cold-start-composer__input"
				placeholder="问一句，或说一句…"
				value={visibleValue}
				rows={3}
				onChange={(event) => {
					setValue(event.target.value);
					setInterimTranscript("");
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter" && !event.shiftKey) {
						event.preventDefault();
						submit();
					}
				}}
			/>
			<div className="cold-start-composer__actions">
				<VoiceInputButton onTranscript={handleTranscript} disabled={false} />
				<button
					type="button"
					className="cold-start-composer__send"
					aria-label="发送"
					disabled={!canSubmit}
					onClick={submit}
				>
					<SendIcon />
					<span>发送</span>
				</button>
			</div>
		</div>
	);
}
