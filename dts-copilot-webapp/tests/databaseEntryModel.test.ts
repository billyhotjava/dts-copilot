import test from 'node:test'
import assert from 'node:assert/strict'
import {
	MANAGED_DATA_SOURCE_TYPE_OPTIONS,
	buildManagedDataSourcePayload,
	buildManagedDatabaseImportPayload,
	validateManagedDataSourceForm,
} from '../src/pages/databaseEntryModel.js'

test('builds managed datasource payload from manual form values', () => {
	const payload = buildManagedDataSourcePayload({
		name: '园林业务库',
		type: 'postgres',
		host: 'db.internal',
		port: '5432',
		database: 'garden',
		username: 'readonly',
		password: 'secret-pass',
		description: '用于 NL2SQL',
	})

	assert.deepEqual(payload, {
		name: '园林业务库',
		type: 'postgres',
		host: 'db.internal',
		port: 5432,
		database: 'garden',
		username: 'readonly',
		password: 'secret-pass',
		description: '用于 NL2SQL',
	})
})

test('builds analytics import payload from managed datasource', () => {
	const payload = buildManagedDatabaseImportPayload({
		id: 42,
		name: '园林业务库',
		type: 'postgres',
	})

	assert.deepEqual(payload, {
		name: '园林业务库',
		engine: 'postgres',
		details: {
			dataSourceId: 42,
		},
	})
})

test('exposes supported manual datasource type options', () => {
	assert.deepEqual(MANAGED_DATA_SOURCE_TYPE_OPTIONS, [
		{ value: 'postgres', label: 'PostgreSQL' },
		{ value: 'mysql', label: 'MySQL' },
	])
})

test('validates required manual datasource fields for mysql', () => {
	const errors = validateManagedDataSourceForm({
		name: '园林业务库',
		type: 'mysql',
		host: '',
		port: '3306',
		database: '',
		username: 'readonly',
		password: '',
		description: '',
	})

	assert.deepEqual(errors, {
		host: 'required',
		database: 'required',
	})
})
