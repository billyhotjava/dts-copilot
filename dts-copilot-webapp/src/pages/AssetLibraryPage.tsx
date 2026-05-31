import { useSearchParams } from "react-router";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "../ui/Tabs/Tabs";
import CardsPage from "./CardsPage";
import CollectionsPage from "./CollectionsPage";
import DashboardsPage from "./DashboardsPage";
import { MetricAssetsPanel } from "./MetricAssetsPanel";
import "./AssetLibraryPage.css";

export type AssetLibraryTab = "dashboards" | "cards" | "collections" | "metrics";

const TAB_VALUES: AssetLibraryTab[] = ["dashboards", "cards", "collections", "metrics"];

export function normalizeAssetLibraryTab(value: string | null): AssetLibraryTab {
	return TAB_VALUES.includes(value as AssetLibraryTab)
		? (value as AssetLibraryTab)
		: "dashboards";
}

export default function AssetLibraryPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const activeTab = normalizeAssetLibraryTab(searchParams.get("tab"));

	const handleTabChange = (tab: string) => {
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("tab", normalizeAssetLibraryTab(tab));
			return next;
		});
	};

	return (
		<PageContainer>
			<PageHeader
				title="资产库"
				subtitle="聚合看板、卡片、集合与平台指标，保留原有 BI 资产浏览能力。"
			/>
			<Tabs value={activeTab} onChange={handleTabChange} variant="pill">
				<TabList aria-label="资产库类型">
					<Tab value="dashboards">看板</Tab>
					<Tab value="cards">卡片</Tab>
					<Tab value="collections">集合</Tab>
					<Tab value="metrics">平台指标</Tab>
				</TabList>
				<TabPanels>
					<TabPanel value="dashboards">
						<DashboardsPage embedded />
					</TabPanel>
					<TabPanel value="cards">
						<CardsPage embedded />
					</TabPanel>
					<TabPanel value="collections">
						<CollectionsPage embedded />
					</TabPanel>
					<TabPanel value="metrics">
						<MetricAssetsPanel />
					</TabPanel>
				</TabPanels>
			</Tabs>
		</PageContainer>
	);
}
