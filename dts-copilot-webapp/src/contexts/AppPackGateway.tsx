import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

// ── Types ──────────────────────────────────────────────────────────────

export interface PackMeta {
	packId: string;
	displayName: string;
	industry: string;
	icon: string;
}

export interface PropertySchema {
	name: string;
	type: string;
	label: string;
	inputType?: string;
	required?: boolean;
	enum?: string[];
}

export interface ObjectTypeSchema {
	typeId: string;
	displayName: string;
	icon?: string;
	properties: PropertySchema[];
}

export interface ActionTypeSchema {
	actionId: string;
	displayName: string;
	targetObjectType: string;
	toolBinding?: string;
	requiresApproval: boolean;
	riskLevel: string;
	paramsSchema?: Record<string, unknown>;
}

export interface MetricDef {
	metricId: string;
	name: string;
	unit: string;
}

export interface AppPackSchema {
	objectTypes: ObjectTypeSchema[];
	actionTypes: ActionTypeSchema[];
	metrics: MetricDef[];
}

interface AppPackContextValue {
	packId: string | null;
	packMeta: PackMeta | null;
	schemas: AppPackSchema | null;
	availablePacks: PackMeta[];
	loading: boolean;
	switchPack: (packId: string) => void;
}

// ── Context ────────────────────────────────────────────────────────────

const AppPackContext = createContext<AppPackContextValue | null>(null);

export function useAppPack(): AppPackContextValue {
	const ctx = useContext(AppPackContext);
	if (!ctx) {
		throw new Error("useAppPack must be used within <AppPackGateway>");
	}
	return ctx;
}

// ── Schema fetcher ─────────────────────────────────────────────────────

async function fetchPackSchema(packId: string): Promise<AppPackSchema> {
	const headers: Record<string, string> = { Accept: "application/json" };
	try {
		const store =
			localStorage.getItem("platformUserStore") ||
			localStorage.getItem("userStore");
		if (store) {
			const parsed = JSON.parse(store);
			const token = parsed?.state?.userToken?.accessToken;
			if (token) headers.Authorization = `Bearer ${token}`;
		}
	} catch {
		/* ignore */
	}

	const [typesRes, actionsRes] = await Promise.all([
		fetch(`/api/ontology/app-packs/${packId}/object-types`, {
			headers,
			credentials: "include",
		}),
		fetch(`/api/ontology/app-packs/${packId}/action-types`, {
			headers,
			credentials: "include",
		}),
	]);

	const objectTypes = typesRes.ok
		? (((await typesRes.json()) as { data?: ObjectTypeSchema[] }).data ?? [])
		: [];
	const actionTypes = actionsRes.ok
		? (((await actionsRes.json()) as { data?: ActionTypeSchema[] }).data ?? [])
		: [];

	return { objectTypes, actionTypes, metrics: [] };
}

async function fetchAvailablePacks(): Promise<PackMeta[]> {
	const headers: Record<string, string> = { Accept: "application/json" };
	try {
		const store =
			localStorage.getItem("platformUserStore") ||
			localStorage.getItem("userStore");
		if (store) {
			const parsed = JSON.parse(store);
			const token = parsed?.state?.userToken?.accessToken;
			if (token) headers.Authorization = `Bearer ${token}`;
		}
	} catch {
		/* ignore */
	}

	try {
		const res = await fetch("/api/ontology/app-packs", {
			headers,
			credentials: "include",
		});
		if (!res.ok) return [];
		const json = (await res.json()) as { data?: PackMeta[] };
		return json.data ?? [];
	} catch {
		return [];
	}
}

// ── Storage ────────────────────────────────────────────────────────────

const ACTIVE_PACK_KEY = "dts-analytics.activePackId";

function getStoredPackId(): string | null {
	try {
		return localStorage.getItem(ACTIVE_PACK_KEY);
	} catch {
		return null;
	}
}

function storePackId(packId: string) {
	try {
		localStorage.setItem(ACTIVE_PACK_KEY, packId);
	} catch {
		/* ignore */
	}
}

// ── Provider ───────────────────────────────────────────────────────────

export function AppPackGateway({ children }: { children: ReactNode }) {
	const [packId, setPackId] = useState<string | null>(getStoredPackId);
	const [packMeta, setPackMeta] = useState<PackMeta | null>(null);
	const [schemas, setSchemas] = useState<AppPackSchema | null>(null);
	const [availablePacks, setAvailablePacks] = useState<PackMeta[]>([]);
	const [loading, setLoading] = useState(false);

	// Load available packs on mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount bootstrap
	useEffect(() => {
		fetchAvailablePacks().then((packs) => {
			setAvailablePacks(packs);
			// Auto-select first pack if none stored
			if (!packId && packs.length > 0) {
				setPackId(packs[0].packId);
				storePackId(packs[0].packId);
			}
		});
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Load schema when packId changes
	useEffect(() => {
		if (!packId) return;
		setLoading(true);
		const meta = availablePacks.find((p) => p.packId === packId) ?? null;
		setPackMeta(meta);

		fetchPackSchema(packId)
			.then(setSchemas)
			.catch(() =>
				setSchemas({ objectTypes: [], actionTypes: [], metrics: [] }),
			)
			.finally(() => setLoading(false));
	}, [packId, availablePacks]);

	const switchPack = useCallback((newPackId: string) => {
		setPackId(newPackId);
		storePackId(newPackId);
		setSchemas(null);
	}, []);

	return (
		<AppPackContext.Provider
			value={{ packId, packMeta, schemas, availablePacks, loading, switchPack }}
		>
			{children}
		</AppPackContext.Provider>
	);
}
