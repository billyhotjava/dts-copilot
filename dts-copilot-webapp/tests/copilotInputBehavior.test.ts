import test from 'node:test'
import assert from 'node:assert/strict'

type SubmitFn = (args: {
	key: string
	shiftKey?: boolean
	isComposing?: boolean
	keyCode?: number
}) => boolean

async function loadShouldSubmitCopilotInputOnEnter(): Promise<SubmitFn> {
	try {
		const mod = await import('../src/components/copilot/copilotInputBehavior.ts')
		return mod.shouldSubmitCopilotInputOnEnter
	} catch {
		return ({ key, shiftKey = false }) => key === 'Enter' && !shiftKey
	}
}

test('does not submit while IME composition is active', async () => {
	const shouldSubmitCopilotInputOnEnter =
		await loadShouldSubmitCopilotInputOnEnter()

	assert.equal(
		shouldSubmitCopilotInputOnEnter({
			key: 'Enter',
			isComposing: true,
		}),
		false,
	)
})

test('does not submit on legacy IME keyCode 229', async () => {
	const shouldSubmitCopilotInputOnEnter =
		await loadShouldSubmitCopilotInputOnEnter()

	assert.equal(
		shouldSubmitCopilotInputOnEnter({
			key: 'Enter',
			keyCode: 229,
		}),
		false,
	)
})

test('submits on plain enter when not composing', async () => {
	const shouldSubmitCopilotInputOnEnter =
		await loadShouldSubmitCopilotInputOnEnter()

	assert.equal(
		shouldSubmitCopilotInputOnEnter({
			key: 'Enter',
			isComposing: false,
		}),
		true,
	)
})
