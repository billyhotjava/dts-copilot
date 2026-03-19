import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type CopilotSuggestedQuestion } from "../../api/analyticsApi";
import "./WelcomeCard.css";

const FALLBACK_GROUPS = [
	{
		role: "项目管理",
		icon: "\uD83D\uDCCB",
		questions: [
			"当前在服项目一共多少个？",
			"哪些合同90天内到期？",
			"各项目在摆绿植数排行",
		],
	},
	{
		role: "花卉业务",
		icon: "\uD83C\uDF38",
		questions: [
			"本月各类报花业务数量分布",
			"加花次数最多的项目是哪个？",
			"有多少待审批的报花单？",
		],
	},
	{
		role: "财务结算",
		icon: "\uD83D\uDCB0",
		questions: [
			"上月未结算的项目有哪些？",
			"各客户欠款排名",
			"项目租金收入排行",
		],
	},
	{
		role: "现场养护",
		icon: "\uD83C\uDF3F",
		questions: [
			"本月哪些摆位还没做过养护？",
			"养护人均负责多少摆位？",
			"进行中的初摆任务有几个？",
		],
	},
];

const DOMAIN_META: Record<string, { role: string; icon: string }> = {
	project: { role: "项目履约", icon: "\uD83D\uDCCB" },
	flowerbiz: { role: "花卉业务", icon: "\uD83C\uDF38" },
	settlement: { role: "财务结算", icon: "\uD83D\uDCB0" },
	task: { role: "任务执行", icon: "\uD83D\uDCDD" },
	curing: { role: "现场养护", icon: "\uD83C\uDF3F" },
	pendulum: { role: "初摆实施", icon: "\uD83D\uDEA7" },
};

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
		if (suggestions.length === 0) {
			return FALLBACK_GROUPS;
		}
		const grouped = new Map<string, { role: string; icon: string; questions: string[] }>();
		for (const suggestion of suggestions) {
			const normalizedDomain = String(suggestion.domain ?? "").trim();
			const label = String(suggestion.roleHint ?? "").trim()
				|| DOMAIN_META[normalizedDomain]?.role
				|| "推荐问题";
			const icon = DOMAIN_META[normalizedDomain]?.icon ?? "\uD83C\uDF31";
			const key = `${normalizedDomain}:${label}`;
			const bucket = grouped.get(key) ?? { role: label, icon, questions: [] };
			if (!bucket.questions.includes(suggestion.question)) {
				bucket.questions.push(suggestion.question);
			}
			grouped.set(key, bucket);
		}
		return Array.from(grouped.values());
	}, [suggestions]);

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
