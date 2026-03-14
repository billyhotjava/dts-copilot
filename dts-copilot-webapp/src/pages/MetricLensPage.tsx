import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type MetricLensCompare, type MetricLensDetail, type MetricLensSummary } from "../api/analyticsApi";
import { ErrorNotice } from "../components/ErrorNotice";
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import { toIdString, type LoadState } from "../shared/utils";
import { Badge } from "../ui/Badge/Badge";
import { Button } from "../ui/Button/Button";
import { Card, CardBody, CardHeader } from "../ui/Card/Card";
import { NativeSelect } from "../ui/Input/Select";
import { Spinner } from "../ui/Loading/Spinner";
import "./page.css";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type FieldRowProps = {
	label: string;
	value: string;
};

function FieldRow({ label, value }: FieldRowProps) {
	return (
		<div>
			<div className="small muted">{label}</div>
			<div style={{ marginTop: "var(--spacing-xxs)" }}>{value || "-"}</div>
		</div>
	);
}

type MetricDetailViewProps = {
	detail: MetricLensDetail;
};

function MetricDetailView({ detail }: MetricDetailViewProps) {
	const conflicts = Array.isArray(detail.conflicts) ? detail.conflicts : [];
	const versions = Array.isArray(detail.versions) ? detail.versions : [];

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			<div className="grid2" style={{ gap: "var(--spacing-sm)" }}>
				<FieldRow label="指标 ID" value={toIdString(detail.metricId)} />
				<FieldRow label="名称" value={detail.name ?? "-"} />
				<FieldRow label="聚合方式" value={detail.aggregation ?? "-"} />
				<FieldRow label="时间口径" value={detail.timeGrain ?? "-"} />
				<FieldRow label="当前版本" value={detail.version ?? "-"} />
				<FieldRow label="ACL 范围" value={detail.aclScope ?? "-"} />
			</div>

			{versions.length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>版本历史</div>
					<table className="table">
						<thead>
							<tr>
								<th>#</th>
								<th>版本标识</th>
							</tr>
						</thead>
						<tbody>
							{versions.map((v, idx) => (
								<tr key={`v-${idx}`}>
									<td className="muted">{idx + 1}</td>
									<td>{v}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{conflicts.length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>
						口径冲突 <Badge variant="error" size="sm">{conflicts.length}</Badge>
					</div>
					<table className="table">
						<thead>
							<tr>
								<th>类型</th>
								<th>等级</th>
								<th>详情</th>
							</tr>
						</thead>
						<tbody>
							{conflicts.map((c, idx) => (
								<tr key={`conflict-${idx}`}>
									<td>{String(c.type ?? "-")}</td>
									<td>{String(c.level ?? "-")}</td>
									<td className="small muted">{String(c.detail ?? c.message ?? "")}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{detail.lineage && Object.keys(detail.lineage).length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>血缘信息</div>
					<div
						style={{
							padding: "var(--spacing-sm)",
							background: "var(--color-bg-secondary)",
							borderRadius: "var(--radius-sm)",
							fontSize: "var(--font-size-sm)",
						}}
					>
						{Object.entries(detail.lineage).map(([key, val]) => (
							<div key={key} style={{ display: "flex", gap: "var(--spacing-xs)", marginBottom: "var(--spacing-xxs)" }}>
								<span className="muted" style={{ flexShrink: 0 }}>{key}:</span>
								<span style={{ wordBreak: "break-all" }}>{typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

type CompareDeltaRowProps = {
	label: string;
	left: unknown;
	right: unknown;
};

function CompareDeltaRow({ label, left, right }: CompareDeltaRowProps) {
	const leftStr = left == null ? "-" : typeof left === "object" ? JSON.stringify(left) : String(left);
	const rightStr = right == null ? "-" : typeof right === "object" ? JSON.stringify(right) : String(right);
	const changed = leftStr !== rightStr;
	return (
		<tr style={{ background: changed ? "var(--color-warning-light, #fffbe6)" : undefined }}>
			<td className="small muted">{label}</td>
			<td style={{ wordBreak: "break-all" }}>{leftStr}</td>
			<td style={{ wordBreak: "break-all" }}>{rightStr}</td>
		</tr>
	);
}

type CompareViewProps = {
	result: MetricLensCompare;
};

function CompareView({ result }: CompareViewProps) {
	const left = result.leftVersion ?? {};
	const right = result.rightVersion ?? {};
	const delta = result.delta ?? {};
	const allKeys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));

	return (
		<div className="col" style={{ gap: "var(--spacing-md)" }}>
			{allKeys.length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>字段对比</div>
					<table className="table">
						<thead>
							<tr>
								<th>字段</th>
								<th>左版本</th>
								<th>右版本</th>
							</tr>
						</thead>
						<tbody>
							{allKeys.map((key) => (
								<CompareDeltaRow key={key} label={key} left={left[key]} right={right[key]} />
							))}
						</tbody>
					</table>
				</div>
			)}

			{Object.keys(delta).length > 0 && (
				<div>
					<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>变更摘要</div>
					<div
						style={{
							padding: "var(--spacing-sm)",
							background: "var(--color-bg-secondary)",
							borderRadius: "var(--radius-sm)",
							fontSize: "var(--font-size-sm)",
						}}
					>
						{Object.entries(delta).map(([key, val]) => (
							<div key={key} style={{ display: "flex", gap: "var(--spacing-xs)", marginBottom: "var(--spacing-xxs)" }}>
								<span className="muted" style={{ flexShrink: 0 }}>{key}:</span>
								<span style={{ wordBreak: "break-all" }}>{typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetricLensPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const [listState, setListState] = useState<LoadState<MetricLensSummary[]>>({ state: "loading" });
	const [conflictState, setConflictState] = useState<LoadState<Array<Record<string, unknown>>>>({ state: "loading" });
	const [detailState, setDetailState] = useState<LoadState<MetricLensDetail> | null>(null);
	const [compareState, setCompareState] = useState<LoadState<MetricLensCompare> | null>(null);

	const [selectedMetricId, setSelectedMetricId] = useState("");
	const [leftVersion, setLeftVersion] = useState("");
	const [rightVersion, setRightVersion] = useState("");

	const loadList = async () => {
		try {
			setListState({ state: "loading" });
			const rows = await analyticsApi.listMetricLens();
			const safeRows = Array.isArray(rows) ? rows : [];
			setListState({ state: "loaded", value: safeRows });
			if (!selectedMetricId && safeRows.length > 0) {
				setSelectedMetricId(toIdString(safeRows[0]?.metricId));
			}
		} catch (e) {
			setListState({ state: "error", error: e });
		}
	};

	const loadConflicts = async () => {
		try {
			setConflictState({ state: "loading" });
			const rows = await analyticsApi.getMetricLensConflicts();
			setConflictState({ state: "loaded", value: Array.isArray(rows) ? rows : [] });
		} catch (e) {
			setConflictState({ state: "error", error: e });
		}
	};

	const loadDetail = async (metricId: string) => {
		if (!metricId) {
			setDetailState(null);
			return;
		}
		try {
			setDetailState({ state: "loading" });
			const detail = await analyticsApi.getMetricLens(metricId);
			setDetailState({ state: "loaded", value: detail });
			const versions = Array.isArray(detail.versions) ? detail.versions : [];
			setLeftVersion(versions[0] ? String(versions[0]) : "");
			setRightVersion(versions[1] ? String(versions[1]) : versions[0] ? String(versions[0]) : "");
			setCompareState(null);
		} catch (e) {
			setDetailState({ state: "error", error: e });
		}
	};

	useEffect(() => {
		void Promise.all([loadList(), loadConflicts()]);
	}, []);

	useEffect(() => {
		if (!selectedMetricId) return;
		void loadDetail(selectedMetricId);
	}, [selectedMetricId]);

	const runCompare = async () => {
		if (!selectedMetricId || !leftVersion || !rightVersion) return;
		try {
			setCompareState({ state: "loading" });
			const result = await analyticsApi.compareMetricLensVersions(selectedMetricId, leftVersion, rightVersion);
			setCompareState({ state: "loaded", value: result });
		} catch (e) {
			setCompareState({ state: "error", error: e });
		}
	};

	const metricOptions = listState.state === "loaded"
		? listState.value.map((item) => ({
			value: toIdString(item.metricId),
			label: `${item.name || "未命名指标"} (#${toIdString(item.metricId)})`,
		}))
		: [{ value: "", label: t(locale, "loading") }];

	const detail = detailState?.state === "loaded" ? detailState.value : null;
	const versions = detail && Array.isArray(detail.versions) ? detail.versions.map((item) => String(item)) : [];
	const versionOptions = versions.map((item) => ({ value: item, label: item }));

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "metricLens.title")}
				subtitle={t(locale, "metricLens.subtitle")}
				actions={
					<Button variant="secondary" size="sm" onClick={() => void Promise.all([loadList(), loadConflicts()])}>
						{t(locale, "common.refresh")}
					</Button>
				}
			/>

			<div className="grid2" style={{ marginBottom: "var(--spacing-lg)" }}>
				<Card>
					<CardHeader
						title="指标清单"
						action={listState.state === "loaded" ? <Badge>{listState.value.length}</Badge> : null}
					/>
					<CardBody>
						{listState.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{listState.state === "error" && <ErrorNotice locale={locale} error={listState.error} />}
						{listState.state === "loaded" && listState.value.length === 0 && (
							<div className="muted">{t(locale, "common.empty")}</div>
						)}
						{listState.state === "loaded" && listState.value.length > 0 && (
							<>
								<NativeSelect
									label="选择指标"
									value={selectedMetricId}
									onChange={(event) => setSelectedMetricId(event.target.value)}
									options={metricOptions}
								/>
								<table className="table" style={{ marginTop: "var(--spacing-md)" }}>
									<thead>
										<tr>
											<th>{t(locale, "common.name")}</th>
											<th>聚合</th>
											<th>时间口径</th>
										</tr>
									</thead>
									<tbody>
										{listState.value.map((row, idx) => {
											const rowId = toIdString(row.metricId);
											return (
												<tr
													key={`${rowId}-${idx}`}
													onClick={() => setSelectedMetricId(rowId)}
													style={{ cursor: "pointer", background: selectedMetricId === rowId ? "var(--color-bg-hover)" : undefined }}
												>
													<td>{row.name || "-"}</td>
													<td>{row.aggregation || "-"}</td>
													<td>{row.timeGrain || "-"}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</>
						)}
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="冲突检测" />
					<CardBody>
						{conflictState.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{conflictState.state === "error" && <ErrorNotice locale={locale} error={conflictState.error} />}
						{conflictState.state === "loaded" && conflictState.value.length === 0 && (
							<div className="muted">当前未发现口径冲突。</div>
						)}
						{conflictState.state === "loaded" && conflictState.value.length > 0 && (
							<table className="table">
								<thead>
									<tr>
										<th>指标名</th>
										<th>等级</th>
										<th>冲突类型</th>
									</tr>
								</thead>
								<tbody>
									{conflictState.value.map((row, idx) => (
										<tr key={`conflict-${idx}`}>
											<td>{String(row.metricName || "-")}</td>
											<td>{String(row.conflictLevel || "-")}</td>
											<td>{Array.isArray(row.type) ? row.type.map(String).join(", ") : "-"}</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</CardBody>
				</Card>
			</div>

			<div className="grid2">
				<Card>
					<CardHeader title="指标透视详情" />
					<CardBody>
						{detailState == null && <div className="muted">选择指标查看详情。</div>}
						{detailState?.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{detailState?.state === "error" && <ErrorNotice locale={locale} error={detailState.error} />}
						{detail && <MetricDetailView detail={detail} />}
					</CardBody>
				</Card>

				<Card>
					<CardHeader title="版本对比" />
					<CardBody>
						<div className="col" style={{ gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
							<NativeSelect
								label="左版本"
								value={leftVersion}
								onChange={(event) => setLeftVersion(event.target.value)}
								options={versionOptions}
								disabled={versions.length === 0}
							/>
							<NativeSelect
								label="右版本"
								value={rightVersion}
								onChange={(event) => setRightVersion(event.target.value)}
								options={versionOptions}
								disabled={versions.length === 0}
							/>
							<Button variant="primary" onClick={() => void runCompare()} disabled={!leftVersion || !rightVersion || !selectedMetricId}>
								执行对比
							</Button>
						</div>
						{compareState?.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-lg)" }}>
								<Spinner size="md" />
							</div>
						)}
						{compareState?.state === "error" && <ErrorNotice locale={locale} error={compareState.error} />}
						{compareState?.state === "loaded" && <CompareView result={compareState.value} />}
					</CardBody>
				</Card>
			</div>
		</PageContainer>
	);
}
