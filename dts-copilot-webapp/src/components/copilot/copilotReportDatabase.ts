import type { DatabaseListItem } from "../../api/analyticsApi";

type ReportDatabase = DatabaseListItem & {
	database_role?: string | null;
	databaseRole?: string | null;
};

type ResolveInput = {
	selectedDatabaseId?: number | null;
	databases?: ReportDatabase[];
	dataSurface?: string | null;
	sql?: string | null;
	sourceRefs?: string[] | string | null;
};

const DBT_DATABASE_NAME = "DTS dbt模型库";

export function resolveCopilotSqlDatabaseId({
	selectedDatabaseId,
	databases = [],
	dataSurface,
	sql,
	sourceRefs,
}: ResolveInput): number | null {
	if (!isDbtMartQuery({ dataSurface, sql, sourceRefs })) {
		return selectedDatabaseId ?? null;
	}
	const dbtDatabase = findDbtDatabase(databases);
	return dbtDatabase?.id ?? selectedDatabaseId ?? null;
}

function isDbtMartQuery({
	dataSurface,
	sql,
	sourceRefs,
}: Pick<ResolveInput, "dataSurface" | "sql" | "sourceRefs">): boolean {
	if (String(dataSurface ?? "").toUpperCase() === "L1_DBT_MART") {
		return true;
	}
	const refs = Array.isArray(sourceRefs)
		? sourceRefs
		: String(sourceRefs ?? "")
				.split(/[;,\n]/)
				.map((item) => item.trim())
				.filter(Boolean);
	if (refs.some((ref) => ref.toLowerCase().startsWith("dbt-model:"))) {
		return true;
	}
	return /\b(?:public\.)?xycyl_(?:ads|dws|dwd|dim|stg)_flowerbiz_/i.test(
		String(sql ?? ""),
	);
}

function findDbtDatabase(databases: ReportDatabase[]): ReportDatabase | undefined {
	return (
		databases.find((db) => db.name === DBT_DATABASE_NAME) ??
		databases.find((db) => {
			const name = String(db.name ?? "").toLowerCase();
			const role = String(db.database_role ?? db.databaseRole ?? "").toUpperCase();
			const engine = String(db.engine ?? "").toLowerCase();
			return (
				engine === "postgres" &&
				(role === "BUSINESS_SECONDARY" ||
					name.includes("dbt") ||
					name.includes("模型库"))
			);
		})
	);
}
