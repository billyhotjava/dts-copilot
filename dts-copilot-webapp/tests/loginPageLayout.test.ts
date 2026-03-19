import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loginPagePath = resolve(process.cwd(), 'src/pages/auth/LoginPage.tsx')
const authCssPath = resolve(process.cwd(), 'src/pages/auth/auth.css')
const source = readFileSync(loginPagePath, 'utf8')
const css = readFileSync(authCssPath, 'utf8')

test('login page uses the NL2SQL showcase layout', () => {
	assert.match(source, /DTS 智能数据分析助手/)
	assert.match(source, /AI-Native 智能数据分析平台/)
	assert.match(source, /dashboard-stage/)
	assert.match(source, /analysis-chain/)
	assert.match(source, /analysis-node--prompt/)
	assert.match(source, /analysis-node--guard/)
	assert.match(source, /analysis-node--sql/)
	assert.match(source, /analysis-node--result/)
	assert.match(source, /analysis-flow__beam/)
	assert.match(source, /自然语言提问/)
	assert.match(source, /Schema 感知与 SQL 安全校验/)
	assert.match(source, /生成 SQL/)
	assert.match(source, /结果表格 \/ 图表输出/)
	assert.match(source, /NL2SQL 智能生成/)
	assert.match(source, /多数据源分析/)
	assert.match(source, /AI 对话与可视化/)
	assert.match(source, /让问题沿分析链直接抵达结果/)
	assert.match(source, /login-side-panel/)
})

test('result panel stacks table and chart vertically', () => {
	assert.match(
		css,
		/\.analysis-result\s*\{[\s\S]*grid-template-columns:\s*1fr;[\s\S]*grid-template-rows:\s*auto auto;/,
	)
})
