import { NavLink } from "react-router";
import { getEffectiveLocale, t } from "../../i18n";
import { MOBILE_NAV_ITEMS, type NavigationIconKey } from "../../layouts/appNavigation";
import "./MobileTabBar.css";

const AgentReportIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="agent reports"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M6 3h8l4 4v14H6z" />
		<path d="M14 3v5h5" />
		<path d="M9 13h6" />
		<path d="M9 17h4" />
		<path d="M19 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
	</svg>
);

const DashboardIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="dashboards"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="12" r="3" />
		<path d="M12 2v4" />
		<path d="M12 18v4" />
		<path d="m4.93 4.93 2.83 2.83" />
		<path d="m16.24 16.24 2.83 2.83" />
		<path d="M2 12h4" />
		<path d="M18 12h4" />
		<path d="m4.93 19.07 2.83-2.83" />
		<path d="m16.24 4.93 2.83-2.83" />
	</svg>
);

const DataIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="data"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<ellipse cx="12" cy="5" rx="9" ry="3" />
		<path d="M3 5v14a9 3 0 0 0 18 0V5" />
		<path d="M3 12a9 3 0 0 0 18 0" />
	</svg>
);

function getMobileIcon(icon: NavigationIconKey) {
	switch (icon) {
		case "agentReports":
			return <AgentReportIcon />;
		case "dataSources":
			return <DataIcon />;
		case "dashboards":
			return <DashboardIcon />;
		case "users":
		case "settings":
			return <DashboardIcon />;
	}
}

export function MobileTabBar() {
	const locale = getEffectiveLocale();

	return (
		<nav className="mobile-tab-bar">
			{MOBILE_NAV_ITEMS.map((tab) => (
				<NavLink
					key={tab.to}
					to={tab.to}
					end={tab.end}
					className={({ isActive }) =>
						`mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`
					}
				>
					<span className="mobile-tab-bar__icon">{getMobileIcon(tab.icon)}</span>
					<span className="mobile-tab-bar__label">
						{t(locale, tab.labelKey)}
					</span>
				</NavLink>
			))}
		</nav>
	);
}
