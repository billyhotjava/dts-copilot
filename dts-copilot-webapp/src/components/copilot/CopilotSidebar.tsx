import { useCallback, useEffect, useRef, useState } from "react";
import { getCopilotApiKey, hasCopilotSessionAccess } from "../../api/copilotAuth";
import { CopilotChat } from "./CopilotChat";
import { canUseCopilot, resolveInitialCopilotExpanded } from "./copilotAccessPolicy";
import "./CopilotSidebar.css";

const STORAGE_KEY = "dts-analytics.copilotExpanded";
const WIDTH_STORAGE_KEY = "dts-analytics.copilotWidth";
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 240;
const MAX_WIDTH = 720;

interface Props {
	hasSessionAccess?: boolean;
}

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

function getStoredWidth(): number {
	try {
		const v = localStorage.getItem(WIDTH_STORAGE_KEY);
		if (v) {
			const n = Number(v);
			if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
		}
	} catch { /* ignore */ }
	return DEFAULT_WIDTH;
}

export function CopilotSidebar({ hasSessionAccess = false }: Props) {
	const apiKey = getCopilotApiKey();
	const sessionAccess = hasSessionAccess || hasCopilotSessionAccess();
	const copilotEnabled = canUseCopilot(apiKey, sessionAccess);
	const [expanded, setExpanded] = useState(() =>
		resolveInitialCopilotExpanded(getStoredExpanded(), apiKey, sessionAccess),
	);
	const [width, setWidth] = useState(getStoredWidth);
	const isDragging = useRef(false);
	const startX = useRef(0);
	const startWidth = useRef(0);

	useEffect(() => {
		setExpanded((prev) => resolveInitialCopilotExpanded(prev, apiKey, sessionAccess));
	}, [apiKey, sessionAccess]);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, String(expanded));
		} catch { /* ignore */ }
	}, [expanded]);

	useEffect(() => {
		try {
			localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
		} catch { /* ignore */ }
	}, [width]);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		if (!isDragging.current) return;
		// Dragging leftward increases copilot width (sidebar is on the right)
		const delta = startX.current - e.clientX;
		const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
		setWidth(newWidth);
	}, []);

	const handleMouseUp = useCallback(() => {
		if (!isDragging.current) return;
		isDragging.current = false;
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
	}, []);

	useEffect(() => {
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove, handleMouseUp]);

	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		isDragging.current = true;
		startX.current = e.clientX;
		startWidth.current = width;
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}, [width]);

	return (
		<>
			{expanded && (
				<div
					className="copilot-resize-handle"
					onMouseDown={handleResizeStart}
					role="separator"
					aria-orientation="vertical"
					aria-label="Resize AI Copilot panel"
				/>
			)}
			<aside
				className={`copilot-sidebar ${expanded ? "copilot-sidebar--expanded" : "copilot-sidebar--collapsed"}`}
				style={expanded ? { width } : undefined}
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
							<CopilotChat hasSessionAccess={sessionAccess} />
						</div>
					</>
				) : (
					<button
						type="button"
						className="copilot-sidebar__expand-btn"
						onClick={() => setExpanded(true)}
						aria-label="Expand AI Copilot"
						title={copilotEnabled ? "AI Copilot" : "AI Copilot 需要登录或配置 copilot API Key"}
					>
						<AiIcon />
					</button>
				)}
			</aside>
		</>
	);
}
