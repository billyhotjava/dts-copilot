import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTES_SOURCE = readFileSync(resolve(__dirname, "routes.tsx"), "utf8");

describe("agent workspace routes", () => {
	it("mounts the agent workspace at the app home route", () => {
		expect(ROUTES_SOURCE).toContain('path: "/agent-bi"');
		expect(ROUTES_SOURCE).toContain('import("./pages/AgentWorkspacePage")');
		expect(ROUTES_SOURCE).not.toContain('import("./pages/AgentReportsPage")');
	});

	it("removes fragmented legacy analytics routes from the app shell", () => {
		expect(ROUTES_SOURCE).not.toContain('path: "/analyze"');
		expect(ROUTES_SOURCE).not.toContain('path: "/explore-sessions"');
		expect(ROUTES_SOURCE).not.toContain('path: "/report-factory"');
		expect(ROUTES_SOURCE).not.toContain('path: "/metric-lens"');
		expect(ROUTES_SOURCE).not.toContain('path: "/fixed-reports"');
		expect(ROUTES_SOURCE).not.toContain("ScreensCenterRedirect");
		expect(ROUTES_SOURCE).not.toContain("FixedReportsRedirect");
	});

	it("keeps public share routes isolated from legacy route cleanup", () => {
		expect(ROUTES_SOURCE).toContain('path: "/public/card/:uuid"');
		expect(ROUTES_SOURCE).toContain('path: "/public/dashboard/:uuid"');
		expect(ROUTES_SOURCE).toContain('path: "/public/screen/:uuid"');
	});

	it("redirects legacy asset list routes to the asset library tabs", () => {
		expect(ROUTES_SOURCE).toContain("redirect(`/asset-library?tab=${tab}`)");
		expect(ROUTES_SOURCE).toContain('redirectAssetList("dashboards")');
		expect(ROUTES_SOURCE).toContain('redirectAssetList("cards")');
		expect(ROUTES_SOURCE).toContain('redirectAssetList("collections")');
		expect(ROUTES_SOURCE).not.toContain('path: "/dashboards", lazy: lazyComponent(() => import("./pages/DashboardsPage"))');
		expect(ROUTES_SOURCE).not.toContain('path: "/questions", lazy: lazyComponent(() => import("./pages/CardsPage"))');
		expect(ROUTES_SOURCE).not.toContain('path: "/collections", lazy: lazyComponent(() => import("./pages/CollectionsPage"))');
	});

	it("preserves retained asset detail and governance routes", () => {
		expect(ROUTES_SOURCE).toContain('path: "/assets", loader: redirectAssetLibrary');
		expect(ROUTES_SOURCE).toContain('path: "/asset-library"');
		expect(ROUTES_SOURCE).toContain('import("./pages/AssetLibraryPage")');
		expect(ROUTES_SOURCE).toContain('path: "/dashboards"');
		expect(ROUTES_SOURCE).toContain('path: "/dashboards/new"');
		expect(ROUTES_SOURCE).toContain('path: "/dashboards/:id"');
		expect(ROUTES_SOURCE).toContain('path: "/dashboards/:id/edit"');
		expect(ROUTES_SOURCE).toContain('path: "/questions"');
		expect(ROUTES_SOURCE).toContain('path: "/questions/new"');
		expect(ROUTES_SOURCE).toContain('path: "/questions/:id"');
		expect(ROUTES_SOURCE).toContain('path: "/questions/:id/edit"');
		expect(ROUTES_SOURCE).toContain('path: "/collections"');
		expect(ROUTES_SOURCE).toContain('path: "/collections/:id"');
		expect(ROUTES_SOURCE).toContain('path: "/screens"');
		expect(ROUTES_SOURCE).toContain('import("./pages/screens/ScreensPage")');
		expect(ROUTES_SOURCE).toContain('path: "/data"');
		expect(ROUTES_SOURCE).toContain('path: "/models"');
		expect(ROUTES_SOURCE).toContain('path: "/metrics"');
		expect(ROUTES_SOURCE).toContain('path: "/admin/users"');
	});

	it("guards stale dynamic import chunks with a one-shot reload", () => {
		expect(ROUTES_SOURCE).toContain("isDynamicImportFailure");
		expect(ROUTES_SOURCE).toContain("window.location.reload()");
	});

	it("does not keep the removed NL2SQL eval page as an orphan file", () => {
		expect(existsSync(resolve(__dirname, "pages/Nl2SqlEvalPage.tsx"))).toBe(false);
		expect(ROUTES_SOURCE).not.toContain("Nl2SqlEvalPage");
	});
});
