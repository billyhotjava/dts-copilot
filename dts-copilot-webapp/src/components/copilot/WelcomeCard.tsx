import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type CopilotSuggestedQuestion } from "../../api/analyticsApi";
import { AGENT_REPORT_BUSINESS_GUIDE } from "../../pages/agent-reports/agentReportQuickStarts";
import { buildWelcomeSuggestionGroups } from "./welcomeCardModel";
import "./WelcomeCard.css";

interface Props {
	onQuestionClick: (question: string) => void;
}

export function WelcomeCard({ onQuestionClick }: Props) {
	const [suggestions, setSuggestions] = useState<CopilotSuggestedQuestion[]>([]);

	useEffect(() => {
		let active = true;
		void (async () => {
			try {
				const rows = await analyticsApi.listSuggestedQuestions(12);
				if (!active || !Array.isArray(rows) || rows.length === 0) {
					return;
				}
				setSuggestions(rows.filter((item) => typeof item.question === "string" && item.question.trim().length > 0));
			} catch {
				/* keep fallback suggestions */
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const groups = useMemo(() => {
		return buildWelcomeSuggestionGroups(suggestions)
	}, [suggestions])

	return (
		<div className="welcome-card">
			<div className="welcome-card__header">
				<span className="welcome-card__icon">{"\uD83C\uDF31"}</span>
				<h2 className="welcome-card__title">你好，我是绿植业务助手</h2>
			</div>
			<p className="welcome-card__desc">
				我把固定报表、dbt 主题表和业务对象问答合在一个入口里。先选业务对象，再由我决定走认证报表、主题表还是只读明细。
			</p>
			<div className="welcome-card__domain-guide">
				{AGENT_REPORT_BUSINESS_GUIDE.map((domain) => (
					<section key={domain.id} className="welcome-card__domain">
						<div className="welcome-card__domain-head">
							<span className="welcome-card__domain-icon">{domain.icon}</span>
							<div>
								<h3>{domain.title}</h3>
								<p>{domain.subtitle}</p>
							</div>
						</div>
						<div className="welcome-card__route-tags">
							<span>L2 固定报表</span>
							<span>L1 dbt</span>
							<span>L0 业务对象</span>
						</div>
						<div className="welcome-card__chips">
							{domain.questions.map((question) => (
								<button
									key={question.id}
									type="button"
									className="welcome-card__chip"
									onClick={() => onQuestionClick(question.prompt)}
								>
									{question.label}
								</button>
							))}
						</div>
					</section>
				))}
			</div>
			{suggestions.length > 0 && (
				<details className="welcome-card__suggestions">
					<summary>更多推荐问题</summary>
					<div className="welcome-card__groups">
						{groups.map((group) => (
							<div key={group.role} className="welcome-card__group">
								<div className="welcome-card__group-label">
									<span>{group.icon}</span>
									<span>{group.role}</span>
								</div>
								<div className="welcome-card__chips">
									{group.questions.map((q) => (
										<button
											key={q}
											type="button"
											className="welcome-card__chip"
											onClick={() => onQuestionClick(q)}
										>
											{q}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</details>
			)}
		</div>
	);
}
