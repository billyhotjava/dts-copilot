import { Link } from "react-router";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import {
	requestCopilotPrompt,
} from "../components/copilot/copilotPromptRequest";
import { Button } from "../ui/Button/Button";
import { Card, CardBody } from "../ui/Card/Card";
import { getEffectiveLocale, t } from "../i18n";
import {
	AGENT_REPORT_BUSINESS_OBJECTS,
	AGENT_REPORT_QUICK_STARTS,
	AGENT_REPORT_SUPPORTING_ASSETS,
} from "./agent-reports/agentReportQuickStarts";
import {
	buildAgentReportHandoffRequest,
	buildBusinessObjectHandoffRequest,
	type AgentReportHandoffMode,
} from "./agent-reports/agentReportPromptHandoff";
import "./AgentReportsPage.css";

const SparkIcon = () => (
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
		aria-label="AI"
	>
		<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
	</svg>
);

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

export default function AgentReportsPage() {
	const locale = getEffectiveLocale();

	const handlePrompt = (item: (typeof AGENT_REPORT_QUICK_STARTS)[number], mode: AgentReportHandoffMode) => {
		const request = buildAgentReportHandoffRequest(item, mode);
		if (!request) return;
		requestCopilotPrompt(request);
	};

	const handleBusinessObjectPrompt = (
		item: (typeof AGENT_REPORT_BUSINESS_OBJECTS)[number],
		mode: AgentReportHandoffMode,
	) => {
		const request = buildBusinessObjectHandoffRequest(item, mode);
		if (!request) return;
		requestCopilotPrompt(request);
	};

	return (
		<PageContainer maxWidth="xl">
			<PageHeader
				title={t(locale, "agentReports.title")}
				subtitle={t(locale, "agentReports.subtitle")}
				actions={
					<Link to="/fixed-reports">
						<Button variant="secondary" size="sm" icon={<ArrowIcon />}>
							{t(locale, "agentReports.openFixedReports")}
						</Button>
					</Link>
				}
			/>

			<section className="agent-reports-lanes" aria-label="Agent BI 工作流">
				<div>
					<strong>L2</strong>
					<span>固定报表</span>
					<small>认证口径优先</small>
				</div>
				<div>
					<strong>L1</strong>
					<span>dbt 主题表</span>
					<small>生成报表草稿</small>
				</div>
				<div>
					<strong>L0</strong>
					<span>业务对象</span>
					<small>字段画像与只读明细</small>
				</div>
				<div>
					<strong>ACT</strong>
					<span>动作提案</span>
					<small>不直接写业务系统</small>
				</div>
			</section>

			<section className="agent-reports-entry" aria-labelledby="agent-report-entry">
				<div className="agent-reports-section-head">
					<h2 id="agent-report-entry">{t(locale, "agentReports.reportProducer")}</h2>
					<p>{t(locale, "agentReports.quickStartsDesc")}</p>
				</div>
				<div className="agent-reports-entry__body">
					<div className="agent-reports-entry__strategy" aria-label={t(locale, "agentReports.scope")}>
						<strong>{t(locale, "agentReports.scope")}</strong>
						<span>{t(locale, "agentReports.scopeDesc")}</span>
					</div>
					<nav className="agent-reports-asset-strip" aria-labelledby="agent-report-assets">
						<div className="agent-reports-asset-strip__intro">
							<strong id="agent-report-assets">{t(locale, "agentReports.assets")}</strong>
							<span>{t(locale, "agentReports.assetsDesc")}</span>
						</div>
						<div className="agent-reports-asset-list">
							{AGENT_REPORT_SUPPORTING_ASSETS.map((asset) => (
								<Link
									key={asset.id}
									to={asset.to}
									className="agent-reports-asset-link"
								>
									<span>
										<strong>{asset.title}</strong>
										<small>{asset.description}</small>
									</span>
									<ArrowIcon />
								</Link>
							))}
						</div>
					</nav>
				</div>
			</section>

			<div className="agent-reports-entry-stack">
				<section className="agent-reports-main" aria-labelledby="agent-report-prompts">
					<div className="agent-reports-section-head">
						<h2 id="agent-report-prompts">{t(locale, "agentReports.quickStarts")}</h2>
						<p>{t(locale, "agentReports.reportTemplatesDesc")}</p>
					</div>
					<div className="agent-reports-prompt-grid">
						{AGENT_REPORT_QUICK_STARTS.map((item) => (
							<Card key={item.id} variant="hoverable" className="agent-report-card">
								<CardBody>
									<div className="agent-report-card__domain">{item.domain}</div>
									<h3>{item.title}</h3>
									<p>{item.description}</p>
									<div className="agent-report-card__route" aria-label="Agent 路由">
										<span>{item.routeLevel}</span>
										<span>{item.responseKind}</span>
										<span>{item.qualityLevel}</span>
									</div>
									<div className="agent-report-card__route-hint">{item.routeHint}</div>
									<div className="agent-report-card__prompt">{item.prompt}</div>
									<div className="agent-report-card__actions">
										<Button
											variant="primary"
											size="sm"
											icon={<SparkIcon />}
											onClick={() => handlePrompt(item, "run")}
										>
											{t(locale, "agentReports.runWithAgent")}
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onClick={() => handlePrompt(item, "edit")}
										>
											{t(locale, "agentReports.fillCopilot")}
										</Button>
									</div>
								</CardBody>
							</Card>
						))}
					</div>
				</section>

				<section className="agent-reports-object-section" aria-labelledby="agent-report-business-objects">
					<div className="agent-reports-section-head">
						<h2 id="agent-report-business-objects">{t(locale, "agentReports.businessObjects")}</h2>
						<p>{t(locale, "agentReports.businessObjectsDesc")}</p>
					</div>
					<div className="agent-reports-object-table-wrap">
						<table className="agent-reports-object-table">
							<thead>
								<tr>
									<th>业务对象</th>
									<th>页面路径</th>
									<th>关键字段</th>
									<th>数据面</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								{AGENT_REPORT_BUSINESS_OBJECTS.map((item) => (
									<tr key={item.id}>
										<td>
											<div className="agent-reports-object-name">
												<span>{item.domain}</span>
												<strong>{item.title}</strong>
												<small>{item.objectCode}</small>
											</div>
										</td>
										<td>{item.pagePath}</td>
										<td>
											<div className="agent-reports-field-tags">
												{item.keyFields.slice(0, 4).map((field) => (
													<span key={field}>{field}</span>
												))}
											</div>
										</td>
										<td>
											<div className="agent-reports-surface">
												<strong>{item.dataSurface}</strong>
												<span>{item.qualityLevel}</span>
											</div>
										</td>
										<td>
											<div className="agent-reports-object-actions">
												<Button
													variant="primary"
													size="sm"
													icon={<SparkIcon />}
													onClick={() => handleBusinessObjectPrompt(item, "run")}
												>
													{t(locale, "agentReports.askBusinessObject")}
												</Button>
												<Button
													variant="secondary"
													size="sm"
													onClick={() => handleBusinessObjectPrompt(item, "edit")}
												>
													{t(locale, "agentReports.fillCopilot")}
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
			</div>
		</PageContainer>
	);
}
