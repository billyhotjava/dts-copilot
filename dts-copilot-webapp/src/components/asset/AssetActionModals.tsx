import { type ReactNode, useEffect, useMemo, useState } from "react";
import { analyticsApi, type CardDetail, type CollectionListItem, type DashboardListItem } from "../../api/analyticsApi";
import type { Artifact, CanvasActionType } from "../../types/artifact";
import { Button } from "../../ui/Button/Button";
import { Modal } from "../../ui/Modal/Modal";
import {
	downloadArtifactCsv,
	downloadArtifactPng,
} from "./artifactExport";
import {
	pinArtifactToDashboard,
	saveArtifactCard,
} from "./assetOperations";
import { resolveArtifactCardName } from "./assetPayload";
import "./AssetActionModals.css";

export type AssetActionKind = Exclude<CanvasActionType, "trace-sql"> | null;

interface AssetActionModalsProps {
	action: AssetActionKind;
	artifact: Artifact | null;
	onCardSaved?: (card: CardDetail, artifact: Artifact) => void;
	onClose: () => void;
	onPinned?: (result: { card: CardDetail; dashboardId: number }, artifact: Artifact) => void;
}

export function AssetActionModals({
	action,
	artifact,
	onCardSaved,
	onClose,
	onPinned,
}: AssetActionModalsProps) {
	return (
		<>
			<SaveCardModal
				artifact={artifact}
				open={action === "save-card"}
				onCardSaved={onCardSaved}
				onClose={onClose}
			/>
			<PinToDashboardModal
				artifact={artifact}
				open={action === "pin-dashboard"}
				onClose={onClose}
				onPinned={onPinned}
			/>
			<ExportArtifactModal
				artifact={artifact}
				open={action === "export"}
				onClose={onClose}
			/>
		</>
	);
}

