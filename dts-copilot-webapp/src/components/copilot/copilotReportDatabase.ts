import type { DatabaseListItem } from "../../api/analyticsApi";
import { resolveFederatedDatabaseId } from "../../lib/federatedDatabase";

type ResolveInput = {
	selectedDatabaseId?: number | null;
	databases?: DatabaseListItem[];
	dataSurface?: string | null;
	sql?: string | null;
	sourceRefs?: string[] | string | null;
};

export function resolveCopilotSqlDatabaseId({
	selectedDatabaseId,
	databases = [],
}: ResolveInput): number | null {
	if (databases.length > 0) {
		return resolveFederatedDatabaseId(databases);
	}
	return selectedDatabaseId ?? null;
}
