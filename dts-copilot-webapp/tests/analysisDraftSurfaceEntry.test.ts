import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	buildAnalysisDraftCreationFlowPath,
	readSelectedAnalysisDraft,
} from '../src/pages/analysisDraftSurfaceEntry.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds multi-surface creation paths from analysis draft id', () => {
	assert.equal(
		buildAnalysisDraftCreationFlowPath('dashboard', 18),
		'/dashboards/new?analysisDraft=18',
	)
	assert.equal(
		buildAnalysisDraftCreationFlowPath('reportFactory', 18),
		'/report-factory?analysisDraft=18',
	)
	assert.equal(
		buildAnalysisDraftCreationFlowPath('screen', 18),
		'/screens?analysisDraft=18',
	)
	assert.equal(readSelectedAnalysisDraft('?analysisDraft=18'), '18')
	assert.equal(readSelectedAnalysisDraft(''), null)
})

test('multi-surface pages expose analysis draft context handoff', () => {
	const dashboardEditorSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/DashboardEditorPage.tsx'), 'utf8')
	const reportFactorySource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/ReportFactoryPage.tsx'), 'utf8')
	const screensPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/screens/ScreensPage.tsx'), 'utf8')

	assert.match(dashboardEditorSource, /readSelectedAnalysisDraft/)
	assert.match(dashboardEditorSource, /AnalysisProvenancePanel/)
	assert.match(dashboardEditorSource, /buildAnalysisDraftProvenanceModel/)
	assert.match(dashboardEditorSource, /saveAnalysisDraftCard/)
	assert.match(reportFactorySource, /readSelectedAnalysisDraft/)
	assert.match(reportFactorySource, /AnalysisProvenancePanel/)
	assert.match(reportFactorySource, /buildAnalysisDraftProvenanceModel/)
	assert.match(reportFactorySource, /setSourceType\("session"\)/)
	assert.match(screensPageSource, /readSelectedAnalysisDraft/)
	assert.match(screensPageSource, /AnalysisProvenancePanel/)
	assert.match(screensPageSource, /buildAnalysisDraftProvenanceModel/)
	assert.match(screensPageSource, /基于分析草稿生成大屏/)
})
