import { describe, expect, it } from "vitest";
import type {
	AiAgentChatMessage,
	AnalysisDraftListItem,
} from "../../api/analyticsApi";
import { attachAnalysisDraftLinksToMessages } from "./copilotAnalysisDraftLinks";

describe("copilotAnalysisDraftLinks", () => {
	it("reattaches saved analysis draft metadata to persisted report draft messages", () => {
		const messages = [
			{
				id: "msg-1",
				sessionId: "sess-1",
				role: "assistant",
				responseKind: "REPORT_DRAFT",
				generatedSql:
					"select month_id, amount\nfrom public.xycyl_dws_flowerbiz_project_monthly",
			},
		] as AiAgentChatMessage[];
		const drafts = [
			{
				id: 101,
				session_id: "sess-1",
				sql_text:
					"select month_id, amount from public.xycyl_dws_flowerbiz_project_monthly",
				suggested_display: "line",
				data_surface: "L1_DBT_MART",
				quality_level: "MEDIUM",
				quality_notes: "客户关联需核验",
				report_code: "prs.flowerbiz.lease_execution_monthly",
				updated_at: "2026-05-20T10:00:00Z",
			},
		] as AnalysisDraftListItem[];

		expect(attachAnalysisDraftLinksToMessages(messages, drafts)[0]).toMatchObject({
			analysisDraftId: 101,
			analysisDraftStatus: "saved",
			suggestedDisplay: "line",
			dataSurface: "L1_DBT_MART",
			qualityLevel: "MEDIUM",
			qualityNotes: "客户关联需核验",
			reportCode: "prs.flowerbiz.lease_execution_monthly",
		});
	});

	it("keeps unrelated assistant messages unchanged", () => {
		const message = {
			id: "msg-1",
			sessionId: "sess-1",
			role: "assistant",
			responseKind: "FIXED_REPORT",
		} as AiAgentChatMessage;

		expect(attachAnalysisDraftLinksToMessages([message], [])[0]).toBe(message);
	});
});
