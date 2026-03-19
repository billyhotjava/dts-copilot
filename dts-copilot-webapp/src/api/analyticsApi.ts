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
	toolCallId?: string;
	toolName?: string;
	toolParams?: string;
	toolResult?: string;
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

import {
	normalizeLegacyAiChatResponse,
	normalizeLegacyAiChatSession,
	normalizeLegacyAiChatSessionDetail,
	resolveCopilotUserIdFromSharedStores,
} from "./aiChatCompatibility";
import { isCopilotAiRoute, shouldRedirectToLoginOnUnauthorized } from "./authRedirectPolicy";
import { getCopilotApiKey, getCopilotHeaders, hasCopilotSessionAccess } from "./copilotAuth";
import { getPlatformTokens, refreshPlatformAccessToken } from "./platformSession";

export class HttpError extends Error {
	status: number;
	bodyText: string;
	requestId?: string;
	code?: string;
	retryable?: boolean;
	constructor(
		status: number,
		message: string,
		bodyText: string,
		requestId?: string,
		code?: string,
		retryable?: boolean,
	) {
		super(message);
		this.status = status;
		this.bodyText = bodyText;
		this.requestId = requestId;
		this.code = code;
		this.retryable = retryable;
	}
}

export class AuthError extends HttpError { }

type PlatformApiEnvelope<T> = {
	status?: number;
	message?: string;
	code?: string;
	data?: T;
};

type AiApiEnvelope<T> = {
	success?: boolean;
	data?: T;
	error?: string | null;
};

function unwrapPlatformApiEnvelope<T>(payload: T | PlatformApiEnvelope<T>): T {
	if (!payload || typeof payload !== "object") {
		return payload as T;
	}
	const envelope = payload as PlatformApiEnvelope<T>;
	if (typeof envelope.status !== "number") {
		return payload as T;
	}
	if (envelope.status !== 200) {
		const code = typeof envelope.code === "string" && envelope.code.trim().length > 0 ? envelope.code.trim() : undefined;
		const message = typeof envelope.message === "string" && envelope.message.trim().length > 0
			? envelope.message.trim()
			: "请求失败";
		throw new Error(code ? `${message} [code=${code}]` : message);
	}
	return (envelope.data ?? ({} as T)) as T;
}

function unwrapAiApiEnvelope<T>(payload: T | AiApiEnvelope<T>): T {
	if (!payload || typeof payload !== "object" || !("success" in payload)) {
		return payload as T;
	}
	const envelope = payload as AiApiEnvelope<T>;
	if (envelope.success === false) {
		const message = typeof envelope.error === "string" && envelope.error.trim().length > 0
			? envelope.error.trim()
			: "请求失败";
		throw new Error(message);
	}
	return (envelope.data ?? ([] as unknown as T)) as T;
}

let _redirectingToLogin = false;
function redirectToLogin() {
	if (_redirectingToLogin) return;
	_redirectingToLogin = true;
	const tokens = getPlatformTokens();
	if (tokens.accessToken) {
		// Platform integration mode — don't redirect, just warn.
		console.warn("[dts-copilot] 认证失败 (401)，平台 token 可能已过期");
		setTimeout(() => { _redirectingToLogin = false; }, 5000);
		return;
	}
	// Standalone mode — redirect to login page.
	const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";
	window.location.href = `${basePath}/auth/login`;
}

function normalizeLegacyAnalyticsApiPath(url: string): string {
	if (!url.startsWith("/api/analytics/")) {
		return url;
	}
	return "/api/" + url.slice("/api/analytics/".length);
}

async function apiFetch(url: string, init: RequestInit, allowRefresh: boolean): Promise<Response> {
	const normalizedUrl = normalizeLegacyAnalyticsApiPath(url);
	const tokens = getPlatformTokens();
	const headers = new Headers(init.headers ?? {});
	const shouldRedirectOnUnauthorized = shouldRedirectToLoginOnUnauthorized(normalizedUrl);
	const copilotAiRoute = isCopilotAiRoute(normalizedUrl);
	if (!headers.has("accept")) headers.set("accept", "application/json");
	if (copilotAiRoute) {
		const copilotHeaders = getCopilotHeaders();
		for (const [key, value] of Object.entries(copilotHeaders)) {
			if (!headers.has(key)) {
				headers.set(key, String(value));
			}
		}
	} else if (tokens.accessToken && !headers.has("authorization")) {
		headers.set("authorization", `Bearer ${tokens.accessToken}`);
	}

	const response = await fetch(normalizedUrl, { ...init, credentials: "include", headers });
	if (response.status !== 401 || !allowRefresh || copilotAiRoute) {
		return response;
	}

	if (!tokens.refreshToken) {
		if (shouldRedirectOnUnauthorized) {
			redirectToLogin();
		}
		return response;
	}

	const refreshed = await refreshPlatformAccessToken(tokens.refreshToken);
	if (!refreshed?.accessToken) {
		if (shouldRedirectOnUnauthorized) {
			redirectToLogin();
		}
		return response;
	}

	const retryHeaders = new Headers(init.headers ?? {});
	if (!retryHeaders.has("accept")) retryHeaders.set("accept", "application/json");
	retryHeaders.set("authorization", `Bearer ${refreshed.accessToken}`);
	return await fetch(normalizedUrl, { ...init, credentials: "include", headers: retryHeaders });
}

async function readErrorText(response: Response): Promise<string> {
	return await response.text().catch(() => "");
}

function extractRequestId(response: Response): string | undefined {
	const headers = ["x-request-id", "x-requestid", "x-correlation-id"];
	for (const header of headers) {
		const value = response.headers.get(header);
		if (value && value.trim().length > 0) {
			return value.trim();
		}
	}
	return undefined;
}

function extractErrorCode(response: Response, bodyText: string): string | undefined {
	const headerCode = response.headers.get("x-error-code");
	if (headerCode && headerCode.trim().length > 0) {
		return headerCode.trim();
	}
	if (!bodyText) {
		return undefined;
	}
	try {
		const payload = JSON.parse(bodyText) as { code?: unknown };
		if (typeof payload.code === "string" && payload.code.trim().length > 0) {
			return payload.code.trim();
		}
	} catch {
		// ignore non-JSON error bodies
	}
	return undefined;
}

