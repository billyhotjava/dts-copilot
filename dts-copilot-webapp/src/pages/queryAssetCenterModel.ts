import type { AnalysisDraftListItem, CardListItem } from '../api/analyticsApi'

export type QueryAssetTab = 'all' | 'saved' | 'drafts' | 'recent'
export type QueryAssetSourceFilter = 'all' | 'manual' | 'copilot'
export type QueryAssetStatusFilter = 'all' | 'saved' | 'draft' | 'promoted'
export type QueryAssetSortMode = 'updated-desc' | 'updated-asc' | 'title-asc'

export type QueryAssetItem = {
	assetType: 'card' | 'draft'
	id: number
	title: string
	description?: string | null
	display?: string | null
	sourceLabel: string
	statusLabel: string
	sourceType: QueryAssetSourceFilter
	statusType: Exclude<QueryAssetStatusFilter, 'all'>
	question?: string | null
	updatedAt?: string
	href: string
}

export type QueryAssetTabItem = {
	id: QueryAssetTab
	label: string
	count: number
}

export type QueryAssetFilterInput = {
	tab: QueryAssetTab
	searchQuery: string
	sourceFilter?: QueryAssetSourceFilter
	statusFilter?: QueryAssetStatusFilter
	sortMode?: QueryAssetSortMode
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
		sourceType: 'manual' as const,
		statusType: 'saved' as const,
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
		sourceType: draft.source_type === 'copilot' ? 'copilot' as const : 'manual' as const,
		statusType: draft.status === 'SAVED_QUERY' ? 'promoted' as const : 'draft' as const,
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

export function filterQueryAssets(items: QueryAssetItem[], filters: QueryAssetFilterInput): QueryAssetItem[] {
	const {
		tab,
		searchQuery,
		sourceFilter = 'all',
		statusFilter = 'all',
		sortMode = 'updated-desc',
	} = filters
	let visible = items
	if (tab === 'saved') {
		visible = items.filter((item) => item.assetType === 'card')
	} else if (tab === 'drafts') {
		visible = items.filter((item) => item.assetType === 'draft' && item.statusType === 'draft')
	} else if (tab === 'recent') {
		visible = items.filter((item) => item.sourceType === 'copilot').slice(0, 10)
	}

	if (sourceFilter !== 'all') {
		visible = visible.filter((item) => item.sourceType === sourceFilter)
	}

	if (statusFilter !== 'all') {
		visible = visible.filter((item) => item.statusType === statusFilter)
	}

	const query = searchQuery.trim().toLowerCase()
	if (!query) {
		return sortQueryAssets(visible, sortMode)
	}
	return sortQueryAssets(visible.filter((item) =>
		[item.title, item.description ?? '', item.question ?? '', item.sourceLabel, item.statusLabel]
			.join(' ')
			.toLowerCase()
			.includes(query),
	), sortMode)
}

function compareUpdatedAtDesc(left: QueryAssetItem, right: QueryAssetItem): number {
	const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0
	const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0
	return rightTime - leftTime
}

function sortQueryAssets(items: QueryAssetItem[], sortMode: QueryAssetSortMode): QueryAssetItem[] {
	const sorted = [...items]
	if (sortMode === 'updated-asc') {
		sorted.sort((left, right) => compareUpdatedAtDesc(right, left))
		return sorted
	}
	if (sortMode === 'title-asc') {
		sorted.sort((left, right) => left.title.localeCompare(right.title, 'zh-CN'))
		return sorted
	}
	sorted.sort(compareUpdatedAtDesc)
	return sorted
}
