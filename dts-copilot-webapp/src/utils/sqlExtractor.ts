/**
 * Extract SQL from markdown content.
 * Matches ```sql ... ``` or ``` ... ``` blocks that start with SELECT or WITH.
 * Returns the first SQL found, or null.
 */
export function extractSqlFromMarkdown(content: string): string | null {
	// Match fenced code blocks: ```sql ... ``` or ``` ... ```
	const codeBlockRegex = /```(?:sql)?\s*\n([\s\S]*?)```/gi;
	let match: RegExpExecArray | null;
	while ((match = codeBlockRegex.exec(content)) !== null) {
		const block = match[1].trim();
		if (/^\s*(SELECT|WITH)\b/i.test(block)) {
			return block;
		}
	}
	return null;
}
