import type { AnalysisDraftDetail, FixedReportCatalogItem } from '../api/analyticsApi'
import type { BadgeVariant } from '../ui/Badge/Badge'

export type AnalysisProvenanceSurface = 'query' | 'dashboard' | 'reportFactory' | 'screen'

export type AnalysisProvenanceBadge = {
	label: string
	variant: BadgeVariant
}

export type AnalysisProvenanceDetail = {
	label: string
	value: string
}

export type AnalysisProvenanceModel = {
	heading: string
	title: string
	summary: string
	badges: AnalysisProvenanceBadge[]
	details: AnalysisProvenanceDetail[]
}

type AnalysisDraftOptions = {
	surface: AnalysisProvenanceSurface
	isDirty?: boolean
	reportSourceId?: string | number | null
}

type FixedReportOptions = {
	surface: Exclude<AnalysisProvenanceSurface, 'query'>
}

export function buildAnalysisDraftProvenanceModel(
	draft: Pick<AnalysisDraftDetail, 'id' | 'title' | 'question' | 'status' | 'session_id' | 'linked_card_id' | 'suggested_display'>,
	options: AnalysisDraftOptions,
): AnalysisProvenanceModel {
	const title = draft.title?.trim() || draft.question?.trim() || 'Copilot 草稿'
	const details: AnalysisProvenanceDetail[] = []
	const badges: AnalysisProvenanceBadge[] = []

	if (options.surface === 'query') {
		badges.push({ label: 'AI Copilot', variant: 'default' })
		badges.push({
			label: draft.status === 'SAVED_QUERY' ? '已转正式查询' : '草稿',
			variant: draft.status === 'SAVED_QUERY' ? 'success' : 'warning',
		})
		if (draft.question?.trim()) {
			details.push({ label: '原始问题', value: draft.question.trim() })
		}
		if (draft.session_id?.trim()) {
			details.push({ label: '分析会话', value: `#${draft.session_id.trim()}` })
		}
		return {
			heading: 'Copilot 草稿来源',
			title,
			summary: options.isDirty
				? '当前内容已脱离原始草稿，保存时将按当前编辑内容新建正式查询。'
				: '当前内容仍与 Copilot 草稿保持一致，可直接转成正式查询。',
			badges,
			details,
		}
	}

	badges.push({
		label: draft.status === 'SAVED_QUERY' ? '已转正式查询' : '分析草稿',
		variant: draft.status === 'SAVED_QUERY' ? 'success' : 'warning',
	})
	if (draft.suggested_display?.trim()) {
		badges.push({ label: draft.suggested_display.trim(), variant: 'default' })
	}
	if (draft.question?.trim()) {
		details.push({ label: '原始问题', value: draft.question.trim() })
	}
	if (draft.linked_card_id) {
		details.push({ label: '已转正查询', value: `#${draft.linked_card_id}` })
	}
	if (options.surface === 'reportFactory' && options.reportSourceId != null && String(options.reportSourceId).trim()) {
		details.push({ label: '默认报告来源', value: `分析草稿会话 #${String(options.reportSourceId).trim()}` })
	}

	return {
		heading: '分析草稿创建上下文',
		title,
		summary: resolveAnalysisDraftSummary(options.surface),
		badges,
		details,
	}
}

export function buildFixedReportProvenanceModel(
	report: Pick<FixedReportCatalogItem, 'templateCode' | 'name' | 'legacyPagePath' | 'legacyPageTitle'>,
	options: FixedReportOptions,
): AnalysisProvenanceModel {
	const title = report.name?.trim() || report.templateCode?.trim() || '固定报表'
	const badges: AnalysisProvenanceBadge[] = [{ label: '固定报表', variant: 'default' }]
	const details: AnalysisProvenanceDetail[] = []

	if (report.templateCode?.trim()) {
		details.push({ label: '模板编码', value: report.templateCode.trim() })
	}
	if (report.legacyPagePath?.trim()) {
		badges.push({ label: '现网页面可追溯', variant: 'info' })
		details.push({
			label: '现网页面',
			value: report.legacyPageTitle?.trim() || report.legacyPagePath.trim(),
		})
	}

	return {
		heading: '固定报表创建上下文',
		title,
		summary: resolveFixedReportSummary(options.surface),
		badges,
		details,
	}
}

function resolveAnalysisDraftSummary(surface: Exclude<AnalysisProvenanceSurface, 'query'>): string {
	switch (surface) {
		case 'dashboard':
			return '已从分析草稿入口带入当前仪表盘创建页。系统会优先复用草稿对应的查询卡片，并在空白仪表盘中自动挂入第一张图卡。'
		case 'reportFactory':
			return '已从分析草稿入口带入当前页面。若草稿关联了可用会话，报告生成区会默认带入该会话来源，减少手工选择。'
		case 'screen':
			return '已从分析草稿入口带入当前页面，可直接基于该草稿生成大屏，并继承问题语义、说明和推荐图表类型。'
	}
}

function resolveFixedReportSummary(surface: FixedReportOptions['surface']): string {
	switch (surface) {
		case 'dashboard':
			return '已从固定报表入口带入当前仪表盘创建页。当前仅自动带入标题和说明，具体卡片仍需按业务需要添加。'
		case 'reportFactory':
			return '已从固定报表入口带入当前页面。你可以继续创建报告模板草稿，或先查看固定报表运行页。'
		case 'screen':
			return '已从固定报表入口带入当前页面，可直接生成关联大屏草稿或先查看固定报表运行页。'
	}
}
