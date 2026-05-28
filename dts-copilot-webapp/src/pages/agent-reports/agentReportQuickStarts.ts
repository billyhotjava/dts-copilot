export type AgentReportQuickStart = {
	id: string;
	domain: string;
	title: string;
	description: string;
	prompt: string;
	routeLevel: "L0" | "L1" | "L2";
	responseKind: "REPORT_DRAFT" | "FIXED_REPORT" | "BUSINESS_INSIGHT";
	qualityLevel: "HIGH" | "MEDIUM" | "LOW";
	routeHint: string;
};

export type AgentReportSupportingAsset = {
	id: string;
	title: string;
	description: string;
	to: string;
};

export type AgentReportBusinessObject = {
	id: string;
	domain: string;
	title: string;
	objectCode: string;
	pagePath: string;
	prompt: string;
	dataSurface: "L0_BUSINESS_OBJECT_PROFILE";
	qualityLevel: "HIGH" | "MEDIUM" | "LOW";
	keyFields: string[];
};

export const AGENT_REPORT_QUICK_STARTS: AgentReportQuickStart[] = [
	{
		id: "lease-revenue-trend",
		domain: "租赁经营",
		title: "租赁收入和在租结构",
		description: "按月查看租赁收入、租赁数量、项目贡献和异常波动。",
		prompt:
			"从 2025-05-01 开始到现在，按月分析花卉租赁收入、租赁数量、项目贡献 Top10，并解释明显波动。",
		routeLevel: "L1",
		responseKind: "REPORT_DRAFT",
		qualityLevel: "MEDIUM",
		routeHint: "dbt ADS/DWS 主题表",
	},
	{
		id: "recovery-baddebt",
		domain: "回收与坏账",
		title: "回收进展和坏账风险",
		description: "聚焦回收金额、待回收余额、逾期风险和客户异常。",
		prompt:
			"从 2025-05-01 开始到现在，分析花卉回收金额、待回收余额、坏账风险客户，并给出需要跟进的项目清单。",
		routeLevel: "L1",
		responseKind: "REPORT_DRAFT",
		qualityLevel: "MEDIUM",
		routeHint: "dbt 回收主题表",
	},
	{
		id: "curing-extra-cost",
		domain: "养护成本",
		title: "养护工作量和额外成本",
		description: "比较养护人员工作量、额外成本类型和成本异常。",
		prompt:
			"从 2025-05-01 开始到现在，按养护人员和项目分析工作量、额外成本构成，并找出成本异常的项目。",
		routeLevel: "L1",
		responseKind: "REPORT_DRAFT",
		qualityLevel: "MEDIUM",
		routeHint: "dbt 成本与养护主题表",
	},
	{
		id: "project-operation",
		domain: "项目运营",
		title: "项目经营月报",
		description: "汇总项目收入、成本、回收、状态变化和待办事项。",
		prompt:
			"从 2025-05-01 开始到现在，生成项目经营月报，包含收入、成本、回收、状态变化和需要业务确认的问题。",
		routeLevel: "L2",
		responseKind: "REPORT_DRAFT",
		qualityLevel: "MEDIUM",
		routeHint: "固定报表与项目月度主题表",
	},
];

export const AGENT_REPORT_BUSINESS_OBJECTS: AgentReportBusinessObject[] = [
	{
		id: "flowerbiz-order-status",
		domain: "报花",
		title: "报花单据状态分布",
		objectCode: "prs.flowerbiz.biz_order",
		pagePath: "报花管理 > 报花单据",
		prompt:
			"基于业务对象 prs.flowerbiz.biz_order，统计报花单据状态分布、业务类型分布、未完成单据和处理时效，用结构化表格输出，并标注页面路径与数据质量提示。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["项目点", "业务类型", "单号", "状态", "发起时间", "完成时间"],
	},
	{
		id: "procurement-delivery-status",
		domain: "采购",
		title: "采购配送记录状态",
		objectCode: "prs.procurement.delivery_record",
		pagePath: "采购管理 > 配送记录",
		prompt:
			"基于业务对象 prs.procurement.delivery_record，统计采购配送记录状态、配送类型、接收人和配送时效，用结构化表格输出，并标注只读 ODS/业务对象来源。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["标题", "状态", "类型", "配送人", "配送时间", "接收人", "接收时间"],
	},
	{
		id: "project-site-status",
		domain: "项目",
		title: "项目点状态统计",
		objectCode: "prs.project.project_site",
		pagePath: "项目点管理 > 项目点",
		prompt:
			"基于业务对象 prs.project.project_site，统计项目点状态、项目经理项目量、监管人员和养护负责人分布，用结构化表格输出，并说明该对象和经营 TOP 报表的边界。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["项目点编码", "项目点名称", "项目状态", "项目经理", "合同名称"],
	},
	{
		id: "finance-bank-statement-unmatched",
		domain: "财务",
		title: "银行流水未核对",
		objectCode: "prs.finance.bank_statement",
		pagePath: "财务管理 > 银行流水",
		prompt:
			"基于业务对象 prs.finance.bank_statement，统计银行流水未核对、收入支出方向、对方户名 TOP 和未生成凭证情况，用结构化表格输出，并保留业务单据关联完整性提示。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["交易日期", "银行名称", "收入金额", "支出金额", "对方户名", "状态"],
	},
	{
		id: "warehouse-stock-movement",
		domain: "仓库",
		title: "库存和出入库画像",
		objectCode: "prs.warehouse.stock_movement",
		pagePath: "仓库管理 > 库存/出入库",
		prompt:
			"基于业务对象 prs.warehouse.stock_movement，统计库存状态、物品库存排行、入库出库、调拨、报损和退货情况，用结构化表格输出，并说明库存经营分析是否需要候选 ADS。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["仓库", "物品", "库存数量", "库存状态", "入库单号", "出库单号"],
	},
];

export const AGENT_REPORT_SUPPORTING_ASSETS: AgentReportSupportingAsset[] = [
	{
		id: "fixed-reports",
		title: "固定报表",
		description: "高频、口径已认证的报表模板优先走快路径。",
		to: "/fixed-reports",
	},
	{
		id: "dashboards",
		title: "仪表盘",
		description: "承接 AI 生成后的经营看板和专题分析结果。",
		to: "/dashboards",
	},
	{
		id: "data",
		title: "数据源",
		description: "同步 ptr_mysql 与 dbt 主题表元数据，支撑可解释取数。",
		to: "/data",
	},
];
