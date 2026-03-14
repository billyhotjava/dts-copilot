const AI_QUICK_ASK_EVENT = "dts:ai-quick-ask";

interface AiQuickAskProps {
	prompt: string;
	tooltip?: string;
}

export function dispatchAiQuickAsk(prompt: string): void {
	window.dispatchEvent(new CustomEvent(AI_QUICK_ASK_EVENT, { detail: prompt }));
}

export { AI_QUICK_ASK_EVENT };

export default function AiQuickAsk({ prompt, tooltip }: AiQuickAskProps) {
	const handleClick = () => dispatchAiQuickAsk(prompt);

	return (
		<button
			type="button"
			className="analytics-ai-quick-ask"
			onClick={handleClick}
			title={tooltip || "问 AI"}
			aria-label={tooltip || "问 AI"}
			style={{
				background: "none",
				border: "none",
				cursor: "pointer",
				padding: "2px 6px",
				borderRadius: 4,
				color: "#1677ff",
				fontSize: 14,
			}}
		>
			🤖
		</button>
	);
}
