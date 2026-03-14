import type { QualitySignal } from "../../api/hubApi";
import "./QualityAlertBanner.css";

interface Props {
	signals: QualitySignal[];
}

const severityOrder: Record<string, number> = {
	CRITICAL: 0,
	HIGH: 1,
	MEDIUM: 2,
	LOW: 3,
};

export function QualityAlertBanner({ signals }: Props) {
	if (signals.length === 0) return null;

	const sorted = [...signals].sort(
		(a, b) =>
			(severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
	);
	const highCount = sorted.filter(
		(s) => s.severity === "HIGH" || s.severity === "CRITICAL",
	).length;

	return (
		<div
			className={`quality-banner ${highCount > 0 ? "quality-banner--high" : "quality-banner--medium"}`}
		>
			<span className="quality-banner__icon">⚠</span>
			<span className="quality-banner__text">
				{signals.length} quality {signals.length === 1 ? "signal" : "signals"}
				{highCount > 0 && ` (${highCount} HIGH)`}
			</span>
			<details className="quality-banner__details">
				<summary>Details</summary>
				<ul className="quality-banner__list">
					{sorted.map((s) => (
						<li key={s.id} className="quality-banner__item">
							<span
								className={`quality-banner__severity quality-banner__severity--${s.severity.toLowerCase()}`}
							>
								{s.severity}
							</span>
							<span>{s.description}</span>
							{s.columnName && (
								<span className="quality-banner__col">col: {s.columnName}</span>
							)}
						</li>
					))}
				</ul>
			</details>
		</div>
	);
}
