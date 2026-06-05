export type NavigationSectionId = "core";
export type NavigationIconKey =
	| "newChat"
	| "chatHistory"
	| "assets"
	| "signals"
	| "dataSources"
	| "models"
	| "metrics"
	| "users"
	| "settings"
	| "governance";
export type NavigationVisibility = "all" | "privileged" | "superuser";

export type NavigationItem = {
	id: string;
	to: string;
	labelKey: string;
	icon: NavigationIconKey;
	end?: boolean;
	visibility?: NavigationVisibility;
};

export type NavigationSection = {
	id: NavigationSectionId;
	titleKey: string;
	items: NavigationItem[];
};

export type NavigationAccess = {
	privileged: boolean;
	superuser: boolean;
};

export const HIDDEN_LEGACY_NAV_IDS = [
	"trash",
	"questions",
	"collections",
	"screens",
	"search",
] as const;

export const PRIMARY_NAV_SECTIONS: NavigationSection[] = [
	{
		id: "core",
		titleKey: "nav.section.core",
		items: [
			{
				id: "newChat",
				to: "/agent-bi",
				labelKey: "nav.newChat",
				icon: "newChat",
				end: true,
			},
			{
				id: "chatHistory",
				to: "/agent-bi?view=sessions",
				labelKey: "nav.chatHistory",
				icon: "chatHistory",
			},
			{
				id: "assets",
				to: "/asset-library",
				labelKey: "nav.assets",
				icon: "assets",
				end: false,
			},
			{
				id: "signals",
				to: "/agent-bi?view=signals",
				labelKey: "nav.signals",
				icon: "signals",
			},
		],
	},
];

export const GOVERNANCE_NAV_ITEMS: NavigationItem[] = [
	{
		id: "dataSources",
		to: "/data",
		labelKey: "nav.dataSources",
		icon: "dataSources",
		end: true,
		visibility: "privileged",
	},
	{
		id: "models",
		to: "/models",
		labelKey: "nav.models",
		icon: "models",
		end: true,
		visibility: "privileged",
	},
	{
		id: "metrics",
		to: "/metrics",
		labelKey: "nav.metrics",
		icon: "metrics",
		end: true,
		visibility: "privileged",
	},
	{
		id: "users",
		to: "/admin/users",
		labelKey: "nav.users",
		icon: "users",
		visibility: "privileged",
	},
	{
		id: "systemSettings",
		to: "/admin/settings/copilot",
		labelKey: "nav.systemSettings",
		icon: "settings",
		visibility: "privileged",
	},
];

export const ADMIN_NAV_ITEMS = GOVERNANCE_NAV_ITEMS;

export const MOBILE_NAV_ITEMS: NavigationItem[] = [
	PRIMARY_NAV_SECTIONS[0].items[0],
	PRIMARY_NAV_SECTIONS[0].items[1],
	PRIMARY_NAV_SECTIONS[0].items[2],
	PRIMARY_NAV_SECTIONS[0].items[3],
];

function canSeeItem(item: NavigationItem, access: NavigationAccess): boolean {
	switch (item.visibility ?? "all") {
		case "privileged":
			return access.privileged || access.superuser;
		case "superuser":
			return access.superuser;
		case "all":
			return true;
	}
}

export function getVisibleNavigation(access: NavigationAccess): NavigationSection[] {
	return PRIMARY_NAV_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => canSeeItem(item, access)),
	})).filter((section) => section.items.length > 0);
}

export function getVisibleGovernanceItems(access: NavigationAccess): NavigationItem[] {
	return GOVERNANCE_NAV_ITEMS.filter((item) => canSeeItem(item, access));
}
