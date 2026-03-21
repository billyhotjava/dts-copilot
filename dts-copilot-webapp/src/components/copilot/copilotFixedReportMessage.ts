import type { AiAgentChatMessage } from '../../api/analyticsApi'

export type FixedReportCandidate = {
	label: string
	templateCode?: string
}

const FIXED_REPORT_CANDIDATE_CODE_MAP: Record<string, string> = {
	'财务结算汇总': 'FIN-AR-OVERVIEW',
	'财务结算汇总客户欠款排行': 'FIN-CUSTOMER-AR-RANK',
	'财务结算列表项目回款进度': 'FIN-PROJECT-COLLECTION-PROGRESS',
	'财务结算列表待收款明细': 'FIN-PENDING-RECEIPTS-DETAIL',
	'预支申请': 'FIN-ADVANCE-REQUEST-STATUS',
	'日常报销': 'FIN-REIMBURSEMENT-STATUS',
	'开票管理': 'FIN-INVOICE-RECONCILIATION',
	'采购计划明细待处理': 'PROC-PURCHASE-REQUEST-TODO',
	'采购汇总': 'PROC-SUPPLIER-AMOUNT-RANK',
	'配送记录到货及时率': 'PROC-ARRIVAL-ONTIME-RATE',
	'入库管理待入库清单': 'PROC-PENDING-INBOUND-LIST',
	'配送记录在途采购': 'PROC-INTRANSIT-BOARD',
	'库存现量': 'WH-STOCK-OVERVIEW',
	'库存现量低库存预警': 'WH-LOW-STOCK-ALERT',
}

export function shouldShowFixedReportShortcut(message: AiAgentChatMessage): boolean {
	return Boolean(
		message.templateCode
		&& message.responseKind === 'FIXED_REPORT',
	)
}

export function getFixedReportCandidates(message: AiAgentChatMessage): FixedReportCandidate[] {
	if (message.responseKind !== 'FIXED_REPORT_CANDIDATES' || !message.content) {
		return []
	}
	const seen = new Set<string>()
	return message.content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.startsWith('- '))
		.map((line) => line.replace(/^- /, '').trim())
		.filter((label) => {
			if (!label || seen.has(label)) {
				return false
			}
			seen.add(label)
			return true
		})
		.map((label) => ({
			label,
			templateCode: FIXED_REPORT_CANDIDATE_CODE_MAP[label],
		}))
}
