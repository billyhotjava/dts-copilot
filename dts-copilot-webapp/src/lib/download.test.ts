import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, downloadText } from "./download";

describe("download", () => {
	const originalCreateObjectURL = URL.createObjectURL;
	const originalRevokeObjectURL = URL.revokeObjectURL;

	afterEach(() => {
		URL.createObjectURL = originalCreateObjectURL;
		URL.revokeObjectURL = originalRevokeObjectURL;
		vi.restoreAllMocks();
	});

	it("downloads a blob through a temporary link and revokes the URL", () => {
		const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
		const remove = vi.spyOn(HTMLAnchorElement.prototype, "remove").mockImplementation(() => {});
		URL.createObjectURL = vi.fn(() => "blob:artifact");
		URL.revokeObjectURL = vi.fn();

		downloadBlob(new Blob(["a"]), "artifact.csv");

		expect(URL.createObjectURL).toHaveBeenCalled();
		expect(click).toHaveBeenCalled();
		expect(remove).toHaveBeenCalled();
		expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:artifact");
	});

	it("wraps text in a typed blob before downloading", () => {
		const createObjectURL = vi.fn((blob: Blob) => {
			expect(blob.type).toBe("text/csv;charset=utf-8");
			return "blob:csv";
		});
		URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
		URL.revokeObjectURL = vi.fn();
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
		vi.spyOn(HTMLAnchorElement.prototype, "remove").mockImplementation(() => {});

		downloadText("a,b", "artifact.csv", "text/csv;charset=utf-8");

		expect(createObjectURL).toHaveBeenCalled();
	});
});
