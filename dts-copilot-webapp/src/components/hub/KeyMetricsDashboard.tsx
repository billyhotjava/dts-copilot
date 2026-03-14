import type { KeyMetric } from "../../api/hubApi";
import { StatCard } from "../../ui/Card/Card";
import "./hub.css";

interface KeyMetricsDashboardProps {
	metrics: KeyMetric[];
}

function formatValue(metric: KeyMetric) {
	if (!Number.isFinite(metric.value)) return "—";
	if (metric.value >= 1000) {
		return new Intl.NumberFormat("en-US").format(metric.value);
	}
	return String(metric.value);
}

export function KeyMetricsDashboard({ metrics }: KeyMetricsDashboardProps) {
	return (
		<div className="hub-key-metrics">
			{metrics.map((metric) => (
				<StatCard
					key={metric.metricId}
					label={metric.name}
					value={`${formatValue(metric)} ${metric.unit}`}
					change={metric.trend}
					changeType="neutral"
					icon={
						<span>
							{metric.metricId === "total_objects"
								? "📦"
								: metric.metricId === "object_types"
									? "🧩"
									: "🛠"}
						</span>
					}
				/>
			))}
		</div>
	);
}
