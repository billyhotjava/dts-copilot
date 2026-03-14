import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { fetchInstance, type ObjectInstance } from "../api/hubApi";

export interface CopilotObjectContext {
	typeId: string | null;
	instanceId: string | null;
	displayName: string | null;
}

export const SESSION_KEY_PREFIX = "dts-analytics.copilot.objectContext";

function readCachedDisplayName(instanceId: string): string | null {
	try {
		const cached = sessionStorage.getItem(
			`${SESSION_KEY_PREFIX}.${instanceId}`,
		);
		return cached?.trim() ? cached : null;
	} catch {
		return null;
	}
}

function writeCachedDisplayName(
	instanceId: string,
	displayName: string | null | undefined,
) {
	try {
		if (!displayName || !displayName.trim()) {
			sessionStorage.removeItem(`${SESSION_KEY_PREFIX}.${instanceId}`);
			return;
		}
		sessionStorage.setItem(`${SESSION_KEY_PREFIX}.${instanceId}`, displayName);
	} catch {
		/* ignore */
	}
}

/**
 * Watches route and resolves object context for Copilot sidebar.
 */
export function useCopilotContext(): CopilotObjectContext {
	const location = useLocation();
	const [context, setContext] = useState<CopilotObjectContext>({
		typeId: null,
		instanceId: null,
		displayName: null,
	});

	useEffect(() => {
		const match = location.pathname.match(/^\/objects\/([^/]+)(?:\/([^/]+))?/);
		if (!match) {
			setContext({ typeId: null, instanceId: null, displayName: null });
			return;
		}

		const typeId = match[1] || null;
		const instanceId = match[2] || null;

		setContext((prev) => ({
			...prev,
			typeId,
			instanceId,
			displayName: null,
		}));

		if (!instanceId) {
			return;
		}

		const cached = readCachedDisplayName(instanceId);
		if (cached) {
			setContext((prev) => ({ ...prev, displayName: cached }));
			return;
		}

		let ignore = false;
		void fetchInstance(instanceId)
			.then((instance: ObjectInstance | null) => {
				if (ignore) return;
				const displayName = (instance?.displayName || "").trim();
				setContext((prev) => ({ ...prev, displayName: displayName || null }));
				writeCachedDisplayName(instanceId, displayName);
			})
			.catch(() => {
				/* best-effort */
			});

		return () => {
			ignore = true;
		};
	}, [location.pathname]);

	return context;
}
