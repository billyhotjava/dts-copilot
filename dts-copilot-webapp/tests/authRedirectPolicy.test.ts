import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldRedirectToLoginOnUnauthorized } from '../src/api/authRedirectPolicy.js'

test('suppresses login redirect for AI API unauthorized responses', () => {
	assert.equal(shouldRedirectToLoginOnUnauthorized('/api/ai/agent/sessions?limit=50'), false)
	assert.equal(shouldRedirectToLoginOnUnauthorized('http://localhost:3003/api/ai/agent/chat'), false)
})

test('keeps login redirect for analytics API unauthorized responses', () => {
	assert.equal(shouldRedirectToLoginOnUnauthorized('/api/dashboard'), true)
	assert.equal(shouldRedirectToLoginOnUnauthorized('/api/analytics/dashboard'), true)
})
