import { describe, expect, it } from "vitest";
import { rowsToCsv } from "./csv";

describe("rowsToCsv", () => {
	it("serializes columns and rows", () => {
		expect(rowsToCsv(["项目", "收入"], [["A", 12]])).toBe("项目,收入\r\nA,12");
	});

	it("escapes commas, quotes, and new lines", () => {
		expect(rowsToCsv(["name", "note"], [["A, B", '他说"好"\n确认']])).toBe(
			'name,note\r\n"A, B","他说""好""\n确认"',
		);
	});

	it("keeps a header for empty datasets", () => {
		expect(rowsToCsv(["项目", "收入"], [])).toBe("项目,收入");
	});
});
