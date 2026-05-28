import { buildCopilotPromptRequest } from "../../components/copilot/copilotPromptRequest";
import type {
	AgentReportBusinessObject,
	AgentReportQuickStart,
} from "./agentReportQuickStarts";

export type AgentReportHandoffMode = "run" | "edit";

export function buildAgentReportHandoffRequest(
	quickStart: AgentReportQuickStart,
	mode: AgentReportHandoffMode,
) {
	return buildCopilotPromptRequest(quickStart.prompt, {
		submit: mode === "run",
		source: "agent-bi",
		reportIntentId: quickStart.id,
		notice:
			mode === "run"
				? "已提交给 AI Copilot，正在按报表路由生成结果。"
				: "已把问题带入 AI Copilot，可直接发送或继续修改。",
	});
}

export function buildBusinessObjectHandoffRequest(
	businessObject: AgentReportBusinessObject,
	mode: AgentReportHandoffMode,
) {
	return buildCopilotPromptRequest(businessObject.prompt, {
		submit: mode === "run",
		source: "business-object",
		reportIntentId: businessObject.id,
		notice:
			mode === "run"
				? "已提交给 AI Copilot，正在按业务对象只读路径分析。"
				: "已把业务对象问题带入 AI Copilot，可继续补充条件。",
	});
}
