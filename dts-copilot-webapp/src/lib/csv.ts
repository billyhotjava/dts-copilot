export function rowsToCsv(columns: string[], rows: unknown[][]): string {
	const header = columns.map(escapeCsvCell).join(",");
	const body = rows.map((row) => row.map(escapeCsvCell).join(","));
	return [header, ...body].join("\r\n");
}

function escapeCsvCell(value: unknown): string {
	const text = value == null ? "" : String(value);
	if (/[",\r\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}
