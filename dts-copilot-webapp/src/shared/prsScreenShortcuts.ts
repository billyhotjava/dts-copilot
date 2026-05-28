import type { ScreenListItem } from "../api/analyticsApi";

export type PrsScreenShortcut = {
	templateCode: string;
	slug: string;
	name: string;
};

export type PrsScreenRequest = {
	slug?: string;
	name?: string;
};

export const PRS_SCREEN_SHORTCUTS: PrsScreenShortcut[] = [
	{
		templateCode: "PRS-FLOWERBIZ-OVERVIEW",
		slug: "prs-flowerbiz-overview-v1",
		name: "PRS 租赁经营总览",
	},
	{
		templateCode: "PRS-FLOWERBIZ-LEASE-EXECUTION",
		slug: "prs-flowerbiz-lease-execution-v1",
		name: "PRS 租赁报花执行看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-FINANCE-COST",
		slug: "prs-flowerbiz-finance-cost-v1",
		name: "PRS 销售坏账与费用看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-CURING-WORKLOAD",
		slug: "prs-flowerbiz-curing-workload-v1",
		name: "PRS 养护人工作量看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-PENDING-APPROVAL",
		slug: "prs-flowerbiz-pending-approval-v1",
		name: "PRS 在途审批与操作监控",
	},
	{
		templateCode: "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
		slug: "prs-flowerbiz-project-customer-v1",
		name: "PRS 项目客户经营看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-CHANGE-BOARD",
		slug: "prs-flowerbiz-change-board-v1",
		name: "PRS 变更与租期调整看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-RECOVERY-BOARD",
		slug: "prs-flowerbiz-recovery-board-v1",
		name: "PRS 回收撤摆与去向看板",
	},
	{
		templateCode: "PRS-FLOWERBIZ-DRILL-LEASE-DETAIL",
		slug: "prs-flowerbiz-drill-lease-detail-v1",
		name: "PRS 报花单明细钻取",
	},
	{
		templateCode: "PRS-FLOWERBIZ-DRILL-CHANGE-DETAIL",
		slug: "prs-flowerbiz-drill-change-detail-v1",
		name: "PRS 变更明细钻取",
	},
	{
		templateCode: "PRS-FLOWERBIZ-DRILL-RECOVERY-DETAIL",
		slug: "prs-flowerbiz-drill-recovery-detail-v1",
		name: "PRS 回收明细钻取",
	},
	{
		templateCode: "PRS-FLOWERBIZ-DRILL-AUDIT-TRAIL",
		slug: "prs-flowerbiz-drill-audit-trail-v1",
		name: "PRS 审批操作链路钻取",
	},
];

export function isPrsScreenTemplateCode(templateCode?: string): boolean {
	return Boolean(templateCode?.startsWith("PRS-FLOWERBIZ-"));
}

export function getPrsScreenShortcutByTemplateCode(
	templateCode?: string,
): PrsScreenShortcut | undefined {
	if (!templateCode) {
		return undefined;
	}
	return PRS_SCREEN_SHORTCUTS.find(
		(item) => item.templateCode === templateCode,
	);
}

export function getPrsScreenShortcutBySlug(
	slug?: string,
): PrsScreenShortcut | undefined {
	if (!slug) {
		return undefined;
	}
	return PRS_SCREEN_SHORTCUTS.find((item) => item.slug === slug);
}

export function getPrsScreenShortcutByTargetView(
	targetView?: string,
): PrsScreenShortcut | undefined {
	const slug = targetView?.startsWith("screen.")
		? targetView.slice("screen.".length)
		: undefined;
	return getPrsScreenShortcutBySlug(slug);
}

export function buildPrsScreenShortcutPath(
	shortcut?: PrsScreenShortcut,
): string | undefined {
	if (!shortcut) {
		return undefined;
	}
	const params = new URLSearchParams();
	params.set("screen", shortcut.slug);
	params.set("name", shortcut.name);
	return `/screens?${params.toString()}`;
}

export function readPrsScreenRequest(search: string): PrsScreenRequest | null {
	const params = new URLSearchParams(search || "");
	const slug = params.get("screen")?.trim();
	const name = params.get("name")?.trim();
	if (!slug && !name) {
		return null;
	}
	return {
		...(slug ? { slug } : {}),
		...(name ? { name } : {}),
	};
}

export function resolvePrsScreenRequestLabel(
	request: PrsScreenRequest | null,
): string {
	if (!request) {
		return "";
	}
	return (
		request.name ||
		getPrsScreenShortcutBySlug(request.slug)?.name ||
		request.slug ||
		""
	);
}

export function resolvePrsScreenFromList(
	screens: ScreenListItem[],
	request: PrsScreenRequest | null,
): ScreenListItem | null {
	if (!request) {
		return null;
	}
	const shortcut = getPrsScreenShortcutBySlug(request.slug);
	const expectedName = request.name || shortcut?.name;
	const expectedSlug = request.slug || shortcut?.slug;
	const normalizedName = normalizeLookupValue(expectedName);
	const normalizedSlug = normalizeLookupValue(expectedSlug);

	return (
		screens.find((screen) => {
			const id = normalizeLookupValue(screen.id);
			const name = normalizeLookupValue(screen.name);
			const description = normalizeLookupValue(screen.description);
			return Boolean(
				(normalizedSlug &&
					(id === normalizedSlug || description.includes(normalizedSlug))) ||
					(normalizedName && name === normalizedName),
			);
		}) ?? null
	);
}

function normalizeLookupValue(value: unknown): string {
	return String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "");
}
