import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	createCopilotStreamWatchdog,
	resolveCopilotSendAction,
} from '../src/components/copilot/copilotStreamControl.ts'

const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const WEBAPP_ROOT = resolve(TEST_DIR, '..')

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
			input: '',
		}),
		{
			mode: 'stop',
			label: '停止',
			disabled: false,
		},
	)
})

test('send action switches to interrupt-and-send while streaming is in flight and next input is ready', () => {
	assert.deepEqual(
		resolveCopilotSendAction({
			copilotEnabled: true,
			requestInFlight: true,
			input: 'next question',
		}),
		{
			mode: 'interrupt-and-send',
			label: '发送',
			disabled: false,
		},
	)
})

test('copilot chat queues the next question when the current stream is still running', () => {
	const chatSource = readFileSync(
		resolve(WEBAPP_ROOT, 'src/components/copilot/CopilotChat.tsx'),
		'utf8',
	)

	assert.match(chatSource, /const \[queuedInput, setQueuedInput\] = useState<string \| null>\(null\);/)
	assert.match(chatSource, /if \(sending\) \{/)
	assert.match(chatSource, /setQueuedInput\(trimmed\);/)
	assert.match(chatSource, /if \(sending \|\| !queuedInput\) return;/)
	assert.match(chatSource, /void handleSendText\(queuedInput\);/)
})
