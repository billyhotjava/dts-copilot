import type { ReactNode } from "react";
import { useNavigate } from "react-router";

/**
 * Renders object references in AI messages.
 * Pattern: [obj:TypeId:UUID:DisplayName] → clickable link that navigates to /objects/TypeId/UUID
 */
export function renderObjectRefs(text: string): (string | ReactNode)[] {
	const regex = /\[obj:([^:]+):([^:]+):([^\]]+)\]/g;
	const parts: (string | ReactNode)[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(regex)) {
		const [, typeId, instanceId, displayName] = match;
		const startIndex = match.index ?? 0;
		if (startIndex > lastIndex) {
			parts.push(text.slice(lastIndex, startIndex));
		}
		parts.push(
			<ObjectRefLinkInline
				key={`${typeId}-${instanceId}-${startIndex}`}
				typeId={typeId}
				instanceId={instanceId}
				displayName={displayName}
			/>,
		);
		lastIndex = startIndex + match[0].length;
	}

	if (lastIndex < text.length) {
		parts.push(text.slice(lastIndex));
	}

	return parts.length > 0 ? parts : [text];
}

function ObjectRefLinkInline({
	typeId,
	instanceId,
	displayName,
}: {
	typeId: string;
	instanceId: string;
	displayName: string;
}) {
	const navigate = useNavigate();

	return (
		<a
			href={`/objects/${typeId}/${instanceId}`}
			onClick={(e) => {
				e.preventDefault();
				navigate(`/objects/${typeId}/${instanceId}`);
			}}
			className="copilot-obj-ref"
			title={`${typeId} / ${instanceId}`}
		>
			{displayName}
		</a>
	);
}
