import { extractSqlFromMarkdown } from "./sqlExtractor";

describe("extractSqlFromMarkdown", () => {
	it("从 ```sql 代码块中提取 SQL", () => {
		const markdown = "一些文本\n```sql\nSELECT * FROM projects\n```\n其他文本";
		expect(extractSqlFromMarkdown(markdown)).toBe("SELECT * FROM projects");
	});

	it("从无语言标注的代码块中提取 SELECT 语句", () => {
		const markdown = "说明\n```\nSELECT id, name FROM users WHERE active = 1\n```";
		expect(extractSqlFromMarkdown(markdown)).toBe(
			"SELECT id, name FROM users WHERE active = 1",
		);
	});

	it("提取 WITH (CTE) 语句", () => {
		const markdown = "```sql\nWITH cte AS (SELECT 1) SELECT * FROM cte\n```";
		expect(extractSqlFromMarkdown(markdown)).toBe(
			"WITH cte AS (SELECT 1) SELECT * FROM cte",
		);
	});

	it("非 SQL 代码块返回 null", () => {
		const markdown = "```js\nconsole.log('hello')\n```";
		expect(extractSqlFromMarkdown(markdown)).toBeNull();
	});

	it("没有代码块时返回 null", () => {
		const markdown = "这是一段普通文本，没有代码块。";
		expect(extractSqlFromMarkdown(markdown)).toBeNull();
	});

	it("多个 SQL 代码块时返回第一个 SQL", () => {
		const markdown = [
			"说明文字",
			"```sql\nSELECT 1\n```",
			"```sql\nSELECT 2\n```",
		].join("\n");
		expect(extractSqlFromMarkdown(markdown)).toBe("SELECT 1");
	});
});
