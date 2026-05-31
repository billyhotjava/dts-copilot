import { useCallback, type ReactNode } from "react";
import type { ArtifactStore } from "../../hooks/useArtifactStore";
import type {
	Artifact,
	ArtifactDataset,
	CanvasActionEvent,
	CanvasActionType,
} from "../../types/artifact";
import { ArtifactCanvas } from "./ArtifactCanvas";
import { CanvasActions } from "./CanvasActions";
import { ArtifactTray } from "./ArtifactTray";
import "./Canvas.css";

interface CanvasPanelProps {
	store: ArtifactStore;
	loading?: boolean;
	error?: unknown;
	actions?: ReactNode;
	className?: string;
	onArtifactAction?: (event: CanvasActionEvent) => void;
	disabledActions?: CanvasActionType[];
	busyAction?: CanvasActionType | null;
}

export function CanvasPanel({
	store,
	loading = false,
	error,
	actions = null,
	className,
	onArtifactAction,
	disabledActions,
	busyAction = null,
}: CanvasPanelProps) {
	const renderedActions =
		actions ??
		(onArtifactAction ? (
			<CanvasActions
				artifact={store.current}
				busyAction={busyAction}
				disabledActions={disabledActions}
				onAction={onArtifactAction}
			/>
		) : null);
	const handleDatasetReady = useCallback(
		(artifact: Artifact, dataset: ArtifactDataset) => {
			store.upsert({
				...artifact,
				spec: {
					...artifact.spec,
					dataset,
				},
			});
		},
		[store.upsert],
	);

	return (
		<section className={["canvas-panel", className].filter(Boolean).join(" ")}>
			{renderedActions ? (
				<div className="canvas-panel__actions">{renderedActions}</div>
			) : null}
			<div className="canvas-panel__main">
				<ArtifactCanvas
					artifact={store.current}
					loading={loading}
					error={error}
					onArtifactUpdate={store.upsert}
					onDatasetReady={handleDatasetReady}
				/>
			</div>
			<ArtifactTray
				artifacts={store.artifacts}
				currentId={store.currentId}
				onSelect={store.setCurrent}
			/>
		</section>
	);
}
