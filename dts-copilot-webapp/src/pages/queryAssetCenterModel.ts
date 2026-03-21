import type { AnalysisDraftListItem, CardListItem } from '../api/analyticsApi'

export type QueryAssetTab = 'all' | 'saved' | 'drafts' | 'recent'

export type QueryAssetItem = {
	assetType: 'card' | 'draft'
	id: number
	title: string
	description?: string | null
	display?: string | null
	sourceLabel: string
	statusLabel: string
	question?: string | null
	updatedAt?: string
	href: string
}

export type QueryAssetTabItem = {
	id: QueryAssetTab
	label: string
	count: number
}

export function normalizeQueryAssets(cards: CardListItem[], drafts: AnalysisDraftListItem[]): QueryAssetItem[] {
	const normalizedCards = cards.map((card) => ({
		assetType: 'card' as const,
		id: Number(card.id),
		title: card.name?.trim() || '未命名查询',
		description: card.description ?? null,
		display: card.display ?? null,
		sourceLabel: '正式查询',
		statusLabel: '已保存',
		question: null,
		updatedAt: card.updated_at,
		href: `/questions/${encodeURIComponent(String(card.id))}`,
	}))

	const normalizedDrafts = drafts.map((draft) => ({
		assetType: 'draft' as const,
		id: Number(draft.id),
		title: draft.title?.trim() || draft.question?.trim() || '未命名草稿',
		description: draft.explanation_text ?? null,
		display: draft.suggested_display ?? 'table',
		sourceLabel: draft.source_type === 'copilot' ? 'Copilot 草稿' : '分析草稿',
		statusLabel: draft.status === 'SAVED_QUERY' ? '已转正式查询' : '草稿',
		question: draft.question ?? null,
		updatedAt: draft.updated_at,
		href: `/questions/new?draft=${encodeURIComponent(String(draft.id))}`,
	}))

	return [...normalizedCards, ...normalizedDrafts].sort(compareUpdatedAtDesc)
}

export function buildQueryAssetTabs(cards: CardListItem[], drafts: AnalysisDraftListItem[]): QueryAssetTabItem[] {
	const allCount = cards.length + drafts.length
	const recentCount = Math.min(allCount, 10)
	return [
		{ id: 'all', label: '全部', count: allCount },
		{ id: 'saved', label: '正式查询', count: cards.length },
		{ id: 'drafts', label: 'Copilot 草稿', count: drafts.length },
		{ id: 'recent', label: '最近分析', count: recentCount },
	]
}

export function filterQueryAssets(items: QueryAssetItem[], tab: QueryAssetTab, searchQuery: string): QueryAssetItem[] {
	let visible = items
	if (tab === 'saved') {
		visible = items.filter((item) => item.assetType === 'card')
	} else if (tab === 'drafts') {
		visible = items.filter((item) => item.assetType === 'draft')
	} else if (tab === 'recent') {
		visible = items.slice(0, 10)
	}

	const query = searchQuery.trim().toLowerCase()
	if (!query) {
		return visible
	}
	return visible.filter((item) =>
		[item.title, item.description ?? '', item.question ?? '', item.sourceLabel, item.statusLabel]
			.join(' ')
			.toLowerCase()
			.includes(query),
	)
}

function compareUpdatedAtDesc(left: QueryAssetItem, right: QueryAssetItem): number {
	const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0
	const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0
	return rightTime - leftTime
}
