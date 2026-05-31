import { NavLink } from "react-router";
import { getEffectiveLocale, t } from "../../i18n";
import {
	ChatHistoryIcon,
	CollectionIcon,
	DatabaseIcon,
	MetricIcon,
	ModelIcon,
	NewChatIcon,
	SettingsIcon,
	SignalIcon,
	UserIcon,
} from "../../layouts/AppLayout.icons";
import { MOBILE_NAV_ITEMS, type NavigationIconKey } from "../../layouts/appNavigation";
import "./MobileTabBar.css";

function getMobileIcon(icon: NavigationIconKey) {
	switch (icon) {
		case "newChat":
			return <NewChatIcon />;
		case "chatHistory":
			return <ChatHistoryIcon />;
		case "assets":
			return <CollectionIcon />;
		case "signals":
			return <SignalIcon />;
		case "dataSources":
			return <DatabaseIcon />;
		case "models":
			return <ModelIcon />;
		case "metrics":
			return <MetricIcon />;
		case "users":
			return <UserIcon />;
		case "settings":
		case "governance":
			return <SettingsIcon />;
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
