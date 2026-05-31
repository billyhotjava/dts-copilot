import { useEffect, useState } from "react";
import { analyticsApi, type AiAgentChatSession } from "../../../api/analyticsApi";
import {
	buildCopilotSessionFocusRequest,
	requestCopilotSessionFocus,
} from "../copilotSessionFocus";
import { pickResumableSession } from "./coldStartCardsModel";

type ColdStartCardsState = {
	loading: boolean;
	dashboardCount: number;
	cardCount: number;
	session: AiAgentChatSession | null;
};

type ColdStartCardsProps = {
	onOpenAssets?: () => void;
};

const INITIAL_STATE: ColdStartCardsState = {
	loading: true,
	dashboardCount: 0,
	cardCount: 0,
	session: null,
};

export function ColdStartCards({ onOpenAssets }: ColdStartCardsProps) {
	const [state, setState] = useState<ColdStartCardsState>(INITIAL_STATE);

	useEffect(() => {
		let active = true;
		void (async () => {
			const [dashboards, cards, sessions] = await Promise.allSettled([
				analyticsApi.listDashboards(),
				analyticsApi.listCards(),
				analyticsApi.listAiAgentSessions(10),
			]);
			if (!active) return;
			const dashboardRows = dashboards.status === "fulfilled" ? dashboards.value : [];
			const cardRows = cards.status === "fulfilled" ? cards.value : [];
			const sessionRows = sessions.status === "fulfilled" ? sessions.value : [];
			setState({
				loading: false,
				dashboardCount: dashboardRows.length,
				cardCount: cardRows.length,
				session: pickResumableSession(sessionRows),
			});
		})();
		return () => {
			active = false;
		};
	}, []);

	const resumeSession = () => {
		const request = buildCopilotSessionFocusRequest({
			sessionId: state.session?.id,
			question: state.session?.title,
		});
		if (request) requestCopilotSessionFocus(request);
	};

	return (
		<div className="cold-start-cards">
			<article className="cold-start-card">
				<div className="cold-start-card__label">继续上次会话</div>
				{state.loading ? (
					<p className="cold-start-card__text">读取中...</p>
				) : state.session ? (
					<button type="button" className="cold-start-card__action" onClick={resumeSession}>
						<span>{state.session.title}</span>
						<small>继续分析</small>
					</button>
				) : (
					<p className="cold-start-card__text">暂无可继续会话。</p>
				)}
			</article>
			<article className="cold-start-card">
				<div className="cold-start-card__label">我的资产</div>
				{state.loading ? (
					<p className="cold-start-card__text">读取中...</p>
				) : (
					<button type="button" className="cold-start-card__action" onClick={onOpenAssets}>
						<span>{state.dashboardCount} 个看板 / {state.cardCount} 张查询</span>
						<small>打开资产库</small>
					</button>
				)}
			</article>
		</div>
	);
}