function extractErrorRetryable(response: Response, bodyText: string): boolean | undefined {
	const headerValue = response.headers.get("x-error-retryable");
	if (headerValue != null && headerValue.trim().length > 0) {
		const normalized = headerValue.trim().toLowerCase();
		if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
		if (normalized === "false" || normalized === "0" || normalized === "no") return false;
	}
	if (!bodyText) {
		return undefined;
	}
	try {
		const payload = JSON.parse(bodyText) as { retryable?: unknown };
		if (typeof payload.retryable === "boolean") {
			return payload.retryable;
		}
	} catch {
		// ignore non-JSON error bodies
	}
	return undefined;
}

function buildHttpError(response: Response, bodyText: string): HttpError {
	const requestId = extractRequestId(response);
	const errorCode = extractErrorCode(response, bodyText);
	const retryable = extractErrorRetryable(response, bodyText);
	const baseMsg = "HTTP " + response.status + " " + response.statusText + ": " + bodyText;
	const taggedMsg = errorCode ? baseMsg + " [code=" + errorCode + "]" : baseMsg;
	const retryableTag = typeof retryable === "boolean" ? " [retryable=" + String(retryable) + "]" : "";
	const requestTag = requestId ? " [requestId=" + requestId + "]" : "";
	const msg = taggedMsg + retryableTag + requestTag;
	if (response.status === 401 || response.status === 403) {
		return new AuthError(response.status, msg, bodyText, requestId, errorCode, retryable);
	}
	return new HttpError(response.status, msg, bodyText, requestId, errorCode, retryable);
}

