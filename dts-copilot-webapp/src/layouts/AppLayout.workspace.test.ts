import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const LAYOUT_SOURCE = readFileSync(resolve(__dirname, "AppLayout.tsx"), "utf8");
const LAYOUT_CSS = readFileSync(resolve(__dirname, "layout.css"), "utf8");
const SIDEBAR_CSS = readFileSync(resolve(__dirname, "../components/SidebarNav/SidebarNav.css"), "utf8");

describe("AppLayout workspace shell", () => {
	it("uses APP_HOME_PATH as the workspace route and disables the floating copilot there", () => {
		expect(LAYOUT_SOURCE).toContain("const isWorkspaceRoute = location.pathname === APP_HOME_PATH");
		expect(LAYOUT_SOURCE).toContain("{!isWorkspaceRoute && (");
		expect(LAYOUT_SOURCE).toContain("<CopilotSidebar hasSessionAccess={sessionStatus === \"ok\"} />");
	});

	it("keeps public share routes on a minimal outlet branch", () => {
		expect(LAYOUT_SOURCE).toContain("if (isPublicRoute)");
		expect(LAYOUT_SOURCE).toContain("public-route-shell");
		expect(LAYOUT_SOURCE).not.toContain("copilotEmbeddedInPage");
	});

	it("wraps the workspace page in a stable shell class", () => {
		expect(LAYOUT_SOURCE).toContain("workspace-shell");
		expect(LAYOUT_CSS).toContain(".workspace-shell");
		expect(LAYOUT_CSS).toContain(".main-content--workspace");
	});

	it("renders governance navigation from the header instead of the sidebar", () => {
		expect(LAYOUT_SOURCE).toContain("getVisibleGovernanceItems");
		expect(LAYOUT_SOURCE).toContain("governance-menu-trigger");
		expect(LAYOUT_SOURCE).toContain("nav.section.governance");
	});

	it("hides the desktop sidebar on mobile so the bottom tabs own navigation", () => {
		expect(SIDEBAR_CSS).toContain("@media (max-width: 767px)");
		expect(SIDEBAR_CSS).toContain(".mb-sidebar");
		expect(SIDEBAR_CSS).toContain("display: none");
	});
});
