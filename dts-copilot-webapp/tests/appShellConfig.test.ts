import test from 'node:test'
import assert from 'node:assert/strict'
import {
	APP_HOME_PATH,
	APP_HOME_ALIASES,
	CORE_NAV_PATHS,
	REMOVED_ROUTE_PREFIXES,
} from '../src/appShellConfig.ts'

test('uses dashboards as the only app home entry', () => {
	assert.equal(APP_HOME_PATH, '/dashboards')
	assert.deepEqual(APP_HOME_ALIASES, ['/home', '/modern'])
})

test('removes ontology routes from core navigation and app shell', () => {
	assert.deepEqual(CORE_NAV_PATHS, ['/dashboards', '/screens'])
	assert.deepEqual(REMOVED_ROUTE_PREFIXES, ['/objects'])
})
