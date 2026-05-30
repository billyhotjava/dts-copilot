import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import { CopilotChat } from "../components/copilot/CopilotChat";
import type { CopilotPromptRequest } from "../components/copilot/copilotPromptRequest";
import { Button } from "../ui/Button/Button";
import { getEffectiveLocale, t } from "../i18n";
import { AGENT_REPORT_BUSINESS_GUIDE } from "./agent-reports/agentReportQuickStarts";
import "./AgentReportsPage.css";

const ArrowIcon = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		role="img"
		aria-label="open"
	>
		<path d="M5 12h14" />
		<path d="m12 5 7 7-7 7" />
	</svg>
);

type PromptRequestWithNonce = CopilotPromptRequest & { nonce: number };

export default function AgentReportsPage() {
	const locale = getEffectiveLocale();
	const [searchParams] = useSearchParams();
	const fixedReportCode = searchParams.get("fixedReport")?.trim() ?? "";
	const [promptRequest, setPromptRequest] =
		useState<PromptRequestWithNonce | null>(null);
	const guideGroups = useMemo(() => {
		return ["经营总览", "业务闭环", "支撑域"].map((group) => ({
			group,
			items: AGENT_REPORT_BUSINESS_GUIDE.filter((item) => item.group === group),
		})).filter((group) => group.items.length > 0);
	}, []);

	useEffect(() => {
		if (!fixedReportCode) return;
		setPromptRequest({
			prompt: `打开固定报表 ${fixedReportCode}，优先执行已认证口径并用表格展示结果；如果该固定报表不可直接执行，请说明可用的 dbt 主题表和业务对象替代路径。`,
			notice: "已从旧固定报表链接切回 AI 报表统一入口。",
			submit: true,
			source: "fixed-report-redirect",
			reportIntentId: fixedReportCode,
			nonce: Date.now(),
		});
	}, [fixedReportCode]);

	function handleGuideQuestion(
		question: (typeof AGENT_REPORT_BUSINESS_GUIDE)[number]["questions"][number],
	) {
		setPromptRequest({
			prompt: question.prompt,
			notice: "已按业务对象向导提交给 AI 报表助手。",
			submit: true,
			source: "agent-bi-guide",
			reportIntentId: question.id,
			nonce: Date.now(),
		});
	}

	return (
		<PageContainer maxWidth="xl">
			<PageHeader
				title={t(locale, "agentReports.title")}
				subtitle={t(locale, "agentReports.subtitle")}
				actions={
					<Link to="/dashboards">
						<Button variant="secondary" size="sm" icon={<ArrowIcon />}>
							{t(locale, "agentReports.openDashboards")}
						</Button>
					</Link>
				}
			/>

			<section className="agent-reports-workbench" aria-labelledby="agent-report-entry">
				<div className="agent-reports-section-head">
					<h2 id="agent-report-entry">{t(locale, "agentReports.guide")}</h2>
					<p>{t(locale, "agentReports.quickStartsDesc")}</p>
				</div>

				<div className="agent-reports-guide" aria-label={t(locale, "agentReports.scope")}>
					{guideGroups.map((group) => (
						<section key={group.group} className="agent-reports-guide__group">
							<div className="agent-reports-guide__group-title">{group.group}</div>
							<div className="agent-reports-guide__domain-grid">
								{group.items.map((domain) => (
									<article key={domain.id} className="agent-reports-guide__domain">
										<div className="agent-reports-guide__domain-head">
											<span className="agent-reports-guide__domain-icon">
												{domain.icon}
											</span>
											<div>
												<h3>{domain.title}</h3>
												<p>{domain.subtitle}</p>
											</div>
										</div>
										<div className="agent-reports-guide__decision">
											{domain.decisionHint}
										</div>
										<div className="agent-reports-guide__paths">
											<div>
												<strong>L2 固定报表</strong>
												<span>{domain.fixedReports.join(" / ")}</span>
											</div>
											<div>
												<strong>L1 dbt</strong>
												<span>{domain.dbtModels.join(" / ")}</span>
											</div>
											<div>
												<strong>L0 业务对象</strong>
												<span>{domain.businessObjects.join(" / ")}</span>
											</div>
										</div>
										<div className="agent-reports-guide__questions">
											{domain.questions.map((question) => (
												<button
													key={question.id}
													type="button"
													className="agent-reports-guide__question"
													onClick={() => handleGuideQuestion(question)}
												>
													<span>{question.label}</span>
													<small>{question.routeLevel}</small>
												</button>
											))}
										</div>
									</article>
								))}
							</div>
						</section>
					))}
				</div>
			</section>

			<section className="agent-reports-chat-workbench" aria-labelledby="agent-report-chat">
				<div className="agent-reports-chat-workbench__head">
					<div>
						<h2 id="agent-report-chat">{t(locale, "agentReports.chatTitle")}</h2>
						<p>{t(locale, "agentReports.chatDesc")}</p>
					</div>
					<span>{t(locale, "agentReports.scopeDesc")}</span>
				</div>
				<div className="agent-reports-chat-workbench__body">
					<CopilotChat
						presentation="workbench"
						compactReasoning
						promptRequest={promptRequest}
					/>
				</div>
			</section>
		</PageContainer>
	);
}
