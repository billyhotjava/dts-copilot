import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildQueryAssetTabs, filterQueryAssets, normalizeQueryAssets } from '../src/pages/queryAssetCenterModel.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds query asset tabs with saved and copilot draft counts', () => {
	const tabs = buildQueryAssetTabs(
		[{ id: 11, name: '正式查询A' }, { id: 12, name: '正式查询B' }],
		[{ id: 21, title: '草稿A' }],
	)

	assert.deepEqual(
		tabs.map((tab) => [tab.id, tab.count]),
		[
			['all', 3],
			['saved', 2],
			['drafts', 1],
			['recent', 3],
		],
	)
})

test('normalizes cards and drafts into a single sorted asset list', () => {
	const items = normalizeQueryAssets(
		[{ id: 11, name: '正式查询A', updated_at: '2026-03-21T09:00:00Z', display: 'table' }],
		[{ id: 21, title: '采购汇总草稿', source_type: 'copilot', status: 'DRAFT', updated_at: '2026-03-21T10:00:00Z' }],
	)

	assert.deepEqual(
		items.map((item) => [item.assetType, item.title, item.sourceLabel, item.statusLabel, item.sourceType, item.statusType]),
		[
			['draft', '采购汇总草稿', 'Copilot 草稿', '草稿', 'copilot', 'draft'],
			['card', '正式查询A', '正式查询', '已保存', 'manual', 'saved'],
		],
	)
})

test('filters query assets by tab, search query, source, and status', () => {
	const items = normalizeQueryAssets(
		[
			{ id: 11, name: '正式查询A', description: '项目绿植统计', updated_at: '2026-03-21T09:00:00Z' },
			{ id: 12, name: '正式查询B', description: '采购明细', updated_at: '2026-03-20T09:00:00Z' },
		],
		[
			{ id: 21, title: '采购汇总草稿', question: '看采购汇总', source_type: 'copilot', status: 'DRAFT', updated_at: '2026-03-21T10:00:00Z' },
			{ id: 22, title: '库存现量草稿', question: '看库存现量', source_type: 'copilot', status: 'SAVED_QUERY', updated_at: '2026-03-21T11:00:00Z' },
		],
	)

	assert.deepEqual(
		filterQueryAssets(items, { tab: 'drafts', searchQuery: '' }).map((item) => item.assetType),
		['draft'],
	)
	assert.deepEqual(
		filterQueryAssets(items, { tab: 'saved', searchQuery: '采购' }).map((item) => item.title),
		['正式查询B'],
	)
	assert.deepEqual(
		filterQueryAssets(items, { tab: 'all', searchQuery: '看采购汇总' }).map((item) => item.title),
		['采购汇总草稿'],
	)
	assert.deepEqual(
		filterQueryAssets(items, { tab: 'all', searchQuery: '', sourceFilter: 'copilot', statusFilter: 'promoted' }).map((item) => item.title),
		['库存现量草稿'],
	)
})

test('recent tab prioritizes recent copilot analysis instead of all assets', () => {
	const items = normalizeQueryAssets(
		[{ id: 11, name: '正式查询A', updated_at: '2026-03-21T12:00:00Z' }],
		[
			{ id: 21, title: '采购汇总草稿', source_type: 'copilot', status: 'DRAFT', updated_at: '2026-03-21T10:00:00Z' },
			{ id: 22, title: '库存现量草稿', source_type: 'copilot', status: 'SAVED_QUERY', updated_at: '2026-03-21T11:00:00Z' },
		],
	)

	assert.deepEqual(
		filterQueryAssets(items, { tab: 'recent', searchQuery: '' }).map((item) => item.title),
		['库存现量草稿', '采购汇总草稿'],
	)
})

test('supports explicit sort mode for query asset center', () => {
	const items = normalizeQueryAssets(
		[
			{ id: 11, name: 'B查询', updated_at: '2026-03-21T09:00:00Z' },
			{ id: 12, name: 'A查询', updated_at: '2026-03-20T09:00:00Z' },
		],
		[],
	)

	assert.deepEqual(
		filterQueryAssets(items, { tab: 'all', searchQuery: '', sortMode: 'title-asc' }).map((item) => item.title),
		['A查询', 'B查询'],
	)
})

test('cards page exposes copilot draft asset-center language', () => {
	const source = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/CardsPage.tsx'), 'utf8')

	assert.match(source, /Copilot 草稿/)
	assert.match(source, /listAnalysisDrafts/)
	assert.match(source, /buildQueryAssetTabs/)
	assert.match(source, /sourceFilter/)
	assert.match(source, /statusFilter/)
	assert.match(source, /sortMode/)
})
