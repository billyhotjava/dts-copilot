import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { analyticsApi, type ManagedDataSourceCreatePayload } from "../api/analyticsApi";
import { PageContainer, PageHeader, Breadcrumb } from "../components/PageContainer/PageContainer";
import { ErrorNotice } from "../components/ErrorNotice";
import { Card, CardHeader, CardBody, CardFooter } from "../ui/Card/Card";
import { Button } from "../ui/Button/Button";
import { Input, TextArea } from "../ui/Input/Input";
import { NativeSelect } from "../ui/Input/Select";
import { Badge } from "../ui/Badge/Badge";
import { Spinner } from "../ui/Loading/Spinner";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import {
	MANAGED_DATA_SOURCE_TYPE_OPTIONS,
	validateManagedDataSourceForm,
	type ManagedDataSourceFormErrors,
	type ManagedDataSourceFormValues,
} from "./databaseEntryModel";
import "./page.css";

const DatabaseIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<ellipse cx="12" cy="5" rx="9" ry="3" />
		<path d="M3 5v14a9 3 0 0 0 18 0V5" />
		<path d="M3 12a9 3 0 0 0 18 0" />
	</svg>
);

type LoadState =
	| { state: "loading" }
	| { state: "loaded" }
	| { state: "error"; error: unknown };

function parseJdbcUrl(jdbcUrl: string): { host: string; port: string; database: string } {
	const result = { host: "", port: "", database: "" };
	if (!jdbcUrl) return result;

	// jdbc:postgresql://host:port/database or jdbc:mysql://host:port/database
	const match = jdbcUrl.match(/^jdbc:\w+:\/\/([^:/]+)(?::(\d+))?\/([^?]+)/);
	if (match) {
		result.host = match[1] || "";
		result.port = match[2] || "";
		result.database = match[3] || "";
	}
	return result;
}

function manualFieldErrorMessage(
	locale: Locale,
	field: keyof ManagedDataSourceFormErrors,
	code?: ManagedDataSourceFormErrors[keyof ManagedDataSourceFormErrors],
) {
	if (!code) return undefined;
	if (code !== "required") return t(locale, "error");
	switch (field) {
		case "name":
			return t(locale, "data.validation.sourceNameRequired");
		case "type":
			return t(locale, "data.validation.typeRequired");
		case "host":
			return t(locale, "data.validation.hostRequired");
		case "database":
			return t(locale, "data.validation.databaseRequired");
		default:
			return t(locale, "error");
	}
}

