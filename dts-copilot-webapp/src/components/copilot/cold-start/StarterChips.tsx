import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type CopilotSuggestedQuestion } from "../../../api/analyticsApi";
import { buildStarterChips, type StarterChip } from "./starterChipsModel";

type StarterChipsProps = {
	onPick: (prompt: string, chip: StarterChip) => void;
};

export function StarterChips({ onPick }: StarterChipsProps) {
	const [suggestions, setSuggestions] = useState<CopilotSuggestedQuestion[]>([]);

	useEffect(() => {
		let active = true;
		void analyticsApi
			.listSuggestedQuestions(8)
			.then((rows) => {
				if (active && Array.isArray(rows)) setSuggestions(rows);
			})
			.catch(() => {
				if (active) setSuggestions([]);
			});
		return () => {
			active = false;
		};
	}, []);

	const chips = useMemo(() => buildStarterChips(suggestions), [suggestions]);

	return (
		<div className="cold-start-chips" aria-label="起手问题">
			{chips.map((chip) => (
				<button
					key={chip.id}
					type="button"
					className={`cold-start-chip cold-start-chip--${chip.kind}`}
					onClick={() => onPick(chip.prompt, chip)}
				>
					{chip.label}
				</button>
			))}
		</div>
	);
}
