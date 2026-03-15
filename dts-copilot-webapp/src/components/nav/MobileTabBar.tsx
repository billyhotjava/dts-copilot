import { NavLink } from "react-router";
import { APP_HOME_PATH } from "../../appShellConfig";
import { getEffectiveLocale, t } from "../../i18n";
import "./MobileTabBar.css";

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

const MetricsIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="metrics"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M3 3v18h18" />
		<path d="m19 9-5 5-4-4-3 3" />
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

const MetricsAlertIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="metrics"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
		<path d="M12 9v4" />
		<path d="M12 17h.01" />
	</svg>
);

const MoreIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="more"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<circle cx="12" cy="12" r="1" />
		<circle cx="19" cy="12" r="1" />
		<circle cx="5" cy="12" r="1" />
	</svg>
);

const ScreenIcon = () => (
	<svg
		width="20"
		height="20"
		role="img"
		aria-label="screen"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
		<path d="M8 21h8" />
		<path d="M12 17v4" />
	</svg>
);

const tabs = [
	{ to: APP_HOME_PATH, icon: <DashboardIcon />, labelKey: "nav.dashboards" as const, end: true },
	{
		to: "/data",
		icon: <DataIcon />,
		labelKey: "nav.data" as const,
		end: false,
	},
	{
		to: "/metrics",
		icon: <MetricsIcon />,
		labelKey: "nav.metrics" as const,
		end: false,
	},
	{
		to: "/screens",
		icon: <ScreenIcon />,
		labelKey: "nav.screens" as const,
		end: false,
	},
];

export function MobileTabBar() {
	const locale = getEffectiveLocale();

	return (
		<nav className="mobile-tab-bar">
			{tabs.map((tab) => (
				<NavLink
					key={tab.to}
					to={tab.to}
					end={tab.end}
					className={({ isActive }) =>
						`mobile-tab-bar__item ${isActive ? "mobile-tab-bar__item--active" : ""}`
					}
				>
					<span className="mobile-tab-bar__icon">{tab.icon}</span>
					<span className="mobile-tab-bar__label">
						{t(locale, tab.labelKey)}
					</span>
				</NavLink>
			))}
		</nav>
	);
}
