import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const loginPagePath = resolve(process.cwd(), 'src/pages/auth/LoginPage.tsx')
const authCssPath = resolve(process.cwd(), 'src/pages/auth/auth.css')
const source = readFileSync(loginPagePath, 'utf8')
const css = readFileSync(authCssPath, 'utf8')

test('login page provides a password visibility toggle', () => {
	assert.match(source, /const \[showPassword, setShowPassword\] = useState\(false\)/)
	assert.match(source, /type=\{showPassword \? 'text' : 'password'\}/)
	assert.match(source, /className="login-field__password-wrap"/)
	assert.match(source, /className="login-field__toggle"/)
	assert.match(source, /aria-label=\{showPassword \? '隐藏密码' : '显示密码'\}/)
})

test('login page styles the password visibility toggle inside the input', () => {
	assert.match(
		css,
		/\.login-field__password-wrap\s*\{[\s\S]*position:\s*relative;/,
	)
	assert.match(
		css,
		/\.login-field__toggle\s*\{[\s\S]*position:\s*absolute;[\s\S]*right:\s*16px;/,
	)
})
