export type CurrentUser = {
	id: number;
	username?: string;
	first_name?: string;
	last_name?: string;
	common_name?: string;
	is_superuser?: boolean;
	is_active?: boolean;
};

export type CollectionListItem = {
	id: number | "root";
	name?: string;
	description?: string | null;
	archived?: boolean;
	location?: string | null;
	can_write?: boolean;
};

export type CollectionItem = {
	id: number;
	model: "dashboard" | "card";
	name?: string;
	description?: string | null;
	archived?: boolean;
	collection_id?: number | null;
	favorite?: boolean;
	created_at?: string;
	updated_at?: string;
};

export type DashboardListItem = {
	id: number;
	name?: string;
	description?: string | null;
	archived?: boolean;
	collection_id?: number | null;
	created_at?: string;
	updated_at?: string;
	favorite?: boolean;
	public_uuid?: string | null;
};

export type DashboardDetail = DashboardListItem & {
	dashcards?: unknown[];
	parameters?: unknown[];
	ordered_cards?: DashboardCard[];
};

export type PublicCardDetail = CardDetail & {
	public_uuid?: string | null;
};

export type PublicDashboardDetail = DashboardDetail & {
	public_uuid?: string | null;
};

export type DashboardCard = {
	id: number;
	card_id?: number | null;
	row?: number;
	col?: number;
	size_x?: number;
	size_y?: number;
	parameter_mappings?: unknown[];
	visualization_settings?: unknown;
	card?: CardListItem | null;
};

export type CardListItem = {
	id: number;
	name?: string;
	description?: string | null;
	archived?: boolean;
	collection_id?: number | null;
	display?: string;
	created_at?: string;
	updated_at?: string;
	favorite?: boolean;
	public_uuid?: string | null;
};

export type CardDetail = CardListItem & {
	dataset_query?: unknown;
	visualization_settings?: unknown;
	result_metadata?: unknown;
};

export type AnalysisDraftListItem = {
	id: number;
	entity_id?: string;
	title?: string | null;
	source_type?: string | null;
	session_id?: string | null;
	message_id?: string | null;
	question?: string | null;
	database_id?: number | null;
	sql_text?: string | null;
	explanation_text?: string | null;
	suggested_display?: string | null;
	status?: string | null;
	linked_card_id?: number | null;
	linked_dashboard_id?: number | null;
	linked_screen_id?: number | null;
	created_at?: string;
	updated_at?: string;
};

export type AnalysisDraftDetail = AnalysisDraftListItem;

export type AnalysisDraftRunResponse = {
	rows?: unknown[];
	cols?: Array<Record<string, unknown>>;
	results_metadata?: Array<Record<string, unknown>>;
	results_timezone?: string;
	row_count?: number;
};

export type AnalysisDraftSaveCardResponse = {
	draft?: AnalysisDraftDetail;
	card?: CardDetail;
};

export type CardQueryResponse = {
	status?: string;
	row_count?: number;
	running_time?: number;
	error?: unknown;
	code?: string;
	requestId?: string;
	data?: {
		rows?: unknown[];
		cols?: Array<Record<string, unknown>>;
		native_form?: { query?: string };
		results_timezone?: string;
		results_metadata?: { columns?: unknown[] };
	};
};

export type DashboardQueryResponse = CardQueryResponse;

export type Nl2SqlEvalCaseItem = {
	id?: number | string;
	name?: string;
	domain?: string | null;
	promptText?: string;
	expected?: Record<string, unknown>;
	notes?: string | null;
	enabled?: boolean;
	createdAt?: string;
	updatedAt?: string;
};

export type Nl2SqlEvalRunRow = {
	id?: number | string;
	name?: string;
	passed?: boolean;
	score?: number;
	totalChecks?: number;
	passedChecks?: number;
	checks?: Array<Record<string, unknown>>;
	generated?: Record<string, unknown>;
};

export type Nl2SqlEvalRunSummary = {
	executedAt?: string;
	total?: number;
	passed?: number;
	failed?: number;
	passRate?: number;
	averageScore?: number;
	rows?: Nl2SqlEvalRunRow[];
};

export type AiAgentToolCallRecord = {
	toolId: string;
	params?: Record<string, unknown>;
	result?: {
		success?: boolean;
		textSummary?: string;
		errorMessage?: string;
		data?: unknown;
	};
	durationMs?: number;
	timestamp?: string;
};

