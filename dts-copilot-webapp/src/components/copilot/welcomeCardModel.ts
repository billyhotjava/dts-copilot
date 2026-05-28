import type { CopilotSuggestedQuestion } from '../../api/analyticsApi'

export type WelcomeQuestionGroup = {
	role: string
	icon: string
	questions: string[]
}

const DOMAIN_META: Record<string, { role: string; icon: string }> = {
	project: { role: '项目履约', icon: '📋' },
	flowerbiz: { role: '花卉业务', icon: '🌸' },
	settlement: { role: '财务结算', icon: '💰' },
	finance: { role: '财务结算', icon: '💰' },
	task: { role: '任务执行', icon: '📝' },
	curing: { role: '现场养护', icon: '🌿' },
	pendulum: { role: '初摆实施', icon: '🚧' },
	green: { role: '绿植管理', icon: '🌱' },
	PRS租赁: { role: 'PRS租赁报表', icon: '🌸' },
	财务: { role: '财务', icon: '💰' },
	采购: { role: '采购', icon: '🧾' },
	仓库: { role: '仓库', icon: '📦' },
}

export const DEFAULT_WELCOME_GROUPS: WelcomeQuestionGroup[] = [
	{
		role: 'PRS租赁报表',
		icon: '🌸',
		questions: ['PRS 租赁经营总览', 'PRS 租赁报花执行看板', 'PRS 销售坏账与费用看板'],
	},
	{
		role: 'PRS钻取明细',
		icon: '📋',
		questions: ['PRS 报花单明细钻取', 'PRS 变更明细钻取', 'PRS 回收明细钻取'],
	},
	{
		role: 'Agent报表',
		icon: '📝',
		questions: ['从2025年5月到现在，租赁收入按月趋势怎么样', '帮我生成一张PRS租赁项目月度趋势报表', '坏账金额最高的客户和项目排行'],
	},
	{
		role: '项目履约',
		icon: '📋',
		questions: ['当前在服项目一共多少个？', '各项目在摆绿植数排行', '哪些合同90天内到期？'],
	},
]

export function buildWelcomeSuggestionGroups(suggestions: CopilotSuggestedQuestion[]): WelcomeQuestionGroup[] {
	if (!Array.isArray(suggestions) || suggestions.length === 0) {
		return DEFAULT_WELCOME_GROUPS
	}

	const grouped = new Map<string, WelcomeQuestionGroup>()
	for (const suggestion of suggestions) {
		const normalizedDomain = String(suggestion.domain ?? '').trim()
		const role = String(suggestion.roleHint ?? '').trim()
			|| DOMAIN_META[normalizedDomain]?.role
			|| '推荐问题'
		const icon = DOMAIN_META[normalizedDomain]?.icon ?? '🌱'
		const key = `${normalizedDomain}:${role}`
		const bucket = grouped.get(key) ?? { role, icon, questions: [] }
		if (typeof suggestion.question === 'string' && suggestion.question.trim().length > 0 && !bucket.questions.includes(suggestion.question)) {
			bucket.questions.push(suggestion.question)
		}
		grouped.set(key, bucket)
	}
	return Array.from(grouped.values())
}
