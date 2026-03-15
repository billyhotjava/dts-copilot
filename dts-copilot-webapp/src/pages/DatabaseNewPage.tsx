import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { analyticsApi, type PlatformDataSourceItem } from "../api/analyticsApi";
import { PageContainer, PageHeader, Breadcrumb } from "../components/PageContainer/PageContainer";
import { EmptyState } from "../components/EmptyState";
import { ErrorNotice } from "../components/ErrorNotice";
import { Card, CardHeader, CardBody, CardFooter } from "../ui/Card/Card";
import { Button, ButtonGroup } from "../ui/Button/Button";
import { Input, SearchInput, TextArea } from "../ui/Input/Input";
import { NativeSelect } from "../ui/Input/Select";
import { Badge } from "../ui/Badge/Badge";
import { Spinner } from "../ui/Loading/Spinner";
import { getEffectiveLocale, t, type Locale } from "../i18n";
import {
	MANAGED_DATA_SOURCE_TYPE_OPTIONS,
	buildManagedDataSourcePayload,
	buildManagedDatabaseImportPayload,
	validateManagedDataSourceForm,
	type ManagedDataSourceFormErrors,
	type ManagedDataSourceFormValues,
} from "./databaseEntryModel";
import "./page.css";

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown };

const DatabaseIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<ellipse cx="12" cy="5" rx="9" ry="3" />
		<path d="M3 5v14a9 3 0 0 0 18 0V5" />
		<path d="M3 12a9 3 0 0 0 18 0" />
	</svg>
);

const PlusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</svg>
);

const defaultManualForm: ManagedDataSourceFormValues = {
	name: "",
	type: "postgres",
	host: "",
	port: "5432",
	database: "",
	username: "",
	password: "",
	description: "",
};

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