export type MicroFormRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type MicroFormFieldSchema = {
	key: string;
	label: string;
	type?: "text" | "textarea" | "number" | "select";
	required?: boolean;
	placeholder?: string;
	helpText?: string;
	options?: Array<{ label: string; value: string | number }>;
	value?: string | number;
	source?: string;
};

export type MicroFormSchema = {
	title?: string;
	description?: string;
	riskLevel?: MicroFormRiskLevel;
	riskNote?: string;
	fields: MicroFormFieldSchema[];
};

export type AiAgentPendingAction = {
	actionId: string;
	toolId: string;
	params: Record<string, unknown>;
	reason?: string;
	planSummary?: string;
	riskLevel?: MicroFormRiskLevel;
	impactScope?: string;
	microForm?: MicroFormSchema;
};

export type AiAgentChatResponse = {
	sessionId: string;
	agentMessage: string;
	toolCalls: AiAgentToolCallRecord[];
	reasoning?: string;
	requiresApproval: boolean;
	pendingAction?: AiAgentPendingAction | null;
};

export type AiAgentChatSession = {
	id: string;
	title?: string;
	status?: string;
	lastActiveAt?: string;
	createdAt?: string;
	datasourceId?: string;
	schemaName?: string;
};

export type AiAgentChatMessage = {
	id: string;
	sessionId: string;
	role: "user" | "assistant" | "tool" | string;
	content?: string;
	reasoningContent?: string;
	responseKind?: string;
	toolCallId?: string;
	toolName?: string;
	toolParams?: string;
	toolResult?: string;
	generatedSql?: string;
	routedDomain?: string;
	targetView?: string;
	templateCode?: string;
	sequenceNum?: number;
	createdAt?: string;
};

export type AiAgentChatSessionDetail = {
	session?: AiAgentChatSession;
	messages?: AiAgentChatMessage[];
	pendingAction?: AiAgentPendingAction | null;
};

export type CopilotSuggestedQuestion = {
	templateCode?: string;
	domain?: string;
	roleHint?: string;
	question: string;
	description?: string;
};

export type Nl2SqlEvalRunRecord = {
	id?: number | string;
	label?: string | null;
	modelVersion?: string | null;
	promptVersion?: string | null;
	dictionaryVersion?: string | null;
	caseCount?: number;
	passCount?: number;
	failCount?: number;
	passRate?: number;
	averageScore?: number;
	blockedRate?: number;
	gatePassed?: boolean | null;
	gate?: Record<string, unknown>;
	createdAt?: string;
};

export type Nl2SqlEvalGateRunResponse = {
	runId?: number | string;
	executedAt?: string;
	version?: {
		label?: string | null;
		modelVersion?: string | null;
		promptVersion?: string | null;
		dictionaryVersion?: string | null;
	};
	summary?: Nl2SqlEvalRunSummary;
	gate?: {
		passed?: boolean;
		checks?: Array<Record<string, unknown>>;
		reasons?: string[];
		baseline?: Record<string, unknown> | null;
		config?: Record<string, unknown>;
	};
};

export type Nl2SqlEvalCompareResponse = {
	baseline?: Nl2SqlEvalRunRecord;
	candidate?: Nl2SqlEvalRunRecord;
	metrics?: {
		passRateDelta?: number;
		averageScoreDelta?: number;
		failedDelta?: number;
		blockedRateDelta?: number;
	};
	changes?: {
		regressionCount?: number;
		improvementCount?: number;
		unchangedCount?: number;
		totalCompared?: number;
		rows?: Array<Record<string, unknown>>;
	};
};

export type ExplainabilityResponse = {
	cardId?: number | string;
	cardName?: string;
	componentId?: string | null;
	generatedAt?: string;
	explainCard?: {
		metricDefinition?: Record<string, unknown>;
		filterContext?: Record<string, unknown>;
		dataLineage?: Record<string, unknown>;
		querySummary?: Record<string, unknown>;
		nextActions?: string[];
		trace?: Record<string, unknown>;
	};
	copyJson?: string | null;
};

