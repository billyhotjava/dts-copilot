import { useLocation } from "react-router";
import { getEffectiveLocale, t } from "../i18n";
import { ChevronRightIcon } from "./AppLayout.icons";

// ── Shared Store helpers ───────────────────────────────────────────────

const SHARED_STORE_KEYS = ["platformUserStore", "userStore"] as const;

function readSharedStore(): Record<string, unknown> | null {
	for (const key of SHARED_STORE_KEYS) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const store = JSON.parse(raw);
			if (store && typeof store === "object") {
				return store as Record<string, unknown>;
			}
		} catch {
			// ignore malformed store
		}
	}
	return null;
}

export function clearSharedUserTokens() {
	for (const key of SHARED_STORE_KEYS) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const store = JSON.parse(raw);
			if (!store || typeof store !== "object") continue;
			const record = store as Record<string, unknown>;
			const state =
				record.state && typeof record.state === "object"
					? (record.state as Record<string, unknown>)
					: {};
			state.userToken = {};
			record.state = state;
			localStorage.setItem(key, JSON.stringify(record));
		} catch {
			// ignore
		}
	}
}

export type AppUserInfo = {
	username: string;
	fullName: string;
	email: string;
	personnelLevel: unknown;
};

export function getUserInfo(): AppUserInfo {
	try {
		const store = readSharedStore();
		if (!store)
			return { username: "", fullName: "", email: "", personnelLevel: null };
		const state = store?.state;
		const userInfo =
			state && typeof state === "object"
				? (state as Record<string, unknown>).userInfo
				: undefined;
		if (!userInfo || typeof userInfo !== "object") {
			return { username: "", fullName: "", email: "", personnelLevel: null };
		}
		const info = userInfo as Record<string, unknown>;
		return {
			username: String(info.username ?? ""),
			fullName: String(info.fullName ?? ""),
			email: String(info.email ?? ""),
			personnelLevel:
				info.personnelLevel ??
				info.personnel_level ??
				(info as Record<string, unknown>)["personnel-level"] ??
				null,
		};
	} catch {
		return { username: "", fullName: "", email: "", personnelLevel: null };
	}
}

// ── Role-based access ──────────────────────────────────────────────────

export function getUserRoles(): string[] {
	try {
		const store = readSharedStore();
		if (!store) return [];
		const state = store?.state;
		if (!state || typeof state !== "object") return [];
		const s = state as Record<string, unknown>;
		const roles =
			s.roles ??
			s.userRoles ??
			(s.userInfo as Record<string, unknown> | undefined)?.roles;
		if (Array.isArray(roles)) return roles.map(String);
		return [];
	} catch {
		return [];
	}
}

// ── Breadcrumb ─────────────────────────────────────────────────────────

const ROUTE_NAV_MAP: { path: string; section: string; nav?: string }[] = [
	{ path: "/dashboards", section: "nav.section.core", nav: "nav.dashboards" },
	{ path: "/screens", section: "nav.section.core", nav: "nav.screens" },
	{ path: "/data", section: "nav.section.data", nav: "nav.data" },
	{ path: "/models", section: "nav.section.data", nav: "nav.models" },
	{ path: "/metrics", section: "nav.section.data", nav: "nav.metrics" },
	{ path: "/trash", section: "nav.section.data", nav: "nav.trash" },
	{ path: "/analyze", section: "nav.section.tools", nav: "nav.analyze" },
	{ path: "/questions", section: "nav.section.tools", nav: "nav.questions" },
	{ path: "/collections", section: "nav.section.tools", nav: "nav.collections" },
	{
		path: "/explore-sessions",
		section: "nav.section.tools",
		nav: "nav.exploreSessions",
	},
	{
		path: "/report-factory",
		section: "nav.section.tools",
		nav: "nav.reportFactory",
	},
	{ path: "/fixed-reports", section: "nav.section.tools", nav: "nav.fixedReports" },
	{ path: "/metric-lens", section: "nav.section.tools", nav: "nav.metricLens" },
	{ path: "/search", section: "nav.section.tools", nav: "nav.search" },
	{ path: "/admin/users", section: "nav.section.admin", nav: "nav.users" },
	{ path: "/admin/settings", section: "nav.section.admin", nav: "nav.systemSettings" },
];

export function HeaderBreadcrumb() {
	const locale = getEffectiveLocale();
	const location = useLocation();
	const path = location.pathname;

	let matched: { section: string; nav?: string } | null = null;
	for (const route of ROUTE_NAV_MAP) {
		if (route.path === "/") {
			if (path === "/") {
				matched = route;
				break;
			}
			continue;
		}
		if (path === route.path || path.startsWith(route.path + "/")) {
			matched = route;
			break;
		}
	}

	const sectionLabel = matched ? t(locale, matched.section) : null;
	const navLabel = matched?.nav ? t(locale, matched.nav) : null;

	return (
		<nav className="header-breadcrumb">
			{sectionLabel && (
				<span
					className={
						navLabel ? "header-breadcrumb__link" : "header-breadcrumb__current"
					}
				>
					{sectionLabel}
				</span>
			)}
			{navLabel && (
				<>
					<span className="header-breadcrumb__separator">
						<ChevronRightIcon />
					</span>
					<span className="header-breadcrumb__current">{navLabel}</span>
				</>
			)}
		</nav>
	);
}
