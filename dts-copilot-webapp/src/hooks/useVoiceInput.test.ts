import { renderHook, act } from "@testing-library/react";
import { useVoiceInput } from "./useVoiceInput";

describe("useVoiceInput", () => {
	const defaultOptions = {
		onResult: vi.fn(),
		onError: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("jsdom 环境下 isSupported 返回 false", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		expect(result.current.isSupported).toBe(false);
	});

	it("初始状态为 idle", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		expect(result.current.state).toBe("idle");
	});

	it("初始 errorMessage 为 null", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		expect(result.current.errorMessage).toBeNull();
	});

	it("不支持时调用 start() 不会改变状态", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		act(() => {
			result.current.start();
		});
		expect(result.current.state).toBe("idle");
	});

	it("不在监听时调用 stop() 不会抛错", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		expect(() => {
			act(() => {
				result.current.stop();
			});
		}).not.toThrow();
	});

	it("返回值包含所有必要字段", () => {
		const { result } = renderHook(() => useVoiceInput(defaultOptions));
		expect(result.current).toHaveProperty("start");
		expect(result.current).toHaveProperty("stop");
		expect(result.current).toHaveProperty("state");
		expect(result.current).toHaveProperty("isSupported");
		expect(result.current).toHaveProperty("errorMessage");
	});
});
