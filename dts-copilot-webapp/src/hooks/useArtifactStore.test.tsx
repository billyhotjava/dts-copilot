import { act, createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import type { Artifact } from "../types/artifact";
import { useArtifactStore } from "./useArtifactStore";

type StoreValue = ReturnType<typeof useArtifactStore>;

let currentStore: StoreValue | null = null;

function StoreProbe() {
	currentStore = useArtifactStore();
	return createElement(
		"span",
		{ "data-testid": "artifact-store-probe" },
		`${currentStore.artifacts.length}:${currentStore.currentId ?? ""}`,
	);
}

async function renderArtifactStore() {
	currentStore = null;
	render(createElement(StoreProbe));
	await screen.findByTestId("artifact-store-probe");
	if (!currentStore) {
		throw new Error("artifact store probe did not render");
	}
	return () => currentStore as StoreValue;
}

function artifact(id: string, createdAt: number): Artifact {
	return {
		createdAt,
		id,
		sourceMessageId: `msg-${id}`,
		spec: {
			dataset: {
				cols: [{ name: "value" }],
				rows: [[createdAt]],
			},
			display: "table",
		},
		title: id,
		type: "table",
	};
}

describe("useArtifactStore", () => {
	beforeEach(() => {
		currentStore = null;
	});

	it("upserts new artifacts and makes the newest artifact current", async () => {
		const store = await renderArtifactStore();

		act(() => {
			store().upsert(artifact("old", 1000));
			store().upsert(artifact("new", 2000));
		});

		await waitFor(() => {
			expect(store().artifacts).toHaveLength(2);
		});
		expect(store().currentId).toBe("new");
		expect(store().current?.id).toBe("new");
		expect(store().artifacts.map((item) => item.id)).toEqual(["old", "new"]);
	});

	it("updates an existing artifact in place without adding a tray item", async () => {
		const store = await renderArtifactStore();
		const first = artifact("same", 1000);

		act(() => {
			store().upsert(first);
		});
		const firstArray = store().artifacts;
		const updated = {
			...first,
			spec: {
				...first.spec,
				generatedSql: "select updated",
			},
			title: "updated",
		};

		act(() => {
			store().upsert(updated);
		});

		expect(store().artifacts).toHaveLength(1);
		expect(store().artifacts).not.toBe(firstArray);
		expect(store().current).toMatchObject({
			id: "same",
			spec: { generatedSql: "select updated" },
			title: "updated",
		});
	});

	it("selects historical artifacts by id and ignores unknown ids", async () => {
		const store = await renderArtifactStore();

		act(() => {
			store().upsert(artifact("a", 1000));
			store().upsert(artifact("b", 2000));
		});
		await waitFor(() => {
			expect(store().artifacts).toHaveLength(2);
		});

		act(() => {
			store().setCurrent("a");
		});
		await waitFor(() => {
			expect(store().currentId).toBe("a");
		});

		act(() => {
			store().setCurrent("missing");
		});

		expect(store().currentId).toBe("a");
		expect(store().getById("b")?.id).toBe("b");
		expect(store().getById("missing")).toBeNull();
	});

	it("clears all artifacts and current selection", async () => {
		const store = await renderArtifactStore();

		act(() => {
			store().upsert(artifact("a", 1000));
			store().clear();
		});

		expect(store().artifacts).toEqual([]);
		expect(store().currentId).toBeNull();
		expect(store().current).toBeNull();
	});
});
