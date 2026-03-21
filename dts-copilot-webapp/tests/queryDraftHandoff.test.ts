import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('card editor supports opening copilot analysis drafts with source context', () => {
	const source = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/CardEditorPage.tsx'), 'utf8')

	assert.match(source, /getAnalysisDraft/)
	assert.match(source, /analysisDraftId/)
	assert.match(source, /AI Copilot/)
	assert.match(source, /saveAnalysisDraftCard/)
})
