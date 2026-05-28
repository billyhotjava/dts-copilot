import test from 'node:test'
import assert from 'node:assert/strict'
import {
	DEFAULT_WELCOME_GROUPS,
	buildWelcomeSuggestionGroups,
} from '../src/components/copilot/welcomeCardModel.ts'

test('default welcome groups use PRS dbt report and agent-report phrases', () => {
	assert.deepEqual(
		DEFAULT_WELCOME_GROUPS.map((group) => ({
			role: group.role,
			questions: group.questions.slice(0, 2),
		})),
		[
			{ role: 'PRS租赁报表', questions: ['PRS 租赁经营总览', 'PRS 租赁报花执行看板'] },
			{ role: 'PRS钻取明细', questions: ['PRS 报花单明细钻取', 'PRS 变更明细钻取'] },
			{ role: 'Agent报表', questions: ['从2025年5月到现在，租赁收入按月趋势怎么样', '帮我生成一张PRS租赁项目月度趋势报表'] },
			{ role: '项目履约', questions: ['当前在服项目一共多少个？', '各项目在摆绿植数排行'] },
		],
	)
})

test('buildWelcomeSuggestionGroups maps PRS fixed-report domains to proper labels and icons', () => {
	const groups = buildWelcomeSuggestionGroups([
		{ domain: 'PRS租赁', roleHint: '', question: 'PRS 租赁经营总览' },
		{ domain: 'flowerbiz', roleHint: '', question: 'PRS 租赁报花执行看板' },
	])

	assert.deepEqual(groups, [
		{ role: 'PRS租赁报表', icon: '🌸', questions: ['PRS 租赁经营总览'] },
		{ role: '花卉业务', icon: '🌸', questions: ['PRS 租赁报花执行看板'] },
	])
})
