import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	appendAnalysisAssetProvenance,
	buildAnalysisAssetProvenanceSearch,
	readSelectedSourceCard,
} from '../src/pages/analysisAssetProvenanceEntry.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('builds shared published-asset provenance query from draft/card/fixed-report context', () => {
	assert.equal(
		buildAnalysisAssetProvenanceSearch({
			analysisDraftId: 18,
			fixedReportTemplate: 'PROC-001',
			sourceCardId: 29,
		}),
		'?analysisDraft=18&fixedReportTemplate=PROC-001&sourceCard=29',
	)
	assert.equal(
		appendAnalysisAssetProvenance('/dashboards/7', {
			analysisDraftId: 18,
			sourceCardId: 29,
		}),
		'/dashboards/7?analysisDraft=18&sourceCard=29',
	)
	assert.equal(readSelectedSourceCard('?sourceCard=29'), '29')
	assert.equal(readSelectedSourceCard(''), null)
})

test('published analytics surfaces retain provenance context after promotion', () => {
	const dashboardEditorSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/DashboardEditorPage.tsx'), 'utf8')
	const dashboardDetailSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/DashboardDetailPage.tsx'), 'utf8')
	const screensPageSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/screens/ScreensPage.tsx'), 'utf8')
	const screenDesignerSource = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/screens/ScreenDesignerPage.tsx'), 'utf8')

	assert.match(dashboardEditorSource, /appendAnalysisAssetProvenance/)
	assert.match(dashboardDetailSource, /readSelectedAnalysisDraft/)
	assert.match(dashboardDetailSource, /readSelectedFixedReportTemplate/)
	assert.match(dashboardDetailSource, /readSelectedSourceCard/)
	assert.match(dashboardDetailSource, /AnalysisProvenancePanel/)
	assert.match(screensPageSource, /appendAnalysisAssetProvenance/)
	assert.match(screenDesignerSource, /readSelectedAnalysisDraft/)
	assert.match(screenDesignerSource, /readSelectedFixedReportTemplate/)
	assert.match(screenDesignerSource, /AnalysisProvenancePanel/)
})
