export type InlineSqlPreviewVariant = "sql" | "report";

export type InlineSqlPreviewPresentationInput = {
	variant?: InlineSqlPreviewVariant;
	suggestedDisplay?: string | null;
	dataSurface?: string | null;
	qualityLevel?: string | null;
	reportCode?: string | null;
};

export type InlineSqlPreviewPresentation = {
	label: string;
	sqlVisibleByDefault: boolean;
	summaryItems: string[];
};

export function resolveInlineSqlPreviewPresentation({
	variant = "sql",
	suggestedDisplay,
	dataSurface,
	qualityLevel,
	reportCode,
}: InlineSqlPreviewPresentationInput): InlineSqlPreviewPresentation {
	if (variant !== "report") {
		return {
			label: "生成的 SQL",
			sqlVisibleByDefault: true,
			summaryItems: [],
		};
	}
	return {
		label: "报表草稿",
		sqlVisibleByDefault: false,
		summaryItems: [
			suggestedDisplay ? `推荐图表：${suggestedDisplay}` : null,
			dataSurface ? `数据层：${dataSurface}` : null,
			qualityLevel ? `质量等级：${qualityLevel}` : null,
			reportCode ? `报表编码：${reportCode}` : null,
		].filter((item): item is string => Boolean(item)),
	};
}
