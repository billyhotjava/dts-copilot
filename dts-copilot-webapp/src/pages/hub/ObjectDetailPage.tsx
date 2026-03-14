import { Descriptions } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
	type ActionTypeDef,
	fetchActionTypes,
	fetchInstance,
	fetchInstanceGraph,
	fetchInstanceSignals,
	type GraphView,
	type ObjectInstance,
	type QualitySignal,
} from "../../api/hubApi";
import { ActionExecutePanel } from "../../components/hub/ActionExecutePanel";
import { QualityAlertBanner } from "../../components/hub/QualityAlertBanner";
import { RelatedObjectList } from "../../components/hub/RelatedObjectList";
import {
	PageContainer,
	PageHeader,
} from "../../components/PageContainer/PageContainer";
import { SESSION_KEY_PREFIX } from "../../hooks/useCopilotContext";
import { getEffectiveLocale, t } from "../../i18n";
import "./ObjectDetailPage.css";

export default function ObjectDetailPage() {
	const locale = getEffectiveLocale();
	const { typeId, id } = useParams<{ typeId: string; id: string }>();
	const [instance, setInstance] = useState<ObjectInstance | null>(null);
	const [actions, setActions] = useState<ActionTypeDef[]>([]);
	const [signals, setSignals] = useState<QualitySignal[]>([]);
	const [graph, setGraph] = useState<GraphView | null>(null);
	const [loading, setLoading] = useState(true);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const objectType: any = undefined;
	const properties = objectType?.properties ?? [];

	useEffect(() => {
		if (!id || !typeId) return;
		setLoading(true);

		Promise.all([
			fetchInstance(id),
			fetchActionTypes(typeId),
			fetchInstanceSignals(id),
			fetchInstanceGraph(id, 1),
		])
			.then(([inst, acts, sigs, g]) => {
				setInstance(inst);
				setActions(acts);
				setSignals(sigs);
				setGraph(g);
			})
			.catch(() => {
				/* best-effort */
			})
			.finally(() => setLoading(false));
	}, [id, typeId]);

	useEffect(() => {
		if (!id || !instance?.displayName) return;
		try {
			sessionStorage.setItem(
				`${SESSION_KEY_PREFIX}.${id}`,
				instance.displayName,
			);
		} catch {
			/* ignore */
		}
	}, [id, instance?.displayName]);

	const title = instance?.displayName ?? t(locale, "hub.objectDetail");

	if (loading) {
		return (
			<PageContainer>
				<PageHeader title={title} subtitle={t(locale, "hub.loading")} />
				<div className="od-loading">{t(locale, "loading")}</div>
			</PageContainer>
		);
	}

	if (!instance) {
		return (
			<PageContainer>
				<PageHeader
					title={t(locale, "hub.objectDetail")}
					subtitle={`ID: ${id}`}
				/>
				<div className="od-not-found">
					{locale === "zh-CN" ? "对象实例未找到" : "Instance not found"}
				</div>
			</PageContainer>
		);
	}

	// Build description items from schema properties + instance.properties
	const descItems = properties.map((prop: any) => ({
		key: prop.name,
		label: prop.label || prop.name,
		children: formatValue(instance.properties?.[prop.name]),
	}));

	// Add system fields
	descItems.push(
		{
			key: "_externalId",
			label: "External ID",
			children: instance.externalId || "—",
		},
		{
			key: "_updatedAt",
			label: locale === "zh-CN" ? "更新时间" : "Updated",
			children: instance.updatedAt
				? new Date(instance.updatedAt).toLocaleString()
				: "—",
		},
		{
			key: "_createdAt",
			label: locale === "zh-CN" ? "创建时间" : "Created",
			children: instance.createdAt
				? new Date(instance.createdAt).toLocaleString()
				: "—",
		},
	);

	return (
		<PageContainer>
			<PageHeader
				title={`${objectType?.icon ?? "📋"} ${title}`}
				subtitle={`${objectType?.displayName ?? typeId} · ${instance.externalId || id}`}
			/>

			{signals.length > 0 && <QualityAlertBanner signals={signals} />}

			<div className="od-content">
				<section className="od-section">
					<Descriptions
						bordered
						size="small"
						column={{ xs: 1, sm: 2, lg: 3 }}
						items={descItems}
					/>
				</section>

				{actions.length > 0 && id && (
					<section className="od-section">
						<ActionExecutePanel instanceId={id} actions={actions} />
					</section>
				)}

				{graph && id && (
					<section className="od-section">
						<RelatedObjectList graph={graph} currentId={id} />
					</section>
				)}
			</div>
		</PageContainer>
	);
}

function formatValue(v: unknown): string {
	if (v == null) return "—";
	if (typeof v === "object") return JSON.stringify(v);
	return String(v);
}
