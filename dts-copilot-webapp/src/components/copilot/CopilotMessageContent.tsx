import type { ReactNode } from "react";

type TextSegment = {
	type: "text";
	content: string;
};

type TableSegment = {
	type: "table";
	headers: string[];
	rows: string[][];
};

export type CopilotMessageSegment = TextSegment | TableSegment;

export function parseCopilotMarkdownTables(
	content: string,
): CopilotMessageSegment[] {
	const lines = content.replace(/\r\n/g, "\n").split("\n");
	const segments: CopilotMessageSegment[] = [];
	const textBuffer: string[] = [];
	let index = 0;

	function flushText() {
		const text = trimBlankEdges(textBuffer).join("\n");
		textBuffer.length = 0;
		if (text.trim()) {
			segments.push({ type: "text", content: text });
		}
	}

	while (index < lines.length) {
		const current = lines[index];
		const next = lines[index + 1];
		if (isMarkdownTableRow(current) && isMarkdownSeparatorRow(next)) {
			flushText();
			const headers = parseMarkdownTableCells(current);
			index += 2;
			const rows: string[][] = [];
			while (index < lines.length && isMarkdownTableRow(lines[index])) {
				const row = parseMarkdownTableCells(lines[index]);
				rows.push(normalizeRowLength(row, headers.length));
				index += 1;
			}
			if (headers.length > 0 && rows.length > 0) {
				segments.push({ type: "table", headers, rows });
			}
			continue;
		}
		textBuffer.push(current);
		index += 1;
	}

	flushText();
	return segments;
}

export function CopilotMessageContent({ content }: { content?: string | null }) {
	if (!content) {
		return null;
	}
	const segments = parseCopilotMarkdownTables(content);
	if (segments.length === 0) {
		return <span className="copilot-message-text">{content}</span>;
	}
	return (
		<>
			{segments.map((segment, index) =>
				segment.type === "table"
					? renderTableSegment(segment, index)
					: renderTextSegment(segment, index),
			)}
		</>
	);
}

function renderTextSegment(segment: TextSegment, index: number): ReactNode {
	return (
		<div className="copilot-message-text" key={`text-${index}`}>
			{segment.content}
		</div>
	);
}

function renderTableSegment(segment: TableSegment, index: number): ReactNode {
	return (
		<div className="copilot-message-table-wrap" key={`table-${index}`}>
			<table className="copilot-message-table">
				<thead>
					<tr>
						{segment.headers.map((header, headerIndex) => (
							<th
								className="copilot-message-table__header-cell"
								key={`${header}-${headerIndex}`}
								scope="col"
							>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{segment.rows.map((row, rowIndex) => (
						<tr key={`row-${rowIndex}`}>
							{row.map((cell, cellIndex) => (
								<td
									className="copilot-message-table__body-cell"
									key={`${rowIndex}-${cellIndex}`}
								>
									{cell}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function isMarkdownTableRow(line: string | undefined): line is string {
	if (!line) {
		return false;
	}
	const trimmed = line.trim();
	if (!trimmed.includes("|")) {
		return false;
	}
	return parseMarkdownTableCells(trimmed).length >= 2;
}

function isMarkdownSeparatorRow(line: string | undefined): boolean {
	if (!line || !line.includes("|")) {
		return false;
	}
	const cells = parseMarkdownTableCells(line);
	return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseMarkdownTableCells(line: string): string[] {
	let normalized = line.trim();
	if (normalized.startsWith("|")) {
		normalized = normalized.slice(1);
	}
	if (normalized.endsWith("|")) {
		normalized = normalized.slice(0, -1);
	}
	return normalized
		.split("|")
		.map((cell) => cell.trim())
		.filter((cell) => cell.length > 0);
}

function normalizeRowLength(row: string[], length: number): string[] {
	if (row.length === length) {
		return row;
	}
	if (row.length > length) {
		return row.slice(0, length);
	}
	return [...row, ...Array.from({ length: length - row.length }, () => "")];
}

function trimBlankEdges(lines: string[]): string[] {
	let start = 0;
	let end = lines.length;
	while (start < end && !lines[start].trim()) {
		start += 1;
	}
	while (end > start && !lines[end - 1].trim()) {
		end -= 1;
	}
	return lines.slice(start, end);
}
