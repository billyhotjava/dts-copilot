import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ColdStartHome from "./ColdStartHome";

const COLD_START_CSS = readFileSync(resolve(__dirname, "cold-start.css"), "utf8");

const listSuggestedQuestions = vi.fn();
const listDashboards = vi.fn();
const listCards = vi.fn();
const listAiAgentSessions = vi.fn();

vi.mock("../../../api/analyticsApi", () => ({
	analyticsApi: {
		listSuggestedQuestions: (...args: unknown[]) => listSuggestedQuestions(...args),
		listDashboards: (...args: unknown[]) => listDashboards(...args),
		listCards: (...args: unknown[]) => listCards(...args),
		listAiAgentSessions: (...args: unknown[]) => listAiAgentSessions(...args),
	},
}));

vi.mock("../VoiceInputButton", () => ({
	VoiceInputButton: ({ onTranscript }: { onTranscript: (text: string, isFinal: boolean) => void }) => (
		<button type="button" aria-label="语音输入" onClick={() => onTranscript("报花趋势", true)}>
			语音输入
		</button>
	),
}));

describe("ColdStartHome", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		listSuggestedQuestions.mockResolvedValue([
			{ question: "本月各项目利润", domain: "project" },
			{ question: "报花趋势", domain: "flowerbiz" },
		]);
		listDashboards.mockResolvedValue([{ id: 1 }, { id: 2 }]);
		listCards.mockResolvedValue([{ id: 10 }]);
		listAiAgentSessions.mockResolvedValue([
			{ id: "session-1", title: "报花趋势复盘", lastActiveAt: "2026-05-30T10:00:00Z" },
		]);
	});

	it("renders the cold-start input, starter chips, and non-signal cards", async () => {
		render(<ColdStartHome onSubmit={vi.fn()} />);

		expect(await screen.findByRole("heading", { name: "今天想看哪件事？" })).toBeInTheDocument();
		expect(screen.getByPlaceholderText("问一句，或说一句…")).toBeInTheDocument();
		expect(await screen.findByRole("button", { name: "本月各项目利润" })).toBeInTheDocument();
		expect(screen.queryByText("主动信号")).not.toBeInTheDocument();
		expect(screen.getByText("继续上次会话")).toBeInTheDocument();
		expect(screen.getByText("我的资产")).toBeInTheDocument();
	});

	it("submits trimmed text with Enter or the send button and ignores blank text", async () => {
		const onSubmit = vi.fn();
		render(<ColdStartHome onSubmit={onSubmit} />);
		const input = await screen.findByPlaceholderText("问一句，或说一句…");

		fireEvent.change(input, { target: { value: "  本月利润  " } });
		fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
		expect(onSubmit).toHaveBeenCalledWith("本月利润");

		fireEvent.change(input, { target: { value: "   " } });
		fireEvent.click(screen.getByRole("button", { name: "发送" }));
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it("keeps Shift+Enter as a newline instead of submitting", async () => {
		const onSubmit = vi.fn();
		render(<ColdStartHome onSubmit={onSubmit} />);
		const input = await screen.findByPlaceholderText("问一句，或说一句…");

		fireEvent.change(input, {
			target: { value: "本月利润" },
		});
		fireEvent.keyDown(input, {
			key: "Enter",
			shiftKey: true,
		});

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("fills the composer from final voice transcript and sends it", async () => {
		const onSubmit = vi.fn();
		render(<ColdStartHome onSubmit={onSubmit} />);

		fireEvent.click(await screen.findByRole("button", { name: "语音输入" }));
		await waitFor(() => {
			expect(screen.getByPlaceholderText("问一句，或说一句…")).toHaveValue("报花趋势");
		});
		fireEvent.click(screen.getByRole("button", { name: "发送" }));

		expect(onSubmit).toHaveBeenCalledWith("报花趋势");
	});

	it("starts a question when a starter chip is clicked", async () => {
		const onSubmit = vi.fn();
		render(<ColdStartHome onSubmit={onSubmit} />);

		fireEvent.click(await screen.findByRole("button", { name: "报花趋势" }));

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith("报花趋势");
		});
	});

	it("opens the resumable session from the cold-start card", async () => {
		const onOpenSession = vi.fn();
		render(<ColdStartHome onSubmit={vi.fn()} onOpenSession={onOpenSession} />);

		fireEvent.click(await screen.findByRole("button", { name: /报花趋势复盘/ }));

		expect(onOpenSession).toHaveBeenCalledWith({
			sessionId: "session-1",
			notice: "已回到来源对话：报花趋势复盘",
		});
	});

	it("keeps the composer usable when suggestion and card APIs fail", async () => {
		listSuggestedQuestions.mockRejectedValueOnce(new Error("suggestion failed"));
		listDashboards.mockRejectedValueOnce(new Error("dashboard failed"));
		listCards.mockRejectedValueOnce(new Error("card failed"));
		listAiAgentSessions.mockRejectedValueOnce(new Error("session failed"));

		render(<ColdStartHome onSubmit={vi.fn()} />);

		expect(await screen.findByPlaceholderText("问一句，或说一句…")).toBeInTheDocument();
		expect(await screen.findByRole("button", { name: "PRS 租赁经营总览" })).toBeInTheDocument();
		expect(screen.queryByText("暂无新信号，先从一个问题开始。")).not.toBeInTheDocument();
	});

	it("prevents cold-start mobile sections from shrinking into overlap", () => {
		expect(COLD_START_CSS).toMatch(/\.cold-start-composer\s*\{[\s\S]*flex-shrink: 0;/);
		expect(COLD_START_CSS).toMatch(/\.cold-start-chips\s*\{[\s\S]*flex-shrink: 0;/);
		expect(COLD_START_CSS).toMatch(/\.cold-start-cards\s*\{[\s\S]*flex-shrink: 0;/);
		expect(COLD_START_CSS).toContain("justify-content: flex-start");
	});
});
