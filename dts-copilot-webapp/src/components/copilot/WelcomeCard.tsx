import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type CopilotSuggestedQuestion } from "../../api/analyticsApi";
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
				我可以帮你查询项目、报花、结算、任务、养护等业务数据。试试问我：
			</p>
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
		</div>
	);
}
