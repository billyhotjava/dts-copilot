import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createCopilotStreamWatchdog,
	resolveCopilotSendAction,
} from "./copilotStreamControl";

describe("resolveCopilotSendAction", () => {
	it("disables send when Copilot is unavailable", () => {
		expect(
			resolveCopilotSendAction({
				copilotEnabled: false,
				requestInFlight: false,
				input: "项目收入",
			}),
		).toEqual({
			mode: "send",
			label: "→",
			disabled: true,
		});
	});

	it("disables send when idle input is empty", () => {
		expect(
			resolveCopilotSendAction({
				copilotEnabled: true,
				requestInFlight: false,
				input: "  ",
			}),
		).toEqual({
			mode: "send",
			label: "→",
			disabled: true,
		});
	});

	it("switches to stop while streaming with no queued input", () => {
		expect(
			resolveCopilotSendAction({
				copilotEnabled: true,
				requestInFlight: true,
				input: "",
			}),
		).toEqual({
			mode: "stop",
			label: "停止",
			disabled: false,
		});
	});

	it("switches to interrupt-and-send while streaming and next input is ready", () => {
		expect(
			resolveCopilotSendAction({
				copilotEnabled: true,
				requestInFlight: true,
				input: "换一个口径重算",
			}),
		).toEqual({
			mode: "interrupt-and-send",
			label: "发送",
			disabled: false,
		});
	});
});

describe("createCopilotStreamWatchdog", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("fires onIdle only after the configured idle window", () => {
		vi.useFakeTimers();
		const onIdle = vi.fn();
		const watchdog = createCopilotStreamWatchdog({
			idleMs: 30000,
			onIdle,
		});

		watchdog.start();
		vi.advanceTimersByTime(29999);
		expect(onIdle).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);

		expect(onIdle).toHaveBeenCalledTimes(1);
	});

	it("extends the idle window on activity and cancels it on stop", () => {
		vi.useFakeTimers();
		const onIdle = vi.fn();
		const watchdog = createCopilotStreamWatchdog({
			idleMs: 30000,
			onIdle,
		});

		watchdog.start();
		vi.advanceTimersByTime(20000);
		watchdog.markActivity();
		vi.advanceTimersByTime(20000);
		expect(onIdle).not.toHaveBeenCalled();
		watchdog.stop();
		vi.advanceTimersByTime(30000);

		expect(onIdle).not.toHaveBeenCalled();
	});
});
