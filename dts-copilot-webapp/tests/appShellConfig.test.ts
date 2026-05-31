import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
	APP_HOME_PATH,
	APP_HOME_ALIASES,
} from '../src/appShellConfig.ts'

const APP_SHELL_CONFIG_SOURCE = readFileSync(
	resolve(import.meta.dirname, '../src/appShellConfig.ts'),
	'utf8',
)

test('uses Agent BI as the app home entry', () => {
	assert.equal(APP_HOME_PATH, '/agent-bi')
	assert.deepEqual(APP_HOME_ALIASES, ['/home', '/modern'])
})

test('does not export unused route policy constants', () => {
	assert.equal(APP_SHELL_CONFIG_SOURCE.includes('CORE_NAV_PATHS'), false)
	assert.equal(APP_SHELL_CONFIG_SOURCE.includes('REMOVED_ROUTE_PREFIXES'), false)
})
