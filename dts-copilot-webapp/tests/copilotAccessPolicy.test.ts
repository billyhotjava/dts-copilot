import test from 'node:test'
import assert from 'node:assert/strict'
import {
	canUseCopilot,
	resolveInitialCopilotExpanded,
} from '../src/components/copilot/copilotAccessPolicy.js'

test('disables copilot when no bearer token is available', () => {
	assert.equal(canUseCopilot(''), false)
	assert.equal(canUseCopilot('   '), false)
	assert.equal(resolveInitialCopilotExpanded(true, ''), false)
})

test('preserves stored expansion when bearer token exists', () => {
	assert.equal(canUseCopilot('token-123'), true)
	assert.equal(resolveInitialCopilotExpanded(true, 'token-123'), true)
	assert.equal(resolveInitialCopilotExpanded(false, 'token-123'), false)
})
