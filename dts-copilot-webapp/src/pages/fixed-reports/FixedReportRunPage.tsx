import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router"
import { analyticsApi, type FixedReportCatalogItem, type FixedReportRunResponse } from "../../api/analyticsApi"
import { ErrorNotice } from "../../components/ErrorNotice"
import { EmptyState } from "../../components/EmptyState"
import { PageContainer, PageHeader } from "../../components/PageContainer/PageContainer"
import {
	buildFixedReportLegacyPageHref,
	buildFixedReportInitialParameterValues,
	buildFixedReportParameterFields,
	getFixedReportTemplateAvailability,
	getFixedReportRunActionState,
} from "./fixedReportCatalogModel"
import { getEffectiveLocale, t, type Locale } from "../../i18n"
import { Badge } from "../../ui/Badge/Badge"
import { Button } from "../../ui/Button/Button"
import { Card, CardBody } from "../../ui/Card/Card"
import { Input, TextArea } from "../../ui/Input/Input"
import { NativeSelect } from "../../ui/Input/Select"
import { Spinner } from "../../ui/Loading/Spinner"

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown }

export default function FixedReportRunPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), [])
	const { templateCode = "" } = useParams()
	const [templateState, setTemplateState] = useState<LoadState<FixedReportCatalogItem>>({ state: "loading" })
	const [runState, setRunState] = useState<LoadState<FixedReportRunResponse> | null>(null)
	const [formValues, setFormValues] = useState<Record<string, string>>({})
	const [running, setRunning] = useState(false)

	useEffect(() => {
		if (!templateCode.trim()) {
			setTemplateState({ state: "error", error: new Error("Missing template code") })
			return
		}
		analyticsApi
			.getFixedReportCatalogItem(templateCode)
			.then((template) => {
				setTemplateState({ state: "loaded", value: template })
			})
			.catch((error) => {
				setTemplateState({ state: "error", error })
			})
	}, [templateCode])

	const template = templateState.state === "loaded"
		? templateState.value
		: undefined
	const legacyPageHref = buildFixedReportLegacyPageHref(template?.legacyPagePath)
	const fields = buildFixedReportParameterFields(template?.parameterSchemaJson, template)
	const availability = getFixedReportTemplateAvailability(template, {
		backedLabel: t(locale, "fixedReports.backed"),
		placeholderLabel: t(locale, "fixedReports.placeholder"),
	})
	const actionState = getFixedReportRunActionState(
		running,
		template?.placeholderReviewRequired === true,
		{
			idleLabel: t(locale, "fixedReports.runAction"),
			runningLabel: t(locale, "fixedReports.runActionRunning"),
			placeholderLabel: t(locale, "fixedReports.placeholder"),
		},
	)

	useEffect(() => {
		setFormValues(buildFixedReportInitialParameterValues(fields))
	}, [fields])

	async function handleRun() {
		if (!templateCode || running) {
			return
		}
		setRunning(true)
		setRunState(null)
		try {
			const parameters = Object.fromEntries(
				Object.entries(formValues).filter(([, value]) => value.trim().length > 0),
			)
			const response = await analyticsApi.runFixedReport(template?.templateCode ?? templateCode, { parameters })
			setRunState({ state: "loaded", value: response })
		} catch (error) {
			setRunState({ state: "error", error })
		} finally {
			setRunning(false)
		}
	}

	return (
		<PageContainer>
			<PageHeader
				title={template?.name ?? t(locale, "fixedReports.runTitle")}
				subtitle={template?.description ?? t(locale, "fixedReports.runSubtitle")}
				actions={
					<Link to="/fixed-reports">
						<Button variant="secondary">{t(locale, "fixedReports.back")}</Button>
					</Link>
				}
			/>

			{templateState.state === "loading" && (
				<Card>
					<CardBody>
						<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}>
							<Spinner size="lg" />
						</div>
					</CardBody>
				</Card>
			)}

			{templateState.state === "error" && <ErrorNotice locale={locale} error={templateState.error} />}

			{templateState.state === "loaded" && !template && (
				<EmptyState title={t(locale, "fixedReports.notFound")} description={t(locale, "fixedReports.notFoundDesc")} />
			)}

			{templateState.state === "loaded" && template && (
				<div className="grid2" style={{ alignItems: "start" }}>
					<Card>
						<CardBody>
							<div style={{ display: "flex", gap: "var(--spacing-xs)", flexWrap: "wrap", marginBottom: "var(--spacing-md)" }}>
								<Badge variant="default" size="sm">{template.domain ?? "-"}</Badge>
								<Badge variant="default" size="sm">{template.category ?? "-"}</Badge>
								<Badge variant="default" size="sm">{template.refreshPolicy ?? "-"}</Badge>
								<Badge variant={availability.badgeVariant} size="sm">{availability.badgeLabel}</Badge>
							</div>

							{template.placeholderReviewRequired === true && (
								<div
									style={{
										marginBottom: "var(--spacing-md)",
										padding: "var(--spacing-md)",
										borderRadius: "var(--radius-md)",
										border: "1px solid color-mix(in srgb, var(--color-warning-500) 40%, transparent)",
										background: "color-mix(in srgb, var(--color-warning-500) 8%, white)",
										color: "var(--color-text-primary)",
										fontSize: "var(--font-size-sm)",
									}}
								>
									{t(locale, "fixedReports.placeholderNotice")}
								</div>
							)}

							{legacyPageHref && (
								<div
									style={{
										marginBottom: "var(--spacing-md)",
										padding: "var(--spacing-md)",
										borderRadius: "var(--radius-md)",
										border: "1px solid var(--color-border)",
										background: "var(--color-surface-subtle, #f8fafc)",
										fontSize: "var(--font-size-sm)",
									}}
								>
									<div className="small muted" style={{ marginBottom: "var(--spacing-xs)" }}>
										{t(locale, "fixedReports.legacyPage")}
									</div>
									<a href={legacyPageHref} target="_blank" rel="noreferrer">
										{t(locale, "fixedReports.openLegacyPage")}
										{template?.legacyPageTitle ? `：${template.legacyPageTitle}` : ""}
									</a>
								</div>
							)}

							{fields.length === 0 ? (
								<div className="text-muted">{t(locale, "fixedReports.noParameters")}</div>
							) : (
								<div className="col" style={{ gap: "var(--spacing-md)" }}>
									{fields.map((field) =>
										field.type === "select" ? (
											<NativeSelect
												key={field.key}
												label={field.label}
												value={formValues[field.key] ?? ""}
												options={field.options.map((option) => ({
													label: option.label,
													value: String(option.value),
												}))}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										) : field.type === "textarea" ? (
											<TextArea
												key={field.key}
												label={field.label}
												required={field.required}
												value={formValues[field.key] ?? ""}
												placeholder={field.placeholder}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										) : (
											<Input
												key={field.key}
												label={field.label}
												required={field.required}
												type={
													field.type === "date"
														? "date"
														: field.type === "month"
															? "month"
															: field.type === "number"
																? "number"
																: "text"
												}
												value={formValues[field.key] ?? ""}
												placeholder={
													field.placeholder
													?? (field.type === "daterange" ? t(locale, "fixedReports.dateRangePlaceholder") : undefined)
												}
												helperText={field.type === "daterange" ? t(locale, "fixedReports.dateRangeHelp") : undefined}
												onChange={(event) =>
													setFormValues((current) => ({ ...current, [field.key]: event.target.value }))
												}
											/>
										),
									)}
								</div>
							)}

							<div style={{ marginTop: "var(--spacing-lg)", display: "flex", justifyContent: "flex-end" }}>
								<Button variant="primary" disabled={actionState.disabled} onClick={handleRun}>
									{actionState.label}
								</Button>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardBody>
							<div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)", marginBottom: "var(--spacing-md)" }}>
								{t(locale, "fixedReports.resultTitle")}
							</div>

							{runState == null && (
								<div className="text-muted">
									{template.placeholderReviewRequired === true
										? t(locale, "fixedReports.resultPlaceholderBacking")
										: t(locale, "fixedReports.resultPlaceholder")}
								</div>
							)}
							{runState?.state === "error" && <ErrorNotice locale={locale} error={runState.error} />}
							{runState?.state === "loaded" && (
								<div className="col" style={{ gap: "var(--spacing-sm)" }}>
									<div><span className="small muted">{t(locale, "fixedReports.route")}:</span> {runState.value.route ?? "-"}</div>
									<div><span className="small muted">{t(locale, "fixedReports.sourceType")}:</span> {runState.value.sourceType ?? "-"}</div>
									<div><span className="small muted">{t(locale, "fixedReports.freshness")}:</span> {runState.value.freshness ?? "-"}</div>
									<div><span className="small muted">{t(locale, "fixedReports.status")}:</span> {runState.value.executionStatus ?? "-"}</div>
									<div><span className="small muted">{t(locale, "fixedReports.rationale")}:</span> {runState.value.rationale ?? "-"}</div>
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			)}
		</PageContainer>
	)
}
