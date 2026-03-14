import test from 'node:test'
import assert from 'node:assert/strict'
import { resolvePrivilegedAccess } from '../src/layouts/privilegedAccessPolicy.js'

test('grants privileged access to analytics superuser without shared roles', () => {
	assert.equal(
		resolvePrivilegedAccess({
			roles: [],
			personnelLevel: null,
			isSuperuser: true,
		}),
		true,
	)
})

test('preserves existing privileged access rules for shared roles and personnel level', () => {
	assert.equal(
		resolvePrivilegedAccess({
			roles: ['ROLE_ADMIN'],
			personnelLevel: null,
			isSuperuser: false,
		}),
		true,
	)
	assert.equal(
		resolvePrivilegedAccess({
			roles: [],
			personnelLevel: '2',
			isSuperuser: false,
		}),
		true,
	)
	assert.equal(
		resolvePrivilegedAccess({
			roles: [],
			personnelLevel: null,
			isSuperuser: false,
		}),
		false,
	)
})
