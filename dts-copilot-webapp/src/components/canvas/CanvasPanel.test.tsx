import { act, createElement } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Artifact } from "../../types/artifact";
import { useArtifactStore } from "../../hooks/useArtifactStore";
import { CanvasPanel } from "./CanvasPanel";

vi.mock("./ArtifactCanvas", () => ({
	ArtifactCanvas: vi.fn((props: { artifact: Artifact | null }) => (
		<div data-testid="artifact-canvas">
			canvas:{props.artifact?.id ?? "empty"}
		</div>
	)),
}));

type StoreValue = ReturnType<typeof useArtifactStore>;

let currentStore: StoreValue | null = null;

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
		title: `产物 ${id}`,
		type: "table",
	};
}

function PanelProbe() {
	const store = useArtifactStore();
	currentStore = store;
	return createElement(CanvasPanel, { store });
}

async function renderCanvasPanel() {
	currentStore = null;
	render(createElement(PanelProbe));
	await screen.findByTestId("artifact-canvas");
	if (!currentStore) {
		throw new Error("canvas panel probe did not render");
	}
	return () => currentStore as StoreValue;
}

describe("CanvasPanel", () => {
	it("shows the current artifact and switches back to historical artifacts from the tray", async () => {
		const store = await renderCanvasPanel();

		act(() => {
			store().upsert(artifact("a", 1000));
			store().upsert(artifact("b", 2000));
		});

		await waitFor(() => {
			expect(screen.getByTestId("artifact-canvas")).toHaveTextContent("canvas:b");
		});

		await userEvent.click(await screen.findByRole("button", { name: /产物 a/ }));

		await waitFor(() => {
			expect(screen.getByTestId("artifact-canvas")).toHaveTextContent("canvas:a");
		});
		expect(store().artifacts.map((item) => item.id)).toEqual(["a", "b"]);
	});

	it("returns to the empty canvas state after the injected store is cleared", async () => {
		const store = await renderCanvasPanel();

		act(() => {
			store().upsert(artifact("a", 1000));
		});
		await waitFor(() => {
			expect(screen.getByTestId("artifact-canvas")).toHaveTextContent("canvas:a");
		});

		act(() => {
			store().clear();
		});

		await waitFor(() => {
			expect(screen.getByTestId("artifact-canvas")).toHaveTextContent("canvas:empty");
		});
		expect(screen.queryByRole("button", { name: /产物 a/ })).not.toBeInTheDocument();
	});
});
