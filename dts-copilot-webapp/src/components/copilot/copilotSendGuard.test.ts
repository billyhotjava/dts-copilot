import { describe, expect, it } from "vitest";
import { resolveCopilotSendGuard } from "./copilotSendGuard";

describe("resolveCopilotSendGuard", () => {
	it("blocks send when Copilot is unavailable", () => {
		expect(
			resolveCopilotSendGuard({
				copilotEnabled: false,
				requestInFlight: false,
				streamInFlight: false,
				text: "收入趋势",
			}),
		).toEqual({
			action: "block",
			reason: "copilot-disabled",
		});
	});

	it("blocks empty input after trimming whitespace", () => {
		expect(
			resolveCopilotSendGuard({
				copilotEnabled: true,
				requestInFlight: false,
				streamInFlight: false,
				text: "  \n ",
			}),
		).toEqual({
			action: "block",
			reason: "empty-input",
		});
	});

	it("blocks duplicate sends while a request is marked in flight", () => {
		expect(
			resolveCopilotSendGuard({
				copilotEnabled: true,
				requestInFlight: true,
				streamInFlight: false,
				text: "再算一次",
			}),
		).toEqual({
			action: "block",
			reason: "request-in-flight",
		});
	});

	it("blocks duplicate sends while the stream lock is still held", () => {
		expect(
			resolveCopilotSendGuard({
				copilotEnabled: true,
				requestInFlight: false,
				streamInFlight: true,
				text: "再算一次",
			}),
		).toEqual({
			action: "block",
			reason: "stream-in-flight",
		});
	});

	it("returns the normalized text when sending is allowed", () => {
		expect(
			resolveCopilotSendGuard({
				copilotEnabled: true,
				requestInFlight: false,
				streamInFlight: false,
				text: "  项目收入趋势  ",
			}),
		).toEqual({
			action: "send",
			text: "项目收入趋势",
		});
	});
});
