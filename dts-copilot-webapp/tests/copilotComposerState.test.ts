import test from 'node:test'
import assert from 'node:assert/strict'
import {
	canEditCopilotComposer,
	canSubmitCopilotComposer,
} from '../src/components/copilot/copilotComposerState.ts'

test('composer remains editable during an active streaming request', () => {
	assert.equal(
		canEditCopilotComposer({
			copilotEnabled: true,
			requestInFlight: true,
		}),
		true,
	)
})

test('composer submit stays blocked while a request is in flight', () => {
	assert.equal(
		canSubmitCopilotComposer({
			copilotEnabled: true,
			requestInFlight: true,
			input: 'next question',
		}),
		false,
	)
})

test('composer is disabled when copilot access is unavailable', () => {
	assert.equal(
		canEditCopilotComposer({
			copilotEnabled: false,
			requestInFlight: false,
		}),
		false,
	)
})
