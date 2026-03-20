import test from 'node:test'
import assert from 'node:assert/strict'

import {
	buildScreenPreviewPath,
	buildScreenExportPath,
	buildPublicScreenPath,
	buildAbsoluteScreenAppUrl,
	normalizeLegacyScreenAppPath,
} from '../src/pages/screens/screenRoutePaths.ts'

test('builds preview route under /screens without legacy /analytics prefix', () => {
	assert.equal(buildScreenPreviewPath(42), '/screens/42/preview')
	assert.equal(buildScreenPreviewPath('42', { device: 'mobile' }), '/screens/42/preview?device=mobile')
})

test('builds export route under /screens without legacy /analytics prefix', () => {
	assert.equal(buildScreenExportPath(42), '/screens/42/export')
	assert.equal(
		buildScreenExportPath('42', { mode: 'published', device: 'tablet' }),
		'/screens/42/export?mode=published&device=tablet',
	)
})

test('builds public screen route without legacy /analytics prefix', () => {
	assert.equal(buildPublicScreenPath('abc-uuid'), '/public/screen/abc-uuid')
	assert.equal(
		buildAbsoluteScreenAppUrl('https://copilot.local', buildPublicScreenPath('abc-uuid')),
		'https://copilot.local/public/screen/abc-uuid',
	)
})

test('normalizes legacy analytics-prefixed screen paths back to app routes', () => {
	assert.equal(
		normalizeLegacyScreenAppPath('/analytics/screens/7/preview?device=mobile'),
		'/screens/7/preview?device=mobile',
	)
	assert.equal(
		normalizeLegacyScreenAppPath('/analytics/public/screen/public-123'),
		'/public/screen/public-123',
	)
	assert.equal(normalizeLegacyScreenAppPath('/screens/7/export'), '/screens/7/export')
})
