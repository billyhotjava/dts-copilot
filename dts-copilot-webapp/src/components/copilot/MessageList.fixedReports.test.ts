import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MESSAGE_LIST_SOURCE = readFileSync(resolve(__dirname, "MessageList.tsx"), "utf8");

describe("MessageList fixed report links", () => {
	it("does not synthesize fixed report hrefs when the candidate model marks them unavailable", () => {
		expect(MESSAGE_LIST_SOURCE).not.toContain("candidate.href ??");
		expect(MESSAGE_LIST_SOURCE).toContain("candidate.href ? (");
	});
});