export default function DatabaseEditPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const navigate = useNavigate();
	const { dbId } = useParams();

	const [loadState, setLoadState] = useState<LoadState>({ state: "loading" });
	const [form, setForm] = useState<ManagedDataSourceFormValues>({
		name: "",
		type: "postgres",
		host: "",
		port: "",
		database: "",
		username: "",
		password: "",
		description: "",
	});
	const [dataSourceId, setDataSourceId] = useState<number | null>(null);
	const [formErrors, setFormErrors] = useState<ManagedDataSourceFormErrors>({});
	const [testing, setTesting] = useState(false);
	const [saving, setSaving] = useState(false);
	const [okMessage, setOkMessage] = useState("");
	const [error, setError] = useState<unknown>(null);

	useEffect(() => {
		if (!dbId) return;
		setLoadState({ state: "loading" });
		analyticsApi
			.getDatabase(dbId)
			.then(async (db: any) => {
				const dsId = db?.details?.dataSourceId ?? db?.details?.datasourceId;
				if (dsId != null) {
					setDataSourceId(Number(dsId));
					try {
						const detail = await analyticsApi.getPlatformDataSource(dsId);
						const parsed = parseJdbcUrl(String(detail.jdbcUrl || ""));
						setForm({
							name: String(detail.name || db.name || ""),
							type: String(detail.type || db.engine || "postgres"),
							host: parsed.host,
							port: parsed.port,
							database: parsed.database,
							username: String((detail as any).username || ""),
							password: "",
							description: String(detail.description || db.description || ""),
						});
					} catch {
						// Fallback: use database record only
						setForm((prev) => ({
							...prev,
							name: String(db.name || ""),
							type: String(db.engine || "postgres"),
							description: String(db.description || ""),
						}));
					}
				} else {
					setForm((prev) => ({
						...prev,
						name: String(db.name || ""),
						type: String(db.engine || "postgres"),
						description: String(db.description || ""),
					}));
				}
				setLoadState({ state: "loaded" });
			})
			.catch((e) => {
				setLoadState({ state: "error", error: e });
			});
	}, [dbId]);

	function updateField(field: keyof ManagedDataSourceFormValues, value: string) {
		setForm((prev) => ({ ...prev, [field]: value }));
		setFormErrors((prev) => {
			const errorField = field as keyof ManagedDataSourceFormErrors;
			if (!prev[errorField]) return prev;
			const next = { ...prev };
			delete next[errorField];
			return next;
		});
	}

	function validateForm() {
		const nextErrors = validateManagedDataSourceForm(form);
		setFormErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}

	async function testConnection() {
		if (!validateForm()) return;
		setTesting(true);
		setOkMessage("");
		setError(null);
		try {
			const port = Number.parseInt(form.port, 10);
			const details: Record<string, unknown> = {
				host: form.host.trim(),
				port: Number.isFinite(port) ? port : undefined,
				database: form.database.trim(),
				username: form.username.trim() || undefined,
				password: form.password || undefined,
			};
			// When an AI datasource is already linked, include its ID so the
			// backend resolver can fetch the stored JDBC URL (with Docker-IP
			// normalisation) and credentials.  The user-entered host/port are
			// still visible in the form for reference but the actual test uses
			// the canonical connection info managed by copilot-ai.
			if (dataSourceId != null) {
				details.dataSourceId = dataSourceId;
			}
			await analyticsApi.validateDatabase({
				engine: form.type,
				details,
			});
			setOkMessage(t(locale, "data.validated"));
		} catch (e) {
			setError(e);
		} finally {
			setTesting(false);
		}
	}

	async function handleSave() {
		if (!validateForm()) return;
		setSaving(true);
		setOkMessage("");
		setError(null);
		try {
			const port = Number.parseInt(form.port, 10);
			const payload: ManagedDataSourceCreatePayload = {
				name: form.name.trim(),
				type: form.type,
				host: form.host.trim(),
				port: Number.isFinite(port) ? port : undefined,
				database: form.database.trim(),
				username: form.username.trim() || undefined,
				password: form.password || undefined,
				description: form.description.trim() || undefined,
			};

			if (dataSourceId != null) {
				// Update existing copilot-ai datasource
				await analyticsApi.updateManagedDataSource(dataSourceId, payload);
				// Also update analytics database record to refresh name/engine
				await analyticsApi.updateDatabase(dbId!, {
					details: { dataSourceId },
				});
			} else {
				// Create new copilot-ai datasource and link it
				const created = await analyticsApi.createManagedDataSource(payload);
				const newDsId = created.id;
				await analyticsApi.updateDatabase(dbId!, {
					details: { dataSourceId: newDsId },
				});
				setDataSourceId(Number(newDsId));
			}

			setOkMessage(t(locale, "data.updated"));
			setTimeout(() => {
				navigate(`/data/${encodeURIComponent(String(dbId))}`, { replace: true });
			}, 600);
		} catch (e) {
			setError(e);
		} finally {
			setSaving(false);
		}
	}

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "data.edit")}
				subtitle={`${t(locale, "data.db")} #${dbId}`}
				breadcrumbs={
					<Breadcrumb items={[
						{ label: t(locale, "data.title"), href: "/data" },
						{ label: `${t(locale, "data.db")} #${dbId}`, href: `/data/${dbId}` },
						{ label: t(locale, "data.edit") },
					]} />
				}
			/>

			{loadState.state === "loading" && (
				<Card>
					<CardBody>
						<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}>
							<Spinner size="lg" />
						</div>
					</CardBody>
				</Card>
			)}

			{loadState.state === "error" && <ErrorNotice locale={locale} error={loadState.error} />}

			{loadState.state === "loaded" && (
				<Card>
					<CardHeader
						title={t(locale, "data.connection")}
						icon={<DatabaseIcon />}
						action={
							dataSourceId != null ? (
								<Badge variant="default" size="sm">
									DataSource #{dataSourceId}
								</Badge>
							) : null
						}
					/>
					<CardBody>
						{error ? <ErrorNotice locale={locale} error={error} /> : null}
						{okMessage && (
							<div style={{
								display: "flex",
								alignItems: "center",
								gap: "var(--spacing-sm)",
								marginBottom: "var(--spacing-md)",
								padding: "var(--spacing-sm)",
								background: "var(--color-success-bg)",
								borderRadius: "var(--radius-sm)",
								color: "var(--color-success)",
							}}>
								{okMessage}
							</div>
						)}

						<div className="grid2">
							<Input
								label={t(locale, "data.sourceName")}
								value={form.name}
								error={manualFieldErrorMessage(locale, "name", formErrors.name)}
								onChange={(e) => updateField("name", e.target.value)}
							/>
							<NativeSelect
								label={t(locale, "data.engine")}
								options={MANAGED_DATA_SOURCE_TYPE_OPTIONS.map((option) => ({
									value: option.value,
									label: option.label,
								}))}
								value={form.type}
								error={manualFieldErrorMessage(locale, "type", formErrors.type)}
								onChange={(e) => updateField("type", e.target.value)}
							/>
							<Input
								label={t(locale, "data.host")}
								value={form.host}
								error={manualFieldErrorMessage(locale, "host", formErrors.host)}
								onChange={(e) => updateField("host", e.target.value)}
							/>
							<Input
								label={t(locale, "data.port")}
								value={form.port}
								onChange={(e) => updateField("port", e.target.value)}
							/>
							<Input
								label={t(locale, "data.databaseName")}
								value={form.database}
								error={manualFieldErrorMessage(locale, "database", formErrors.database)}
								onChange={(e) => updateField("database", e.target.value)}
							/>
							<Input
								label={t(locale, "data.username")}
								value={form.username}
								onChange={(e) => updateField("username", e.target.value)}
							/>
							<Input
								label={t(locale, "data.password")}
								type="password"
								value={form.password}
								placeholder={dataSourceId != null ? t(locale, "data.passwordPlaceholder") : undefined}
								onChange={(e) => updateField("password", e.target.value)}
							/>
						</div>
						<div style={{ marginTop: "var(--spacing-md)" }}>
							<TextArea
								label={t(locale, "data.description")}
								rows={3}
								value={form.description}
								onChange={(e) => updateField("description", e.target.value)}
							/>
						</div>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-sm)", marginTop: "var(--spacing-md)" }}>
							<Button variant="secondary" loading={testing} onClick={testConnection}>
								{t(locale, "data.testConnection")}
							</Button>
							<Button variant="primary" loading={saving} onClick={handleSave}>
								{t(locale, "data.updated") === okMessage ? t(locale, "data.updated") : t(locale, "data.edit")}
							</Button>
						</div>
					</CardBody>
					<CardFooter align="between">
						<Link to={`/data/${dbId}`}>
							<Button variant="tertiary">{t(locale, "common.cancel")}</Button>
						</Link>
					</CardFooter>
				</Card>
			)}
		</PageContainer>
	);
}