export default function DatabaseNewPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const navigate = useNavigate();

	const [mode, setMode] = useState<"manual" | "import">("manual");
	const [state, setState] = useState<LoadState<PlatformDataSourceItem[]>>({ state: "loading" });
	const [query, setQuery] = useState("");
	const [importingId, setImportingId] = useState<string | null>(null);
	const [manualForm, setManualForm] = useState<ManagedDataSourceFormValues>(defaultManualForm);
	const [testing, setTesting] = useState(false);
	const [creating, setCreating] = useState(false);
	const [okMessage, setOkMessage] = useState("");
	const [error, setError] = useState<unknown>(null);
	const [manualErrors, setManualErrors] = useState<ManagedDataSourceFormErrors>({});

	function updateManualField(field: keyof ManagedDataSourceFormValues, value: string) {
		setManualForm((prev) => ({ ...prev, [field]: value }));
		setManualErrors((prev) => {
			const errorField = field as keyof ManagedDataSourceFormErrors;
			if (!prev[errorField]) {
				return prev;
			}
			const next = { ...prev };
			delete next[errorField];
			return next;
		});
	}

	function validateManualForm() {
		const nextErrors = validateManagedDataSourceForm(manualForm);
		setManualErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	}

	const reload = () => {
		setState({ state: "loading" });
		setError(null);
		analyticsApi
			.listPlatformDataSources()
			.then((list) => {
				setState({ state: "loaded", value: Array.isArray(list) ? list : [] });
			})
			.catch((e) => {
				setState({ state: "error", error: e });
				setError(e);
			});
	};

	useEffect(() => {
		reload();
	}, []);

	const filtered = useMemo(() => {
		if (state.state !== "loaded") return [];
		const needle = query.trim().toLowerCase();
		if (!needle) return state.value;
		return state.value.filter((item) => {
			const name = String(item.name || "").toLowerCase();
			const type = String(item.type || "").toLowerCase();
			const url = String(item.jdbcUrl || "").toLowerCase();
			return name.includes(needle) || type.includes(needle) || url.includes(needle);
		});
	}, [state, query]);

	async function importSource(item: PlatformDataSourceItem) {
		setImportingId(String(item.id));
		setOkMessage("");
		setError(null);
		try {
			const response = await analyticsApi.createDatabase(buildManagedDatabaseImportPayload(item));
			const createdId = (response as any)?.id;
			if (!createdId) {
				setOkMessage(t(locale, "data.created"));
				return;
			}
			await analyticsApi.syncDatabaseSchema(createdId);
			setOkMessage(t(locale, "data.synced"));
			navigate(`/data/${encodeURIComponent(String(createdId))}`, { replace: true });
		} catch (e) {
			setError(e);
		} finally {
			setImportingId(null);
		}
	}

	async function testManualConnection() {
		if (!validateManualForm()) {
			setError(null);
			setOkMessage("");
			return;
		}
		setTesting(true);
		setOkMessage("");
		setError(null);
		try {
			const payload = buildManagedDataSourcePayload(manualForm);
			await analyticsApi.validateDatabase({
				engine: payload.type,
				details: payload,
			});
			setOkMessage(t(locale, "data.validated"));
		} catch (e) {
			setError(e);
		} finally {
			setTesting(false);
		}
	}

	async function createManualSource() {
		if (!validateManualForm()) {
			setError(null);
			setOkMessage("");
			return;
		}
		setCreating(true);
		setOkMessage("");
		setError(null);
		try {
			const payload = buildManagedDataSourcePayload(manualForm);
			const createdSource = await analyticsApi.createManagedDataSource(payload);
			const response = await analyticsApi.createDatabase(buildManagedDatabaseImportPayload(createdSource));
			const createdId = (response as any)?.id;
			if (!createdId) {
				setOkMessage(t(locale, "data.created"));
				return;
			}
			await analyticsApi.syncDatabaseSchema(createdId);
			setOkMessage(t(locale, "data.synced"));
			navigate(`/data/${encodeURIComponent(String(createdId))}`, { replace: true });
		} catch (e) {
			setError(e);
		} finally {
			setCreating(false);
		}
	}

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "data.add")}
				subtitle={t(locale, "data.platformHint")}
				breadcrumbs={
					<Breadcrumb items={[
						{ label: t(locale, "data.title"), href: "/data" },
						{ label: t(locale, "data.add") }
					]} />
				}
			/>

				<Card>
					<CardHeader title={t(locale, "data.platformSources")} icon={<DatabaseIcon />} />
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
							<PlusIcon />
							{okMessage}
						</div>
					)}

						<div style={{ display: "flex", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
							<ButtonGroup>
								<Button
									variant={mode === "manual" ? "primary" : "secondary"}
									onClick={() => setMode("manual")}
								>
									{t(locale, "data.manual")}
								</Button>
								<Button
									variant={mode === "import" ? "primary" : "secondary"}
									onClick={() => setMode("import")}
								>
									{t(locale, "data.importExisting")}
								</Button>
							</ButtonGroup>
						</div>

						{mode === "manual" && (
							<Card variant="hoverable">
								<CardBody>
									<div className="grid2">
										<Input
											label={t(locale, "data.sourceName")}
											value={manualForm.name}
											error={manualFieldErrorMessage(locale, "name", manualErrors.name)}
											onChange={(e) => updateManualField("name", e.target.value)}
										/>
										<NativeSelect
											label={t(locale, "data.engine")}
											options={MANAGED_DATA_SOURCE_TYPE_OPTIONS.map((option) => ({
												value: option.value,
												label: option.label,
											}))}
											value={manualForm.type}
											error={manualFieldErrorMessage(locale, "type", manualErrors.type)}
											onChange={(e) => updateManualField("type", e.target.value)}
										/>
										<Input
											label={t(locale, "data.host")}
											value={manualForm.host}
											error={manualFieldErrorMessage(locale, "host", manualErrors.host)}
											onChange={(e) => updateManualField("host", e.target.value)}
										/>
										<Input
											label={t(locale, "data.port")}
											value={manualForm.port}
											onChange={(e) => updateManualField("port", e.target.value)}
										/>
										<Input
											label={t(locale, "data.databaseName")}
											value={manualForm.database}
											error={manualFieldErrorMessage(locale, "database", manualErrors.database)}
											onChange={(e) => updateManualField("database", e.target.value)}
										/>
										<Input
											label={t(locale, "data.username")}
											value={manualForm.username}
											onChange={(e) => updateManualField("username", e.target.value)}
										/>
										<Input
											label={t(locale, "data.password")}
											type="password"
											value={manualForm.password}
											onChange={(e) => updateManualField("password", e.target.value)}
										/>
									</div>
									<div style={{ marginTop: "var(--spacing-md)" }}>
										<TextArea
											label={t(locale, "data.description")}
											rows={3}
											value={manualForm.description}
											onChange={(e) => updateManualField("description", e.target.value)}
										/>
									</div>
									<div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-sm)", marginTop: "var(--spacing-md)" }}>
										<Button variant="secondary" loading={testing} onClick={testManualConnection}>
											{t(locale, "data.testConnection")}
										</Button>
										<Button variant="primary" loading={creating} onClick={createManualSource}>
											{t(locale, "data.createImport")}
										</Button>
									</div>
								</CardBody>
							</Card>
						)}

						{mode === "import" && state.state === "loading" && (
							<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}>
								<Spinner size="lg" />
							</div>
						)}

						{mode === "import" && (
							<div style={{ display: "flex", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
								<SearchInput
									label={t(locale, "common.search")}
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder={t(locale, "search.placeholder")}
									onClear={() => setQuery("")}
								/>
								<Button variant="secondary" onClick={reload}>
									{t(locale, "common.refresh")}
								</Button>
							</div>
						)}

						{mode === "import" && state.state === "loaded" && filtered.length === 0 && (
							<EmptyState
								title={t(locale, "data.platformEmpty")}
								description={t(locale, "data.platformEmptyDesc")}
							/>
						)}

						{mode === "import" && state.state === "loaded" && filtered.length > 0 && (
							<div className="grid3">
								{filtered.map((item) => (
									<Card key={item.id} variant="hoverable" style={{ height: "100%" }}>
									<CardBody>
										<div style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-md)" }}>
											<div style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												width: 40,
												height: 40,
												borderRadius: "var(--radius-md)",
												background: "var(--color-bg-hover)",
												color: "var(--color-brand)",
												flexShrink: 0,
											}}>
												<DatabaseIcon />
											</div>
											<div style={{ flex: 1, minWidth: 0 }}>
												<h3 style={{ margin: 0, fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)" }}>
													{item.name || item.id}
												</h3>
												<p className="text-muted" style={{ margin: "var(--spacing-xs) 0 0", fontSize: "var(--font-size-sm)" }}>
													{t(locale, "common.id")}: {item.id}
												</p>
												{item.description ? (
													<p className="text-muted" style={{ margin: "var(--spacing-xs) 0 0", fontSize: "var(--font-size-sm)" }}>
														{item.description}
													</p>
												) : null}
											</div>
											<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--spacing-xs)" }}>
												<Badge variant="default" size="sm">
													{item.type || "JDBC"}
												</Badge>
												{item.status ? (
													<Badge variant={item.status === "active" ? "success" : "default"} size="sm">
														{item.status}
													</Badge>
												) : null}
											</div>
										</div>
										<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--spacing-md)" }}>
											<Button
												variant="primary"
												icon={<PlusIcon />}
												loading={importingId === String(item.id)}
												onClick={() => importSource(item)}
											>
												{t(locale, "data.import")}
											</Button>
										</div>
									</CardBody>
								</Card>
							))}
						</div>
					)}
				</CardBody>
					<CardFooter align="between">
						<Link to="/data">
							<Button variant="tertiary">
								{t(locale, "common.open")} {t(locale, "data.title")}
						</Button>
					</Link>
				</CardFooter>
			</Card>
		</PageContainer>
	);
}
