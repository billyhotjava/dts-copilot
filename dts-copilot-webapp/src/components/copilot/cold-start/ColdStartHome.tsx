import { ColdStartCards } from "./ColdStartCards";
import { ColdStartComposer } from "./ColdStartComposer";
import { StarterChips } from "./StarterChips";
import type { CopilotSessionFocusRequest } from "../copilotSessionFocus";
import "./cold-start.css";

type ColdStartHomeProps = {
	onSubmit: (text: string) => void;
	onOpenSession?: (request: CopilotSessionFocusRequest) => void;
	onOpenAssets?: () => void;
};

export default function ColdStartHome({
	onSubmit,
	onOpenSession,
	onOpenAssets,
}: ColdStartHomeProps) {
	return (
		<section className="cold-start" aria-labelledby="cold-start-title">
			<div className="cold-start__header">
				<p className="cold-start__eyebrow">Agent BI</p>
				<h1 id="cold-start-title">今天想看哪件事？</h1>
				<p>
					直接问业务问题，Agent 会组织数据口径、执行查询，并把结果沉淀成可复用资产。
				</p>
			</div>
			<ColdStartComposer onSubmit={onSubmit} />
			<StarterChips onPick={(prompt) => onSubmit(prompt)} />
			<ColdStartCards onOpenSession={onOpenSession} onOpenAssets={onOpenAssets} />
		</section>
	);
}
