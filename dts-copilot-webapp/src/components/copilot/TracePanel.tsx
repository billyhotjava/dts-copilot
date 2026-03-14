import { useState } from "react";
import type { AiAgentChatMessage } from "../../api/analyticsApi";
import "./TracePanel.css";

interface Props {
	toolMessages: AiAgentChatMessage[];
}

export function TracePanel({ toolMessages }: Props) {
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	if (toolMessages.length === 0) return null;

	return (
		<div className="trace-panel">
			<div className="trace-panel__steps">
				{toolMessages.map((msg, idx) => {
					const isExpanded = expandedIndex === idx;
					const isSuccess = !msg.toolResult?.includes('"success":false') &&
						!msg.toolResult?.includes('"errorMessage"');
					return (
						<div key={msg.id} className="trace-panel__step">
							<button
								type="button"
								className="trace-panel__step-header"
								onClick={() => setExpandedIndex(isExpanded ? null : idx)}
							>
								<span className={`trace-panel__status ${isSuccess ? "trace-panel__status--ok" : "trace-panel__status--err"}`}>
									{isSuccess ? "\u2713" : "\u2717"}
								</span>
								<span className="trace-panel__tool-name">{msg.toolName || "unknown"}</span>
								<span className="trace-panel__step-num">#{idx + 1}</span>
								<span className="trace-panel__expand">{isExpanded ? "\u25B2" : "\u25BC"}</span>
							</button>

							{isExpanded && (
								<div className="trace-panel__detail">
									{msg.toolParams && (
										<div className="trace-panel__section">
											<div className="trace-panel__section-label">Parameters</div>
											<pre className="trace-panel__json">{formatJson(msg.toolParams)}</pre>
										</div>
									)}
									{msg.toolResult && (
										<div className="trace-panel__section">
											<div className="trace-panel__section-label">Result</div>
											<ExpandableJson json={msg.toolResult} maxLines={8} />
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ExpandableJson({ json, maxLines }: { json: string; maxLines: number }) {
	const [expanded, setExpanded] = useState(false);
	const formatted = formatJson(json);
	const lines = formatted.split("\n");
	const needsTruncation = lines.length > maxLines;

	return (
		<div>
			<pre className="trace-panel__json">
				{needsTruncation && !expanded ? lines.slice(0, maxLines).join("\n") + "\n..." : formatted}
			</pre>
			{needsTruncation && (
				<button
					type="button"
					className="trace-panel__expand-btn"
					onClick={() => setExpanded(!expanded)}
				>
					{expanded ? "Collapse" : `Show all (${lines.length} lines)`}
				</button>
			)}
		</div>
	);
}

function formatJson(raw: string): string {
	try {
		return JSON.stringify(JSON.parse(raw), null, 2);
	} catch {
		return raw;
	}
}
