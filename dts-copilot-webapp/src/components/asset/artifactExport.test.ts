import { describe, expect, it, vi } from "vitest";
import type { Artifact } from "../../types/artifact";
import {
	buildArtifactExportFileName,
	downloadArtifactCsv,
	downloadArtifactPng,
} from "./artifactExport";

const artifact: Artifact = {
	createdAt: 1,
	id: "artifact:1",
	sourceMessageId: "message-1",
	title: "利润/趋势",
	type: "table",
	spec: {
		dataset: {
			cols: [{ name: "month", display_name: "月份" }, { name: "profit" }],
			rows: [["2026-05", 1024]],
		},
	},
};

describe("artifactExport", () => {
	it("builds safe export file names from artifact titles", () => {
		expect(buildArtifactExportFileName(artifact, "csv")).toBe("利润_趋势.csv");
		expect(buildArtifactExportFileName({ ...artifact, title: "   " }, "png")).toBe("agent-artifact.png");
	});

	it("downloads the current artifact dataset as CSV", () => {
		const downloadText = vi.fn();

		downloadArtifactCsv(artifact, downloadText);

		expect(downloadText).toHaveBeenCalledWith(
			"月份,profit\r\n2026-05,1024",
			"利润_趋势.csv",
			"text/csv;charset=utf-8",
		);
	});

	it("renders a PNG snapshot through canvas and downloads it", async () => {
		const downloadBlob = vi.fn();
		const context = {
			fillRect: vi.fn(),
			fillText: vi.fn(),
			strokeRect: vi.fn(),
		};
		const canvas = {
			getContext: vi.fn(() => context),
			height: 0,
			toBlob: vi.fn((callback: BlobCallback) => {
				callback(new Blob(["png"], { type: "image/png" }));
			}),
			width: 0,
		} as unknown as HTMLCanvasElement;
		const createElement = vi.spyOn(document, "createElement").mockReturnValue(canvas);

		await downloadArtifactPng(artifact, downloadBlob);

		expect(createElement).toHaveBeenCalledWith("canvas");
		expect(downloadBlob).toHaveBeenCalledWith(
			expect.objectContaining({ type: "image/png" }),
			"利润_趋势.png",
		);
	});
});
