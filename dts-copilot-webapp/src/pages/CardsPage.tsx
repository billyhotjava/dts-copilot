import { Link } from "react-router";
import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { analyticsApi, type AnalysisDraftListItem, type CardListItem } from "../api/analyticsApi";
import { PageContainer, PageHeader, EmptyState } from "../components/PageContainer/PageContainer";
import { Card } from "../ui/Card/Card";
import { Button } from "../ui/Button/Button";
import { SearchInput } from "../ui/Input/Input";
import { NativeSelect } from "../ui/Input/Select";
import { Badge } from "../ui/Badge/Badge";
import { CardSkeleton } from "../ui/Loading/Skeleton";
import { CardGrid } from "../components/DashboardGrid/DashboardGrid";
import { ErrorNotice } from "../components/ErrorNotice";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import { usePageContext } from "../hooks/usePageContext";
import {
	buildQueryAssetTabs,
	filterQueryAssets,
	normalizeQueryAssets,
	type QueryAssetItem,
	type QueryAssetSourceFilter,
	type QueryAssetStatusFilter,
	type QueryAssetSortMode,
	type QueryAssetTab,
} from "./queryAssetCenterModel";
import "./page.css";

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown };

// Icons
const PlusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</svg>
);

const QuestionIcon = () => (
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect width="18" height="18" x="3" y="3" rx="2" />
		<path d="M3 9h18" />
		<path d="M9 21V9" />
	</svg>
);

const GridIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect width="7" height="7" x="3" y="3" rx="1" />
		<rect width="7" height="7" x="14" y="3" rx="1" />
		<rect width="7" height="7" x="14" y="14" rx="1" />
		<rect width="7" height="7" x="3" y="14" rx="1" />
	</svg>
);

const ListIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="8" x2="21" y1="6" y2="6" />
		<line x1="8" x2="21" y1="12" y2="12" />
		<line x1="8" x2="21" y1="18" y2="18" />
		<line x1="3" x2="3.01" y1="6" y2="6" />
		<line x1="3" x2="3.01" y1="12" y2="12" />
		<line x1="3" x2="3.01" y1="18" y2="18" />
	</svg>
);

const displayTypeIcons: Record<string, () => JSX.Element> = {
	table: () => (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect width="18" height="18" x="3" y="3" rx="2" />
			<path d="M3 9h18" />
			<path d="M3 15h18" />
			<path d="M9 3v18" />
		</svg>
	),
	bar: () => (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<line x1="12" x2="12" y1="20" y2="10" />
			<line x1="18" x2="18" y1="20" y2="4" />
			<line x1="6" x2="6" y1="20" y2="14" />
		</svg>
	),
	line: () => (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M3 3v18h18" />
			<path d="m19 9-5 5-4-4-3 3" />
		</svg>
	),
	pie: () => (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
			<path d="M22 12A10 10 0 0 0 12 2v10z" />
		</svg>
	),
	scalar: () => (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M12 2v20" />
			<path d="M2 12h20" />
		</svg>
	),
};

function getDisplayTypeIcon(display?: string) {
	const IconComponent = displayTypeIcons[display || ""] || displayTypeIcons.table;
	return <IconComponent />;
}

