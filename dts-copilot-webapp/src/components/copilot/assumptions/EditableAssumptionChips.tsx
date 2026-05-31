import { useEffect, useMemo, useState } from "react";
import type { CopilotAssumption } from "./assumptionTypes";
import {
	formatAssumptionChipLabel,
	hasAssumptionChanged,
} from "./assumptionTypes";
import "./EditableAssumptionChips.css";

interface EditableAssumptionChipsProps {
	assumptions?: CopilotAssumption[] | null;
	onCommit: (key: string, nextValue: string) => void;
	disabled?: boolean;
}

export function EditableAssumptionChips({
	assumptions,
	onCommit,
	disabled = false,
}: EditableAssumptionChipsProps) {
	const items = useMemo(
		() => (Array.isArray(assumptions) ? assumptions : []),
		[assumptions],
	);
	const [editingKey, setEditingKey] = useState<string | null>(null);
	const editingAssumption =
		items.find((assumption) => assumption.key === editingKey) ?? null;
	const [draftValue, setDraftValue] = useState("");

	useEffect(() => {
		if (!editingAssumption) return;
		setDraftValue(editingAssumption.value);
	}, [editingAssumption]);

	if (items.length === 0) {
		return null;
	}

	function startEditing(assumption: CopilotAssumption) {
		if (disabled || assumption.editable === false) return;
		setEditingKey(assumption.key);
		setDraftValue(assumption.value);
	}

	function submitEdit() {
		if (!editingAssumption) return;
		const nextValue = draftValue.trim();
		if (nextValue && hasAssumptionChanged(editingAssumption, nextValue)) {
			onCommit(editingAssumption.key, nextValue);
		}
		setEditingKey(null);
	}

	function cancelEdit() {
		setEditingKey(null);
	}

	return (
		<div className="assumption-chips" aria-label="口径假设">
			{items.map((assumption) => {
				if (assumption.key === editingKey && editingAssumption) {
					return (
						<div className="assumption-chips__editor" key={assumption.key}>
							{assumption.options?.length ? (
								<select
									aria-label={assumption.label}
									value={draftValue}
									onChange={(event) => setDraftValue(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Escape") cancelEdit();
									}}
								>
									{assumption.options.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							) : (
								<input
									aria-label={assumption.label}
									value={draftValue}
									onChange={(event) => setDraftValue(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") submitEdit();
										if (event.key === "Escape") cancelEdit();
									}}
								/>
							)}
							<button type="button" onClick={submitEdit}>
								确定
							</button>
							<button type="button" onClick={cancelEdit}>
								取消
							</button>
						</div>
					);
				}

				const readonly = disabled || assumption.editable === false;
				return (
					<button
						key={assumption.key}
						type="button"
						className="assumption-chips__chip"
						aria-disabled={readonly}
						disabled={disabled}
						title={assumption.sourceHint}
						onClick={() => startEditing(assumption)}
					>
						<span>{formatAssumptionChipLabel(assumption)}</span>
						{assumption.editable === false ? null : (
							<span className="assumption-chips__edit-mark" aria-hidden="true">
								EDIT
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
