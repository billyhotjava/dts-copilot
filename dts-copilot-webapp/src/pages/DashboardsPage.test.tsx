import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsApi } from "../api/analyticsApi";
import DashboardsPage from "./DashboardsPage";

vi.mock("react-router", async () => {
	const React = await vi.importActual<typeof import("react")>("react");
	return {
		Link: ({
			children,
			className,
			to,
		}: {
			children: ReactNode;
			className?: string;
			to: string;
		}) => React.createElement("a", { className, href: to }, children),
	};
});

vi.mock("../api/analyticsApi", () => ({
	analyticsApi: {
		listDashboards: vi.fn(),
		listFixedReportCatalog: vi.fn(),
	},
}));

const listDashboards = vi.mocked(analyticsApi.listDashboards);
const listFixedReportCatalog = vi.mocked(analyticsApi.listFixedReportCatalog);

describe("DashboardsPage fixed report assets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listDashboards.mockResolvedValue([]);
		listFixedReportCatalog.mockResolvedValue([
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER-TOP",
				name: "PRS 项目经营 TOP",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SPLIT",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				parentTemplateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
			},
			{
				templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				name: "PRS 项目客户经营看板",
				domain: "PRS租赁",
				certificationStatus: "CERTIFIED",
				published: true,
				assetKind: "DBT_SCREEN_TABLE",
				assetGroupCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
				targetObject: "screen.prs-flowerbiz-project-customer-v1",
				primaryDbtModel: "public.xycyl_ads_flowerbiz_project_customer",
			},
		]);
	});

	it("shows PRS screen-backed fixed report assets and opens them through Agent BI", async () => {
		render(<DashboardsPage embedded />);

		await waitFor(() => {
			expect(listFixedReportCatalog).toHaveBeenCalledWith({ limit: 100 });
		});

		const link = await screen.findByRole("link", { name: /PRS 项目客户经营看板/ });
		expect(link).toHaveAttribute(
			"href",
			"/agent-bi?fixedReport=PRS-FLOWERBIZ-PROJECT-CUSTOMER",
		);
		expect(screen.queryByRole("link", { name: /PRS 项目经营 TOP/ })).not.toBeInTheDocument();
		expect(screen.getByText("public.xycyl_ads_flowerbiz_project_customer")).toBeInTheDocument();
	});
});
