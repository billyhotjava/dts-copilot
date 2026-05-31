import { useCallback, useMemo, useState } from "react";
import type { Artifact } from "../types/artifact";

export interface ArtifactStore {
	artifacts: Artifact[];
	currentId: string | null;
	current: Artifact | null;
	upsert: (artifact: Artifact) => void;
	setCurrent: (id: string) => void;
	getById: (id: string) => Artifact | null;
	clear: () => void;
}

export function useArtifactStore(): ArtifactStore {
	const [artifacts, setArtifacts] = useState<Artifact[]>([]);
	const [currentId, setCurrentId] = useState<string | null>(null);
	const current = useMemo(
		() => artifacts.find((artifact) => artifact.id === currentId) ?? null,
		[artifacts, currentId],
	);

	const upsert = useCallback((artifact: Artifact) => {
		setArtifacts((prev) => {
			const exists = prev.some((item) => item.id === artifact.id);
			const next = exists
				? prev.map((item) => (item.id === artifact.id ? artifact : item))
				: [...prev, artifact];
			return [...next].sort((left, right) => left.createdAt - right.createdAt);
		});
		setCurrentId(artifact.id);
	}, []);

	const setCurrent = useCallback(
		(id: string) => {
			if (artifacts.some((artifact) => artifact.id === id)) {
				setCurrentId(id);
			}
		},
		[artifacts],
	);

	const getById = useCallback(
		(id: string) => artifacts.find((artifact) => artifact.id === id) ?? null,
		[artifacts],
	);

	const clear = useCallback(() => {
		setArtifacts([]);
		setCurrentId(null);
	}, []);

	return {
		artifacts,
		clear,
		current,
		currentId,
		getById,
		setCurrent,
		upsert,
	};
}
