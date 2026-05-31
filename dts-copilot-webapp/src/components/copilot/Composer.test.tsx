import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { Composer } from "./Composer";
import type { CopilotSendAction } from "./copilotStreamControl";

vi.mock("./VoiceInputButton", () => ({
	VoiceInputButton: ({
		disabled,
		onTranscript,
	}: {
		disabled?: boolean;
		onTranscript: (text: string, isFinal: boolean) => void;
	}) => (
		<button
			type="button"
			aria-label="语音输入"
			disabled={disabled}
			onClick={() => onTranscript("报花趋势", true)}
		>
			语音输入
		</button>
	),
}));

const sendAction: CopilotSendAction = {
	disabled: false,
	label: "→",
	mode: "send",
};

function ComposerHarness({
	canEditComposer = true,
	initialInput = "",
	onStop = vi.fn(),
	onSubmit = vi.fn(),
	action = sendAction,
}: {
	action?: CopilotSendAction;
	canEditComposer?: boolean;
	initialInput?: string;
	onStop?: () => void;
	onSubmit?: (value: string) => void;
}) {
	const [input, setInput] = useState(initialInput);

	return (
		<Composer
			canEditComposer={canEditComposer}
			copilotEnabled={true}
			input={input}
			inputRef={{ current: null }}
			sendAction={action}
			sending={action.mode !== "send"}
			onInputChange={setInput}
			onNewChat={vi.fn()}
			onStop={onStop}
			onSubmit={() => onSubmit(input)}
			onVoiceTranscript={(text, isFinal) => {
				if (isFinal) {
					setInput((prev) => (prev ? `${prev} ${text}` : text));
				}
			}}
		/>
	);
}

describe("Composer", () => {
	it("submits with Enter and keeps Shift+Enter for multiline input", async () => {
		const onSubmit = vi.fn();
		render(<ComposerHarness onSubmit={onSubmit} />);
		const input = await screen.findByPlaceholderText("输入问题...");

		fireEvent.change(input, { target: { value: "本月利润" } });
		await waitFor(() => {
			expect(input).toHaveValue("本月利润");
		});
		fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
		expect(onSubmit).toHaveBeenCalledWith("本月利润");

		fireEvent.change(input, { target: { value: "继续说明" } });
		await waitFor(() => {
			expect(input).toHaveValue("继续说明");
		});
		fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("does not submit while the input method editor is composing", async () => {
		const onSubmit = vi.fn();
		render(<ComposerHarness onSubmit={onSubmit} />);
		const input = await screen.findByPlaceholderText("输入问题...");

		fireEvent.change(input, { target: { value: "报花" } });
		await waitFor(() => {
			expect(input).toHaveValue("报花");
		});
		fireEvent.keyDown(input, {
			isComposing: true,
			key: "Enter",
		});
		fireEvent.keyDown(input, {
			key: "Enter",
			keyCode: 229,
		});

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("appends final voice transcript and submits the composed text", async () => {
		const onSubmit = vi.fn();
		render(<ComposerHarness initialInput="已有问题" onSubmit={onSubmit} />);

		fireEvent.click(await screen.findByRole("button", { name: "语音输入" }));
		await waitFor(() => {
			expect(screen.getByPlaceholderText("输入问题...")).toHaveValue(
				"已有问题 报花趋势",
			);
		});
		fireEvent.click(screen.getByRole("button", { name: "→" }));

		expect(onSubmit).toHaveBeenCalledWith("已有问题 报花趋势");
	});

	it("uses the stop action while streaming", async () => {
		const onStop = vi.fn();
		const onSubmit = vi.fn();
		render(
			<ComposerHarness
				action={{ disabled: false, label: "停止", mode: "stop" }}
				onStop={onStop}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.click(await screen.findByRole("button", { name: "停止" }));

		expect(onStop).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("disables text and voice input when editing is not allowed", async () => {
		render(<ComposerHarness canEditComposer={false} />);

		expect(await screen.findByPlaceholderText("输入问题...")).toBeDisabled();
		expect(await screen.findByRole("button", { name: "语音输入" })).toBeDisabled();
	});
});
