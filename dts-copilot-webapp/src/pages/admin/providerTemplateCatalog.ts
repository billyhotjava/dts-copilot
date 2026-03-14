import type { CopilotProviderTemplate } from "../../api/analyticsApi";

export const PROVIDER_TYPE_CUSTOM = "CUSTOM";

const GROUP_ORDER = ["INTERNATIONAL", "CHINA", "LOCAL"] as const;

const GROUP_LABELS: Record<string, string> = {
	INTERNATIONAL: "国际主流",
	CHINA: "中国主流",
	LOCAL: "本地部署",
	CUSTOM: "自定义",
};

export type ProviderFormLike = {
	id: number | null;
	name: string;
	baseUrl: string;
	apiKey: string;
	model: string;
	temperature: string;
	maxTokens: string;
	timeoutSeconds: string;
	isDefault: boolean;
	enabled: boolean;
	priority: string;
	providerType: string;
	apiKeyMasked?: string | null;
	hasApiKey?: boolean;
};

export type ProviderTypeOptionGroup = {
	key: string;
	label: string;
	options: Array<{
		value: string;
		label: string;
		recommended?: boolean;
	}>;
};

function sortTemplates(templates: CopilotProviderTemplate[]): CopilotProviderTemplate[] {
	return [...templates].sort((left, right) => {
		const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
		const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
		if (leftOrder !== rightOrder) {
			return leftOrder - rightOrder;
		}
		return (left.displayName ?? left.name).localeCompare(right.displayName ?? right.name);
	});
}

function findTemplateByType(
	templates: CopilotProviderTemplate[],
	providerType: string | null | undefined,
): CopilotProviderTemplate | null {
	const normalized = String(providerType ?? "").trim();
	if (!normalized || normalized === PROVIDER_TYPE_CUSTOM) {
		return null;
	}
	return (
		templates.find((template) => template.name === normalized) ??
		null
	);
}

function shouldReplaceProviderName(
	current: ProviderFormLike,
	templates: CopilotProviderTemplate[],
): boolean {
	const trimmed = current.name.trim();
	if (!trimmed) {
		return true;
	}
	const previousTemplate = findTemplateByType(templates, current.providerType);
	if (!previousTemplate) {
		return false;
	}
	const previousName = previousTemplate.displayName ?? previousTemplate.name;
	return trimmed === previousName || trimmed === previousTemplate.name;
}

export function isProviderFormPristine(form: ProviderFormLike): boolean {
	return (
		form.id == null &&
		!form.name.trim() &&
		!form.baseUrl.trim() &&
		!form.model.trim() &&
		!form.providerType.trim()
	);
}

export function findRecommendedTemplate(
	templates: CopilotProviderTemplate[],
): CopilotProviderTemplate | null {
	const ordered = sortTemplates(templates);
	return ordered.find((template) => template.recommended) ?? ordered[0] ?? null;
}

export function buildProviderTypeGroups(
	templates: CopilotProviderTemplate[],
): ProviderTypeOptionGroup[] {
	const ordered = sortTemplates(templates);
	const groups: ProviderTypeOptionGroup[] = GROUP_ORDER.map((key) => ({
		key,
		label: GROUP_LABELS[key],
		options: ordered
			.filter((template) => template.region === key)
			.map((template) => ({
				value: template.name,
				label:
					(template.displayName ?? template.name) +
					(template.recommended ? "（推荐）" : ""),
				recommended: template.recommended,
			})),
	})).filter((group) => group.options.length > 0);

	groups.push({
		key: PROVIDER_TYPE_CUSTOM,
		label: GROUP_LABELS.CUSTOM,
		options: [{ value: PROVIDER_TYPE_CUSTOM, label: "Custom" }],
	});

	return groups;
}

export function applyProviderTypeSelection(
	current: ProviderFormLike,
	providerType: string,
	templates: CopilotProviderTemplate[],
): ProviderFormLike {
	const normalized = String(providerType ?? "").trim();
	if (!normalized || normalized === PROVIDER_TYPE_CUSTOM) {
		return {
			...current,
			providerType: PROVIDER_TYPE_CUSTOM,
		};
	}

	const template = findTemplateByType(templates, normalized);
	if (!template) {
		return {
			...current,
			providerType: normalized,
		};
	}

	return {
		...current,
		name: shouldReplaceProviderName(current, templates)
			? (template.displayName ?? template.name)
			: current.name,
		baseUrl: template.defaultBaseUrl ?? current.baseUrl,
		model: template.defaultModel ?? current.model,
		temperature:
			template.defaultTemperature != null
				? String(template.defaultTemperature)
				: current.temperature,
		maxTokens:
			template.defaultMaxTokens != null
				? String(template.defaultMaxTokens)
				: current.maxTokens,
		timeoutSeconds:
			template.defaultTimeoutSeconds != null
				? String(template.defaultTimeoutSeconds)
				: current.timeoutSeconds,
		providerType: template.name,
	};
}

export function createRecommendedProviderFormDefaults(
	templates: CopilotProviderTemplate[],
	emptyForm: ProviderFormLike = {
		id: null,
		name: "",
		baseUrl: "",
		apiKey: "",
		model: "",
		temperature: "0.3",
		maxTokens: "4096",
		timeoutSeconds: "60",
		isDefault: false,
		enabled: true,
		priority: "0",
		providerType: "",
		apiKeyMasked: null,
		hasApiKey: false,
	},
): ProviderFormLike {
	const template = findRecommendedTemplate(templates);
	if (!template) {
		return emptyForm;
	}
	return applyProviderTypeSelection(emptyForm, template.name, templates);
}
