import type { ReactNode } from "react";
import { Button } from "../../ui/Button/Button";
import type {
	Artifact,
	CanvasActionEvent,
	CanvasActionType,
} from "../../types/artifact";
import "./Canvas.css";

interface CanvasActionsProps {
	artifact: Artifact | null;
	onAction: (event: CanvasActionEvent) => void;
	disabledActions?: CanvasActionType[];
	busyAction?: CanvasActionType | null;
}

const ACTIONS: Array<{
	action: CanvasActionType;
	icon: ReactNode;
	label: string;
}> = [
	{ action: "save-card", icon: <ActionIcon label="S" />, label: "存为卡片" },
	{ action: "pin-dashboard", icon: <ActionIcon label="P" />, label: "钉到看板" },
	{ action: "trace-sql", icon: <ActionIcon label="</>" />, label: "SQL·溯源" },
	{ action: "drilldown", icon: <ActionIcon label="↧" />, label: "下钻" },
	{ action: "export", icon: <ActionIcon label="↓" />, label: "导出" },
];

export function CanvasActions({
	artifact,
	onAction,
	disabledActions = [],
	busyAction = null,
}: CanvasActionsProps) {
	return (
		<div className="canvas-actions" aria-label="画布动作">
			{ACTIONS.map((item) => {
				const disabled =
					!artifact ||
					(item.action === "drilldown" && artifact.type !== "indicator") ||
					disabledActions.includes(item.action) ||
					busyAction === item.action;
				return (
					<Button
						key={item.action}
						type="button"
						aria-label={item.label}
						size="sm"
						variant="secondary"
						icon={item.icon}
						loading={busyAction === item.action}
						disabled={disabled}
						onClick={() => {
							if (!artifact) return;
							onAction({ action: item.action, artifact });
						}}
					>
						{item.label}
					</Button>
				);
			})}
		</div>
	);
}

function ActionIcon({ label }: { label: string }) {
	return (
		<span className="canvas-actions__icon" aria-hidden="true">
			{label}
		</span>
	);
}
