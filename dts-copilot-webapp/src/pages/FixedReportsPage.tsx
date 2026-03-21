import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { analyticsApi, type FixedReportCatalogItem } from "../api/analyticsApi"
import { ErrorNotice } from "../components/ErrorNotice"
import { EmptyState } from "../components/EmptyState"
import { PageContainer, PageHeader } from "../components/PageContainer/PageContainer"
import {
	buildFixedReportDomainTabs,
	filterFixedReportTemplates,
	getFixedReportTemplateAvailability,
} from "./fixed-reports/fixedReportCatalogModel"
import { getEffectiveLocale, t, type Locale } from "../i18n"
import { Badge } from "../ui/Badge/Badge"
import { Button } from "../ui/Button/Button"
import { Card, CardBody } from "../ui/Card/Card"
import { Spinner } from "../ui/Loading/Spinner"
import { Tab, TabList, Tabs } from "../ui/Tabs/Tabs"
import "./page.css"

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown }

export default function FixedReportsPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), [])
	const [state, setState] = useState<LoadState<FixedReportCatalogItem[]>>({ state: "loading" })
	const [activeDomain, setActiveDomain] = useState("all")

	useEffect(() => {
		analyticsApi
			.listFixedReportCatalog({ limit: 200 })
			.then((rows) => {
				setState({ state: "loaded", value: Array.isArray(rows) ? rows : [] })
			})
			.catch((error) => {
				setState({ state: "error", error })
			})
	}, [])

	const tabs = state.state === "loaded"
		? buildFixedReportDomainTabs(state.value, {
			allLabel: t(locale, "fixedReports.all"),
			uncategorizedLabel: t(locale, "fixedReports.uncategorized"),
		})
		: [{ id: "all", label: t(locale, "fixedReports.all"), count: 0 }]
	const visibleReports = state.state !== "loaded"
		? []
		: filterFixedReportTemplates(state.value, activeDomain)

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "fixedReports.title")}
				subtitle={t(locale, "fixedReports.subtitle")}
			/>

			{state.state === "loading" && (
				<Card>
					<CardBody>
						<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}>
							<Spinner size="lg" />
						</div>
					</CardBody>
				</Card>
			)}

			{state.state === "error" && <ErrorNotice locale={locale} error={state.error} />}

			{state.state === "loaded" && (
				<>
					<Tabs value={activeDomain} onChange={setActiveDomain} variant="pill">
						<TabList aria-label={t(locale, "fixedReports.tabs")}>
							{tabs.map((tab) => (
								<Tab key={tab.id} value={tab.id}>
									{tab.label} ({tab.count})
								</Tab>
							))}
						</TabList>
					</Tabs>

					<div style={{ height: "var(--spacing-md)" }} />

					{visibleReports.length === 0 ? (
						<EmptyState title={t(locale, "fixedReports.empty")} description={t(locale, "fixedReports.emptyDesc")} />
					) : (
						<div className="grid3">
							{visibleReports.map((report) => {
								const availability = getFixedReportTemplateAvailability(report, {
									backedLabel: t(locale, "fixedReports.backed"),
									placeholderLabel: t(locale, "fixedReports.placeholder"),
								})
								return (
									<Card key={report.templateCode ?? String(report.id)} variant="hoverable">
										<CardBody>
										<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--spacing-sm)" }}>
											<div style={{ minWidth: 0 }}>
												<div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)" }}>
													{report.name ?? report.templateCode ?? "-"}
												</div>
												<div className="text-muted" style={{ marginTop: "var(--spacing-xs)", fontSize: "var(--font-size-sm)" }}>
													{report.description ?? t(locale, "fixedReports.noDescription")}
												</div>
											</div>
											<Badge variant="default" size="sm">
												{report.domain ?? "-"}
											</Badge>
										</div>

										<div style={{ display: "flex", gap: "var(--spacing-xs)", flexWrap: "wrap", marginTop: "var(--spacing-md)" }}>
											<Badge variant="default" size="sm">{report.category ?? "-"}</Badge>
											<Badge variant="default" size="sm">{report.refreshPolicy ?? "-"}</Badge>
											<Badge variant="default" size="sm">{report.dataSourceType ?? "-"}</Badge>
											<Badge variant={availability.badgeVariant} size="sm">{availability.badgeLabel}</Badge>
										</div>

										<div style={{ marginTop: "var(--spacing-md)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--spacing-sm)" }}>
											<div className="small muted">{report.templateCode ?? "-"}</div>
											{availability.canRun ? (
												<Link to={`/fixed-reports/${encodeURIComponent(report.templateCode ?? "")}/run`}>
													<Button variant="primary" size="sm">
														{t(locale, "fixedReports.run")}
													</Button>
												</Link>
											) : (
												<Button variant="secondary" size="sm" disabled>
													{t(locale, "fixedReports.placeholder")}
												</Button>
											)}
										</div>
										</CardBody>
									</Card>
								)
							})}
						</div>
					)}
				</>
			)}
		</PageContainer>
	)
}