export default function CardsPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	usePageContext({ module: "analytics/question", resourceType: "question" });
	const [cardsState, setCardsState] = useState<LoadState<CardListItem[]>>({ state: "loading" });
	const [draftsState, setDraftsState] = useState<LoadState<AnalysisDraftListItem[]>>({ state: "loading" });
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchQuery, setSearchQuery] = useState("");
	const [activeTab, setActiveTab] = useState<QueryAssetTab>("all");
	const [sourceFilter, setSourceFilter] = useState<QueryAssetSourceFilter>("all");
	const [statusFilter, setStatusFilter] = useState<QueryAssetStatusFilter>("all");
	const [sortMode, setSortMode] = useState<QueryAssetSortMode>("updated-desc");
	const [draftActionState, setDraftActionState] = useState<{ draftId: number; kind: "archive" | "delete" } | null>(null);
	const [draftActionError, setDraftActionError] = useState<unknown>(null);
	const [draftActionMessage, setDraftActionMessage] = useState("");

	const loadCards = useCallback(async () => {
		try {
			setCardsState({ state: "loading" });
			const value = await analyticsApi.listCards();
			setCardsState({ state: "loaded", value });
		} catch (e) {
			setCardsState({ state: "error", error: e });
		}
	}, []);

	const loadDrafts = useCallback(async () => {
		try {
			setDraftsState({ state: "loading" });
			const value = await analyticsApi.listAnalysisDrafts();
			setDraftsState({ state: "loaded", value });
		} catch (e) {
			setDraftsState({ state: "error", error: e });
		}
	}, []);

	useEffect(() => {
		void loadCards();
		void loadDrafts();
	}, [loadCards, loadDrafts]);

	const handleDraftAction = useCallback(async (draftId: number, kind: "archive" | "delete") => {
		setDraftActionError(null);
		setDraftActionMessage("");
		setDraftActionState({ draftId, kind });
		try {
			if (kind === "archive") {
				await analyticsApi.archiveAnalysisDraft(draftId);
				setDraftActionMessage("草稿已归档。");
			} else {
				await analyticsApi.deleteAnalysisDraft(draftId);
				setDraftActionMessage("草稿已删除。");
			}
			await loadDrafts();
		} catch (e) {
			setDraftActionError(e);
		} finally {
			setDraftActionState(null);
		}
	}, [loadDrafts]);

	const allAssets = useMemo(() => {
		if (cardsState.state !== "loaded" || draftsState.state !== "loaded") return [];
		return normalizeQueryAssets(cardsState.value, draftsState.value);
	}, [cardsState, draftsState]);

	const tabs = useMemo(() => {
		if (cardsState.state !== "loaded" || draftsState.state !== "loaded") return [];
		return buildQueryAssetTabs(cardsState.value, draftsState.value);
	}, [cardsState, draftsState]);

	const filteredAssets = useMemo(
		() => filterQueryAssets(allAssets, { tab: activeTab, searchQuery, sourceFilter, statusFilter, sortMode }),
		[allAssets, activeTab, searchQuery, sourceFilter, statusFilter, sortMode],
	);

	const hasLoadedAssets = cardsState.state === "loaded" && draftsState.state === "loaded";
	const isLoading = cardsState.state === "loading" || draftsState.state === "loading";
	const errorState = cardsState.state === "error" ? cardsState.error : draftsState.state === "error" ? draftsState.error : null;

	const sourceFilterOptions = [
		{ value: "all", label: "全部来源" },
		{ value: "manual", label: "正式查询" },
		{ value: "copilot", label: "Copilot 分析" },
	];

	const statusFilterOptions = [
		{ value: "all", label: "全部状态" },
		{ value: "saved", label: "已保存" },
		{ value: "draft", label: "草稿" },
		{ value: "promoted", label: "已转正式查询" },
	];
	const sortModeOptions = [
		{ value: "updated-desc", label: "最近更新优先" },
		{ value: "updated-asc", label: "最早更新优先" },
		{ value: "title-asc", label: "按名称排序" },
	];
	const isDraftActionRunning = (draftId: number, kind: "archive" | "delete") =>
		draftActionState?.draftId === draftId && draftActionState.kind === kind;

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "questions.title")}
				subtitle={t(locale, "questions.subtitle")}
				actions={
					<Link to="/questions/new">
						<Button variant="primary" icon={<PlusIcon />}>
							{t(locale, "questions.new")}
						</Button>
					</Link>
				}
			/>

			{/* Filter Bar */}
			<div className="filterBar">
				<div style={{ flex: 1, maxWidth: 320 }}>
					<SearchInput
						placeholder={t(locale, "common.search")}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onClear={() => setSearchQuery("")}
					/>
				</div>
				<div style={{ width: 180 }}>
					<NativeSelect
						label=""
						value={sourceFilter}
						onChange={(e) => setSourceFilter((e.target.value as QueryAssetSourceFilter) || "all")}
						options={sourceFilterOptions}
					/>
				</div>
				<div style={{ width: 180 }}>
					<NativeSelect
						label=""
						value={statusFilter}
						onChange={(e) => setStatusFilter((e.target.value as QueryAssetStatusFilter) || "all")}
						options={statusFilterOptions}
					/>
				</div>
				<div style={{ width: 180 }}>
					<NativeSelect
						label=""
						value={sortMode}
						onChange={(e) => setSortMode((e.target.value as QueryAssetSortMode) || "updated-desc")}
						options={sortModeOptions}
					/>
				</div>
				<div style={{ marginLeft: "auto", display: "flex", gap: "var(--spacing-xs)" }}>
					<Button
						variant={viewMode === "grid" ? "primary" : "secondary"}
						size="sm"
						icon={<GridIcon />}
						onClick={() => setViewMode("grid")}
						aria-label={t(locale, "common.viewAll")} // Grid view
					/>
					<Button
						variant={viewMode === "list" ? "primary" : "secondary"}
						size="sm"
						icon={<ListIcon />}
						onClick={() => setViewMode("list")}
						aria-label={t(locale, "common.viewAll")} // List view
					/>
				</div>
			</div>

			{tabs.length > 0 && (
				<div className="query-asset-tabs" role="tablist" aria-label="查询资产分组">
					{tabs.map((tab) => (
						<Button
							key={tab.id}
							variant={activeTab === tab.id ? "primary" : "secondary"}
							size="sm"
							onClick={() => setActiveTab(tab.id)}
							aria-pressed={activeTab === tab.id}
						>
							{tab.label} <span className="query-asset-tabs__count">{tab.count}</span>
						</Button>
					))}
				</div>
			)}

			{activeTab === "recent" && hasLoadedAssets && (
				<div className="small muted" style={{ marginBottom: "var(--spacing-md)" }}>
					最近分析优先展示来自 Copilot 的草稿与已晋升结果，方便快速回到上一轮探索链路。
				</div>
			)}

			{/* Loading State */}
			{isLoading && (
				<CardGrid columns={3} gap="md">
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<CardSkeleton key={i} lines={2} />
					))}
				</CardGrid>
			)}

			{/* Error State */}
			{errorState ? <ErrorNotice locale={locale} error={errorState} /> : null}
			{draftActionError ? <ErrorNotice locale={locale} error={draftActionError} /> : null}
			{draftActionMessage ? (
				<Card style={{ marginBottom: "var(--spacing-md)" }}>
					<div className="small" style={{ color: "var(--color-success)", padding: "var(--spacing-sm) var(--spacing-md)" }}>
						{draftActionMessage}
					</div>
				</Card>
			) : null}

			{/* Empty State */}
			{hasLoadedAssets && allAssets.length === 0 && (
				<EmptyState
					icon={<QuestionIcon />}
					title={t(locale, "common.empty")}
					description="还没有创建任何正式查询或 Copilot 草稿。"
					action={
						<Link to="/questions/new">
							<Button variant="primary" icon={<PlusIcon />}>
								{t(locale, "questions.new")}
							</Button>
						</Link>
					}
				/>
			)}

			{/* No Results */}
			{hasLoadedAssets && allAssets.length > 0 && filteredAssets.length === 0 && (
				<EmptyState
					title={t(locale, "common.noResults")}
					description={t(locale, "common.noResultsDesc")}
					action={
						<Button variant="secondary" onClick={() => setSearchQuery("")}>
							{t(locale, "common.clearSearch")}
						</Button>
					}
				/>
			)}

			{/* Grid View */}
			{hasLoadedAssets && filteredAssets.length > 0 && viewMode === "grid" && (
				<CardGrid columns={3} gap="md">
					{filteredAssets.map((item) => (
						<Card key={`${item.assetType}-${item.id}`} variant="hoverable" padding="md">
							<div className="question-card">
								<div className="question-card__icon">
									{getDisplayTypeIcon(item.display ?? undefined)}
								</div>
								<div className="question-card__content">
									<h3 className="question-card__title">
										<Link to={item.href} className="link" style={{ textDecoration: "none" }}>
											{item.title || t(locale, "common.untitled")}
										</Link>
									</h3>
									<div className="question-card__meta">
										<Badge size="sm" variant={item.assetType === "draft" ? "warning" : "default"}>
											{item.sourceLabel}
										</Badge>
										<Badge size="sm" variant={item.assetType === "draft" ? "default" : "success"}>
											{item.statusLabel}
										</Badge>
										{item.display && (
											<Badge size="sm" variant="default">
												{item.display}
											</Badge>
										)}
									</div>
									{item.question && (
										<p className="question-card__question">{item.question}</p>
									)}
									{item.description && !item.question && (
										<p className="question-card__question">{item.description}</p>
									)}
									<div className="query-asset-actions">
										<Link to={item.href} className="link small">
											打开
										</Link>
										{item.assetType === "draft" && (
											<>
												<Button
													variant="secondary"
													size="sm"
													onClick={() => handleDraftAction(item.id, "archive")}
													disabled={draftActionState != null}
												>
													{isDraftActionRunning(item.id, "archive") ? "归档中..." : "归档"}
												</Button>
												<Button
													variant="secondary"
													size="sm"
													onClick={() => handleDraftAction(item.id, "delete")}
													disabled={draftActionState != null}
												>
													{isDraftActionRunning(item.id, "delete") ? "删除中..." : "删除"}
												</Button>
											</>
										)}
									</div>
								</div>
							</div>
						</Card>
					))}
				</CardGrid>
			)}

			{/* List View */}
			{hasLoadedAssets && filteredAssets.length > 0 && viewMode === "list" && (
				<Card padding="none">
					<table className="table">
						<thead>
							<tr>
								<th>{t(locale, "common.name")}</th>
								<th>来源</th>
								<th>状态</th>
								<th>{t(locale, "common.type")}</th>
								<th>动作</th>
								<th style={{ width: 80 }}>{t(locale, "common.id")}</th>
							</tr>
						</thead>
						<tbody>
							{filteredAssets.map((item) => (
								<tr key={`${item.assetType}-${item.id}`}>
									<td>
										<Link to={item.href} className="link">
											{item.title || t(locale, "common.untitled")}
										</Link>
									</td>
									<td>
										<Badge size="sm" variant={item.assetType === "draft" ? "warning" : "default"}>
											{item.sourceLabel}
										</Badge>
									</td>
									<td>
										<Badge size="sm" variant={item.assetType === "draft" ? "default" : "success"}>
											{item.statusLabel}
										</Badge>
									</td>
									<td>
										{item.display && (
											<Badge size="sm" variant="default">
												{item.display}
											</Badge>
										)}
									</td>
									<td>
										<div className="query-asset-actions">
											<Link to={item.href} className="link small">
												打开
											</Link>
											{item.assetType === "draft" && (
												<>
													<Button
														variant="secondary"
														size="sm"
														onClick={() => handleDraftAction(item.id, "archive")}
														disabled={draftActionState != null}
													>
														{isDraftActionRunning(item.id, "archive") ? "归档中..." : "归档"}
													</Button>
													<Button
														variant="secondary"
														size="sm"
														onClick={() => handleDraftAction(item.id, "delete")}
														disabled={draftActionState != null}
													>
														{isDraftActionRunning(item.id, "delete") ? "删除中..." : "删除"}
													</Button>
												</>
											)}
										</div>
									</td>
									<td className="muted">{item.id}</td>
								</tr>
							))}
						</tbody>
					</table>
				</Card>
			)}

			<style>{`
				.question-card {
					display: flex;
					align-items: flex-start;
					gap: var(--spacing-md);
				}

				.question-card__icon {
					display: flex;
					align-items: center;
					justify-content: center;
					width: 40px;
					height: 40px;
					border-radius: var(--radius-md);
					background: var(--color-bg-hover);
					color: var(--color-brand);
					flex-shrink: 0;
				}

				.question-card__content {
					flex: 1;
					min-width: 0;
					display: flex;
					flex-direction: column;
					gap: var(--spacing-xs);
				}

				.query-asset-tabs {
					display: flex;
					flex-wrap: wrap;
					gap: var(--spacing-xs);
					margin-bottom: var(--spacing-md);
				}

				.query-asset-tabs__count {
					margin-left: 4px;
					opacity: 0.75;
				}

				.query-asset-actions {
					display: flex;
					flex-wrap: wrap;
					gap: var(--spacing-xs);
					align-items: center;
				}

				.question-card__title {
					margin: 0;
					font-size: var(--font-size-md);
					font-weight: var(--font-weight-semibold);
					color: var(--color-text-primary);
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}

				.question-card__meta {
					display: flex;
					flex-wrap: wrap;
					gap: var(--spacing-xs);
				}

				.question-card__question {
					margin: 0;
					font-size: var(--font-size-sm);
					color: var(--color-text-secondary);
					line-height: 1.5;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
			`}</style>
		</PageContainer>
	);
}