function SaveCardModal({
	artifact,
	open,
	onCardSaved,
	onClose,
}: {
	artifact: Artifact | null;
	open: boolean;
	onCardSaved?: (card: CardDetail, artifact: Artifact) => void;
	onClose: () => void;
}) {
	const [collections, setCollections] = useState<CollectionListItem[]>([]);
	const [collectionId, setCollectionId] = useState<string>("root");
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savedCard, setSavedCard] = useState<CardDetail | null>(null);

	useEffect(() => {
		if (!open || !artifact) return;
		let cancelled = false;
		setName(resolveArtifactCardName(artifact));
		setCollectionId("root");
		setError(null);
		setSavedCard(null);
		analyticsApi.listCollections()
			.then((items) => {
				if (!cancelled) setCollections(items);
			})
			.catch((err) => {
				if (!cancelled) setError(resolveErrorMessage(err));
			});
		return () => {
			cancelled = true;
		};
	}, [artifact, open]);

	const handleSave = async () => {
		if (!artifact) return;
		setSaving(true);
		setError(null);
		try {
			const card = await saveArtifactCard(analyticsApi, artifact, {
				collectionId,
				name,
			});
			setSavedCard(card);
			onCardSaved?.(card, artifact);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			isOpen={open && Boolean(artifact)}
			onClose={onClose}
			title="存为卡片"
			description="把当前画布产物沉淀为可复用 BI 卡片。"
			size="md"
		>
			<div className="asset-modal">
				<label className="asset-modal__field">
					<span>卡片名称</span>
					<input
						className="asset-modal__input"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</label>
				<label className="asset-modal__field">
					<span>保存到集合</span>
					<select
						className="asset-modal__input"
						value={collectionId}
						onChange={(event) => setCollectionId(event.target.value)}
					>
						<option value="root">根集合</option>
						{collections.map((collection) => (
							<option key={collection.id} value={String(collection.id)}>
								{collection.name || `集合 ${collection.id}`}
							</option>
						))}
					</select>
				</label>
				<ActionStatus
					error={error}
					success={savedCard ? (
						<>
							已保存为卡片{" "}
							<a href={`/questions/${savedCard.id}`}>{savedCard.name || savedCard.id}</a>
						</>
					) : null}
				/>
				<div className="asset-modal__actions">
					<Button type="button" variant="tertiary" onClick={onClose}>
						关闭
					</Button>
					<Button
						type="button"
						variant="primary"
						loading={saving}
						disabled={!name.trim()}
						onClick={() => {
							void handleSave();
						}}
					>
						保存卡片
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function PinToDashboardModal({
	artifact,
	open,
	onClose,
	onPinned,
}: {
	artifact: Artifact | null;
	open: boolean;
	onClose: () => void;
	onPinned?: (result: { card: CardDetail; dashboardId: number }, artifact: Artifact) => void;
}) {
	const [collections, setCollections] = useState<CollectionListItem[]>([]);
	const [dashboards, setDashboards] = useState<DashboardListItem[]>([]);
	const [mode, setMode] = useState<"existing" | "new">("existing");
	const [dashboardId, setDashboardId] = useState("");
	const [newDashboardName, setNewDashboardName] = useState("");
	const [collectionId, setCollectionId] = useState<string>("root");
	const [cardName, setCardName] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dashboardLinkId, setDashboardLinkId] = useState<number | null>(null);

	useEffect(() => {
		if (!open || !artifact) return;
		let cancelled = false;
		setCardName(resolveArtifactCardName(artifact));
		setNewDashboardName(`${resolveArtifactCardName(artifact)}看板`);
		setCollectionId("root");
		setError(null);
		setDashboardLinkId(null);
		Promise.all([analyticsApi.listCollections(), analyticsApi.listDashboards()])
			.then(([collectionItems, dashboardItems]) => {
				if (cancelled) return;
				setCollections(collectionItems);
				setDashboards(dashboardItems);
				const firstDashboardId = dashboardItems[0]?.id;
				setDashboardId(firstDashboardId ? String(firstDashboardId) : "");
				setMode(firstDashboardId ? "existing" : "new");
			})
			.catch((err) => {
				if (!cancelled) setError(resolveErrorMessage(err));
			});
		return () => {
			cancelled = true;
		};
	}, [artifact, open]);

	const canSubmit =
		Boolean(cardName.trim()) &&
		(mode === "new" ? Boolean(newDashboardName.trim()) : Boolean(dashboardId));

	const handlePin = async () => {
		if (!artifact || !canSubmit) return;
		setSaving(true);
		setError(null);
		try {
			const result = await pinArtifactToDashboard(analyticsApi, artifact, {
				cardName,
				collectionId,
				dashboardId: mode === "existing" ? dashboardId : null,
				newDashboardName: mode === "new" ? newDashboardName : undefined,
			});
			setDashboardLinkId(result.dashboard.id);
			onPinned?.({ card: result.card, dashboardId: result.dashboard.id }, artifact);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal
			isOpen={open && Boolean(artifact)}
			onClose={onClose}
			title="钉到看板"
			description="把当前产物卡片追加到指定看板底部。"
			size="md"
		>
			<div className="asset-modal">
				<label className="asset-modal__field">
					<span>卡片名称</span>
					<input
						className="asset-modal__input"
						value={cardName}
						onChange={(event) => setCardName(event.target.value)}
					/>
				</label>
				<div className="asset-modal__segmented" role="group" aria-label="看板类型">
					<button
						type="button"
						className={mode === "existing" ? "is-active" : ""}
						onClick={() => setMode("existing")}
						disabled={dashboards.length === 0}
					>
						已有看板
					</button>
					<button
						type="button"
						className={mode === "new" ? "is-active" : ""}
						onClick={() => setMode("new")}
					>
						新建看板
					</button>
				</div>
				{mode === "existing" ? (
					<label className="asset-modal__field">
						<span>选择看板</span>
						<select
							className="asset-modal__input"
							value={dashboardId}
							onChange={(event) => setDashboardId(event.target.value)}
						>
							{dashboards.map((dashboard) => (
								<option key={dashboard.id} value={String(dashboard.id)}>
									{dashboard.name || `看板 ${dashboard.id}`}
								</option>
							))}
						</select>
					</label>
				) : (
					<>
						<label className="asset-modal__field">
							<span>新看板名称</span>
							<input
								className="asset-modal__input"
								value={newDashboardName}
								onChange={(event) => setNewDashboardName(event.target.value)}
							/>
						</label>
						<label className="asset-modal__field">
							<span>保存到集合</span>
							<select
								className="asset-modal__input"
								value={collectionId}
								onChange={(event) => setCollectionId(event.target.value)}
							>
								<option value="root">根集合</option>
								{collections.map((collection) => (
									<option key={collection.id} value={String(collection.id)}>
										{collection.name || `集合 ${collection.id}`}
									</option>
								))}
							</select>
						</label>
					</>
				)}
				<ActionStatus
					error={error}
					success={dashboardLinkId ? (
						<>
							已钉到看板 <a href={`/dashboards/${dashboardLinkId}`}>打开看板</a>
						</>
					) : null}
				/>
				<div className="asset-modal__actions">
					<Button type="button" variant="tertiary" onClick={onClose}>
						关闭
					</Button>
					<Button
						type="button"
						variant="primary"
						loading={saving}
						disabled={!canSubmit}
						onClick={() => {
							void handlePin();
						}}
					>
						钉到看板
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function ExportArtifactModal({
	artifact,
	open,
	onClose,
}: {
	artifact: Artifact | null;
	open: boolean;
	onClose: () => void;
}) {
	const [pngBusy, setPngBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const canExportCsv = useMemo(
		() => Boolean(artifact?.spec.dataset?.cols.length && artifact?.spec.dataset?.rows.length),
		[artifact],
	);

	useEffect(() => {
		if (!open) return;
		setError(null);
		setStatus(null);
	}, [open]);

	const handleCsv = () => {
		if (!artifact || !canExportCsv) return;
		downloadArtifactCsv(artifact);
		setStatus("CSV 已生成。");
	};

	const handlePng = async () => {
		if (!artifact) return;
		setPngBusy(true);
		setError(null);
		try {
			await downloadArtifactPng(artifact);
			setStatus("PNG 已生成。");
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setPngBusy(false);
		}
	};

	return (
		<Modal
			isOpen={open && Boolean(artifact)}
			onClose={onClose}
			title="导出"
			description="导出当前画布产物，便于离线流转。"
			size="sm"
		>
			<div className="asset-modal">
				<div className="asset-modal__export-actions">
					<Button
						type="button"
						variant="secondary"
						disabled={!canExportCsv}
						onClick={handleCsv}
					>
						导出 CSV
					</Button>
					<Button
						type="button"
						variant="secondary"
						loading={pngBusy}
						onClick={() => {
							void handlePng();
						}}
					>
						导出 PNG
					</Button>
				</div>
				{!canExportCsv ? (
					<p className="asset-modal__hint">当前产物没有表格结果，CSV 暂不可用。</p>
				) : null}
				<ActionStatus error={error} success={status} />
				<div className="asset-modal__actions">
					<Button type="button" variant="tertiary" onClick={onClose}>
						关闭
					</Button>
				</div>
			</div>
		</Modal>
	);
}

function ActionStatus({
	error,
	success,
}: {
	error?: string | null;
	success?: ReactNode;
}) {
	if (error) {
		return <p className="asset-modal__status asset-modal__status--error">{error}</p>;
	}
	if (success) {
		return <p className="asset-modal__status asset-modal__status--success">{success}</p>;
	}
	return null;
}

function resolveErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message || "操作失败";
	}
	return String(error ?? "操作失败");
}