export type ExploreSessionItem = {
	id?: number | string;
	title?: string;
	question?: string | null;
	steps?: Array<Record<string, unknown>>;
	stepCount?: number;
	conclusion?: string | null;
	tags?: string[];
	projectKey?: string | null;
	dept?: string | null;
	creatorId?: number | string;
	archived?: boolean;
	publicUuid?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export type ReportTemplateItem = {
	id?: number | string;
	name?: string;
	description?: string | null;
	spec?: Record<string, unknown>;
	versionNo?: number;
	published?: boolean;
	archived?: boolean;
	creatorId?: number | string;
	createdAt?: string;
	updatedAt?: string;
};

export type FixedReportCatalogItem = {
	id?: number | string;
	name?: string;
	description?: string | null;
	templateCode?: string;
	domain?: string | null;
	category?: string | null;
	dataSourceType?: string | null;
	targetObject?: string | null;
	refreshPolicy?: string | null;
	parameterSchemaJson?: string | null;
	certificationStatus?: string | null;
	placeholderReviewRequired?: boolean;
	legacyPageTitle?: string | null;
	legacyPagePath?: string | null;
	published?: boolean;
	updatedAt?: string;
};

export type FixedReportRunResponse = {
	templateCode?: string;
	templateName?: string;
	domain?: string | null;
	freshness?: string | null;
	sourceType?: string | null;
	targetObject?: string | null;
	route?: string | null;
	adapterKey?: string | null;
	rationale?: string | null;
	supported?: boolean;
	executionStatus?: string | null;
	placeholderReviewRequired?: boolean;
	legacyPageTitle?: string | null;
	legacyPagePath?: string | null;
	parameters?: Record<string, unknown>;
	resultPreview?: {
		databaseId?: number | string;
		databaseName?: string | null;
		rowCount?: number;
		truncated?: boolean;
		columns?: Array<{
			key?: string;
			label?: string;
			baseType?: string | null;
		}>;
		rows?: Array<Record<string, unknown>>;
	} | null;
};

export type ReportRunItem = {
	id?: number | string;
	templateId?: number | string | null;
	sourceType?: string | null;
	sourceId?: number | string | null;
	status?: string;
	outputFormat?: string;
	summary?: Record<string, unknown>;
	distribution?: Record<string, unknown>;
	creatorId?: number | string;
	createdAt?: string;
	updatedAt?: string;
};

export type MetricLensSummary = {
	metricId?: number | string;
	name?: string;
	owner?: number | string;
	aggregation?: string | null;
	timeGrain?: string | null;
	aclScope?: string | null;
	latestVersion?: string | null;
};

export type MetricLensDetail = {
	metricId?: number | string;
	name?: string;
	definition?: Record<string, unknown>;
	aggregation?: string | null;
	timeGrain?: string | null;
	owner?: number | string;
	version?: string | null;
	versions?: string[];
	aclScope?: string | null;
	lineage?: Record<string, unknown>;
	conflicts?: Array<Record<string, unknown>>;
};

export type MetricLensCompare = {
	metricId?: number | string;
	leftVersion?: Record<string, unknown>;
	rightVersion?: Record<string, unknown>;
	delta?: Record<string, unknown>;
};

export type QueryTraceFailureSummary = {
	since?: string;
	windowDays?: number;
	chain?: string | null;
	total?: number;
	success?: number;
	failed?: number;
	failureRate?: number;
	topErrorCodes?: Array<{
		code?: string;
		count?: number;
		retryableHint?: boolean;
		category?: string;
	}>;
	topErrorCategories?: Array<{
		category?: string;
		count?: number;
	}>;
};

export type SearchItem = {
	model: "dashboard" | "card" | "collection" | string;
	id: number;
	name?: string;
	description?: string | null;
	archived?: boolean;
};

export type SearchResponse = {
	data: SearchItem[];
	total: number;
};

export type TrashItem = {
	model: "dashboard" | "card" | string;
	id: number;
	name?: string;
	description?: string | null;
	collection_id?: number | null;
	updated_at?: string;
	created_at?: string;
};

export type TrashResponse = {
	dashboards: TrashItem[];
	cards: TrashItem[];
};

export type DatabaseListItem = {
	id: number;
	name?: string;
	engine?: string;
};

export type DatabaseListResponse = {
	data: DatabaseListItem[];
	total: number;
};

export type DatabaseMetadataResponse = Record<string, unknown>;

export type DatasetCacheStats = {
	size?: number;
	hit_count?: number;
	miss_count?: number;
	hit_rate?: number;
	eviction_count?: number;
};

export type DatasetCachePolicy = {
	databaseId?: number;
	enabled?: boolean;
	ttlSeconds?: number;
	cacheNativeQueries?: boolean;
};

export type DatabaseValidateResponse = Record<string, unknown>;
export type DatabaseCreateResponse = Record<string, unknown>;

export type ManagedDataSourceCreatePayload = {
	name: string;
	type: string;
	jdbcUrl?: string;
	host?: string;
	port?: number;
	database?: string;
	serviceName?: string;
	sid?: string;
	username?: string;
	password?: string;
	description?: string;
};

export type PlatformDataSourceItem = {
	id: string | number;
	name?: string;
	type?: string;
	jdbcUrl?: string;
	description?: string | null;
	ownerDept?: string | null;
	status?: string | null;
	driverVersion?: string | null;
	lastUpdatedAt?: string | null;
};

export type TableSummary = {
	id: number;
	db_id?: number;
	schema?: string | null;
	name?: string;
	display_name?: string;
	description?: string | null;
};

export type TableDetail = TableSummary & {
	fields?: Array<{
		id: number;
		name?: string;
		display_name?: string;
		base_type?: string;
		semantic_type?: string | null;
	}>;
};

export type FieldDetail = {
	id: number;
	name?: string;
	display_name?: string;
	description?: string | null;
	table_id?: number;
	db_id?: number;
	base_type?: string;
	effective_type?: string;
	semantic_type?: string | null;
	active?: boolean;
	visibility_type?: string;
	fingerprint?: unknown;
	created_at?: string;
	updated_at?: string;
};

export type FieldValuesResponse = {
	field_id: number;
	values: unknown[];
	has_more_values?: boolean;
	error?: unknown;
};

export type Metric = {
	id: number;
	name?: string;
	description?: string | null;
	archived?: boolean;
	creator_id?: number;
	table_id?: number | null;
	definition?: unknown;
};

export type PlatformMetric = {
	id: string | number;
	name?: string;
	description?: string | null;
	dept?: string;
	classification?: string;
};

export type VisibleTable = {
	tableId: number;
	dbId?: number;
	schema?: string | null;
	name?: string | null;
};

export type PublicScreenDetail = ScreenDetail & {
	public_uuid?: string | null;
};

export type CopilotSiteSettings = {
	siteName?: string;
};

export type CopilotProviderTemplate = {
	name: string;
	displayName?: string;
	defaultBaseUrl?: string;
	defaultModel?: string;
	defaultTemperature?: number;
	defaultMaxTokens?: number;
	defaultTimeoutSeconds?: number;
	region?: string;
	recommended?: boolean;
	sortOrder?: number;
	requiresApiKey?: boolean;
};

export type CopilotProvider = {
	id: number;
	name?: string;
	baseUrl?: string;
	model?: string;
	temperature?: number | null;
	maxTokens?: number | null;
	timeoutSeconds?: number | null;
	isDefault?: boolean;
	enabled?: boolean;
	priority?: number | null;
	providerType?: string | null;
	hasApiKey?: boolean;
	apiKeyMasked?: string | null;
	createdAt?: string;
	updatedAt?: string;
};

export type CopilotProviderPayload = {
	name: string;
	baseUrl: string;
	apiKey?: string;
	model: string;
	temperature?: number | null;
	maxTokens?: number | null;
	timeoutSeconds?: number | null;
	isDefault?: boolean;
	enabled?: boolean;
	priority?: number | null;
	providerType?: string | null;
};

export type CopilotProviderTestResult = {
	reachable?: boolean;
	provider?: string;
	baseUrl?: string;
	models?: unknown;
	modelsError?: string;
};

export type CopilotApiKeyItem = {
	id: number;
	prefix?: string;
	name?: string;
	description?: string | null;
	status?: string;
	rateLimit?: number | null;
	createdBy?: string | null;
	createdAt?: string;
	expiresAt?: string | null;
	lastUsedAt?: string | null;
	usageCount?: number | null;
};

export type CopilotApiKeyReveal = CopilotApiKeyItem & {
	rawKey?: string;
	message?: string;
};

export type CopilotApiKeyCreatePayload = {
	name: string;
	description?: string;
	createdBy?: string;
	expiresInDays?: number | null;
};

// Screen Designer Types
export type ScreenListItem = {
	id: number | string;
	name?: string;
	description?: string | null;
	width?: number;
	height?: number;
	createdAt?: string;
	updatedAt?: string;
	publishedVersionNo?: number | null;
	publishedAt?: string | null;
	canRead?: boolean;
	canEdit?: boolean;
	canPublish?: boolean;
	canManage?: boolean;
};

export type ScreenDetail = ScreenListItem & {
	schemaVersion?: number;
	backgroundColor?: string;
	backgroundImage?: string | null;
	theme?: string;
	components?: ScreenComponentData[];
	globalVariables?: Array<{ key: string; label?: string; type?: string; defaultValue?: string; description?: string }>;
	sourceMode?: "draft" | "published" | string;
};

export type ScreenWarmupSummary = {
	totalDatabaseSources?: number;
	warmed?: number;
	skipped?: number;
	failed?: number;
	items?: Array<Record<string, unknown>>;
};

export type ScreenAiGenerationRequest = {
	prompt: string;
	width?: number;
	height?: number;
};

export type ScreenAiRevisionRequest = {
	prompt: string;
	screenSpec: Record<string, unknown>;
	context?: string[];
	mode?: "apply" | "suggest";
};

export type ScreenAiGenerationResponse = {
	engine?: string;
	prompt?: string;
	contextCount?: number;
	usedContextCount?: number;
	applyMode?: "apply" | "suggest" | string;
	applied?: boolean;
	intent?: {
		domain?: string;
		timeRange?: string;
		granularity?: string;
		metrics?: string[];
		dimensions?: string[];
		filters?: string[];
	};
	semanticModelHints?: {
		domain?: string;
		factTable?: string;
		timeField?: string;
		dimensions?: string[];
		metricMappings?: Array<{
			name?: string;
			expression?: string;
		}>;
	};
	queryRecommendations?: Array<{
		id?: string;
		purpose?: string;
		mode?: string;
		semanticLayer?: string;
		domain?: string;
		factTable?: string;
		timeField?: string;
		timeRange?: string;
		granularity?: string;
		dimensions?: string[];
		metrics?: string[];
		filters?: string[];
		sqlHint?: string;
	}>;
	sqlBlueprints?: Array<{
		queryId?: string;
		purpose?: string;
		sql?: string;
		factTable?: string;
		timeField?: string;
	}>;
	vizRecommendations?: Array<{
		queryId?: string;
		componentType?: string;
		title?: string;
	}>;
	metricLensReferences?: Array<Record<string, unknown>>;
	semanticRecall?: {
		schemaCandidates?: Array<Record<string, unknown>>;
		synonymHits?: Array<Record<string, unknown>>;
		fewShotExamples?: Array<Record<string, unknown>>;
		promptHints?: Array<string>;
		trace?: Record<string, unknown>;
	};
	nl2sqlDiagnostics?: {
		stage?: string;
		domain?: string;
		factTable?: string;
		timeField?: string;
		queryRecommendationCount?: number;
		sqlBlueprintCount?: number;
		safeCount?: number;
		executableBlueprintCount?: number;
		needsParamsCount?: number;
		blockedCount?: number;
		status?: string;
		executionReadiness?: "ready" | "needs-params" | "blocked" | string;
		requiredVariableCount?: number;
		pendingVariableCount?: number;
		requiredVariables?: string[];
		pendingVariables?: string[];
		autoInjectedVariableCount?: number;
		autoInjectedVariables?: string[];
		blockedQueryIds?: string[];
		needsParamsQueryIds?: string[];
		safeQueryIds?: string[];
		semanticRecallEnabled?: boolean;
		blueprintChecks?: Array<{
			queryId?: string;
			purpose?: string;
			status?: string;
			hasTemplateVariables?: boolean;
			templateVariables?: string[];
			reasons?: string[];
			[key: string]: unknown;
		}>;
	};
	generatedBy?: number | string;
	generatedAt?: string;
	actions?: string[];
	quality?: {
		score?: number;
		warnings?: string[];
		suggestions?: string[];
	};
	screenSpec?: {
		schemaVersion?: number;
		name?: string;
		description?: string | null;
		width?: number;
		height?: number;
		backgroundColor?: string;
		backgroundImage?: string | null;
		theme?: string;
		components?: ScreenComponentData[];
		globalVariables?: Array<{ key: string; label?: string; type?: string; defaultValue?: string; description?: string }>;
	};
};

export type ScreenSpecValidationResponse = {
	valid?: boolean;
	warnings?: string[];
};

export type ScreenTemplateItem = {
	id: number | string;
	schemaVersion?: number;
	name?: string;
	description?: string | null;
	category?: string;
	thumbnail?: string | null;
	tags?: string[];
	theme?: string | null;
	width?: number;
	height?: number;
	backgroundColor?: string;
	backgroundImage?: string | null;
	components?: ScreenComponentData[];
	globalVariables?: Array<{ key: string; label?: string; type?: string; defaultValue?: string; description?: string }>;
	creatorId?: number | string;
	visibilityScope?: "personal" | "team" | "global" | string;
	ownerDept?: string | null;
	listed?: boolean;
	themePack?: Record<string, unknown>;
	sourceScreenId?: number | string;
	sourceTemplateId?: number | string;
	templateVersion?: number;
	createdAt?: string;
	updatedAt?: string;
};

export type ScreenTemplateVersionItem = {
	id?: number | string;
	templateId?: number | string;
	versionNo?: number;
	action?: string;
	actorId?: number | string;
	createdAt?: string;
	restoredFromVersion?: number | null;
	snapshot?: Record<string, unknown>;
};

export type ScreenPluginComponent = {
	id: string;
	name?: string;
	icon?: string;
	baseType?: string;
	defaultWidth?: number;
	defaultHeight?: number;
	defaultConfig?: Record<string, unknown>;
	propertySchema?: Record<string, unknown>;
	dataContract?: Record<string, unknown>;
};

export type ScreenPluginDataSource = {
	id: string;
	name?: string;
	type?: string;
	sdkVersion?: string;
};

export type ScreenPluginManifest = {
	id: string;
	name?: string;
	version?: string;
	enabled?: boolean;
	signatureRequired?: boolean;
	components?: ScreenPluginComponent[];
	dataSources?: ScreenPluginDataSource[];
};

export type ScreenPluginValidationResult = {
	valid?: boolean;
	errors?: string[];
};

export type ScreenIndustryPack = {
	packageType?: string;
	specVersion?: string;
	exportedAt?: string;
	exportedBy?: string;
	metadata?: Record<string, unknown>;
	templates?: Array<Record<string, unknown>>;
	summary?: Record<string, unknown>;
};

export type ScreenIndustryPackImportResult = {
	imported?: number;
	failed?: number;
	items?: Array<Record<string, unknown>>;
};

export type ScreenIndustryPackPresets = {
	industries?: Array<Record<string, unknown>>;
	hardwareProfiles?: Array<Record<string, unknown>>;
	connectorTemplates?: Array<Record<string, unknown>>;
	deploymentModes?: string[];
};

export type ScreenIndustryPackValidationResult = {
	valid?: boolean;
	errors?: string[];
	warnings?: string[];
	recommendations?: string[];
};

export type ScreenIndustryPackAuditRow = {
	id?: number | string;
	assetType?: string;
	assetId?: number | string | null;
	action?: string;
	actorId?: number | string | null;
	source?: string;
	result?: string;
	requestId?: string;
	createdAt?: string;
	details?: Record<string, unknown> | string | null;
};

export type ScreenIndustryConnectorPlan = {
	generatedAt?: string;
	templateCount?: number;
	jobCount?: number;
	items?: Array<Record<string, unknown>>;
};

export type ScreenIndustryConnectorProbe = {
	generatedAt?: string;
	summary?: Record<string, unknown>;
	rows?: Array<Record<string, unknown>>;
};

export type ScreenIndustryOpsHealth = {
	generatedAt?: string;
	summary?: ScreenIndustryOpsHealthSummary;
	checks?: ScreenIndustryOpsHealthCheck[];
};

export type ScreenIndustryRuntimeProbe = {
	generatedAt?: string;
	summary?: ScreenIndustryRuntimeProbeSummary;
	rows?: ScreenIndustryRuntimeProbeRow[];
};

export type ScreenIndustryOpsHealthSummary = {
	score?: number;
	deploymentMode?: string;
	templateCount?: number;
	listedCount?: number;
	auditSamples?: number;
	failedAudits?: number;
};

export type ScreenIndustryOpsHealthCheck = {
	id?: string;
	name?: string;
	status?: "pass" | "warn" | "fail" | string;
	message?: string;
	details?: Record<string, unknown>;
};

export type ScreenIndustryRuntimeProbeSummary = {
	total?: number;
	pass?: number;
	warn?: number;
	fail?: number;
	timeoutMs?: number;
};

export type ScreenIndustryRuntimeProbeRow = {
	id?: string;
	name?: string;
	host?: string;
	port?: number;
	required?: boolean;
	protocol?: "tcp" | "http" | "https" | "mqtt" | string;
	path?: string | null;
	expectedBodyContains?: string | null;
	url?: string | null;
	httpStatus?: number | null;
	bodyMatched?: boolean | null;
	bodyPreview?: string | null;
	status?: "pass" | "warn" | "fail" | string;
	message?: string;
	latencyMs?: number;
};

export type ScreenCompliancePolicy = {
	maskingEnabled?: boolean;
	watermarkEnabled?: boolean;
	watermarkText?: string;
	exportApprovalRequired?: boolean;
	auditRetentionDays?: number;
	updatedBy?: string;
	updatedAt?: string;
};

export type ScreenComplianceReport = {
	generatedAt?: string;
	scope?: string;
	screenId?: number | string;
	days?: number;
	limit?: number;
	policy?: ScreenCompliancePolicy;
	summary?: Record<string, unknown>;
	rows?: Array<Record<string, unknown>>;
};

export type ScreenComplianceReportQuery = {
	screenId?: number | string;
	days?: number;
	limit?: number;
};

export type ScreenVersion = {
	id: number | string;
	screenId?: number | string;
	versionNo?: number;
	status?: string;
	name?: string;
	description?: string | null;
	currentPublished?: boolean;
	publishedAt?: string | null;
	createdAt?: string;
	creatorId?: number | string;
};

export type ScreenVersionDiff = {
	from?: ScreenVersion;
	to?: ScreenVersion;
	summary?: {
		componentCountFrom?: number;
		componentCountTo?: number;
		addedComponents?: number;
		removedComponents?: number;
		addedComponentTypes?: number;
		removedComponentTypes?: number;
		changedTypeComponents?: number;
		addedVariables?: number;
		removedVariables?: number;
	};
	details?: {
		addedComponentIds?: string[];
		removedComponentIds?: string[];
		addedComponentTypes?: string[];
		removedComponentTypes?: string[];
		changedTypeComponents?: Array<{
			id?: string;
			fromType?: string;
			toType?: string;
		}>;
		addedVariableKeys?: string[];
		removedVariableKeys?: string[];
	};
};

export type ScreenAclEntry = {
	id?: number | string;
	screenId?: number | string;
	subjectType: "USER" | "ROLE";
	subjectId: string;
	perm: "READ" | "EDIT" | "PUBLISH" | "MANAGE";
	creatorId?: number | string;
	createdAt?: string;
	updatedAt?: string;
};

export type ScreenAuditEntry = {
	id: number | string;
	screenId?: number | string;
	actorId?: number | string;
	action?: string;
	requestId?: string;
	createdAt?: string;
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
};

export type ScreenComment = {
	id: number | string;
	screenId?: number | string;
	componentId?: string | null;
	message?: string;
	anchor?: Record<string, unknown> | null;
	mentions?: Array<Record<string, unknown>>;
	createdBy?: number | string;
	createdAt?: string;
	status?: "open" | "resolved" | string;
	resolvedBy?: number | string | null;
	resolvedAt?: string | null;
	resolutionNote?: string | null;
	requestId?: string | null;
};

export type ScreenCommentChanges = {
	cursor?: number;
	sinceId?: number;
	fullReload?: boolean;
	waitMs?: number;
	rows?: ScreenComment[];
};

export type ScreenCollaborationPresenceRow = {
	sessionId?: string;
	userId?: number | string | null;
	displayName?: string;
	componentId?: string | null;
	typing?: boolean;
	clientType?: string | null;
	selectedCount?: number | null;
	selectionPreview?: string | null;
	lastSeenAt?: string | null;
	idleSeconds?: number;
	mine?: boolean;
};

export type ScreenCollaborationPresence = {
	generatedAt?: string;
	ttlSeconds?: number;
	meSessionId?: string | null;
	activeCount?: number;
	rows?: ScreenCollaborationPresenceRow[];
};

export type ScreenEditLock = {
	active?: boolean;
	screenId?: number | string | null;
	ownerId?: number | string | null;
	ownerName?: string | null;
	mine?: boolean;
	requestId?: string | null;
	acquiredAt?: string | null;
	heartbeatAt?: string | null;
	expireAt?: string | null;
	ttlSeconds?: number;
};

export type ScreenPublicLinkPolicy = {
	uuid?: string | null;
	expireAt?: string | null;
	hasPassword?: boolean;
	ipAllowlist?: string | null;
	disabled?: boolean;
};

export type ScreenHealthStats = {
	componentCount?: number;
	dataBoundComponentCount?: number;
	refreshableComponentCount?: number;
	interactiveComponentCount?: number;
	heavyComponentCount?: number;
	warmupEligibleDatabaseSources?: number;
	uniqueComponentTypes?: number;
	estimatedComplexity?: number;
	pass?: boolean;
	recommendations?: string[];
};

export type ScreenHealthReport = {
	screenId?: number | string;
	generatedAt?: string;
	requestId?: string;
	baselineTargetComponents?: number;
	draft?: ScreenHealthStats;
	published?: ScreenHealthStats;
	publishedVersionNo?: number | null;
	publishedAt?: string | null;
};

export type ScreenExportPrepareRequest = {
	format?: "png" | "pdf" | "json" | string;
	mode?: "draft" | "published" | "preview" | string;
	device?: "pc" | "tablet" | "mobile" | string;
	includeScreenSpec?: boolean;
};

export type ScreenExportPrepareResult = {
	allowed?: boolean;
	screenId?: number | string;
	format?: string;
	mode?: string;
	requestedMode?: string;
	resolvedMode?: string;
	device?: string | null;
	requestId?: string;
	previewUrl?: string;
	specDigest?: string | null;
	publishedVersionNo?: number | null;
	publishedAt?: string | null;
	screenSpec?: {
		schemaVersion?: number;
		name?: string;
		description?: string | null;
		width?: number;
		height?: number;
		backgroundColor?: string;
		backgroundImage?: string | null;
		theme?: string;
		components?: ScreenComponentData[];
		globalVariables?: Array<{ key: string; label?: string; type?: string; defaultValue?: string; description?: string }>;
	};
	policy?: {
		policyVersion?: number;
		exportApprovalRequired?: boolean;
		watermarkEnabled?: boolean;
		watermarkText?: string;
	};
};

export type ScreenExportReportRequest = {
	status: "success" | "failed" | "fallback" | string;
	format?: "png" | "pdf" | "json" | string;
	mode?: "draft" | "published" | "preview" | string;
	resolvedMode?: "draft" | "published" | "preview" | string;
	device?: "pc" | "tablet" | "mobile" | string;
	requestId?: string;
	specDigest?: string;
	message?: string;
};

export type ScreenExportReportResult = {
	accepted?: boolean;
	status?: string;
	screenId?: number | string;
	format?: string;
	mode?: string;
	device?: string | null;
	clientRequestId?: string | null;
	message?: string | null;
	specDigest?: string | null;
	requestId?: string;
	reportedAt?: string;
};

export type ScreenExportRenderRequest = {
	format?: "png" | "pdf" | string;
	mode?: "draft" | "published" | "preview" | string;
	device?: "pc" | "tablet" | "mobile" | string;
	pixelRatio?: number;
	screenSpec?: Record<string, unknown>;
};

export type ScreenExportRenderResult = {
	blob: Blob;
	contentType?: string;
	fileName?: string;
	requestId?: string;
	specDigest?: string;
	resolvedMode?: string;
	renderEngine?: string;
	pixelRatio?: number;
	deviceMode?: string;
	hiddenByDevice?: number;
};

export type ScreenComponentData = {
	id: string;
	type: string;
	name: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	locked: boolean;
	visible: boolean;
	config: Record<string, unknown>;
	dataSource?: Record<string, unknown>;
	interaction?: Record<string, unknown>;
};

// ── CS-09: SSE streaming for copilot chat ────────────────────────────

export type CopilotStreamEvent =
	| { type: "session"; sessionId: string }
	| { type: "heartbeat" }
	| { type: "reasoning"; content: string }
	| { type: "token"; content: string }
	| { type: "tool"; tool: string; status: string }
	| {
		type: "done";
		generatedSql?: string;
		templateCode?: string;
		routedDomain?: string;
		targetView?: string;
		responseKind?: string;
	}
	| { type: "error"; error: string };
