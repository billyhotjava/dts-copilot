export interface CopilotSendActionInput {
	copilotEnabled: boolean;
	requestInFlight: boolean;
	input: string;
}

export interface CopilotSendAction {
	mode: 'send' | 'stop';
	label: string;
	disabled: boolean;
}

export function resolveCopilotSendAction(input: CopilotSendActionInput): CopilotSendAction {
	if (input.requestInFlight) {
		return {
			mode: 'stop',
			label: '停止',
			disabled: false,
		}
	}
	if (!input.copilotEnabled) {
		return {
			mode: 'send',
			label: '→',
			disabled: true,
		}
	}
	return {
		mode: 'send',
		label: '→',
		disabled: input.input.trim().length === 0,
	}
}

export interface CopilotStreamWatchdog {
	start(): void;
	markActivity(): void;
	stop(): void;
}

export function createCopilotStreamWatchdog(input: {
	idleMs: number;
	onIdle: () => void;
}): CopilotStreamWatchdog {
	let timer: ReturnType<typeof setTimeout> | null = null

	const schedule = () => {
		if (timer != null) {
			clearTimeout(timer)
		}
		timer = setTimeout(() => {
			timer = null
			input.onIdle()
		}, input.idleMs)
	}

	return {
		start() {
			schedule()
		},
		markActivity() {
			schedule()
		},
		stop() {
			if (timer != null) {
				clearTimeout(timer)
				timer = null
			}
		},
	}
}
