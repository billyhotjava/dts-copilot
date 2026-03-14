import { Link } from "react-router";
import type { GraphView } from "../../api/hubApi";
import "./RelatedObjectList.css";

interface Props {
	graph: GraphView;
	currentId: string;
}

export function RelatedObjectList({ graph, currentId }: Props) {
	const related = graph.edges
		.map((edge) => {
			const otherId = edge.source === currentId ? edge.target : edge.source;
			const node = graph.nodes.find((n) => n.id === otherId);
			return node
				? { node, linkType: edge.displayName || edge.linkTypeId }
				: null;
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	if (related.length === 0) return null;

	return (
		<div className="related-list">
			<div className="related-list__title">Related Objects</div>
			<div className="related-list__items">
				{related.map((r) => (
					<Link
						key={r.node.id}
						to={`/objects/${r.node.typeId}/${r.node.id}`}
						className="related-list__item"
					>
						<span className="related-list__name">{r.node.displayName}</span>
						<span className="related-list__link-type">{r.linkType}</span>
						<span className="related-list__type">{r.node.typeId}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
