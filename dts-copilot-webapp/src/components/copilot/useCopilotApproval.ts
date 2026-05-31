import { useEffect, useMemo, useState } from "react";
import type { AiAgentPendingAction } from "../../api/analyticsApi";
import { analyticsApi } from "../../api/analyticsApi";
import {
	buildInitialApprovalValues,
	normalizeMicroForm,
	resolveUiError,
} from "./CopilotChat.helpers";

type FormValues = Record<string, string | number | undefined>;
type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

interface UseCopilotApprovalInput {
	copilotDisabledMessage: string;
	copilotEnabled: boolean;
	pendingAction: AiAgentPendingAction | null;
	selectedDbId: number | null;
	sessionId: string | null;
	reloadMessages: (sessionId: string) => Promise<void>;
	reloadSessions: () => Promise<unknown>;
	setError: StateSetter<string | null>;
	setPendingAction: StateSetter<AiAgentPendingAction | null>;
	setSending: StateSetter<boolean>;
}

export function useCopilotApproval({
	copilotDisabledMessage,
	copilotEnabled,
	pendingAction,
	selectedDbId,
	sessionId,
	reloadMessages,
	reloadSessions,
	setError,
	setPendingAction,
	setSending,
}: UseCopilotApprovalInput) {
	const [approvalValues, setApprovalValues] = useState<FormValues>({});
	const approvalSchema = useMemo(
		() => normalizeMicroForm(pendingAction),
		[pendingAction],
	);

	useEffect(() => {
		setApprovalValues(
			buildInitialApprovalValues(pendingAction, approvalSchema, selectedDbId),
		);
	}, [pendingAction, approvalSchema, selectedDbId]);

	async function handleApprove() {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		if (!sessionId || !pendingAction?.actionId) return;
		setSending(true);
		setError(null);
		try {
			let formData: Record<string, unknown> | undefined;
			if (approvalSchema) {
				const payload: Record<string, unknown> = {};
				for (const field of approvalSchema.fields) {
					const raw = approvalValues[field.key];
					const missing =
						raw == null || (typeof raw === "string" && raw.trim().length === 0);
					if (missing) {
						if (field.required) {
							setError(`缺少参数: ${field.label}`);
							setSending(false);
							return;
						}
						continue;
					}
					if (field.type === "number" && typeof raw === "string") {
						const num = Number(raw);
						if (Number.isFinite(num)) {
							payload[field.key] = num;
							continue;
						}
					}
					payload[field.key] = raw;
				}

				if (typeof payload.confJson === "string") {
					const confRaw = payload.confJson.trim();
					delete payload.confJson;
					if (confRaw.length > 0) {
						try {
							const parsed = JSON.parse(confRaw);
							if (
								parsed == null ||
								Array.isArray(parsed) ||
								typeof parsed !== "object"
							) {
								setError("运行参数必须是 JSON 对象");
								setSending(false);
								return;
							}
							payload.conf = parsed;
						} catch {
							setError("运行参数 JSON 格式不正确");
							setSending(false);
							return;
						}
					}
				}
				formData = Object.keys(payload).length > 0 ? payload : undefined;
			}

			await analyticsApi.aiAgentChatApprove(
				sessionId,
				pendingAction.actionId,
				formData,
			);
			setPendingAction(null);
			await reloadMessages(sessionId);
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "审批失败"));
		} finally {
			setSending(false);
		}
	}

	async function handleCancel() {
		if (!copilotEnabled) {
			setError(copilotDisabledMessage);
			return;
		}
		if (!sessionId || !pendingAction?.actionId) return;
		setSending(true);
		try {
			await analyticsApi.aiAgentChatCancel(sessionId, pendingAction.actionId);
			setPendingAction(null);
			await reloadMessages(sessionId);
			await reloadSessions();
		} catch (e) {
			setError(resolveUiError(e, "取消失败"));
		} finally {
			setSending(false);
		}
	}

	function setApprovalField(fieldKey: string, value: string) {
		setApprovalValues((prev) => ({
			...prev,
			[fieldKey]: value,
		}));
	}

	return {
		approvalSchema,
		approvalValues,
		handleApprove,
		handleCancel,
		resetApprovalValues: () => setApprovalValues({}),
		setApprovalField,
	};
}
