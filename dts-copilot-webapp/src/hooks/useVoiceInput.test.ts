import { act, createElement } from "react";
import { render, screen } from "@testing-library/react";
import { useVoiceInput } from "./useVoiceInput";

describe("useVoiceInput", () => {
	const defaultOptions = {
		onResult: vi.fn(),
		onError: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	type VoiceInputValue = ReturnType<typeof useVoiceInput>;
	let currentVoiceInput: VoiceInputValue | null = null;

	function VoiceInputProbe() {
		currentVoiceInput = useVoiceInput(defaultOptions);
		return createElement("span", { "data-testid": "voice-input-state" }, currentVoiceInput.state);
	}

	async function renderVoiceInput() {
		currentVoiceInput = null;
		render(createElement(VoiceInputProbe));
		await screen.findByTestId("voice-input-state");
		if (!currentVoiceInput) {
			throw new Error("useVoiceInput probe did not render");
		}
		return () => currentVoiceInput as VoiceInputValue;
	}

	it("jsdom 环境下 isSupported 返回 false", async () => {
		const voiceInput = await renderVoiceInput();
		expect(voiceInput().isSupported).toBe(false);
	});

	it("初始状态为 idle", async () => {
		const voiceInput = await renderVoiceInput();
		expect(voiceInput().state).toBe("idle");
	});

	it("初始 errorMessage 为 null", async () => {
		const voiceInput = await renderVoiceInput();
		expect(voiceInput().errorMessage).toBeNull();
	});

	it("不支持时调用 start() 不会改变状态", async () => {
		const voiceInput = await renderVoiceInput();
		act(() => {
			voiceInput().start();
		});
		expect(voiceInput().state).toBe("idle");
	});

	it("不在监听时调用 stop() 不会抛错", async () => {
		const voiceInput = await renderVoiceInput();
		expect(() => {
			act(() => {
				voiceInput().stop();
			});
		}).not.toThrow();
	});

	it("返回值包含所有必要字段", async () => {
		const voiceInput = await renderVoiceInput();
		expect(voiceInput()).toHaveProperty("start");
		expect(voiceInput()).toHaveProperty("stop");
		expect(voiceInput()).toHaveProperty("state");
		expect(voiceInput()).toHaveProperty("isSupported");
		expect(voiceInput()).toHaveProperty("errorMessage");
	});
});
