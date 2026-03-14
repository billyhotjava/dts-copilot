import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { fetchInstances, type ObjectInstance } from "../../api/hubApi";
import {
	PageContainer,
	PageHeader,
} from "../../components/PageContainer/PageContainer";
import { getEffectiveLocale, t } from "../../i18n";
import "./ObjectBrowserPage.css";

export default function ObjectBrowserPage() {
	const locale = getEffectiveLocale();
	const { typeId } = useParams<{ typeId: string }>();
	const [instances, setInstances] = useState<ObjectInstance[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const objectType: any = undefined;
	const title =
		objectType?.displayName ?? typeId ?? t(locale, "hub.objectBrowser");

	useEffect(() => {
		if (!typeId) return;
		setLoading(true);
		fetchInstances(typeId, undefined, 200)
			.then(setInstances)
			.catch(() => setInstances([]))
			.finally(() => setLoading(false));
	}, [typeId]);

	const filtered = useMemo(() => {
		if (!search.trim()) return instances;
		const q = search.toLowerCase();
		return instances.filter(
			(i) =>
				i.displayName?.toLowerCase().includes(q) ||
				i.externalId?.toLowerCase().includes(q),
		);
	}, [instances, search]);

	// Build columns from ObjectType properties schema
	const columns = useMemo<ColumnsType<ObjectInstance>>(() => {
		const base: ColumnsType<ObjectInstance> = [
			{
				title: locale === "zh-CN" ? "名称" : "Name",
				dataIndex: "displayName",
				key: "displayName",
				render: (text: string, record: ObjectInstance) => (
					<Link to={`/objects/${typeId}/${record.id}`}>{text || "—"}</Link>
				),
			},
			{
				title: locale === "zh-CN" ? "外部ID" : "External ID",
				dataIndex: "externalId",
				key: "externalId",
				width: 160,
			},
		];

		// Add property columns from schema
		const propCols: ColumnsType<ObjectInstance> = (objectType?.properties ?? [])
			.slice(0, 5)
			.map((prop: any) => ({
				title: prop.label || prop.name,
				key: `prop-${prop.name}`,
				width: 140,
				render: (_: unknown, record: ObjectInstance) => {
					const val = record.properties?.[prop.name];
					return val != null ? String(val) : "—";
				},
			}));

		base.push(...propCols);

		base.push({
			title: locale === "zh-CN" ? "更新时间" : "Updated",
			dataIndex: "updatedAt",
			key: "updatedAt",
			width: 180,
			render: (v: string) => (v ? new Date(v).toLocaleString() : "—"),
		});

		return base;
	}, [objectType, typeId, locale]);

	return (
		<PageContainer>
			<PageHeader
				title={`${objectType?.icon ?? "📋"} ${title}`}
				subtitle={t(locale, "hub.objectBrowserDesc")}
			/>

			<div className="ob-toolbar">
				<input
					className="ob-search"
					type="text"
					placeholder={
						locale === "zh-CN"
							? "搜索名称或外部ID..."
							: "Search by name or external ID..."
					}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
				<span className="ob-count">
					{filtered.length} / {instances.length}
				</span>
			</div>

			<Table<ObjectInstance>
				columns={columns}
				dataSource={filtered}
				rowKey="id"
				loading={loading}
				size="small"
				pagination={{ pageSize: 20, showSizeChanger: true }}
				scroll={{ x: 800 }}
			/>
		</PageContainer>
	);
}
