import test from 'node:test'
import assert from 'node:assert/strict'
import {
	createCopilotStreamWatchdog,
	resolveCopilotSendAction,
} from '../src/components/copilot/copilotStreamControl.ts'

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

test('watchdog invokes onIdle when the stream goes silent', async () => {
	let idleCount = 0
	const watchdog = createCopilotStreamWatchdog({
		idleMs: 20,
		onIdle: () => {
			idleCount += 1
		},
	})

	watchdog.start()
	await sleep(35)
	watchdog.stop()

	assert.equal(idleCount, 1)
})

test('watchdog resets its timer when stream activity arrives', async () => {
	let idleCount = 0
	const watchdog = createCopilotStreamWatchdog({
		idleMs: 20,
		onIdle: () => {
			idleCount += 1
		},
	})

	watchdog.start()
	await sleep(10)
	watchdog.markActivity()
	await sleep(15)
	assert.equal(idleCount, 0)
	await sleep(15)
	watchdog.stop()

	assert.equal(idleCount, 1)
})

test('send action switches to stop while streaming is in flight', () => {
	assert.deepEqual(
		resolveCopilotSendAction({
			copilotEnabled: true,
			requestInFlight: true,
			input: 'next question',
		}),
		{
			mode: 'stop',
			label: '停止',
			disabled: false,
		},
	)
})
