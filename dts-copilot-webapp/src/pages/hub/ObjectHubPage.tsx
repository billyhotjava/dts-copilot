import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { HubSummary, ObjectInstance } from "../../api/hubApi";
import { fetchHubSummary, fetchInstances } from "../../api/hubApi";
import { HubSearchBar } from "../../components/hub/HubSearchBar";
import { KeyMetricsDashboard } from "../../components/hub/KeyMetricsDashboard";
import { ObjectTypeTile } from "../../components/hub/ObjectTypeTile";
import { PendingActionList } from "../../components/hub/PendingActionList";
import {
	PageContainer,
	PageHeader,
} from "../../components/PageContainer/PageContainer";
import { getEffectiveLocale, t } from "../../i18n";
import "./ObjectHubPage.css";

interface SearchResult extends ObjectInstance {
	typeName: string;
}

export default function ObjectHubPage() {
	const locale = getEffectiveLocale();
	const packId: string | null = null;
	const [summary, setSummary] = useState<HubSummary | null>(null);
	const [loading, setLoading] = useState(false);
	const [searching, setSearching] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

	useEffect(() => {
		if (!packId) {
			setSummary(null);
			return;
		}

		setLoading(true);
		setSearchKeyword("");
		setSearchResults([]);
		fetchHubSummary(packId)
			.then(setSummary)
			.catch(() => setSummary(null))
			.finally(() => setLoading(false));
	}, [packId]);

	const objectTypes = summary?.objectTypes ?? [];

	const totalInstances = useMemo(
		() => objectTypes.reduce((sum, item) => sum + item.instanceCount, 0),
		[objectTypes],
	);

	useEffect(() => {
		if (!packId || !searchKeyword.trim()) {
			setSearchResults([]);
			return;
		}
		if (objectTypes.length === 0) {
			setSearchResults([]);
			return;
		}

		setSearching(true);
		const keyword = searchKeyword.trim();
		Promise.all(
			objectTypes.map(async (type) => {
				const list = await fetchInstances(type.typeId, keyword, 50);
				return list.map((item) => ({
					...item,
					typeName: type.displayName,
				}));
			}),
		)
			.then((rows) => {
				const merged = rows
					.flat()
					.filter(
						(row) =>
							row.displayName?.includes(keyword) ||
							row.externalId?.includes(keyword),
					);
				setSearchResults(merged);
			})
			.catch(() => setSearchResults([]))
			.finally(() => setSearching(false));
	}, [packId, objectTypes, searchKeyword]);

	const objectTypeNodes = objectTypes.map((type) => (
		<ObjectTypeTile key={type.typeId} summary={type} packId={packId} />
	));

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "hub.title")}
				subtitle={t(locale, "hub.subtitle")}
			/>

			{loading ? (
				<div className="hub-loading">{t(locale, "hub.loading")}</div>
			) : !packId ? (
				<div className="hub-empty">请选择一个 AppPack 后查看对象中心</div>
			) : (
				<div className="hub-content">
					<div className="hub-search">
						<HubSearchBar
							packId={packId}
							onSearch={setSearchKeyword}
							loading={searching}
						/>
					</div>

					<div className="hub-stats">
						<span>
							{locale === "zh-CN"
								? `对象类型 ${objectTypes.length} 类`
								: `${objectTypes.length} object types`}
						</span>
						<span className="hub-stats__sep" />
						<span>
							{locale === "zh-CN"
								? `${totalInstances} 个对象实例`
								: `${totalInstances} instances`}
						</span>
					</div>

					{summary ? (
						<KeyMetricsDashboard metrics={summary.keyMetrics} />
					) : null}

					<div className="hub-panels">
						<section className="hub-section">
							<h3>{t(locale, "hub.objectTypes")}</h3>
							{objectTypes.length === 0 ? (
								<div className="hub-grid__empty">
									{t(locale, "hub.noObjectTypes")}
								</div>
							) : (
								<div className="hub-grid">{objectTypeNodes}</div>
							)}
						</section>
						<section className="hub-section">
							<PendingActionList actions={summary?.pendingActions ?? []} />
						</section>
					</div>

					{searchKeyword.trim() && (
						<div className="hub-search-results">
							<div className="hub-search-results__title">
								{locale === "zh-CN"
									? `搜索“${searchKeyword}”结果：${searchResults.length}`
									: `Search '${searchKeyword}': ${searchResults.length} results`}
							</div>
							{searchResults.length === 0 ? (
								<div className="hub-grid__empty">
									{searching
										? t(locale, "hub.loading")
										: t(locale, "common.noResults")}
								</div>
							) : (
								searchResults.slice(0, 100).map((item) => (
									<div key={item.id} className="hub-search-results__item">
										<div>
											<div>
												{item.displayName || item.externalId || item.id}
											</div>
											<div className="hub-search-results__meta">
												{item.typeName}
											</div>
										</div>
										<Link to={`/objects/${item.typeId}/${item.id}`}>
											{t(locale, "common.open")}
										</Link>
									</div>
								))
							)}
						</div>
					)}
				</div>
			)}
		</PageContainer>
	);
}
