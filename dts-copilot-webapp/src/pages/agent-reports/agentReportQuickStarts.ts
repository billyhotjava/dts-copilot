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

export type AgentReportGuideQuestion = {
	id: string;
	label: string;
	prompt: string;
	routeLevel: "L0" | "L1" | "L2";
};

export type AgentReportBusinessGuide = {
	id: string;
	group: "经营总览" | "业务闭环" | "支撑域";
	icon: string;
	title: string;
	subtitle: string;
	decisionHint: string;
	fixedReports: string[];
	dbtModels: string[];
	businessObjects: string[];
	questions: AgentReportGuideQuestion[];
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
		id: "warehouse-stock-info",
		domain: "仓库",
		title: "库存现量画像",
		objectCode: "prs.warehouse.stock_info",
		pagePath: "仓库管理 > 库存管理 > 库存",
		prompt:
			"基于业务对象 prs.warehouse.stock_info，按库房、物品、状态和可用数量统计库存现量，标注来源表 s_stock_info、s_stock_item 和 s_storehouse_info，并输出低库存提示。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["所属库房", "物品名称", "物品规格", "物品属性", "可用数量", "库存状态"],
	},
	{
		id: "warehouse-inout-record",
		domain: "仓库",
		title: "出入库记录画像",
		objectCode: "prs.warehouse.inout_record",
		pagePath: "仓库管理 > 库存管理 > 出入库记录",
		prompt:
			"基于业务对象 prs.warehouse.inout_record，统计本月入库、出库、调拨、报损和退货记录，标注来源表 t_warehousing_info/item 与 t_ex_warehouse_info/item，并用结构化表格输出。",
		dataSurface: "L0_BUSINESS_OBJECT_PROFILE",
		qualityLevel: "MEDIUM",
		keyFields: ["方向", "库房", "物品", "数量", "单价", "发生日期", "关联业务单号"],
	},
];

