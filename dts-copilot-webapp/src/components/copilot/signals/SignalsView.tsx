import { useEffect, useMemo, useState } from "react";
import {
	analyticsApi,
	type CopilotSignalSummary,
} from "../../../api/analyticsApi";

type SignalsViewProps = {
	domain?: string;
	onOpenSignal?: (signal: CopilotSignalSummary) => void;
};

type SignalsViewState =
	| { state: "loading" }
	| { state: "loaded"; signals: CopilotSignalSummary[] }
	| { state: "error"; error: string };

export function SignalsView({
	domain = "flowerbiz",
	onOpenSignal,
}: SignalsViewProps) {
	const [state, setState] = useState<SignalsViewState>({ state: "loading" });

	useEffect(() => {
		let active = true;
		setState({ state: "loading" });
		void analyticsApi
			.listCopilotSignals(domain)
			.then((signals) => {
				if (!active) return;
				setState({
					state: "loaded",
					signals: Array.isArray(signals) ? signals : [],
				});
			})
			.catch(() => {
				if (!active) return;
				setState({
					state: "error",
					error: "信号数据读取失败，请稍后重试。",
				});
			});
		return () => {
			active = false;
		};
	}, [domain]);

	const signals = useMemo(
		() => (state.state === "loaded" ? state.signals : []),
		[state],
	);

	return (
		<section className="agent-signals-view" aria-labelledby="agent-signals-title">
			<div className="agent-signals-view__header">
				<p className="agent-signals-view__eyebrow">Agent BI</p>
				<h1 id="agent-signals-title">主动信号</h1>
				<p>这里承载真实预警、异常洞察和后续一键处理动作。</p>
			</div>

			{state.state === "loading" ? (
				<p className="agent-signals-view__status">正在读取信号...</p>
			) : state.state === "error" ? (
				<p className="agent-signals-view__status agent-signals-view__status--error">
					{state.error}
				</p>
			) : signals.length === 0 ? (
				<div className="agent-signals-view__empty">
					<h2>信号数据未接通</h2>
					<p>当前没有可展示的 ontology signals,不会展示占位业务预警。</p>
				</div>
			) : (
				<ul className="agent-signals-view__list">
					{signals.map((signal) => (
						<li key={signal.id} className="agent-signals-view__signal">
							<button
								type="button"
								className="agent-signals-view__signal-button"
								onClick={() => onOpenSignal?.(signal)}
							>
								<span className="agent-signals-view__severity">
									{formatSeverity(signal.severity)}
								</span>
								<strong>{signal.title}</strong>
								{signal.description ? <p>{signal.description}</p> : null}
								{signal.linkedActions?.length ? (
									<div className="agent-signals-view__actions" aria-label="关联动作">
										{signal.linkedActions.map((action) => (
											<span key={action}>{action}</span>
										))}
									</div>
								) : null}
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function formatSeverity(severity: CopilotSignalSummary["severity"]): string {
	switch (severity) {
		case "high":
		case "critical":
			return "高";
		case "medium":
		case "warning":
			return "中";
		default:
			return "信息";
	}
}
