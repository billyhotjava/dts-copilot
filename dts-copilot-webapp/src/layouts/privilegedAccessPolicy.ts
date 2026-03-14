const PRIVILEGED_ROLES = [
	'ROLE_SYS_ADMIN',
	'ROLE_AUTH_ADMIN',
	'ROLE_ADMIN',
	'ROLE_OP_ADMIN',
	'ROLE_SECURITY_AUDITOR',
	'INST_DATA_VIEWER',
	'INST_DATA_DEV',
	'INST_DATA_OWNER',
	'DEPT_DATA_DEV',
	'DEPT_DATA_OWNER',
]

function toNumber(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value
	}
	if (typeof value === 'string') {
		const trimmed = value.trim()
		if (!trimmed) return null
		const normalized = trimmed.toLowerCase()
		if (
			[
				'low',
				'employee',
				'staff',
				'normal',
				'basic',
				'viewer',
				'read',
				'readonly',
			].includes(normalized)
		) {
			return 1
		}
		if (
			[
				'high',
				'advanced',
				'admin',
				'op',
				'authorized',
				'manager',
				'senior',
				'owner',
				'full',
			].includes(normalized)
		) {
			return 2
		}
		const parsed = Number.parseInt(trimmed, 10)
		return Number.isFinite(parsed) ? parsed : null
	}
	return null
}

export type PrivilegedAccessInput = {
	roles?: string[]
	personnelLevel?: unknown
	isSuperuser?: boolean | null
}

export function resolvePrivilegedAccess({
	roles = [],
	personnelLevel = null,
	isSuperuser = false,
}: PrivilegedAccessInput): boolean {
	if (isSuperuser) {
		return true
	}
	const level = toNumber(personnelLevel)
	if (level === null) {
		return roles.some((role) => PRIVILEGED_ROLES.includes(role))
	}
	return level > 1 || roles.some((role) => PRIVILEGED_ROLES.includes(role))
}
