import {
	buildPrsScreenPreviewPath,
	getPrsScreenShortcutByTemplateCode,
	isPrsScreenTemplateCode,
} from "./prsScreenShortcuts";

const LEGACY_FIXED_REPORT_LABELS: Record<string, string> = {
	"FIN-AR-OVERVIEW": "财务结算汇总",
	"FIN-CUSTOMER-AR-RANK": "财务结算汇总客户欠款排行",
	"FIN-PROJECT-COLLECTION-PROGRESS": "财务结算列表项目回款进度",
	"FIN-PENDING-RECEIPTS-DETAIL": "财务结算列表待收款明细",
	"FIN-ADVANCE-REQUEST-STATUS": "预支申请",
	"FIN-REIMBURSEMENT-STATUS": "日常报销",
	"FIN-INVOICE-RECONCILIATION": "开票管理",
	"PROC-PURCHASE-REQUEST-TODO": "采购计划明细待处理",
	"PROC-SUPPLIER-AMOUNT-RANK": "采购汇总",
	"PROC-ARRIVAL-ONTIME-RATE": "配送记录到货及时率",
	"PROC-PENDING-INBOUND-LIST": "入库管理待入库清单",
	"PROC-INTRANSIT-BOARD": "配送记录在途采购",
};

export function normalizeFixedReportTemplateCode(value?: string | null): string {
	return String(value ?? "").trim();
}

export function isAgentRunnableFixedReportTemplateCode(
	templateCode?: string | null,
): boolean {
	const normalizedCode = normalizeFixedReportTemplateCode(templateCode);
	return Boolean(normalizedCode && isPrsScreenTemplateCode(normalizedCode));
}

export function buildAgentFixedReportHref(
	templateCode?: string | null,
): string | undefined {
	const normalizedCode = normalizeFixedReportTemplateCode(templateCode);
	if (!normalizedCode || !isAgentRunnableFixedReportTemplateCode(normalizedCode)) {
		return undefined;
	}
	return buildPrsScreenPreviewPath(getPrsScreenShortcutByTemplateCode(normalizedCode));
}

export function shouldFallbackFixedReportToPrompt(
	templateCode?: string | null,
): boolean {
	const normalizedCode = normalizeFixedReportTemplateCode(templateCode);
	return Boolean(normalizedCode && !isAgentRunnableFixedReportTemplateCode(normalizedCode));
}

export function resolveFixedReportDisplayLabel(
	templateCode?: string | null,
	fallbackLabel?: string | null,
): string {
	const explicitLabel = String(fallbackLabel ?? "").trim();
	if (explicitLabel) {
		return explicitLabel;
	}
	const normalizedCode = normalizeFixedReportTemplateCode(templateCode);
	return (
		getPrsScreenShortcutByTemplateCode(normalizedCode)?.name ||
		LEGACY_FIXED_REPORT_LABELS[normalizedCode] ||
		normalizedCode ||
		"资产库模板"
	);
}

export function buildFixedReportFallbackPrompt(
	templateCode?: string | null,
	fallbackLabel?: string | null,
): string {
	const normalizedCode = normalizeFixedReportTemplateCode(templateCode);
	const label = resolveFixedReportDisplayLabel(normalizedCode, fallbackLabel);
	return [
		`查看${label}。`,
		normalizedCode
			? `资产库模板 ${normalizedCode} 当前未在资产目录发布或已归档。`
			: "资产库模板当前未在资产目录发布或已归档。",
		"请优先使用业务对象、dbt 主题表或已认证 PRS 报表口径完成分析，并说明可用数据来源。",
	].join("");
}
