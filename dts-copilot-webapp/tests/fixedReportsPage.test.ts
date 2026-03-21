import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analyticsApi } from '../src/api/analyticsApi.ts'
import {
	buildFixedReportLegacyPageHref,
	buildFixedReportQuickStartItems,
	buildFixedReportDomainTabs,
	buildFixedReportInitialParameterValues,
	buildFixedReportParameterFields,
	filterFixedReportTemplates,
	getFixedReportRunActionState,
	getFixedReportTemplateAvailability,
	isPlaceholderFixedReport,
} from '../src/pages/fixed-reports/fixedReportCatalogModel.ts'
import { buildFixedReportCreationFlowPath, readSelectedFixedReportTemplate } from '../src/pages/fixed-reports/fixedReportSurfaceEntry.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds fixed report domain tabs in business priority order', () => {
	const tabs = buildFixedReportDomainTabs([
		{ templateCode: 'FIN-AR-OVERVIEW', domain: '财务' },
		{ templateCode: 'PROC-PURCHASE-REQUEST-TODO', domain: '采购' },
		{ templateCode: 'WH-STOCK-OVERVIEW', domain: '仓库' },
		{ templateCode: 'OPS-BIZ-CHANGE-RANK', domain: '报花' },
	])

	assert.deepEqual(
		tabs.map((tab) => [tab.id, tab.count]),
		[
			['all', 4],
			['财务', 1],
			['采购', 1],
			['仓库', 1],
			['报花', 1],
		],
	)
})

test('lists only certified templates in the selected domain', () => {
	const templates = [
		{ templateCode: 'FIN-AR-OVERVIEW', domain: '财务', certificationStatus: 'CERTIFIED', published: true, updatedAt: '2026-03-20T10:00:00Z' },
		{ templateCode: 'FIN-AR-DRAFT', domain: '财务', certificationStatus: 'DRAFT', published: true, updatedAt: '2026-03-20T11:00:00Z' },
		{ templateCode: 'PROC-PURCHASE-REQUEST-TODO', domain: '采购', certificationStatus: 'CERTIFIED', published: true, archived: true, updatedAt: '2026-03-20T12:00:00Z' },
		{ templateCode: 'FIN-AR-AGING', domain: '财务', certificationStatus: 'CERTIFIED', published: true, updatedAt: '2026-03-20T09:00:00Z' },
	]

	const visible = filterFixedReportTemplates(templates, '财务')

	assert.deepEqual(
		visible.map((item) => item.templateCode),
		['FIN-AR-OVERVIEW', 'FIN-AR-AGING'],
	)
})

test('parses fixed report parameter schema into renderable form fields', () => {
	const fields = buildFixedReportParameterFields(
		JSON.stringify({
			params: [
				{ name: 'projectId', label: '项目', type: 'text', required: true },
				{ name: 'month', label: '月份', type: 'month', default: '2026-03' },
				{ name: 'topN', label: 'TopN', type: 'int', default: 10 },
				{ name: 'range', label: '周期', type: 'daterange', placeholder: '2026-03-01 ~ 2026-03-31' },
				{ name: 'period', label: '周期', type: 'select', options: [{ label: '本月', value: 'month' }] },
			],
		}),
	)

	assert.deepEqual(fields, [
		{ key: 'projectId', label: '项目', type: 'text', required: true, options: [], placeholder: undefined, defaultValue: undefined },
		{ key: 'month', label: '月份', type: 'month', required: false, options: [], placeholder: undefined, defaultValue: '2026-03' },
		{ key: 'topN', label: 'TopN', type: 'number', required: false, options: [], placeholder: undefined, defaultValue: '10' },
		{ key: 'range', label: '周期', type: 'daterange', required: false, options: [], placeholder: '2026-03-01 ~ 2026-03-31', defaultValue: undefined },
		{
			key: 'period',
			label: '周期',
			type: 'select',
			required: false,
			options: [{ label: '本月', value: 'month' }],
			placeholder: undefined,
			defaultValue: undefined,
		},
	])

	assert.deepEqual(buildFixedReportInitialParameterValues(fields), {
		projectId: '',
		month: '2026-03',
		topN: '10',
		range: '',
		period: '',
	})
})

test('returns stable execute button state for idle and running flows', () => {
	assert.deepEqual(getFixedReportRunActionState(false), {
		disabled: false,
		label: '执行报表',
	})
	assert.deepEqual(getFixedReportRunActionState(true), {
		disabled: true,
		label: '执行中…',
	})
})

