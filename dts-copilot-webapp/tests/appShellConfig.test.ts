import test from 'node:test'
import assert from 'node:assert/strict'
import {
	APP_HOME_PATH,
	APP_HOME_ALIASES,
	CORE_NAV_PATHS,
	REMOVED_ROUTE_PREFIXES,
} from '../src/appShellConfig.ts'

test('uses Agent BI as the app home entry', () => {
	assert.equal(APP_HOME_PATH, '/agent-bi')
	assert.deepEqual(APP_HOME_ALIASES, ['/home', '/modern'])
})

test('removes ontology routes from core navigation and app shell', () => {
	assert.deepEqual(CORE_NAV_PATHS, ['/agent-bi', '/dashboards'])
	assert.deepEqual(REMOVED_ROUTE_PREFIXES, ['/objects'])
})
