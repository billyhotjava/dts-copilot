import { useEffect } from "react";
import { createBrowserRouter, redirect, useNavigate } from "react-router";
import { APP_HOME_ALIASES, APP_HOME_PATH } from "./appShellConfig";
import { AppLayout } from "./layouts/AppLayout";

function ModernAliasRedirect() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate(APP_HOME_PATH, { replace: true });
	}, [navigate]);
	return null;
}

const CHUNK_RELOAD_STORAGE_KEY = "dts-copilot:last-dynamic-import-reload";
const DYNAMIC_IMPORT_ERROR_PATTERN =
	/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

function ReloadingRoute() {
	return null;
}

function isDynamicImportFailure(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return DYNAMIC_IMPORT_ERROR_PATTERN.test(message);
}

function reloadOnceForDynamicImportFailure(): boolean {
	if (typeof window === "undefined") return false;
	const now = Date.now();
	const lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) ?? "0");
	if (Number.isFinite(lastReload) && now - lastReload < 60_000) return false;
	window.sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, String(now));
	window.location.reload();
	return true;
}

const lazyComponent = (importer: () => Promise<{ default: unknown }>) => async () => {
	try {
		const mod = await importer();
		return { Component: mod.default as never };
	} catch (error) {
		if (isDynamicImportFailure(error) && reloadOnceForDynamicImportFailure()) {
			return { Component: ReloadingRoute as never };
		}
		throw error;
	}
};

const redirectAssetList = (tab: "dashboards" | "cards" | "collections") => () =>
	redirect(`/asset-library?tab=${tab}`);

const redirectAssetLibrary = () => redirect("/asset-library");

export function createRoutes() {
	return createBrowserRouter(
		[
			// Auth routes — fullscreen, no layout
			{ path: "/auth/login", lazy: lazyComponent(() => import("./pages/auth/LoginPage")) },
			{ path: "/auth/setup", lazy: lazyComponent(() => import("./pages/auth/SetupPage")) },
			// Fullscreen routes — no sidebar/layout wrapper
			{ path: "/screens/new", lazy: lazyComponent(() => import("./pages/screens/ScreenDesignerPage")) },
			{ path: "/screens/:id/edit", lazy: lazyComponent(() => import("./pages/screens/ScreenDesignerPage")) },
			{ path: "/screens/:id/preview", lazy: lazyComponent(() => import("./pages/screens/ScreenPreviewPage")) },
			{ path: "/screens/:id/export", lazy: lazyComponent(() => import("./pages/screens/ScreenExportPage")) },
			{ path: "/public/screen/:uuid", lazy: lazyComponent(() => import("./pages/screens/PublicScreenPage")) },
			{
				Component: AppLayout,
				children: [
					{ path: "/", Component: ModernAliasRedirect },
					...APP_HOME_ALIASES.map((path) => ({ path, Component: ModernAliasRedirect })),
					{ path: "/agent-bi", lazy: lazyComponent(() => import("./pages/AgentWorkspacePage")) },
					{ path: "/assets", loader: redirectAssetLibrary },
					{ path: "/asset-library", lazy: lazyComponent(() => import("./pages/AssetLibraryPage")) },
					{ path: "/collections", loader: redirectAssetList("collections") },
					{ path: "/collections/:id", lazy: lazyComponent(() => import("./pages/CollectionItemsPage")) },
					{ path: "/dashboards", loader: redirectAssetList("dashboards") },
					{ path: "/dashboards/new", lazy: lazyComponent(() => import("./pages/DashboardEditorPage")) },
					{ path: "/dashboards/:id", lazy: lazyComponent(() => import("./pages/DashboardDetailPage")) },
					{ path: "/dashboards/:id/edit", lazy: lazyComponent(() => import("./pages/DashboardEditorPage")) },
					{ path: "/questions", loader: redirectAssetList("cards") },
					{ path: "/questions/new", lazy: lazyComponent(() => import("./pages/CardEditorPage")) },
					{ path: "/questions/:id", lazy: lazyComponent(() => import("./pages/CardDetailPage")) },
					{ path: "/questions/:id/edit", lazy: lazyComponent(() => import("./pages/CardEditorPage")) },
					{ path: "/data", lazy: lazyComponent(() => import("./pages/DataPage")) },
					{ path: "/data/new", lazy: lazyComponent(() => import("./pages/DatabaseNewPage")) },
					{ path: "/data/:dbId/edit", lazy: lazyComponent(() => import("./pages/DatabaseEditPage")) },
					{ path: "/data/:dbId", lazy: lazyComponent(() => import("./pages/DatabaseDetailPage")) },
					{ path: "/admin/settings/copilot", lazy: lazyComponent(() => import("./pages/admin/CopilotSettingsPage")) },
					{ path: "/admin/users", lazy: lazyComponent(() => import("./pages/admin/UsersPage")) },
					{ path: "/data/:dbId/tables/:tableId", lazy: lazyComponent(() => import("./pages/TableDetailPage")) },
					{
						path: "/data/:dbId/tables/:tableId/fields/:fieldId",
						lazy: lazyComponent(() => import("./pages/FieldDetailPage")),
					},
					{ path: "/models", lazy: lazyComponent(() => import("./pages/ModelsPage")) },
					{ path: "/metrics", lazy: lazyComponent(() => import("./pages/MetricsPage")) },
					{ path: "/trash", lazy: lazyComponent(() => import("./pages/TrashPage")) },
					{ path: "/public/card/:uuid", lazy: lazyComponent(() => import("./pages/PublicCardPage")) },
					{ path: "/public/dashboard/:uuid", lazy: lazyComponent(() => import("./pages/PublicDashboardPage")) },
					{ path: "/screens", lazy: lazyComponent(() => import("./pages/screens/ScreensPage")) },
					{ path: "/search", lazy: lazyComponent(() => import("./pages/SearchPage")) },
					{ path: "*", lazy: lazyComponent(() => import("./pages/NotFoundPage")) },
				],
			},
		],
		{
			basename: import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "",
		},
	);
}