export const AGENT_REPORT_BUSINESS_GUIDE: AgentReportBusinessGuide[] = [
	{
		id: "operation-overview",
		group: "经营总览",
		icon: "总",
		title: "经营总览",
		subtitle: "先看收入、单量、项目贡献、异常待办，适合老板和运营负责人。",
		decisionHint: "优先命中 L2 经营总览；缺少细项时再走 dbt ADS/DWS。",
		fixedReports: ["PRS-FLOWERBIZ-OVERVIEW", "PRS-FLOWERBIZ-PROJECT-CUSTOMER"],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_overview",
			"public.xycyl_ads_flowerbiz_project_customer",
			"public.xycyl_dws_flowerbiz_project_monthly",
		],
		businessObjects: [
			"prs.flowerbiz.biz_order",
			"prs.project.project_site",
			"prs.finance.bank_statement",
		],
		questions: [
			{
				id: "overview-monthly",
				label: "PRS 租赁经营总览",
				prompt: "从 2025-05-01 到现在，按月汇总 PRS 租赁收入、单量、项目贡献、待处理单据和异常波动，用结构化表格输出。",
				routeLevel: "L2",
			},
			{
				id: "project-ar-compare",
				label: "各项目上月和本月应收对比",
				prompt: "对比各项目上月和本月应收、已收、未收金额，按差异金额排序，并标注需要业务确认的项目。",
				routeLevel: "L1",
			},
		],
	},
	{
		id: "flowerbiz-flow",
		group: "业务闭环",
		icon: "报",
		title: "报花业务",
		subtitle: "覆盖报花单据、明细、加摆、撤摆、换花、调花和审批链路。",
		decisionHint: "看执行看板走 L2；查单据明细和处理链路走 L0/L1。",
		fixedReports: [
			"PRS-FLOWERBIZ-LEASE-EXECUTION",
			"PRS-FLOWERBIZ-DRILL-LEASE-DETAIL",
			"PRS-FLOWERBIZ-DRILL-AUDIT-TRAIL",
		],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_lease_summary",
			"public.xycyl_ads_flowerbiz_lease_detail",
			"public.xycyl_ads_flowerbiz_audit_trail",
		],
		businessObjects: ["prs.flowerbiz.biz_order"],
		questions: [
			{
				id: "flowerbiz-status",
				label: "查 4 月份报花管理状态",
				prompt: "统计 4 月份报花管理的单据状态、业务类型、未完成单据和平均处理时效，用表格输出。",
				routeLevel: "L0",
			},
			{
				id: "flowerbiz-execution",
				label: "报花执行看板",
				prompt: "从 2025-05-01 到现在，按月跟踪报花执行、加摆、撤摆、换花、调花和租金变化。",
				routeLevel: "L2",
			},
		],
	},
	{
		id: "procurement-supply",
		group: "业务闭环",
		icon: "采",
		title: "采购与配送",
		subtitle: "围绕采购计划、采购明细、配送记录、入库和到货及时性。",
		decisionHint: "采购单据多来自业务对象；高频汇总后续可沉淀候选 ADS。",
		fixedReports: [
			"PROC-SUPPLIER-AMOUNT-RANK",
			"PROC-ARRIVAL-ONTIME-RATE",
			"PROC-INTRANSIT-BOARD",
		],
		dbtModels: ["候选 ADS: procurement_delivery_monthly", "候选 ADS: procurement_supplier_monthly"],
		businessObjects: ["prs.procurement.delivery_record"],
		questions: [
			{
				id: "procurement-product-detail",
				label: "绿萝采购明细",
				prompt: "查询 2025 年 2 月绿萝产品的采购明细，按采购人、供应商、采购金额统计，并列出异常状态。",
				routeLevel: "L0",
			},
			{
				id: "procurement-intransit",
				label: "当前在途采购",
				prompt: "统计当前在途采购配送记录，按配送类型、配送人、接收人和超时时长输出。",
				routeLevel: "L0",
			},
		],
	},
	{
		id: "flowerbiz-change-recovery",
		group: "业务闭环",
		icon: "变",
		title: "变更与回收",
		subtitle: "覆盖租期调整、换花变更、撤摆回收、入库去向和回收成本。",
		decisionHint: "趋势监控走 L2；单据钻取走明细报表；去向和成本用回收 ADS。",
		fixedReports: [
			"PRS-FLOWERBIZ-CHANGE-BOARD",
			"PRS-FLOWERBIZ-DRILL-CHANGE-DETAIL",
			"PRS-FLOWERBIZ-RECOVERY-BOARD",
			"PRS-FLOWERBIZ-DRILL-RECOVERY-DETAIL",
		],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_change_log",
			"public.xycyl_ads_flowerbiz_recovery_detail",
			"public.xycyl_dwd_flowerbiz_change",
			"public.xycyl_dwd_flowerbiz_recovery",
		],
		businessObjects: ["prs.flowerbiz.change_order", "prs.flowerbiz.biz_order"],
		questions: [
			{
				id: "flowerbiz-change-lag",
				label: "变更确认耗时",
				prompt: "从 2025-05-01 到现在，统计变更单确认耗时、金额差额和租期变化，按项目和变更类型输出。",
				routeLevel: "L2",
			},
			{
				id: "flowerbiz-recovery-cost",
				label: "回收成本与去向",
				prompt: "从 2025-05-01 到现在，统计撤摆回收数量、回收成本、入库库房和未完成回收单据，用结构化表格输出。",
				routeLevel: "L2",
			},
		],
	},
	{
		id: "project-contract",
		group: "业务闭环",
		icon: "项",
		title: "项目点与履约",
		subtitle: "项目点、客户、合同、结算方式、在摆数量和经营贡献。",
		decisionHint: "经营排行走项目 ADS；项目基础信息补充走业务对象。",
		fixedReports: ["PRS-FLOWERBIZ-PROJECT-CUSTOMER"],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_project_customer",
			"public.xycyl_dws_flowerbiz_project_monthly",
			"public.xycyl_stg_project",
		],
		businessObjects: ["prs.project.project_site"],
		questions: [
			{
				id: "project-top",
				label: "项目经营 TOP",
				prompt: "从 2025-05-01 到现在，按项目统计收入、成本、回收、欠款和单量，输出项目经营 TOP20。",
				routeLevel: "L1",
			},
			{
				id: "project-fixed-rent",
				label: "哪些项目是固定月租",
				prompt: "统计项目点的结算方式，找出固定月租项目，并补充项目经理、客户和当前状态。",
				routeLevel: "L0",
			},
		],
	},
	{
		id: "warehouse-inventory",
		group: "支撑域",
		icon: "仓",
		title: "仓库与库存",
		subtitle: "库存现量、出入库、调拨、报损、退货和低库存风险。",
		decisionHint: "库存实时性更强，优先走业务对象和现量表，再判断是否沉淀 ADS。",
		fixedReports: [],
		dbtModels: ["候选 ADS: warehouse_stock_snapshot", "候选 ADS: warehouse_movement_daily"],
		businessObjects: ["prs.warehouse.stock_info", "prs.warehouse.inout_record"],
		questions: [
			{
				id: "warehouse-stock-now",
				label: "库存现量",
				prompt: "查看当前库存现量，按仓库、物品、库存状态统计，并列出低库存和异常库存。",
				routeLevel: "L0",
			},
			{
				id: "warehouse-movement",
				label: "本月出入库变化",
				prompt: "统计本月入库、出库、调拨、报损和退货情况，按仓库和物品排行。",
				routeLevel: "L0",
			},
		],
	},
	{
		id: "finance-settlement",
		group: "支撑域",
		icon: "财",
		title: "财务结算",
		subtitle: "应收、回款、坏账、费用、银行流水、报销、预支和开票。",
		decisionHint: "PRS 经营财务走 dbt ADS；银行流水和报销明细走业务对象。",
		fixedReports: [
			"PRS-FLOWERBIZ-FINANCE-COST",
			"FIN-AR-OVERVIEW",
			"FIN-PENDING-RECEIPTS-DETAIL",
		],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_finance_cost",
			"public.xycyl_ads_flowerbiz_sale_summary",
			"public.xycyl_ads_flowerbiz_baddebt_summary",
			"public.xycyl_ads_flowerbiz_extra_cost_summary",
			"public.xycyl_ads_flowerbiz_recovery_detail",
		],
		businessObjects: ["prs.finance.bank_statement"],
		questions: [
			{
				id: "finance-month-compare",
				label: "应收回款月度对比",
				prompt: "对比本月和上月各项目应收、已收、未收、坏账和费用，按未收金额排序。",
				routeLevel: "L1",
			},
			{
				id: "finance-bank-unmatched",
				label: "银行流水未核对",
				prompt: "统计银行流水未核对记录，按对方户名、收支方向、金额和未生成凭证情况输出。",
				routeLevel: "L0",
			},
		],
	},
	{
		id: "task-service",
		group: "支撑域",
		icon: "任",
		title: "任务执行与养护",
		subtitle: "待办任务、审批状态、养护人员工作量和现场执行负载。",
		decisionHint: "任务状态先走业务对象；养护工作量走已沉淀 ADS。",
		fixedReports: ["PRS-FLOWERBIZ-PENDING-APPROVAL", "PRS-FLOWERBIZ-CURING-WORKLOAD"],
		dbtModels: [
			"public.xycyl_ads_flowerbiz_pending",
			"public.xycyl_ads_flowerbiz_curing_workload",
			"public.xycyl_dws_flowerbiz_curing_user_monthly",
		],
		businessObjects: ["prs.task.todo", "prs.flowerbiz.biz_order"],
		questions: [
			{
				id: "task-pending-today",
				label: "今天待处理任务",
				prompt: "统计今天待处理任务数量，按业务类型、处理人、超时时长和项目点输出。",
				routeLevel: "L0",
			},
			{
				id: "curing-workload",
				label: "养护人员工作量",
				prompt: "从 2025-05-01 到现在，按养护人员统计经手单量、植物数量、收入贡献和执行负载。",
				routeLevel: "L2",
			},
		],
	},
];

export const AGENT_REPORT_SUPPORTING_ASSETS: AgentReportSupportingAsset[] = [
	{
		id: "fixed-reports",
		title: "AI 报表入口",
		description: "固定报表、dbt 主题表和业务对象问答统一从这里进入。",
		to: "/agent-bi",
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
