import type { AiAgentChatMessage } from "../api/analyticsApi";
import type { CopilotTrace } from "../api/analyticsApi";
import type {
	VisualizationSettings,
	VisualizationType,
} from "../components/charts/ChartRenderer";

export interface ArtifactDataset {
	cols: { name: string; display_name?: string; base_type?: string }[];
	rows: unknown[][];
}

export type ArtifactType = "chart" | "table" | "report";

export interface ArtifactSpec {
	display?: VisualizationType;
	settings?: VisualizationSettings;
	dataset?: ArtifactDataset;
	reportCode?: string;
	reportHref?: string;
	generatedSql?: string;
	targetView?: string;
	dataSurface?: string;
	databaseId?: number | string;
	analysisDraftId?: number | string;
	cardId?: number | string;
	sourceRefs?: string[];
	trace?: CopilotTrace;
}

export interface Artifact {
	id: string;
	type: ArtifactType;
	title?: string;
	spec: ArtifactSpec;
	sourceMessageId: string;
	createdAt: number;
}

export interface MessageArtifactRef {
	messageId: string;
	artifactId: string;
}

export type CanvasActionType =
	| "save-card"
	| "pin-dashboard"
	| "trace-sql"
	| "export";

export interface CanvasActionEvent {
	action: CanvasActionType;
	artifact: Artifact;
}

export interface ArtifactFromMessageOptions {
	createdAt?: number;
	id?: string;
	settings?: VisualizationSettings;
	title?: string;
}

type ArtifactMessageInput = Pick<
	AiAgentChatMessage,
	| "content"
	| "dataSurface"
	| "generatedSql"
	| "id"
	| "reportCode"
	| "responseKind"
	| "sourceRefs"
	| "suggestedDisplay"
	| "targetView"
	| "templateCode"
	| "trace"
> & {
	analysisDraftId?: number | string;
	cardId?: number | string;
	databaseId?: number | string;
};

const VISUALIZATION_TYPES: ReadonlySet<string> = new Set<VisualizationType>([
	"table",
	"line",
	"bar",
	"row",
	"pie",
	"area",
	"scalar",
	"number",
	"progress",
	"gauge",
	"combo",
	"waterfall",
	"funnel",
	"scatter",
	"map",
	"pivot",
]);

let fallbackArtifactCounter = 0;

export function makeArtifactId(sourceMessageId: string): string {
	const source = normalizeIdSegment(sourceMessageId);
	const unique =
		globalThis.crypto?.randomUUID?.() ??
		`${Date.now().toString(36)}-${++fallbackArtifactCounter}`;
	return `artifact:${source}:${unique}`;
}

export function artifactFromMessage(
	message: ArtifactMessageInput,
	dataset?: ArtifactDataset | null,
	options: ArtifactFromMessageOptions = {},
): Artifact {
	const display = normalizeVisualizationType(message.suggestedDisplay);
	const type = resolveArtifactType(message, display);
	const reportCode = message.reportCode ?? message.templateCode;
	const spec: ArtifactSpec = {
		display,
		...(options.settings ? { settings: options.settings } : {}),
		...(type !== "report" && dataset ? { dataset } : {}),
		...(reportCode ? { reportCode } : {}),
		...(message.templateCode ? { reportHref: buildFixedReportHref(message.templateCode) } : {}),
		...(message.generatedSql ? { generatedSql: message.generatedSql } : {}),
		...(message.targetView ? { targetView: message.targetView } : {}),
		...(message.dataSurface ? { dataSurface: message.dataSurface } : {}),
		...(message.databaseId ? { databaseId: message.databaseId } : {}),
		...(message.analysisDraftId ? { analysisDraftId: message.analysisDraftId } : {}),
		...(message.cardId ? { cardId: message.cardId } : {}),
		...(message.trace ? { trace: message.trace } : {}),
		...(normalizeSourceRefs(message.sourceRefs).length > 0
			? { sourceRefs: normalizeSourceRefs(message.sourceRefs) }
			: {}),
	};

	return {
		createdAt: options.createdAt ?? Date.now(),
		id: options.id ?? makeArtifactId(message.id),
		sourceMessageId: message.id,
		spec,
		title: options.title ?? resolveArtifactTitle(message, type),
		type,
	};
}

function resolveArtifactType(
	message: ArtifactMessageInput,
	display: VisualizationType,
): ArtifactType {
	if (message.responseKind === "FIXED_REPORT") {
		return "report";
	}
	if (display === "table") {
		return "table";
	}
	return "chart";
}

function normalizeVisualizationType(value?: string | null): VisualizationType {
	const normalized = String(value ?? "table").trim().toLowerCase();
	return VISUALIZATION_TYPES.has(normalized)
		? (normalized as VisualizationType)
		: "table";
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

function buildFixedReportHref(templateCode: string): string {
	return `/agent-bi?fixedReport=${encodeURIComponent(templateCode)}`;
}

function resolveArtifactTitle(
	message: ArtifactMessageInput,
	type: ArtifactType,
): string {
	if (message.reportCode) {
		return message.reportCode;
	}
	if (message.templateCode) {
		return message.templateCode;
	}
	const content = message.content?.trim();
	if (content) {
		return content.length > 48 ? `${content.slice(0, 48)}...` : content;
	}
	return type === "report" ? "报表产物" : "查询产物";
}

function normalizeIdSegment(value: string): string {
	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return normalized || "message";
}
