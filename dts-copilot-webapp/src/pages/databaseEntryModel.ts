import type { ManagedDataSourceCreatePayload, PlatformDataSourceItem } from '../api/analyticsApi'

export type ManagedDataSourceFormValues = {
	name: string
	type: string
	host: string
	port: string
	database: string
	username: string
	password: string
	description: string
}

export type ManagedDataSourceFormErrorCode = 'required'

export type ManagedDataSourceFormErrors = Partial<Record<
	'name' | 'type' | 'host' | 'database',
	ManagedDataSourceFormErrorCode
>>

export const MANAGED_DATA_SOURCE_TYPE_OPTIONS = [
	{ value: 'postgres', label: 'PostgreSQL' },
	{ value: 'mysql', label: 'MySQL' },
] as const

export function resolveManagedEngine(type?: string | null, jdbcUrl?: string | null): string {
	const normalized = String(type || '').trim().toLowerCase()
	if (normalized === 'postgresql' || normalized === 'postgres' || normalized === 'pg') return 'postgres'
	if (normalized === 'mysql' || normalized === 'mariadb') return 'mysql'
	if (normalized === 'oracle') return 'oracle'
	if (normalized === 'dm' || normalized === 'dameng') return 'dm'

	const url = String(jdbcUrl || '').toLowerCase()
	if (url.startsWith('jdbc:postgresql:')) return 'postgres'
	if (url.startsWith('jdbc:mysql:')) return 'mysql'
	if (url.startsWith('jdbc:oracle:')) return 'oracle'
	if (url.startsWith('jdbc:dm:')) return 'dm'
	return normalized || 'jdbc'
}

export function validateManagedDataSourceForm(
	values: ManagedDataSourceFormValues,
): ManagedDataSourceFormErrors {
	const errors: ManagedDataSourceFormErrors = {}
	if (!values.name.trim()) {
		errors.name = 'required'
	}
	if (!resolveManagedEngine(values.type)) {
		errors.type = 'required'
	}
	if (!values.host.trim()) {
		errors.host = 'required'
	}
	if (!values.database.trim()) {
		errors.database = 'required'
	}
	return errors
}

export function buildManagedDataSourcePayload(
	values: ManagedDataSourceFormValues,
): ManagedDataSourceCreatePayload {
	const port = Number.parseInt(String(values.port || '').trim(), 10)
	return {
		name: values.name.trim(),
		type: resolveManagedEngine(values.type),
		host: values.host.trim(),
		port: Number.isFinite(port) ? port : undefined,
		database: values.database.trim(),
		username: values.username.trim() || undefined,
		password: values.password || undefined,
		description: values.description.trim() || undefined,
	}
}

export function buildManagedDatabaseImportPayload(
	item: Pick<PlatformDataSourceItem, 'id' | 'name' | 'type' | 'jdbcUrl'>,
) {
	const engine = resolveManagedEngine(item.type, item.jdbcUrl)
	return {
		name: item.name || `${engine}-db`,
		engine,
		details: {
			dataSourceId: item.id,
		},
	}
}
