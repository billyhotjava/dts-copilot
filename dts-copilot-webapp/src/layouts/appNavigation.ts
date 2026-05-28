export type NavigationSectionId = "core" | "data" | "admin";
export type NavigationIconKey =
	| "agentReports"
	| "dashboards"
	| "dataSources"
	| "users"
	| "settings";
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
	"models",
	"metrics",
	"trash",
	"analyze",
	"questions",
	"collections",
	"exploreSessions",
	"reportFactory",
	"fixedReports",
	"screens",
	"metricLens",
	"search",
] as const;

export const PRIMARY_NAV_SECTIONS: NavigationSection[] = [
	{
		id: "core",
		titleKey: "nav.section.core",
		items: [
			{
				id: "agentReports",
				to: "/agent-bi",
				labelKey: "nav.agentReports",
				icon: "agentReports",
				end: true,
			},
			{
				id: "dashboards",
				to: "/dashboards",
				labelKey: "nav.dashboards",
				icon: "dashboards",
				end: true,
			},
		],
	},
	{
		id: "data",
		titleKey: "nav.section.data",
		items: [
			{
				id: "dataSources",
				to: "/data",
				labelKey: "nav.dataSources",
				icon: "dataSources",
				end: true,
				visibility: "superuser",
			},
		],
	},
];

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
	{
		id: "users",
		to: "/admin/users",
		labelKey: "nav.users",
		icon: "users",
		visibility: "superuser",
	},
	{
		id: "systemSettings",
		to: "/admin/settings/copilot",
		labelKey: "nav.systemSettings",
		icon: "settings",
		visibility: "superuser",
	},
];

export const MOBILE_NAV_ITEMS: NavigationItem[] = [
	PRIMARY_NAV_SECTIONS[0].items[0],
	PRIMARY_NAV_SECTIONS[1].items[0],
	PRIMARY_NAV_SECTIONS[0].items[1],
];

function canSeeItem(item: NavigationItem, access: NavigationAccess): boolean {
	switch (item.visibility ?? "all") {
		case "privileged":
			return access.privileged;
		case "superuser":
			return access.superuser;
		case "all":
			return true;
	}
}

export function getVisibleNavigation(access: NavigationAccess): NavigationSection[] {
	const primary = PRIMARY_NAV_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => canSeeItem(item, access)),
	})).filter((section) => section.items.length > 0);

	const adminItems = ADMIN_NAV_ITEMS.filter((item) => canSeeItem(item, access));
	if (adminItems.length === 0) return primary;

	return [
		...primary,
		{
			id: "admin",
			titleKey: "nav.section.admin",
			items: adminItems,
		},
	];
}
