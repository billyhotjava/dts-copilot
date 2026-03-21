import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

test('cards page exposes draft archive/delete lifecycle actions', () => {
	const source = readFileSync(resolve(WEBAPP_ROOT, 'src/pages/CardsPage.tsx'), 'utf8')

	assert.match(source, /archiveAnalysisDraft/)
	assert.match(source, /deleteAnalysisDraft/)
	assert.match(source, /草稿已归档/)
	assert.match(source, /草稿已删除/)
	assert.match(source, /归档/)
	assert.match(source, /删除/)
})
