import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loginPagePath = resolve(process.cwd(), 'src/pages/auth/LoginPage.tsx')
const source = readFileSync(loginPagePath, 'utf8')

test('login page uses compact flower-rental business copy', () => {
	assert.match(source, /植物租赁运营平台/)
	assert.match(source, /让项目、养护与植物资产/)
	assert.match(source, /覆盖项目、巡检、换花与客户服务。/)
	assert.match(source, /使用账号进入植物租赁平台/)
	assert.match(source, /项目看板/)
	assert.match(source, /任务中心/)
	assert.match(source, /客户服务/)
})
