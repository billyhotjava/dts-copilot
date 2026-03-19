import "./WelcomeCard.css";

const ROLE_SUGGESTIONS = [
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

interface Props {
	onQuestionClick: (question: string) => void;
}

export function WelcomeCard({ onQuestionClick }: Props) {
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
				{ROLE_SUGGESTIONS.map((group) => (
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