test('marks placeholder fixed reports as backing required and disables execution', () => {
	const placeholderTemplate = {
		templateCode: 'FIN-AR-OVERVIEW',
		placeholderReviewRequired: true,
	}
	const backedTemplate = {
		templateCode: 'FIN-ACTUAL-SETTLEMENT-LIST',
		placeholderReviewRequired: false,
	}

	assert.equal(isPlaceholderFixedReport(placeholderTemplate), true)
	assert.equal(isPlaceholderFixedReport(backedTemplate), false)
	assert.deepEqual(getFixedReportTemplateAvailability(placeholderTemplate), {
		badgeLabel: '待补数据面',
		badgeVariant: 'warning',
		canRun: false,
	})
	assert.deepEqual(getFixedReportTemplateAvailability(backedTemplate), {
		badgeLabel: '已接通',
		badgeVariant: 'success',
		canRun: true,
	})
	assert.deepEqual(getFixedReportRunActionState(false, true), {
		disabled: true,
		label: '待补数据面',
	})
})

test('builds legacy page href for xycyl admin routes', () => {
	assert.equal(
		buildFixedReportLegacyPageHref('/operate/settlement'),
		'https://app.xycyl.com/#/operate/settlement',
	)
	assert.equal(
		buildFixedReportLegacyPageHref('purchase/purchase'),
		'https://app.xycyl.com/#/purchase/purchase',
	)
	assert.equal(buildFixedReportLegacyPageHref(''), null)
})

test('selects fixed report quick starts in business priority order', () => {
	const items = buildFixedReportQuickStartItems([
		{ templateCode: 'OPS-01', domain: '报花', name: '报花单据管理', certificationStatus: 'CERTIFIED', published: true },
		{ templateCode: 'FIN-AR-OVERVIEW', domain: '财务', name: '财务结算汇总', certificationStatus: 'CERTIFIED', published: true },
		{ templateCode: 'PROC-SUPPLIER-AMOUNT-RANK', domain: '采购', name: '采购汇总', certificationStatus: 'CERTIFIED', published: true },
		{ templateCode: 'WH-STOCK-OVERVIEW', domain: '仓库', name: '库存现量', certificationStatus: 'CERTIFIED', published: true },
		{ templateCode: 'FIN-DRAFT', domain: '财务', name: '草稿财务报表', certificationStatus: 'DRAFT', published: true },
	], 3)

	assert.deepEqual(items.map((item) => item.templateCode), [
		'FIN-AR-OVERVIEW',
		'PROC-SUPPLIER-AMOUNT-RANK',
		'WH-STOCK-OVERVIEW',
	])
})

test('builds creation flow paths and reads selected fixed report template from query string', () => {
	assert.equal(
		buildFixedReportCreationFlowPath('dashboard', 'FIN-AR-OVERVIEW'),
		'/dashboards/new?fixedReportTemplate=FIN-AR-OVERVIEW',
	)
	assert.equal(
		buildFixedReportCreationFlowPath('reportFactory', 'PROC-SUPPLIER-AMOUNT-RANK'),
		'/report-factory?fixedReportTemplate=PROC-SUPPLIER-AMOUNT-RANK',
	)
	assert.equal(
		buildFixedReportCreationFlowPath('screen', 'WH-STOCK-OVERVIEW'),
		'/screens?fixedReportTemplate=WH-STOCK-OVERVIEW',
	)
	assert.equal(
		readSelectedFixedReportTemplate('?fixedReportTemplate=FIN-AR-OVERVIEW'),
		'FIN-AR-OVERVIEW',
	)
	assert.equal(readSelectedFixedReportTemplate(''), null)
})

test('report factory page exposes fixed report quick start entry', () => {
	const reportFactorySource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/ReportFactoryPage.tsx'), 'utf8')

	assert.match(reportFactorySource, /固定报表快捷入口/)
	assert.match(reportFactorySource, /buildFixedReportCreationFlowPath\("reportFactory", item\.templateCode \|\| ""\)/)
	assert.match(reportFactorySource, /基于固定报表/)
	assert.match(reportFactorySource, /查看固定报表/)
})

