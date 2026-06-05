import type { DatabaseListItem } from "../api/analyticsApi";

export const FEDERATED_DATABASE_NAME = "联邦查询入口";

function normalize(value: unknown): string {
	return String(value ?? "").trim().toLowerCase();
}

export function resolveFederatedDatabase(databases: DatabaseListItem[]): DatabaseListItem | null {
	const byName = databases.find((db) => normalize(db.name) === normalize(FEDERATED_DATABASE_NAME));
	if (byName) return byName;

	const byTrino = databases.find((db) => normalize(db.engine) === "trino");
	if (byTrino) return byTrino;

	return null;
}

export function resolveFederatedDatabaseId(
	databases: DatabaseListItem[],
	_legacyDatabaseId?: number | null,
): number | null {
	return resolveFederatedDatabase(databases)?.id ?? null;
}
