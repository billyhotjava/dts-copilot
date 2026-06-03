import type { AiAgentChatMessage } from "../../api/analyticsApi";
import { buildAgentFixedReportHref } from "../../shared/fixedReportAvailability";
import { isPrsScreenTemplateCode } from "../../shared/prsScreenShortcuts.ts";

export type FixedReportCandidate = {
	label: string;
	templateCode?: string;
	href?: string;
};

const FIXED_REPORT_CANDIDATE_CODE_MAP: Record<string, string> = {
	财务结算汇总: "FIN-AR-OVERVIEW",
	财务结算汇总客户欠款排行: "FIN-CUSTOMER-AR-RANK",
	财务结算列表项目回款进度: "FIN-PROJECT-COLLECTION-PROGRESS",
	财务结算列表待收款明细: "FIN-PENDING-RECEIPTS-DETAIL",
	预支申请: "FIN-ADVANCE-REQUEST-STATUS",
	日常报销: "FIN-REIMBURSEMENT-STATUS",
	开票管理: "FIN-INVOICE-RECONCILIATION",
	采购计划明细待处理: "PROC-PURCHASE-REQUEST-TODO",
	采购汇总: "PROC-SUPPLIER-AMOUNT-RANK",
	配送记录到货及时率: "PROC-ARRIVAL-ONTIME-RATE",
	入库管理待入库清单: "PROC-PENDING-INBOUND-LIST",
	配送记录在途采购: "PROC-INTRANSIT-BOARD",
	"PRS 租赁经营总览": "PRS-FLOWERBIZ-OVERVIEW",
	"PRS 租赁报花执行看板": "PRS-FLOWERBIZ-LEASE-EXECUTION",
	"PRS 销售坏账与费用看板": "PRS-FLOWERBIZ-FINANCE-COST",
	"PRS 养护人工作量看板": "PRS-FLOWERBIZ-CURING-WORKLOAD",
	"PRS 在途审批与操作监控": "PRS-FLOWERBIZ-PENDING-APPROVAL",
	"PRS 项目客户经营看板": "PRS-FLOWERBIZ-PROJECT-CUSTOMER",
	"PRS 变更与租期调整看板": "PRS-FLOWERBIZ-CHANGE-BOARD",
	"PRS 回收撤摆与去向看板": "PRS-FLOWERBIZ-RECOVERY-BOARD",
	"PRS 报花单明细钻取": "PRS-FLOWERBIZ-DRILL-LEASE-DETAIL",
	"PRS 变更明细钻取": "PRS-FLOWERBIZ-DRILL-CHANGE-DETAIL",
	"PRS 回收明细钻取": "PRS-FLOWERBIZ-DRILL-RECOVERY-DETAIL",
	"PRS 审批操作链路钻取": "PRS-FLOWERBIZ-DRILL-AUDIT-TRAIL",
};

export type FixedReportShortcut = {
	label: string;
	href: string;
};

function hrefForTemplateCode(
	templateCode?: string,
	targetView?: string,
): string | undefined {
	void targetView;
	return buildAgentFixedReportHref(templateCode);
}

export function getFixedReportShortcut(
	message: AiAgentChatMessage,
): FixedReportShortcut | null {
	if (!message.templateCode || message.responseKind !== "FIXED_REPORT") {
		return null;
	}
	const href = hrefForTemplateCode(message.templateCode, message.targetView);
	if (!href) {
		return null;
	}
	return {
		label: isPrsScreenTemplateCode(message.templateCode)
			? "打开资产库大屏"
			: "打开资产库",
		href,
	};
}

export function shouldShowFixedReportShortcut(
	message: AiAgentChatMessage,
): boolean {
	return Boolean(getFixedReportShortcut(message));
}

export function getFixedReportCandidates(
	message: AiAgentChatMessage,
): FixedReportCandidate[] {
	if (message.responseKind !== "FIXED_REPORT_CANDIDATES" || !message.content) {
		return [];
	}
	const seen = new Set<string>();
	return message.content
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("- "))
		.map((line) => line.replace(/^- /, "").trim())
		.filter((label) => {
			if (!label || seen.has(label)) {
				return false;
			}
			seen.add(label);
			return true;
		})
		.map((label) => ({
			label,
			templateCode: FIXED_REPORT_CANDIDATE_CODE_MAP[label],
			href: hrefForTemplateCode(FIXED_REPORT_CANDIDATE_CODE_MAP[label]),
		}));
}
