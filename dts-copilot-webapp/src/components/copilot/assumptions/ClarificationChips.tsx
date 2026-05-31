import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { CopilotClarification } from "../../../api/analyticsApi";
import "./ClarificationChips.css";

interface ClarificationChipsProps {
	clarifications?: CopilotClarification[] | null;
	onAnswer: (answers: Record<string, string>) => void;
	disabled?: boolean;
}

export function ClarificationChips({
	clarifications,
	onAnswer,
	disabled = false,
}: ClarificationChipsProps) {
	const items = useMemo(
		() => (Array.isArray(clarifications) ? clarifications : []),
		[clarifications],
	);
	const [answers, setAnswers] = useState<Record<string, string>>({});

	useEffect(() => {
		setAnswers((current) => {
			const allowedKeys = new Set(items.map((item) => item.key));
			return Object.fromEntries(
				Object.entries(current).filter(([key]) => allowedKeys.has(key)),
			);
		});
	}, [items]);

	if (items.length === 0) {
		return null;
	}

	const complete = items.every((item) => Boolean(answers[item.key]));

	function selectOption(key: string, value: string) {
		if (disabled) return;
		setAnswers((current) => ({ ...current, [key]: value }));
	}

	function handleOptionKeyDown(
		event: KeyboardEvent<HTMLButtonElement>,
		clarification: CopilotClarification,
		optionIndex: number,
	) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			selectOption(
				clarification.key,
				clarification.options[optionIndex]?.value ?? "",
			);
			return;
		}
		if (
			event.key !== "ArrowRight" &&
			event.key !== "ArrowDown" &&
			event.key !== "ArrowLeft" &&
			event.key !== "ArrowUp"
		) {
			return;
		}
		event.preventDefault();
		const delta =
			event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
		const nextIndex =
			(optionIndex + delta + clarification.options.length) %
			clarification.options.length;
		const nextOption = clarification.options[nextIndex];
		if (!nextOption) return;
		selectOption(clarification.key, nextOption.value);
		(event.currentTarget.parentElement?.querySelectorAll("button")[
			nextIndex
		] as HTMLButtonElement | undefined)?.focus();
	}

	function submit() {
		if (!complete || disabled) return;
		onAnswer(answers);
	}

	return (
		<div className="clarification-chips" aria-label="需要澄清的口径">
			{items.map((clarification) => {
				const selectedValue = answers[clarification.key] ?? "";
				return (
					<div className="clarification-chips__group" key={clarification.key}>
						<div className="clarification-chips__question">
							{clarification.question}
						</div>
						<div
							className="clarification-chips__options"
							role="radiogroup"
							aria-label={clarification.question}
						>
							{clarification.options.map((option, index) => {
								const selected = selectedValue === option.value;
								return (
									<button
										key={option.value}
										type="button"
										role="radio"
										aria-checked={selected}
										disabled={disabled}
										tabIndex={selected || (!selectedValue && index === 0) ? 0 : -1}
										className={`clarification-chips__option${selected ? " clarification-chips__option--selected" : ""}`}
										onClick={() =>
											selectOption(clarification.key, option.value)
										}
										onKeyDown={(event) =>
											handleOptionKeyDown(event, clarification, index)
										}
									>
										{option.label}
									</button>
								);
							})}
						</div>
					</div>
				);
			})}
			<button
				type="button"
				className="clarification-chips__continue"
				disabled={!complete || disabled}
				onClick={submit}
			>
				继续
			</button>
		</div>
	);
}