export function isRetryableHttpError(error: unknown): boolean {
	if (!(error instanceof HttpError)) {
		return false;
	}
	if (typeof error.retryable === "boolean") {
		return error.retryable;
	}
	return [408, 429, 502, 503, 504].includes(error.status);
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await apiFetch(url, { method: "GET" }, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	return (await response.json()) as T;
}

function resolveLegacyAiUserId(): string {
	try {
		return resolveCopilotUserIdFromSharedStores([
			window.localStorage.getItem("platformUserStore"),
			window.localStorage.getItem("userStore"),
			window.sessionStorage.getItem("dts.copilot.login.username")
				? JSON.stringify({
					state: { userInfo: { username: window.sessionStorage.getItem("dts.copilot.login.username") } },
				})
				: null,
		]);
	} catch {
		return "standalone-user";
	}
}

function resolveLegacyAiUserName(): string {
	try {
		const loginUser = window.sessionStorage.getItem("dts.copilot.login.username");
		if (loginUser && loginUser.trim().length > 0) {
			return loginUser.trim();
		}
		return resolveLegacyAiUserId();
	} catch {
		return resolveLegacyAiUserId();
	}
}

function isAiCompatFallbackError(error: unknown): boolean {
	return error instanceof HttpError && [404, 405].includes(error.status);
}

function shouldUseSessionCopilotProxy(): boolean {
	return !getCopilotApiKey() && hasCopilotSessionAccess();
}

async function sendAiAgentChatViaSessionProxy(body: {
	sessionId?: string;
	userMessage: string;
	datasourceId?: string;
}): Promise<AiAgentChatResponse> {
	const legacy = await sendJson<Record<string, unknown>>("/api/copilot/chat/send", {
		sessionId: body.sessionId,
		userMessage: body.userMessage,
		datasourceId: body.datasourceId,
	});
	return normalizeLegacyAiChatResponse(legacy) as AiAgentChatResponse;
}

async function listAiAgentSessionsViaSessionProxy(limit = 50): Promise<AiAgentChatSession[]> {
	const legacy = await fetchJson<Record<string, unknown>[]>(
		"/api/copilot/chat/sessions?limit=" + encodeURIComponent(String(limit)),
	);
	return legacy.map((item) => normalizeLegacyAiChatSession(item) as AiAgentChatSession);
}

async function getAiAgentSessionViaSessionProxy(id: string): Promise<AiAgentChatSessionDetail> {
	const legacy = await fetchJson<Record<string, unknown>>(
		"/api/copilot/chat/" + encodeURIComponent(String(id)),
	);
	return normalizeLegacyAiChatSessionDetail(legacy) as AiAgentChatSessionDetail;
}

async function deleteAiAgentSessionViaSessionProxy(id: string): Promise<void> {
	await requestJson<void>("/api/copilot/chat/" + encodeURIComponent(String(id)), "DELETE");
}

async function sendAiAgentChatCompat(body: {
	sessionId?: string;
	userMessage: string;
}): Promise<AiAgentChatResponse> {
	if (shouldUseSessionCopilotProxy()) {
		return sendAiAgentChatViaSessionProxy(body);
	}
	try {
		const value = await sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat", body ?? {});
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacyBody = {
			sessionId: body.sessionId,
			userId: resolveLegacyAiUserId(),
			message: body.userMessage,
		};
		const legacy = await sendJson<Record<string, unknown>>("/api/ai/agent/chat/send", legacyBody);
		return normalizeLegacyAiChatResponse(legacy) as AiAgentChatResponse;
	}
}

async function listAiAgentSessionsCompat(limit = 50): Promise<AiAgentChatSession[]> {
	if (shouldUseSessionCopilotProxy()) {
		return listAiAgentSessionsViaSessionProxy(limit);
	}
	try {
		const value = await fetchJson<AiAgentChatSession[] | PlatformApiEnvelope<AiAgentChatSession[]>>(
			"/api/ai/agent/sessions?limit=" + encodeURIComponent(String(limit)),
		);
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacy = await fetchJson<Record<string, unknown>[]>(
			"/api/ai/agent/chat/sessions?userId=" + encodeURIComponent(resolveLegacyAiUserId()),
		);
		return legacy.map((item) => normalizeLegacyAiChatSession(item) as AiAgentChatSession).slice(0, limit);
	}
}

async function getAiAgentSessionCompat(id: string): Promise<AiAgentChatSessionDetail> {
	if (shouldUseSessionCopilotProxy()) {
		return getAiAgentSessionViaSessionProxy(id);
	}
	try {
		const value = await fetchJson<AiAgentChatSessionDetail | PlatformApiEnvelope<AiAgentChatSessionDetail>>(
			"/api/ai/agent/sessions/" + encodeURIComponent(String(id)),
		);
		return unwrapPlatformApiEnvelope(value);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		const legacy = await fetchJson<Record<string, unknown>>(
			"/api/ai/agent/chat/" + encodeURIComponent(String(id)),
		);
		return normalizeLegacyAiChatSessionDetail(legacy) as AiAgentChatSessionDetail;
	}
}

async function deleteAiAgentSessionCompat(id: string): Promise<void> {
	if (shouldUseSessionCopilotProxy()) {
		await deleteAiAgentSessionViaSessionProxy(id);
		return;
	}
	try {
		const value = await requestJson<unknown>("/api/ai/agent/sessions/" + encodeURIComponent(String(id)), "DELETE");
		unwrapPlatformApiEnvelope(value as PlatformApiEnvelope<unknown>);
	} catch (error) {
		if (!isAiCompatFallbackError(error)) {
			throw error;
		}
		await requestJson<void>("/api/ai/agent/chat/" + encodeURIComponent(String(id)), "DELETE");
	}
}

async function sendJson<T>(url: string, body: unknown): Promise<T> {
	return await requestJson<T>(url, "POST", body);
}

async function requestJson<T>(url: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
	const init: RequestInit = {
		method,
		headers: {
			accept: "application/json",
			"content-type": "application/json",
		},
	};
	if (method !== "DELETE") {
		init.body = JSON.stringify(body ?? {});
	}
	const response = await apiFetch(url, init, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	if (response.status === 204) {
		return undefined as T;
	}
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json")) {
		return (await response.text()) as unknown as T;
	}
	return (await response.json()) as T;
}

function parseContentDispositionFilename(headerValue: string | null): string | undefined {
	if (!headerValue) return undefined;
	const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(headerValue);
	if (utf8Match && utf8Match[1]) {
		try {
			return decodeURIComponent(utf8Match[1].trim());
		} catch {
			return utf8Match[1].trim();
		}
	}
	const plainMatch = /filename="?([^\";]+)"?/i.exec(headerValue);
	if (plainMatch && plainMatch[1]) {
		return plainMatch[1].trim();
	}
	return undefined;
}

async function requestBinary(
	url: string,
	method: "POST" | "PUT",
	body?: unknown,
): Promise<ScreenExportRenderResult> {
	const response = await apiFetch(url, {
		method,
		headers: {
			accept: "application/octet-stream",
			"content-type": "application/json",
		},
		body: JSON.stringify(body ?? {}),
	}, true);
	if (!response.ok) {
		const text = await readErrorText(response);
		throw buildHttpError(response, text);
	}
	const blob = await response.blob();
	return {
		blob,
		contentType: response.headers.get("content-type") ?? undefined,
		fileName: parseContentDispositionFilename(response.headers.get("content-disposition")),
		requestId: response.headers.get("x-request-id") ?? undefined,
		specDigest: response.headers.get("x-screen-spec-digest") ?? undefined,
		resolvedMode: response.headers.get("x-screen-resolved-mode") ?? undefined,
		renderEngine: response.headers.get("x-screen-render-engine") ?? undefined,
		pixelRatio: (() => {
			const raw = response.headers.get("x-screen-render-pixel-ratio");
			if (!raw) return undefined;
			const value = Number.parseFloat(raw);
			return Number.isFinite(value) ? value : undefined;
		})(),
		deviceMode: response.headers.get("x-screen-device-mode") ?? undefined,
		hiddenByDevice: (() => {
			const raw = response.headers.get("x-screen-hidden-by-device");
			if (!raw) return undefined;
			const value = Number.parseInt(raw, 10);
			return Number.isFinite(value) ? value : undefined;
		})(),
	};
}

export const analyticsApi = {
	getCurrentUser: () => fetchJson<CurrentUser>("/api/user/current"),
	listUsers: () => fetchJson<CurrentUser[]>("/api/user"),
	getUser: (id: number) => fetchJson<CurrentUser>(`/api/user/${id}`),
	createUser: (body: { first_name: string; last_name: string; username: string; password?: string }) =>
		sendJson<CurrentUser>("/api/user", body),
	updateUser: (id: number, body: Record<string, unknown>) =>
		requestJson<CurrentUser>(`/api/user/${id}`, "PUT", body),
	deactivateUser: (id: number) =>
		requestJson<void>(`/api/user/${id}`, "DELETE"),
	reactivateUser: (id: number) =>
		requestJson<CurrentUser>(`/api/user/${id}/reactivate`, "PUT"),
	changeUserPassword: (id: number, body: { password: string; old_password?: string }) =>
		requestJson<void>(`/api/user/${id}/password`, "PUT", body),
	getHealth: () => fetchJson<{ status?: string }>("/api/analytics/health"),
	getCopilotSiteSettings: () => fetchJson<CopilotSiteSettings>("/api/admin/copilot/settings/site"),
	updateCopilotSiteSettings: (body: CopilotSiteSettings) =>
		requestJson<CopilotSiteSettings>("/api/admin/copilot/settings/site", "PUT", body),
	listCopilotProviders: () => fetchJson<CopilotProvider[]>("/api/admin/copilot/providers"),
	listCopilotProviderTemplates: () =>
		fetchJson<CopilotProviderTemplate[]>("/api/admin/copilot/providers/templates"),
	createCopilotProvider: (body: CopilotProviderPayload) =>
		sendJson<CopilotProvider>("/api/admin/copilot/providers", body),
	updateCopilotProvider: (id: string | number, body: CopilotProviderPayload) =>
		requestJson<CopilotProvider>("/api/admin/copilot/providers/" + encodeURIComponent(String(id)), "PUT", body),
	deleteCopilotProvider: (id: string | number) =>
		requestJson<{ id?: number; deleted?: boolean }>(
			"/api/admin/copilot/providers/" + encodeURIComponent(String(id)),
			"DELETE",
		),
	testCopilotProvider: (id: string | number) =>
		sendJson<CopilotProviderTestResult>(
			"/api/admin/copilot/providers/" + encodeURIComponent(String(id)) + "/test",
			{},
		),
	listCopilotApiKeys: () => fetchJson<CopilotApiKeyItem[]>("/api/admin/copilot/api-keys"),
	createCopilotApiKey: (body: CopilotApiKeyCreatePayload) =>
		sendJson<CopilotApiKeyReveal>("/api/admin/copilot/api-keys", body),
	rotateCopilotApiKey: (id: string | number) =>
		requestJson<CopilotApiKeyReveal>(
			"/api/admin/copilot/api-keys/" + encodeURIComponent(String(id)) + "/rotate",
			"PUT",
		),
	revokeCopilotApiKey: (id: string | number) =>
		requestJson<{ id?: number; revoked?: boolean }>(
			"/api/admin/copilot/api-keys/" + encodeURIComponent(String(id)),
			"DELETE",
		),
	listDatabases: () => fetchJson<DatabaseListResponse>("/api/analytics/database"),
	listPlatformDataSources: () => fetchJson<PlatformDataSourceItem[]>("/api/analytics/platform/data-sources"),
	createManagedDataSource: (body: ManagedDataSourceCreatePayload) =>
		sendJson<PlatformDataSourceItem>("/api/platform/data-sources", body),
	updateManagedDataSource: (id: string | number, body: ManagedDataSourceCreatePayload) =>
		requestJson<PlatformDataSourceItem>(`/api/platform/data-sources/${encodeURIComponent(String(id))}`, "PUT", body),
	getDatabase: (dbId: string | number) =>
		fetchJson<DatabaseCreateResponse>(`/api/analytics/database/${encodeURIComponent(String(dbId))}`),
	getPlatformDataSource: (id: string | number) =>
		fetchJson<PlatformDataSourceItem>(`/api/platform/data-sources/${encodeURIComponent(String(id))}`),
	listTables: (dbId: string | number) =>
		fetchJson<TableSummary[]>(`/api/analytics/table?db_id=${encodeURIComponent(String(dbId))}`),
	getTable: (tableId: string | number) =>
		fetchJson<TableDetail>(`/api/analytics/table/${encodeURIComponent(String(tableId))}`),
	getField: (fieldId: string | number) =>
		fetchJson<FieldDetail>(`/api/analytics/field/${encodeURIComponent(String(fieldId))}`),
	getFieldValues: (fieldId: string | number) =>
		fetchJson<FieldValuesResponse>(`/api/analytics/field/${encodeURIComponent(String(fieldId))}/values`),
	validateDatabase: (body: unknown) => sendJson<DatabaseValidateResponse>("/api/analytics/database/validate", body),
	createDatabase: (body: unknown) => sendJson<DatabaseCreateResponse>("/api/analytics/database", body),
	syncDatabaseSchema: (dbId: string | number) =>
		sendJson<Record<string, unknown>>(`/api/analytics/database/${encodeURIComponent(String(dbId))}/sync_schema`, {}),
	updateDatabase: (id: string | number, body: unknown) =>
		requestJson<DatabaseCreateResponse>(`/api/analytics/database/${encodeURIComponent(String(id))}`, "PUT", body),
	deleteDatabase: (id: string | number) =>
		requestJson<void>(`/api/analytics/database/${encodeURIComponent(String(id))}`, "DELETE"),
	getDatabaseMetadata: (dbId: string | number) =>
		fetchJson<DatabaseMetadataResponse>(`/api/analytics/database/${encodeURIComponent(String(dbId))}/metadata`),
	listCollections: () => fetchJson<CollectionListItem[]>("/api/analytics/collection"),
	getCollectionItems: (id: string | number) =>
		fetchJson<CollectionItem[]>(`/api/analytics/collection/${encodeURIComponent(String(id))}/items`),
	listDashboards: () => fetchJson<DashboardListItem[]>("/api/analytics/dashboard"),
	getDashboard: (id: string | number) => fetchJson<DashboardDetail>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}`),
	createDashboard: (body: unknown) => sendJson<DashboardDetail>("/api/analytics/dashboard", body),
	saveDashboard: (body: unknown) => sendJson<DashboardDetail>("/api/analytics/dashboard/save", body),
	listDashboardParamValues: (dashId: string | number, paramId: string) =>
		fetchJson<string[]>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashId))}/params/${encodeURIComponent(String(paramId))}/values`,
		),
	searchDashboardParamValues: (dashId: string | number, paramId: string, query: string) =>
		fetchJson<string[]>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashId))}/params/${encodeURIComponent(String(paramId))}/search/${encodeURIComponent(String(query))}`,
		),
	listCards: () => fetchJson<CardListItem[]>("/api/analytics/card"),
	getCard: (id: string | number) => fetchJson<CardDetail>(`/api/analytics/card/${encodeURIComponent(String(id))}`),
	createCard: (body: unknown) => sendJson<CardDetail>("/api/analytics/card", body),
	updateCard: (id: string | number, body: unknown) =>
		requestJson<CardDetail>(`/api/analytics/card/${encodeURIComponent(String(id))}`, "PUT", body),
	queryCard: (id: string | number, body?: unknown) =>
		sendJson<CardQueryResponse>(`/api/analytics/card/${encodeURIComponent(String(id))}/query`, body ?? {}),
	runDatasetQuery: (body: unknown) => sendJson<CardQueryResponse>("/api/analytics/dataset", body),
	getDatasetCacheStats: () => fetchJson<DatasetCacheStats>("/api/analytics/dataset/cache/stats"),
	getDatasetCachePolicy: (databaseId: string | number) =>
		fetchJson<DatasetCachePolicy>("/api/analytics/dataset/cache/policy/" + encodeURIComponent(String(databaseId))),
	setDatasetCachePolicy: (databaseId: string | number, body: unknown) =>
		sendJson<DatasetCachePolicy>("/api/analytics/dataset/cache/policy/" + encodeURIComponent(String(databaseId)), body),
	warmupDatasetCache: (body: unknown) => sendJson<Record<string, unknown>>("/api/analytics/dataset/cache/warmup", body),
	queryDashcard: (dashboardId: string | number, dashcardId: string | number, cardId: string | number, body?: unknown) =>
		sendJson<DashboardQueryResponse>(
			`/api/analytics/dashboard/${encodeURIComponent(String(dashboardId))}/dashcard/${encodeURIComponent(String(dashcardId))}/card/${encodeURIComponent(String(cardId))}/query`,
			body ?? {},
		),
	search: (q: string) =>
		fetchJson<SearchResponse>(`/api/analytics/search?q=${encodeURIComponent(String(q ?? ""))}&limit=25&offset=0`),
	listMetrics: () => fetchJson<Metric[]>("/api/analytics/metric"),
	listMetricVersions: (metricId: string | number) =>
		fetchJson<string[]>("/api/analytics/query-trace/metric/" + encodeURIComponent(String(metricId)) + "/versions"),
	getQueryTraceFailureSummary: (days = 7, topN = 10, chain?: string) => {
		const qs = new URLSearchParams();
		qs.set("days", String(days));
		qs.set("topN", String(topN));
		if (chain && chain.trim().length > 0) {
			qs.set("chain", chain.trim());
		}
		return fetchJson<QueryTraceFailureSummary>("/api/analytics/query-trace/failure-summary?" + qs.toString());
	},
	explainCard: (cardId: string | number, body?: unknown) =>
		sendJson<ExplainabilityResponse>("/api/analytics/explain/card/" + encodeURIComponent(String(cardId)), body ?? {}),
	listExploreSessions: (params?: {
		includeArchived?: boolean;
		dept?: string;
		projectKey?: string;
		limit?: number;
	}) => {
		const qs = new URLSearchParams();
		qs.set("includeArchived", String(Boolean(params?.includeArchived)));
		if (params?.dept && params.dept.trim()) {
			qs.set("dept", params.dept.trim());
		}
		if (params?.projectKey && params.projectKey.trim()) {
			qs.set("projectKey", params.projectKey.trim());
		}
		qs.set("limit", String(params?.limit ?? 100));
		return fetchJson<ExploreSessionItem[]>("/api/analytics/explore-session?" + qs.toString());
	},
	getExploreSession: (id: string | number) =>
		fetchJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id))),
	createExploreSession: (body: unknown) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session", body ?? {}),
	updateExploreSession: (id: string | number, body: unknown) =>
		requestJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)), "PUT", body),
	appendExploreSessionStep: (id: string | number, body: unknown) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/steps", body ?? {}),
	replayExploreSessionStep: (id: string | number, stepIndex: number) =>
		sendJson<Record<string, unknown>>(
			"/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/replay",
			{ stepIndex },
		),
	archiveExploreSession: (id: string | number) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/archive", {}),
	cloneExploreSession: (id: string | number) =>
		sendJson<ExploreSessionItem>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/clone", {}),
	createExploreSessionPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/public_link", {}),
	deleteExploreSessionPublicLink: (id: string | number) =>
		requestJson<void>("/api/analytics/explore-session/" + encodeURIComponent(String(id)) + "/public_link", "DELETE"),
	getPublicExploreSession: (uuid: string) =>
		fetchJson<ExploreSessionItem>("/api/analytics/explore-session/public/" + encodeURIComponent(String(uuid))),
	listReportTemplates: (limit = 100) =>
		fetchJson<ReportTemplateItem[]>("/api/analytics/report-factory/templates?limit=" + encodeURIComponent(String(limit))),
	createReportTemplate: (body: unknown) =>
		sendJson<ReportTemplateItem>("/api/analytics/report-factory/templates", body ?? {}),
	updateReportTemplate: (id: string | number, body: unknown) =>
		requestJson<ReportTemplateItem>("/api/analytics/report-factory/templates/" + encodeURIComponent(String(id)), "PUT", body),
	deleteReportTemplate: (id: string | number) =>
		requestJson<void>("/api/analytics/report-factory/templates/" + encodeURIComponent(String(id)), "DELETE"),
	generateReportRun: (body: unknown) =>
		sendJson<ReportRunItem>("/api/analytics/report-factory/generate", body ?? {}),
	listReportRuns: (limit = 100) =>
		fetchJson<ReportRunItem[]>("/api/analytics/report-factory/runs?limit=" + encodeURIComponent(String(limit))),
	getReportRun: (id: string | number) =>
		fetchJson<ReportRunItem>("/api/analytics/report-factory/runs/" + encodeURIComponent(String(id))),
	getReportRunExportUrl: (id: string | number, format: "html" | "markdown" = "html") =>
		"/api/analytics/report-factory/runs/"
		+ encodeURIComponent(String(id))
		+ "/export?format="
		+ encodeURIComponent(String(format)),
	listMetricLens: () =>
		fetchJson<MetricLensSummary[]>("/api/analytics/metric-lens"),
	getMetricLens: (metricId: string | number) =>
		fetchJson<MetricLensDetail>("/api/analytics/metric-lens/" + encodeURIComponent(String(metricId))),
	compareMetricLensVersions: (metricId: string | number, leftVersion: string, rightVersion: string) =>
		fetchJson<MetricLensCompare>(
			"/api/analytics/metric-lens/"
			+ encodeURIComponent(String(metricId))
			+ "/compare?leftVersion="
			+ encodeURIComponent(String(leftVersion))
			+ "&rightVersion="
			+ encodeURIComponent(String(rightVersion)),
		),
	getMetricLensConflicts: () =>
		fetchJson<Array<Record<string, unknown>>>("/api/analytics/metric-lens/conflicts"),
	listNl2SqlEvalCases: (enabledOnly = false, limit = 200) =>
		fetchJson<Nl2SqlEvalCaseItem[]>(
			"/api/analytics/nl2sql-eval/cases?enabledOnly="
			+ encodeURIComponent(String(enabledOnly))
			+ "&limit="
			+ encodeURIComponent(String(limit)),
		),
	createNl2SqlEvalCase: (body: unknown) =>
		sendJson<Nl2SqlEvalCaseItem>("/api/analytics/nl2sql-eval/cases", body ?? {}),
	updateNl2SqlEvalCase: (id: string | number, body: unknown) =>
		requestJson<Nl2SqlEvalCaseItem>("/api/analytics/nl2sql-eval/cases/" + encodeURIComponent(String(id)), "PUT", body),
	deleteNl2SqlEvalCase: (id: string | number) =>
		requestJson<void>("/api/analytics/nl2sql-eval/cases/" + encodeURIComponent(String(id)), "DELETE"),
	runNl2SqlEvaluation: (body?: unknown) =>
		sendJson<Nl2SqlEvalRunSummary>("/api/analytics/nl2sql-eval/run", body ?? {}),
	runNl2SqlEvaluationWithGate: (body?: unknown) =>
		sendJson<Nl2SqlEvalGateRunResponse>("/api/analytics/nl2sql-eval/run-gated", body ?? {}),
	listNl2SqlEvalRuns: (limit = 20) =>
		fetchJson<Nl2SqlEvalRunRecord[]>(
			"/api/analytics/nl2sql-eval/runs?limit=" + encodeURIComponent(String(limit)),
		),
	compareNl2SqlEvalRuns: (baselineRunId: string | number, candidateRunId: string | number) =>
		fetchJson<Nl2SqlEvalCompareResponse>(
			"/api/analytics/nl2sql-eval/compare?baselineRunId="
			+ encodeURIComponent(String(baselineRunId))
			+ "&candidateRunId="
			+ encodeURIComponent(String(candidateRunId)),
		),
	aiAgentChatSend: (body: {
		sessionId?: string;
		userMessage: string;
		datasourceId?: string;
		schemaName?: string;
		objectContext?: {
			typeId?: string;
			instanceId?: string | null;
			displayName?: string | null;
		};
		pageContext?: {
			module: string;
			resourceType?: string;
			resourceId?: string;
			resourceName?: string;
			extras?: Record<string, string>;
		};
	}) =>
		sendAiAgentChatCompat(body),
	aiAgentChatApprove: (
		sessionId: string,
		actionId: string,
		formData?: Record<string, unknown>,
	) =>
		sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat/approve", {
			sessionId,
			actionId,
			formData,
		})
			.then(unwrapPlatformApiEnvelope),
	aiAgentChatCancel: (sessionId: string, actionId: string) =>
		sendJson<AiAgentChatResponse | PlatformApiEnvelope<AiAgentChatResponse>>("/api/ai/agent/chat/cancel", { sessionId, actionId })
			.then(unwrapPlatformApiEnvelope),
	listAiAgentSessions: (limit = 50) => listAiAgentSessionsCompat(limit),
	getAiAgentSession: (id: string) => getAiAgentSessionCompat(id),
	deleteAiAgentSession: (id: string) => deleteAiAgentSessionCompat(id),
	listPlatformMetrics: () => fetchJson<PlatformMetric[]>("/api/analytics/platform/metrics"),
	listVisibleTables: () => fetchJson<Array<number | VisibleTable>>("/api/analytics/platform/visible-tables"),
	getTrash: () => fetchJson<TrashResponse>("/api/analytics/trash"),
	createCardPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>(`/api/analytics/card/${encodeURIComponent(String(id))}/public_link`, {}),
	deleteCardPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/card/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	createDashboardPublicLink: (id: string | number) =>
		sendJson<{ uuid: string }>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}/public_link`, {}),
	deleteDashboardPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/dashboard/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	getPublicCard: (uuid: string) => fetchJson<PublicCardDetail>(`/api/analytics/public/card/${encodeURIComponent(uuid)}`),
	queryPublicCard: (uuid: string, body?: unknown) =>
		sendJson<CardQueryResponse>(`/api/analytics/public/card/${encodeURIComponent(uuid)}/query`, body ?? {}),
	getPublicDashboard: (uuid: string) =>
		fetchJson<PublicDashboardDetail>(`/api/analytics/public/dashboard/${encodeURIComponent(uuid)}`),
	queryPublicDashboardDashcard: (uuid: string, dashcardId: string | number, cardId: string | number, body?: unknown) =>
		sendJson<DashboardQueryResponse>(
			`/api/analytics/public/dashboard/${encodeURIComponent(uuid)}/dashcard/${encodeURIComponent(String(dashcardId))}/card/${encodeURIComponent(String(cardId))}/query`,
			body ?? {},
		),

	// Screen Designer API
	listScreenPlugins: () => fetchJson<ScreenPluginManifest[]>("/api/analytics/screen-plugins"),
	validateScreenPlugin: (body: unknown) =>
		sendJson<ScreenPluginValidationResult>("/api/analytics/screen-plugins/validate", body),
	exportScreenIndustryPack: (body?: unknown) =>
		sendJson<ScreenIndustryPack>("/api/analytics/screen-packs/export", body ?? {}),
	importScreenIndustryPack: (body: unknown) =>
		sendJson<ScreenIndustryPackImportResult>("/api/analytics/screen-packs/import", body),
	getScreenIndustryPackPresets: () =>
		fetchJson<ScreenIndustryPackPresets>("/api/analytics/screen-packs/presets"),
	validateScreenIndustryPack: (body: unknown) =>
		sendJson<ScreenIndustryPackValidationResult>("/api/analytics/screen-packs/validate", body),
	listScreenIndustryPackAudit: (limit = 100) =>
		fetchJson<ScreenIndustryPackAuditRow[]>(
			"/api/analytics/screen-packs/audit?limit=" + encodeURIComponent(String(limit)),
		),
	generateScreenIndustryConnectorPlan: (body?: unknown) =>
		sendJson<ScreenIndustryConnectorPlan>("/api/analytics/screen-packs/connectors/plan", body ?? {}),
	probeScreenIndustryConnectors: (body?: unknown) =>
		sendJson<ScreenIndustryConnectorProbe>("/api/analytics/screen-packs/connectors/probe", body ?? {}),
	getScreenIndustryOpsHealth: (deploymentMode?: string, includeRuntime = false) => {
		const qs = new URLSearchParams();
		if (deploymentMode && String(deploymentMode).trim().length > 0) {
			qs.set("deploymentMode", String(deploymentMode));
		}
		if (includeRuntime) {
			qs.set("includeRuntime", "true");
		}
		const query = qs.toString();
		const suffix = query.length > 0 ? `?${query}` : "";
		return fetchJson<ScreenIndustryOpsHealth>("/api/analytics/screen-packs/ops/health" + suffix);
	},
	probeScreenIndustryRuntime: (body?: unknown) =>
		sendJson<ScreenIndustryRuntimeProbe>("/api/analytics/screen-packs/ops/runtime-probe", body ?? {}),
	getScreenCompliancePolicy: () =>
		fetchJson<ScreenCompliancePolicy>("/api/analytics/screen-compliance/policy"),
	updateScreenCompliancePolicy: (body: unknown) =>
		requestJson<ScreenCompliancePolicy>("/api/analytics/screen-compliance/policy", "PUT", body),
	getScreenComplianceReport: (query?: ScreenComplianceReportQuery) => {
		const qs = new URLSearchParams();
		if (query?.screenId !== undefined && query?.screenId !== null && String(query.screenId).trim() !== "") {
			qs.set("screenId", String(query.screenId));
		}
		if (query?.days !== undefined) {
			qs.set("days", String(query.days));
		}
		if (query?.limit !== undefined) {
			qs.set("limit", String(query.limit));
		}
		const suffix = qs.toString();
		const url = suffix.length > 0
			? "/api/analytics/screen-compliance/report?" + suffix
			: "/api/analytics/screen-compliance/report";
		return fetchJson<ScreenComplianceReport>(url);
	},
	generateScreenSpec: (body: ScreenAiGenerationRequest) =>
		sendJson<ScreenAiGenerationResponse>("/api/analytics/screens/ai/generate", body),
	reviseScreenSpec: (body: ScreenAiRevisionRequest) =>
		sendJson<ScreenAiGenerationResponse>("/api/analytics/screens/ai/revise", body),
	listScreens: () => fetchJson<ScreenListItem[]>("/api/analytics/screens"),
	listScreenTemplates: (params?: {
		q?: string;
		category?: string;
		tag?: string;
		visibility?: string;
		listed?: boolean;
	}) => {
		const qs = new URLSearchParams();
		if (params?.q) qs.set("q", String(params.q));
		if (params?.category) qs.set("category", String(params.category));
		if (params?.tag) qs.set("tag", String(params.tag));
		if (params?.visibility) qs.set("visibility", String(params.visibility));
		if (typeof params?.listed === "boolean") qs.set("listed", String(params.listed));
		const query = qs.toString();
		const url = query.length > 0 ? "/api/analytics/screen-templates?" + query : "/api/analytics/screen-templates";
		return fetchJson<ScreenTemplateItem[]>(url);
	},
	getScreenTemplate: (id: string | number) =>
		fetchJson<ScreenTemplateItem>("/api/analytics/screen-templates/" + encodeURIComponent(String(id))),
	createScreenTemplate: (body: unknown) =>
		sendJson<ScreenTemplateItem>("/api/analytics/screen-templates", body),
	createScreenTemplateFromScreen: (screenId: string | number, body?: unknown) =>
		sendJson<ScreenTemplateItem>("/api/analytics/screen-templates/from-screen/" + encodeURIComponent(String(screenId)), body ?? {}),
	updateScreenTemplate: (id: string | number, body: unknown) =>
		requestJson<ScreenTemplateItem>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)), "PUT", body),
	updateScreenTemplateListing: (id: string | number, listed: boolean) =>
		requestJson<ScreenTemplateItem>(
			"/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/listing",
			"PUT",
			{ listed },
		),
	listScreenTemplateVersions: (id: string | number, limit = 50) =>
		fetchJson<ScreenTemplateVersionItem[]>(
			"/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/versions?limit=" + encodeURIComponent(String(limit)),
		),
	restoreScreenTemplateVersion: (id: string | number, versionNo: number) =>
		sendJson<ScreenTemplateItem>(
			"/api/analytics/screen-templates/"
				+ encodeURIComponent(String(id))
				+ "/restore/"
				+ encodeURIComponent(String(versionNo)),
			{},
		),
	deleteScreenTemplate: (id: string | number) =>
		requestJson<void>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)), "DELETE"),
	createScreenFromTemplate: (id: string | number, body?: unknown) =>
		sendJson<ScreenDetail>("/api/analytics/screen-templates/" + encodeURIComponent(String(id)) + "/create-screen", body ?? {}),
	getScreen: (
		id: string | number,
		options?: { mode?: "draft" | "published" | "preview" | string; fallbackDraft?: boolean },
	) => {
		const params = new URLSearchParams();
		if (options?.mode) params.set("mode", String(options.mode));
		if (options?.fallbackDraft !== undefined) params.set("fallbackDraft", String(options.fallbackDraft));
		const qs = params.toString();
		const base = `/api/analytics/screens/${encodeURIComponent(String(id))}`;
		return fetchJson<ScreenDetail>(qs ? `${base}?${qs}` : base);
	},
	getScreenHealth: (id: string | number) =>
		fetchJson<ScreenHealthReport>(`/api/analytics/screens/${encodeURIComponent(String(id))}/health`),
	prepareScreenExport: (id: string | number, body?: ScreenExportPrepareRequest) =>
		sendJson<ScreenExportPrepareResult>(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-prepare`, body ?? {}),
	reportScreenExport: (id: string | number, body: ScreenExportReportRequest) =>
		sendJson<ScreenExportReportResult>(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-report`, body),
	renderScreenExport: (id: string | number, body?: ScreenExportRenderRequest) =>
		requestBinary(`/api/analytics/screens/${encodeURIComponent(String(id))}/export-render`, "POST", body ?? {}),
	validateScreenSpec: (body: unknown) =>
		sendJson<ScreenSpecValidationResponse>("/api/analytics/screens/validate-spec", body),
	createScreen: (body: unknown) => sendJson<ScreenDetail>("/api/analytics/screens", body),
	listScreenVersions: (id: string | number) =>
		fetchJson<ScreenVersion[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/versions`),
	compareScreenVersions: (id: string | number, fromVersionId: string | number, toVersionId: string | number) =>
		fetchJson<ScreenVersionDiff>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/versions/compare`
			+ `?fromVersionId=${encodeURIComponent(String(fromVersionId))}`
			+ `&toVersionId=${encodeURIComponent(String(toVersionId))}`,
		),
	publishScreen: (id: string | number) =>
		sendJson<{ screen: ScreenDetail; version: ScreenVersion; warmup?: ScreenWarmupSummary }>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/publish`,
			{},
		),
	rollbackScreenVersion: (id: string | number, versionId: string | number) =>
		sendJson<{ screen: ScreenDetail; version: ScreenVersion; warmup?: ScreenWarmupSummary }>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/rollback/${encodeURIComponent(String(versionId))}`,
			{},
		),
	updateScreen: (id: string | number, body: unknown) =>
		requestJson<ScreenDetail>(`/api/analytics/screens/${encodeURIComponent(String(id))}`, "PUT", body),
	deleteScreen: (id: string | number) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}`, "DELETE"),
	getScreenAcl: (id: string | number) =>
		fetchJson<ScreenAclEntry[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/acl`),
	updateScreenAcl: (id: string | number, body: { entries: ScreenAclEntry[] }) =>
		requestJson<ScreenAclEntry[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/acl`, "PUT", body),
	getScreenEditLock: (id: string | number) =>
		fetchJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock`),
	acquireScreenEditLock: (id: string | number, body?: { ttlSeconds?: number; forceTakeover?: boolean }) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/acquire`, body ?? {}),
	heartbeatScreenEditLock: (id: string | number, body?: { ttlSeconds?: number }) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/heartbeat`, body ?? {}),
	releaseScreenEditLock: (id: string | number) =>
		sendJson<ScreenEditLock>(`/api/analytics/screens/${encodeURIComponent(String(id))}/edit-lock/release`, {}),
	getScreenAuditLogs: (id: string | number, limit = 200) =>
		fetchJson<ScreenAuditEntry[]>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/audit?limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenComments: (id: string | number, limit = 200) =>
		fetchJson<ScreenComment[]>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments?limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenCommentChanges: (id: string | number, sinceId = 0, limit = 200) =>
		fetchJson<ScreenCommentChanges>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/changes`
			+ `?sinceId=${encodeURIComponent(String(sinceId))}`
			+ `&limit=${encodeURIComponent(String(limit))}`,
		),
	listScreenCommentChangesLive: (id: string | number, sinceId = 0, limit = 200, waitMs = 12000) =>
		fetchJson<ScreenCommentChanges>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/live`
			+ `?sinceId=${encodeURIComponent(String(sinceId))}`
			+ `&limit=${encodeURIComponent(String(limit))}`
			+ `&waitMs=${encodeURIComponent(String(waitMs))}`,
		),
	getScreenCollaborationPresence: (id: string | number, ttlSeconds = 45, sessionId?: string) =>
		fetchJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`
			+ `${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ''}`,
		),
	heartbeatScreenCollaborationPresence: (
		id: string | number,
		body: {
			sessionId?: string;
			componentId?: string | null;
			typing?: boolean;
			clientType?: string;
			selectedIds?: string[];
		},
		ttlSeconds = 45,
	) =>
		sendJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence/heartbeat`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`,
			body ?? {},
		),
	leaveScreenCollaborationPresence: (
		id: string | number,
		body?: {
			sessionId?: string;
		},
		ttlSeconds = 45,
	) =>
		sendJson<ScreenCollaborationPresence>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/collaboration/presence/leave`
			+ `?ttlSeconds=${encodeURIComponent(String(ttlSeconds))}`,
			body ?? {},
		),
	createScreenComment: (id: string | number, body: {
		message: string;
		componentId?: string | null;
		anchor?: Record<string, unknown>;
		mentions?: Array<Record<string, unknown>>;
	}) =>
		sendJson<ScreenComment>(`/api/analytics/screens/${encodeURIComponent(String(id))}/comments`, body),
	resolveScreenComment: (id: string | number, commentId: string | number, body?: { note?: string }) =>
		sendJson<ScreenComment>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/${encodeURIComponent(String(commentId))}/resolve`,
			body ?? {},
		),
	reopenScreenComment: (id: string | number, commentId: string | number, body?: { note?: string }) =>
		sendJson<ScreenComment>(
			`/api/analytics/screens/${encodeURIComponent(String(id))}/comments/${encodeURIComponent(String(commentId))}/reopen`,
			body ?? {},
		),
	createScreenPublicLink: (id: string | number, body?: unknown) =>
		sendJson<ScreenPublicLinkPolicy>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link`, body ?? {}),
	updateScreenPublicLinkPolicy: (id: string | number, body: unknown) =>
		requestJson<ScreenPublicLinkPolicy>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link/policy`, "PUT", body),
	deleteScreenPublicLink: (id: string | number) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}/public_link`, "DELETE"),
	getPublicScreen: (uuid: string) =>
		fetchJson<PublicScreenDetail>(`/api/analytics/public/screen/${encodeURIComponent(uuid)}`),
	// Snapshot API
	createSnapshot: (id: string | number, body: unknown) =>
		sendJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot`, body),
	getSnapshotTask: (taskId: string) =>
		fetchJson<unknown>(`/api/analytics/screens/snapshot-tasks/${encodeURIComponent(taskId)}`),
	listSnapshotSchedules: (id: string | number) =>
		fetchJson<unknown[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules`),
	createSnapshotSchedule: (id: string | number, body: unknown) =>
		sendJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules`, body),
	updateSnapshotSchedule: (id: string | number, scheduleId: string, body: unknown) =>
		requestJson<unknown>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules/${encodeURIComponent(scheduleId)}`, "PUT", body),
	deleteSnapshotSchedule: (id: string | number, scheduleId: string) =>
		requestJson<void>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-schedules/${encodeURIComponent(scheduleId)}`, "DELETE"),
	listSnapshotTasks: (id: string | number) =>
		fetchJson<unknown[]>(`/api/analytics/screens/${encodeURIComponent(String(id))}/snapshot-tasks`),
	// Marketplace API
	listMarketplaceComponents: (params?: { search?: string; category?: string }) => {
		const qs = new URLSearchParams();
		if (params?.search) qs.set('search', params.search);
		if (params?.category) qs.set('category', params.category);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return fetchJson<unknown[]>(`/api/analytics/marketplace/components${suffix}`);
	},
	listMarketplaceTemplates: (params?: { search?: string; category?: string }) => {
		const qs = new URLSearchParams();
		if (params?.search) qs.set('search', params.search);
		if (params?.category) qs.set('category', params.category);
		const suffix = qs.toString() ? `?${qs.toString()}` : '';
		return fetchJson<unknown[]>(`/api/analytics/marketplace/templates${suffix}`);
	},
	installMarketplaceComponent: (id: string) =>
		sendJson<unknown>(`/api/analytics/marketplace/components/${encodeURIComponent(id)}/install`, {}),
	installMarketplaceTemplate: (id: string) =>
		sendJson<unknown>(`/api/analytics/marketplace/templates/${encodeURIComponent(id)}/install`, {}),
	listSuggestedQuestions: (limit = 12) =>
		fetchJson<CopilotSuggestedQuestion[] | AiApiEnvelope<CopilotSuggestedQuestion[]>>(
			"/api/ai/nl2sql/suggestions?limit=" + encodeURIComponent(String(limit)),
		).then(unwrapAiApiEnvelope),
	submitChatFeedback: (body: {
		sessionId: string;
		messageId: string;
		rating: string;
		reason?: string;
		detail?: string;
		generatedSql?: string;
		correctedSql?: string;
		routedDomain?: string;
		targetView?: string;
		templateCode?: string;
		userId?: string;
		userName?: string;
	}) => sendJson<void>("/api/ai/nl2sql/feedback", {
		...body,
		userId: body.userId ?? resolveLegacyAiUserId(),
		userName: body.userName ?? resolveLegacyAiUserName(),
	}),
};
