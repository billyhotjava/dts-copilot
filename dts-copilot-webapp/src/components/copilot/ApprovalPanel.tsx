import type { AiAgentPendingAction } from "../../api/analyticsApi";
import { normalizeMicroForm } from "./CopilotChat.helpers";

type ApprovalSchema = ReturnType<typeof normalizeMicroForm>;
type FormValues = Record<string, string | number | undefined>;

interface ApprovalPanelProps {
	approvalSchema: ApprovalSchema;
	approvalValues: FormValues;
	pendingAction: AiAgentPendingAction;
	sending: boolean;
	onApprove: () => void | Promise<void>;
	onCancel: () => void | Promise<void>;
	onFieldChange: (fieldKey: string, value: string) => void;
}

export function ApprovalPanel({
	approvalSchema,
	approvalValues,
	pendingAction,
	sending,
	onApprove,
	onCancel,
	onFieldChange,
}: ApprovalPanelProps) {
	return (
		<div className="copilot-chat__approval">
			<div className="copilot-chat__approval-title">待审批</div>
			<div className="copilot-chat__approval-detail">
				工具: {pendingAction.toolId}
			</div>
			{pendingAction.reason && (
				<div className="copilot-chat__approval-detail">
					{pendingAction.reason}
				</div>
			)}
			{pendingAction.planSummary && (
				<div className="copilot-chat__approval-detail">
					计划: {pendingAction.planSummary}
				</div>
			)}
			{pendingAction.impactScope && (
				<div className="copilot-chat__approval-detail">
					范围: {pendingAction.impactScope}
				</div>
			)}
			{approvalSchema && (
				<div className="copilot-chat__approval-form">
					{approvalSchema.fields.map((field) => {
						const value = approvalValues[field.key];
						return (
							<label key={field.key} className="copilot-chat__approval-field">
								<span className="copilot-chat__approval-label">
									{field.label}
									{field.required ? " *" : ""}
								</span>
								{field.type === "textarea" ? (
									<textarea
										className="copilot-chat__approval-input copilot-chat__approval-input--textarea"
										rows={2}
										value={value == null ? "" : String(value)}
										placeholder={field.placeholder}
										onChange={(event) =>
											onFieldChange(field.key, event.target.value)
										}
									/>
								) : field.type === "select" ? (
									<select
										className="copilot-chat__approval-input"
										value={value == null ? "" : String(value)}
										onChange={(event) =>
											onFieldChange(field.key, event.target.value)
										}
									>
										<option value="">请选择</option>
										{(field.options ?? []).map((option) => (
											<option
												key={String(option.value)}
												value={String(option.value)}
											>
												{option.label}
											</option>
										))}
									</select>
								) : (
									<input
										className="copilot-chat__approval-input"
										type={field.type === "number" ? "number" : "text"}
										value={value == null ? "" : String(value)}
										placeholder={field.placeholder}
										onChange={(event) =>
											onFieldChange(field.key, event.target.value)
										}
									/>
								)}
								{field.helpText ? (
									<span className="copilot-chat__approval-help">
										{field.helpText}
									</span>
								) : null}
							</label>
						);
					})}
				</div>
			)}
			<div className="copilot-chat__approval-actions">
				<button
					type="button"
					className="copilot-chat__btn copilot-chat__btn--approve"
					onClick={() => void onApprove()}
					disabled={sending}
				>
					批准
				</button>
				<button
					type="button"
					className="copilot-chat__btn copilot-chat__btn--cancel"
					onClick={() => void onCancel()}
					disabled={sending}
				>
					拒绝
				</button>
			</div>
		</div>
	);
}
