import { useState } from "react";
import {
	type ActionExecutionResult,
	type ActionTypeDef,
	executeAction,
} from "../../api/hubApi";
import { DynamicSchemaForm } from "./DynamicSchemaForm";
import "./ActionExecutePanel.css";

interface Props {
	instanceId: string;
	actions: ActionTypeDef[];
}

type Phase = "idle" | "form" | "executing" | "result";

export function ActionExecutePanel({ instanceId, actions }: Props) {
	const [selectedAction, setSelectedAction] = useState<ActionTypeDef | null>(
		null,
	);
	const [phase, setPhase] = useState<Phase>("idle");
	const [params, setParams] = useState<Record<string, unknown>>({});
	const [result, setResult] = useState<ActionExecutionResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	function startAction(action: ActionTypeDef) {
		setSelectedAction(action);
		setParams({});
		setError(null);
		setResult(null);
		const hasParams =
			action.paramsSchema &&
			Object.keys(action.paramsSchema.properties ?? {}).length > 0;
		setPhase(hasParams ? "form" : "executing");
		if (!hasParams) {
			doExecute(action, {});
		}
	}

	function submitForm() {
		if (!selectedAction) return;
		setPhase("executing");
		doExecute(selectedAction, params);
	}

	async function doExecute(
		action: ActionTypeDef,
		actionParams: Record<string, unknown>,
	) {
		try {
			const res = await executeAction(
				instanceId,
				action.actionTypeId,
				actionParams,
			);
			setResult(res);
			setPhase("result");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Execution failed");
			setPhase("result");
		}
	}

	function reset() {
		setSelectedAction(null);
		setPhase("idle");
		setParams({});
		setResult(null);
		setError(null);
	}

	if (actions.length === 0) return null;

	const isHighRisk = (a: ActionTypeDef) => {
		const r = (a.confirmRequired ?? "").toLowerCase();
		return ["high", "critical", "required", "true"].includes(r);
	};

	return (
		<div className="action-panel">
			<div className="action-panel__title">Actions</div>

			{phase === "idle" && (
				<div className="action-panel__buttons">
					{actions.map((a) => (
						<button
							key={a.actionTypeId}
							type="button"
							className={`action-panel__btn ${isHighRisk(a) ? "action-panel__btn--risk" : ""}`}
							onClick={() => startAction(a)}
							title={a.description}
						>
							{a.displayName}
							{isHighRisk(a) && (
								<span className="action-panel__risk-badge">Approval</span>
							)}
						</button>
					))}
				</div>
			)}

			{phase === "form" && selectedAction && (
				<div className="action-panel__form">
					<div className="action-panel__form-title">
						{selectedAction.displayName}
					</div>
					<DynamicSchemaForm
						schema={selectedAction.paramsSchema}
						values={params}
						onChange={setParams}
					/>
					<div className="action-panel__form-actions">
						<button
							type="button"
							className="action-panel__btn"
							onClick={submitForm}
						>
							{isHighRisk(selectedAction) ? "Submit for Approval" : "Execute"}
						</button>
						<button
							type="button"
							className="action-panel__btn action-panel__btn--secondary"
							onClick={reset}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{phase === "executing" && (
				<div className="action-panel__status">Executing...</div>
			)}

			{phase === "result" && (
				<div className="action-panel__result">
					{error ? (
						<div className="action-panel__error">{error}</div>
					) : result?.status === "PENDING" ? (
						<div className="action-panel__pending">
							Action submitted for approval (Request ID:{" "}
							{result.request?.requestId})
						</div>
					) : (
						<div className="action-panel__success">
							{result?.result?.message ?? "Action executed successfully"}
						</div>
					)}
					<button
						type="button"
						className="action-panel__btn action-panel__btn--secondary"
						onClick={reset}
					>
						Close
					</button>
				</div>
			)}
		</div>
	);
}
