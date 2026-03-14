import { Link } from "react-router";
import type { ObjectTypeSummary } from "../../api/hubApi";
import { Badge } from "../../ui/Badge/Badge";
import { Card, CardBody, CardFooter, CardHeader } from "../../ui/Card/Card";
import "./hub.css";

interface ObjectTypeTileProps {
	summary: ObjectTypeSummary;
	packId?: string | null;
}

export function ObjectTypeTile({ summary, packId }: ObjectTypeTileProps) {
	return (
		<Link
			to={`/objects/${summary.typeId}`}
			state={{ packId }}
			className="hub-tile-link"
		>
			<Card variant="hoverable" shadow="sm" className="hub-tile-card">
				<CardHeader
					title={
						<span className="hub-tile-card__title">{summary.displayName}</span>
					}
					action={
						summary.alertCount > 0 ? (
							<Badge variant="warning" size="sm">
								{summary.alertCount}告警
							</Badge>
						) : null
					}
					icon={
						<span className="hub-tile-card__icon">{summary.icon || "📦"}</span>
					}
					subtitle={`${summary.instanceCount} ${summary.instanceCount === 1 ? "实例" : "实例"}`}
				/>
				<CardBody className="hub-tile-card__body">
					<div className="hub-tile-card__meta">
						对象类型ID：{summary.typeId}
					</div>
				</CardBody>
				<CardFooter align="right" className="hub-tile-card__footer">
					<span className="hub-tile-card__link">进入对象浏览</span>
				</CardFooter>
			</Card>
		</Link>
	);
}