test('dashboards page exposes fixed report quick start entry', () => {
	const dashboardsPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/DashboardsPage.tsx'), 'utf8')
	const dashboardEditorSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/DashboardEditorPage.tsx'), 'utf8')

	assert.match(dashboardsPageSource, /固定报表快捷入口/)
	assert.match(dashboardsPageSource, /buildFixedReportCreationFlowPath\('dashboard', item\.templateCode \|\| ''\)/)
	assert.match(dashboardEditorSource, /基于固定报表/)
	assert.match(dashboardEditorSource, /查看固定报表/)
})

test('screens page exposes fixed report quick start entry', () => {
	const screensPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/screens/ScreensPage.tsx'), 'utf8')

	assert.match(screensPageSource, /固定报表快捷入口/)
	assert.match(screensPageSource, /buildFixedReportCreationFlowPath\('screen', item\.templateCode \|\| ''\)/)
	assert.match(screensPageSource, /基于该报表生成大屏/)
})

test('fixed report run page renders result preview table when execution returns rows', () => {
	const runPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/fixed-reports/FixedReportRunPage.tsx'), 'utf8')

	assert.match(runPageSource, /resultPreview\?\.databaseName/)
	assert.match(runPageSource, /previewColumns\.length === 0 \|\| previewRows\.length === 0/)
	assert.match(runPageSource, /<table/)
	assert.doesNotMatch(runPageSource, /<div className="grid2" style=\{\{ alignItems: "start" \}\}>/)
	assert.match(runPageSource, /display: "flex"/)
	assert.match(runPageSource, /flexDirection: "column"/)
})

test('fixed report run page memoizes parameter fields to avoid render loop after opening a template', () => {
	const runPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/fixed-reports/FixedReportRunPage.tsx'), 'utf8')

	assert.match(runPageSource, /const fields = useMemo\(/)
	assert.match(runPageSource, /const initialFormValues = useMemo\(/)
	assert.match(runPageSource, /setFormValues\(initialFormValues\)/)
	assert.match(runPageSource, /\}, \[initialFormValues\]\)/)
})

test('analytics API exposes fixed report catalog and execute methods', async () => {
	const originalFetch = globalThis.fetch
	const originalLocalStorage = globalThis.localStorage
	let requestedUrl = ''
	let requestedMethod = ''
	let requestedBody = ''

	Object.defineProperty(globalThis, 'fetch', {
		value: async (input: RequestInfo | URL, init?: RequestInit) => {
			requestedUrl = String(input)
			requestedMethod = String(init?.method ?? 'GET')
			requestedBody = String(init?.body ?? '')
			return new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		},
		configurable: true,
	})
	Object.defineProperty(globalThis, 'localStorage', {
		value: {
			getItem: () => null,
			setItem: () => undefined,
			removeItem: () => undefined,
			clear: () => undefined,
			key: () => null,
			length: 0,
		},
		configurable: true,
	})

	try {
		await analyticsApi.listFixedReportCatalog({ domain: '财务', limit: 20 })
		assert.equal(requestedUrl, '/api/report-catalog?domain=%E8%B4%A2%E5%8A%A1&limit=20')
		assert.equal(requestedMethod, 'GET')

		await analyticsApi.getFixedReportCatalogItem('FIN-AR-OVERVIEW')
		assert.equal(requestedUrl, '/api/report-catalog/FIN-AR-OVERVIEW')
		assert.equal(requestedMethod, 'GET')

		await analyticsApi.runFixedReport('FIN-AR-OVERVIEW', { parameters: { projectId: 'PRJ-001' } })
		assert.equal(requestedUrl, '/api/fixed-reports/FIN-AR-OVERVIEW/run')
		assert.equal(requestedMethod, 'POST')
		assert.equal(requestedBody, JSON.stringify({ parameters: { projectId: 'PRJ-001' } }))
	} finally {
		Object.defineProperty(globalThis, 'fetch', {
			value: originalFetch,
			configurable: true,
		})
		Object.defineProperty(globalThis, 'localStorage', {
			value: originalLocalStorage,
			configurable: true,
		})
	}
})

test('routes and navigation expose fixed report center pages', async () => {
	const routesSource = readFileSync(resolve(WEBAPP_ROOT, 'src/routes.tsx'), 'utf8')
	const layoutSource = readFileSync(resolve(WEBAPP_ROOT, 'src/layouts/AppLayout.tsx'), 'utf8')

	assert.match(routesSource, /path:\s*"\/fixed-reports"/)
	assert.match(routesSource, /path:\s*"\/fixed-reports\/:templateCode\/run"/)
	assert.match(layoutSource, /to="\/fixed-reports"/)
})
