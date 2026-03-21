import test from 'node:test'
import assert from 'node:assert/strict'
import {
	DEFAULT_WELCOME_GROUPS,
	buildWelcomeSuggestionGroups,
} from '../src/components/copilot/welcomeCardModel.ts'

test('default welcome groups use current-page-aligned fixed report phrases', () => {
	assert.deepEqual(
		DEFAULT_WELCOME_GROUPS.map((group) => ({
			role: group.role,
			questions: group.questions.slice(0, 2),
		})),
		[
			{ role: '财务', questions: ['财务结算汇总', '财务结算列表-待收款明细'] },
			{ role: '采购', questions: ['采购汇总', '采购计划明细-待处理'] },
			{ role: '仓库', questions: ['库存现量', '入库管理-待入库清单'] },
			{ role: '项目履约', questions: ['当前在服项目一共多少个？', '各项目在摆绿植数排行'] },
		],
	)
})

test('buildWelcomeSuggestionGroups maps fixed-report domains to proper labels and icons', () => {
	const groups = buildWelcomeSuggestionGroups([
		{ domain: '财务', roleHint: '', question: '财务结算汇总' },
		{ domain: '采购', roleHint: '', question: '采购汇总' },
		{ domain: '仓库', roleHint: '', question: '库存现量' },
	])

	assert.deepEqual(groups, [
		{ role: '财务', icon: '💰', questions: ['财务结算汇总'] },
		{ role: '采购', icon: '🧾', questions: ['采购汇总'] },
		{ role: '仓库', icon: '📦', questions: ['库存现量'] },
	])
})
