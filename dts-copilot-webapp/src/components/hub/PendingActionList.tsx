import { Link } from "react-router";
import type { PendingAction } from "../../api/hubApi";
import { Badge } from "../../ui/Badge/Badge";
import { Card, CardBody, CardHeader } from "../../ui/Card/Card";
import "./hub.css";

interface PendingActionListProps {
	actions: PendingAction[];
}

function severityBadgeVariant(
	severity: string,
): "default" | "warning" | "error" | "success" | "info" | "primary" {
	switch (severity.toUpperCase()) {
		case "HIGH":
			return "error";
		case "MEDIUM":
			return "warning";
		case "LOW":
			return "info";
		default:
			return "default";
	}
}

export function PendingActionList({ actions }: PendingActionListProps) {
	return (
		<Card variant="default" className="hub-pending-card">
			<CardHeader
				title="待处理 Actions"
				subtitle={`${actions.length} 条待处理动作`}
			/>
			<CardBody className="hub-pending-actions">
				{actions.length === 0 ? (
					<div>暂无待处理 Actions</div>
				) : (
					actions.map((action) => (
						<div
							key={`${action.type}-${action.title}`}
							className="hub-pending-actions__item"
						>
							<div className="hub-pending-actions__title">
								<Badge
									variant={severityBadgeVariant(action.severity)}
									size="sm"
								>
									{action.severity}
								</Badge>
								<span
									className="hub-pending-actions__title-text"
									title={action.title}
								>
									{action.title}
								</span>
							</div>
							<div className="hub-pending-actions__count">
								{action.count} 待处理
							</div>
							<Link to={`/objects/${action.type}`}>进入对象类型</Link>
						</div>
					))
				)}
			</CardBody>
		</Card>
	);
}
