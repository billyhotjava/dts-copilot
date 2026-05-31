import type { KeyboardEvent } from "react";
import type { Artifact } from "../../types/artifact";
import "./Canvas.css";

interface ArtifactTrayProps {
	artifacts: Artifact[];
	currentId: string | null;
	onSelect: (id: string) => void;
}

export function ArtifactTray({
	artifacts,
	currentId,
	onSelect,
}: ArtifactTrayProps) {
	if (artifacts.length === 0) {
		return null;
	}

	return (
		<nav className="artifact-tray" aria-label="产物托盘">
			<div className="artifact-tray__scroller">
				{artifacts.map((artifact, index) => (
					<button
						key={artifact.id}
						type="button"
						className={[
							"artifact-tray__item",
							artifact.id === currentId ? "artifact-tray__item--active" : "",
						]
							.filter(Boolean)
							.join(" ")}
						aria-pressed={artifact.id === currentId}
						onClick={() => onSelect(artifact.id)}
						onKeyDown={(event) =>
							handleTrayKeyDown(event, artifacts, index, onSelect)
						}
					>
						<span className="artifact-tray__index">{index + 1}</span>
						<span className="artifact-tray__type">{resolveTrayTypeLabel(artifact.type)}</span>
						<span className="artifact-tray__title">
							{artifact.title || artifact.id}
						</span>
					</button>
				))}
			</div>
		</nav>
	);
}

function handleTrayKeyDown(
	event: KeyboardEvent<HTMLButtonElement>,
	artifacts: Artifact[],
	index: number,
	onSelect: (id: string) => void,
) {
	if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
		return;
	}
	event.preventDefault();
	const direction = event.key === "ArrowRight" ? 1 : -1;
	const nextIndex = (index + direction + artifacts.length) % artifacts.length;
	onSelect(artifacts[nextIndex].id);
}

function resolveTrayTypeLabel(type: Artifact["type"]): string {
	if (type === "chart") return "图";
	if (type === "table") return "表";
	return "报";
}
