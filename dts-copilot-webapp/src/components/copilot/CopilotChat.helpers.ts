import type {
	AiAgentChatMessage,
	AiAgentPendingAction,
	MicroFormSchema,
} from "../../api/analyticsApi";

// The runtime shape of these types includes extra fields not declared in the
// strict TypeScript definitions (e.g. toolName, microFormSchema, rows, defaultValue).
// We use module-local loose aliases to preserve the original code without
// weakening the exported API types.
type LooseAction = AiAgentPendingAction & Record<string, unknown>;
type LooseFormField = { key: string; label: string; [k: string]: unknown };
type LooseFormSchema = Omit<MicroFormSchema, 'fields'> & { fields: LooseFormField[] };

export const SESSION_ID_KEY = "dts-analytics.copilot.sessionId";
export const DATASOURCE_ID_KEY = "dts-analytics.copilotDatasourceId";
export const STREAM_IDLE_TIMEOUT_MS = 30000;
export const STREAM_PENDING_REASONING = "正在思考…";

export function getStoredDatasourceId(): number | null {
	try {
		const value = sessionStorage.getItem(DATASOURCE_ID_KEY);
		if (value == null) return null;
		const num = Number(value);
		return Number.isFinite(num) ? num : null;
	} catch {
		return null;
	}
}

export const MICRO_FORM_PRESETS: Record<string, LooseFormSchema> = {
	validate_sql: {
		title: "SQL 执行前确认",
		description: "AI 已补全主要参数，请补齐缺失项后再执行。",
		riskLevel: "MEDIUM",
		riskNote: "将触发真实 SQL 校验并读取元数据。",
		fields: [
			{ key: "datasourceId", label: "数据源", required: true, placeholder: "例如: pg-main", source: "session_context" },
			{
				key: "schemaName",
				label: "Schema",
				required: false,
				placeholder: "默认 public",
				source: "session_context",
			},
			{ key: "sql", label: "SQL 语句", required: true, type: "textarea", placeholder: "SELECT ...", rows: 6, source: "tool_result" },
		],
	},
	execute_sql: {
		title: "SQL 执行确认",
		description: "即将在真实数据库上执行 SQL，请核实语句后确认。",
		riskLevel: "HIGH",
		riskNote: "将在数据库上执行读操作并返回数据。",
		fields: [
			{ key: "datasourceId", label: "数据源", required: true, placeholder: "例如: pg-main", source: "session_context" },
			{
				key: "schemaName",
				label: "Schema",
				required: false,
				placeholder: "默认 public",
				source: "session_context",
			},
			{ key: "sql", label: "SQL 语句", required: true, type: "textarea", placeholder: "SELECT ...", rows: 6, source: "tool_result" },
			{ key: "rowLimit", label: "行数限制", required: false, type: "number", placeholder: "100", source: "default" },
		],
	},
};

export function getStoredSessionId(): string | null {
	try {
		return sessionStorage.getItem(SESSION_ID_KEY);
	} catch {
		return null;
	}
}

export function resolveUiError(error: unknown, fallback: string): string {
	if (error instanceof Error) {
		return error.message || fallback;
	}
	return String(error ?? fallback);
}

export function toArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

export function sortMessages(messages: AiAgentChatMessage[]): AiAgentChatMessage[] {
	return [...messages].sort((a, b) => {
		const sa = a.sequenceNum ?? 0;
		const sb = b.sequenceNum ?? 0;
		return sa - sb;
	});
}

export function normalizeMicroForm(action: LooseAction | null): MicroFormSchema | undefined {
	if (!action) return undefined;
	const toolName = String(action.toolName ?? "").trim();
	if (action.microFormSchema) {
		return action.microFormSchema as MicroFormSchema;
	}
	return MICRO_FORM_PRESETS[toolName] as MicroFormSchema | undefined;
}

type FormValues = Record<string, string | number | undefined>;

export function buildInitialApprovalValues(
	action: LooseAction | null,
	form: MicroFormSchema | undefined,
	datasourceId: number | null,
): FormValues {
	const values: FormValues = {};
	if (!action || !form?.fields) return values;
	for (const rawField of form.fields) {
		const field = rawField as LooseFormField;
		if (field.source === "session_context" && field.key === "datasourceId" && datasourceId != null) {
			values[field.key] = datasourceId;
			continue;
		}
		if (field.source === "tool_result" || field.source === "session_context") {
			const toolArgs = action.toolArgs as Record<string, unknown> | null | undefined;
			const toolResult = action.toolResult as Record<string, unknown> | null | undefined;
			const fromArgs = toolArgs?.[field.key];
			if (fromArgs !== undefined && fromArgs !== null && fromArgs !== "") {
				values[field.key] = String(fromArgs);
				continue;
			}
			const fromResult = toolResult?.[field.key];
			if (fromResult !== undefined && fromResult !== null && fromResult !== "") {
				values[field.key] = String(fromResult);
				continue;
			}
		}
		if (field.defaultValue !== undefined && field.defaultValue !== null) {
			values[field.key] = field.defaultValue as string | number;
		}
	}
	return values;
}

/**
 * Collect tool messages that belong to a given assistant message.
 * Groups tool messages between the preceding user message and this assistant message.
 */
export function getToolMessagesForAssistant(
	allMessages: AiAgentChatMessage[],
	assistantMsg: AiAgentChatMessage,
): AiAgentChatMessage[] {
	const assistantSeq = assistantMsg.sequenceNum ?? 0;
	// Find the last user message before this assistant message
	let lastUserSeq = -1;
	for (const m of allMessages) {
		const seq = m.sequenceNum ?? 0;
		if (m.role === "user" && seq < assistantSeq) {
			lastUserSeq = Math.max(lastUserSeq, seq);
		}
	}
	return allMessages.filter(
		(m) =>
			m.role === "tool" &&
			(m.sequenceNum ?? 0) > lastUserSeq &&
		(m.sequenceNum ?? 0) < assistantSeq,
	);
}

export function getUserQuestionForAssistant(
	allMessages: AiAgentChatMessage[],
	assistantMsg: AiAgentChatMessage,
): string | null {
	const assistantSeq = assistantMsg.sequenceNum ?? 0;
	let matched: AiAgentChatMessage | null = null;
	for (const message of allMessages) {
		const seq = message.sequenceNum ?? 0;
		if (message.role === "user" && seq < assistantSeq) {
			if (!matched || seq > (matched.sequenceNum ?? 0)) {
				matched = message;
			}
		}
	}
	return matched?.content?.trim() || null;
}
