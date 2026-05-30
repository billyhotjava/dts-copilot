import type { AiAgentChatMessage } from "../../api/analyticsApi";

export type GeneratedReportDraftNotice = {
	title: string;
	description: string;
	meta: string[];
};

export function isGeneratedReportDraftMessage(
	message: AiAgentChatMessage,
): boolean {
	return message.responseKind === "REPORT_DRAFT";
}

export function inferGeneratedReportSuggestedDisplay({
	message,
	question,
	sql,
}: {
	message?: Pick<AiAgentChatMessage, "suggestedDisplay"> | null;
	question?: string | null;
	sql?: string | null;
}): string {
	const explicit = message?.suggestedDisplay?.trim();
	if (explicit) {
		return explicit;
	}
	const text = `${question ?? ""}\n${sql ?? ""}`.toLowerCase();
	if (
		containsAny(text, [
			"趋势",
			"走势",
			"月度",
			"按月",
			"按日",
			"date_trunc",
			"month_id",
			"day_id",
		])
	) {
		return "line";
	}
	if (
		containsAny(text, ["排行", "排名", "top", "最多", "最高", "最低", "rank"])
	) {
		return "bar";
	}
	if (
		containsAny(text, [
			"占比",
			"比例",
			"构成",
			"分布",
			"rate",
			"ratio",
			"percent",
		])
	) {
		return "pie";
	}
	if (containsAny(text, ["总览", "指标", "kpi", "总数", "合计"])) {
		return "scalar";
	}
	return "table";
}

export function getGeneratedReportDraftNotice(
	message: AiAgentChatMessage,
): GeneratedReportDraftNotice | null {
	if (!isGeneratedReportDraftMessage(message)) {
		return null;
	}
	const meta = [
		message.reportCode ? `报表编码：${message.reportCode}` : null,
		message.routedDomain ? `业务域：${message.routedDomain}` : null,
		message.targetView ? `数据目标：${message.targetView}` : null,
		message.dataSurface ? `数据层：${message.dataSurface}` : null,
		message.qualityLevel ? `质量等级：${message.qualityLevel}` : null,
		...normalizeQualityNotes(message.qualityNotes).map((note) => `质量提示：${note}`),
		...normalizeSourceRefs(message.sourceRefs).map((ref) => `来源：${ref}`),
	].filter((item): item is string => Boolean(item));
	const description = resolveDraftDescription(message);
	return {
		title: "Agent 已生成报表草稿",
		description,
		meta,
	};
}

function normalizeQualityNotes(value: AiAgentChatMessage["qualityNotes"]): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => item.trim()).filter(Boolean);
	}
	if (!value) {
		return [];
	}
	return String(value)
		.split(/[；;\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizeSourceRefs(value: AiAgentChatMessage["sourceRefs"]): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => item.trim()).filter(Boolean);
	}
	if (!value) {
		return [];
	}
	return String(value)
		.split(/[；;\n]/)
		.map((item) => item.trim())
		.filter(Boolean);
}

function resolveDraftDescription(message: AiAgentChatMessage): string {
	if (message.analysisDraftStatus === "saving") {
		return "正在自动保存为分析草稿，保存后可直接打开或创建图表。";
	}
	if (message.analysisDraftStatus === "saved" && message.analysisDraftId) {
		return `已自动保存为分析草稿 #${message.analysisDraftId}，可继续预览、编辑 SQL 或创建图表。`;
	}
	if (message.analysisDraftStatus === "error") {
		return message.analysisDraftError
			? `自动保存草稿失败：${message.analysisDraftError}`
			: "自动保存草稿失败，可在下方手动保存。";
	}
	return "正在自动执行表格预览，确认口径后可直接切换为 BI 侧可视化组件。";
}

function containsAny(text: string, patterns: string[]): boolean {
	return patterns.some((pattern) => text.includes(pattern));
}
