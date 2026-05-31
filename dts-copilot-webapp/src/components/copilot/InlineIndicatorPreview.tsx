import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type AiAgentChatMessage } from "../../api/analyticsApi";
import type { PlatformIndicatorValueResponse } from "../../api/types";
import { ArtifactCanvas } from "../canvas/ArtifactCanvas";
import { indicatorArtifact } from "../../types/artifact";
import { Spinner } from "../../ui/Loading/Spinner";

type PreviewState =
	| { state: "idle" }
	| { state: "loading" }
	| { state: "loaded"; value: PlatformIndicatorValueResponse }
	| { state: "error"; message: string };

interface InlineIndicatorPreviewProps {
	message: AiAgentChatMessage;
}

export function InlineIndicatorPreview({ message }: InlineIndicatorPreviewProps) {
	const caliber = message.trace?.metricCaliber;
	const indicatorId = caliber?.ontologyRef ?? message.reportCode;
	const [previewState, setPreviewState] = useState<PreviewState>({ state: "idle" });

	useEffect(() => {
		if (message.responseKind !== "PUBLISHED_INDICATOR" || !indicatorId) {
			setPreviewState({ state: "idle" });
			return;
		}
		let cancelled = false;
		setPreviewState({ state: "loading" });
		analyticsApi
			.getPlatformIndicatorDetail(indicatorId, 30)
			.then((value) => {
				if (cancelled) return;
				if (value.degraded) {
					setPreviewState({
						state: "error",
						message: value.degradedReason || "平台指标服务暂不可达",
					});
					return;
				}
				setPreviewState({ state: "loaded", value });
			})
			.catch((error) => {
				if (cancelled) return;
				setPreviewState({
					state: "error",
					message: error instanceof Error ? error.message : "平台指标取值失败",
				});
			});
		return () => {
			cancelled = true;
		};
	}, [message.responseKind, indicatorId]);

	const artifact = useMemo(() => {
		if (previewState.state !== "loaded" || !indicatorId || !caliber?.name) {
			return null;
		}
		return indicatorArtifact({
			dataset: {
				cols: previewState.value.cols,
				rows: previewState.value.rows,
			},
			meta: {
				indicatorId,
				code: message.reportCode ?? String(indicatorId),
				name: caliber.name,
				valueMode: previewState.value.mode,
				...(caliber.formula ? { expressionSql: caliber.formula } : {}),
				...(caliber.version ? { version: caliber.version } : {}),
				...(caliber.domain ? { category: caliber.domain } : {}),
				...(previewState.value.timeGrain
					? { timeGrain: previewState.value.timeGrain }
					: caliber.timeGrain
						? { timeGrain: caliber.timeGrain }
						: {}),
				...(previewState.value.dimensionFields?.length
					? { dimensionFields: previewState.value.dimensionFields }
					: caliber.dimensionFields?.length
						? { dimensionFields: caliber.dimensionFields }
					: {}),
			},
			sourceMessageId: message.id,
		});
	}, [caliber, indicatorId, message.id, message.reportCode, previewState]);

	if (message.responseKind !== "PUBLISHED_INDICATOR" || !indicatorId) {
		return null;
	}
	if (previewState.state === "loading" || previewState.state === "idle") {
		return (
			<div className="copilot-chat__indicator-preview copilot-chat__indicator-preview--loading">
				<Spinner size="sm" />
				<span>正在向平台取指标值</span>
			</div>
		);
	}
	if (previewState.state === "error") {
		return (
			<div className="copilot-chat__indicator-preview copilot-chat__indicator-preview--error">
				{previewState.message}
			</div>
		);
	}
	return (
		<div className="copilot-chat__indicator-preview">
			<ArtifactCanvas
				artifact={artifact}
				className="copilot-chat__indicator-preview-artifact"
			/>
		</div>
	);
}
