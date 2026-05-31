import type { CopilotSuggestedQuestion } from "../../../api/analyticsApi";
import { AGENT_REPORT_BUSINESS_GUIDE } from "../../../pages/agent-reports/agentReportQuickStarts";
import { DEFAULT_WELCOME_GROUPS } from "../welcomeCardModel";

export type StarterChip = {
	id: string;
	label: string;
	prompt: string;
	kind: "question" | "fixed-report";
};

const FIXED_REPORT_CHIP: StarterChip = {
	id: "fixed-report-flowerbiz-monthly",
	label: "打开报花月报",
	prompt: "打开报花月报，按月展示 PRS 租赁报花执行、收入、回收和异常波动。",
	kind: "fixed-report",
};

function normalizeId(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\p{Letter}\p{Number}-]+/gu, "");
}

function pushUnique(chips: StarterChip[], chip: StarterChip) {
	if (!chip.label.trim() || !chip.prompt.trim()) return;
	if (chips.some((item) => item.label === chip.label)) return;
	chips.push(chip);
}

export function buildStarterChips(
	suggestions: CopilotSuggestedQuestion[],
	limit = 5,
): StarterChip[] {
	const chips: StarterChip[] = [];

	for (const suggestion of suggestions) {
		const question = suggestion.question?.trim();
		if (!question) continue;
		pushUnique(chips, {
			id: `suggestion-${normalizeId(question)}`,
			label: question,
			prompt: question,
			kind: "question",
		});
		if (chips.length >= limit) break;
	}

	if (chips.length === 0) {
		for (const domain of AGENT_REPORT_BUSINESS_GUIDE) {
			for (const question of domain.questions) {
				pushUnique(chips, {
					id: question.id,
					label: question.label,
					prompt: question.prompt,
					kind: "question",
				});
				if (chips.length >= limit) break;
			}
			if (chips.length >= limit) break;
		}
	}

	if (chips.length === 0) {
		for (const group of DEFAULT_WELCOME_GROUPS) {
			for (const question of group.questions) {
				pushUnique(chips, {
					id: `default-${normalizeId(question)}`,
					label: question,
					prompt: question,
					kind: "question",
				});
				if (chips.length >= limit) break;
			}
			if (chips.length >= limit) break;
		}
	}

	return [...chips, FIXED_REPORT_CHIP];
}
