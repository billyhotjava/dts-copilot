import { useEffect, useState } from "react";
import { useCopilotContext } from "../../hooks/useCopilotContext";
import { CopilotChat } from "./CopilotChat";
import "./CopilotSidebar.css";

const STORAGE_KEY = "dts-analytics.copilotExpanded";

function getStoredExpanded(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) !== "false";
	} catch {
		return true;
	}
}

const AiIcon = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		role="img"
		aria-label="AI Copilot"
	>
		<title>AI Copilot</title>
		<path d="M12 2a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a2 2 0 0 1 2-2V6a4 4 0 0 1 4-4z" />
		<path d="M9 18v3" />
		<path d="M15 18v3" />
		<path d="M9 10h.01" />
		<path d="M15 10h.01" />
	</svg>
);

const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
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
		aria-label={collapsed ? "Expand AI Copilot" : "Collapse AI Copilot"}
		style={{
			transform: collapsed ? "rotate(180deg)" : undefined,
			transition: "transform 0.2s",
		}}
	>
		<title>{collapsed ? "Expand AI Copilot" : "Collapse AI Copilot"}</title>
		<path d="m9 18 6-6-6-6" />
	</svg>
);

export function CopilotSidebar() {
	const [expanded, setExpanded] = useState(getStoredExpanded);
	const objectContext = useCopilotContext();

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, String(expanded));
		} catch {
			/* ignore */
		}
	}, [expanded]);

	return (
		<aside
			className={`copilot-sidebar ${expanded ? "copilot-sidebar--expanded" : "copilot-sidebar--collapsed"}`}
		>
			{expanded ? (
				<>
					<div className="copilot-sidebar__header">
						<div className="copilot-sidebar__title">
							<AiIcon />
							<span>AI Copilot</span>
						</div>
						<button
							type="button"
							className="copilot-sidebar__toggle"
							onClick={() => setExpanded(false)}
							aria-label="Collapse AI Copilot"
						>
							<CollapseIcon collapsed={false} />
						</button>
					</div>
					<div className="copilot-sidebar__body">
						<CopilotChat objectContext={objectContext} />
					</div>
				</>
			) : (
				<button
					type="button"
					className="copilot-sidebar__expand-btn"
					onClick={() => setExpanded(true)}
					aria-label="Expand AI Copilot"
					title="AI Copilot"
				>
					<AiIcon />
				</button>
			)}
		</aside>
	);
}
