import { useEffect, useState } from "react";
import {
	analyticsApi,
	type CopilotApiKeyCreatePayload,
	type CopilotApiKeyItem,
	type CopilotApiKeyReveal,
	type CopilotProvider,
	type CopilotProviderPayload,
	type CopilotProviderTemplate,
} from "../../api/analyticsApi";
import { EmptyState, PageContainer, PageHeader, PageSection } from "../../components/PageContainer/PageContainer";
import { Button, ButtonGroup } from "../../ui/Button/Button";
import { Card, CardBody, CardHeader } from "../../ui/Card/Card";
import { Input, TextArea } from "../../ui/Input/Input";
import {
	PROVIDER_TYPE_CUSTOM,
	applyProviderTypeSelection,
	buildProviderTypeGroups,
	createRecommendedProviderFormDefaults,
	isProviderFormPristine,
} from "./providerTemplateCatalog";
import "./CopilotSettingsPage.css";

type ProviderFormState = {
	id: number | null;
	name: string;
	baseUrl: string;
	apiKey: string;
	model: string;
	temperature: string;
	maxTokens: string;
	timeoutSeconds: string;
	isDefault: boolean;
	enabled: boolean;
	priority: string;
	providerType: string;
	apiKeyMasked?: string | null;
	hasApiKey?: boolean;
};

const EMPTY_PROVIDER_FORM: ProviderFormState = {
	id: null,
	name: "",
	baseUrl: "",
	apiKey: "",
	model: "",
	temperature: "0.3",
	maxTokens: "4096",
	timeoutSeconds: "60",
	isDefault: false,
	enabled: true,
	priority: "0",
	providerType: "",
	apiKeyMasked: null,
	hasApiKey: false,
};

function toNumber(value: string): number | undefined {
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function toProviderForm(provider: CopilotProvider): ProviderFormState {
	return {
		id: provider.id ?? null,
		name: provider.name ?? "",
		baseUrl: provider.baseUrl ?? "",
		apiKey: "",
		model: provider.model ?? "",
		temperature: provider.temperature != null ? String(provider.temperature) : "",
		maxTokens: provider.maxTokens != null ? String(provider.maxTokens) : "",
		timeoutSeconds: provider.timeoutSeconds != null ? String(provider.timeoutSeconds) : "",
		isDefault: provider.isDefault === true,
		enabled: provider.enabled !== false,
		priority: provider.priority != null ? String(provider.priority) : "0",
		providerType: provider.providerType ?? "",
		apiKeyMasked: provider.apiKeyMasked,
		hasApiKey: provider.hasApiKey,
	};
}

function buildProviderPayload(form: ProviderFormState): CopilotProviderPayload {
	return {
		name: form.name.trim(),
		baseUrl: form.baseUrl.trim(),
		apiKey: form.apiKey.trim() || undefined,
		model: form.model.trim(),
		temperature: toNumber(form.temperature),
		maxTokens: toNumber(form.maxTokens),
		timeoutSeconds: toNumber(form.timeoutSeconds),
		isDefault: form.isDefault,
		enabled: form.enabled,
		priority: toNumber(form.priority) ?? 0,
		providerType: form.providerType.trim() || undefined,
	};
}

function buildApiKeyPayload(
	name: string,
	description: string,
	expiresInDays: string,
): CopilotApiKeyCreatePayload {
	return {
		name: name.trim(),
		description: description.trim() || undefined,
		createdBy: "web-admin",
		expiresInDays: toNumber(expiresInDays) ?? undefined,
	};
}

export default function CopilotSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [siteName, setSiteName] = useState("");
	const [siteSaving, setSiteSaving] = useState(false);

	const [templates, setTemplates] = useState<CopilotProviderTemplate[]>([]);
	const [providers, setProviders] = useState<CopilotProvider[]>([]);
	const [providerForm, setProviderForm] = useState<ProviderFormState>(EMPTY_PROVIDER_FORM);
	const [providerSubmitting, setProviderSubmitting] = useState(false);

	const [apiKeys, setApiKeys] = useState<CopilotApiKeyItem[]>([]);
	const [apiKeyName, setApiKeyName] = useState("");
	const [apiKeyDescription, setApiKeyDescription] = useState("");
	const [apiKeyExpiresInDays, setApiKeyExpiresInDays] = useState("90");
	const [apiKeySubmitting, setApiKeySubmitting] = useState(false);
	const [revealedKey, setRevealedKey] = useState<CopilotApiKeyReveal | null>(null);

	const loadAll = async () => {
		setLoading(true);
		setError(null);
		try {
			const [site, providerList, templateList, keyList] = await Promise.all([
				analyticsApi.getCopilotSiteSettings(),
				analyticsApi.listCopilotProviders(),
				analyticsApi.listCopilotProviderTemplates(),
				analyticsApi.listCopilotApiKeys(),
			]);
			setSiteName(site.siteName ?? "");
			setProviders(providerList);
			setTemplates(templateList);
			setApiKeys(keyList);
		} catch (err) {
			setError(err instanceof Error ? err.message : "加载系统配置失败");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		void loadAll();
	}, []);

	useEffect(() => {
		if (templates.length === 0) return;
		setProviderForm((current) =>
			isProviderFormPristine(current)
				? createRecommendedProviderFormDefaults(templates, EMPTY_PROVIDER_FORM)
				: current,
		);
	}, [templates]);

	const providerTypeGroups = buildProviderTypeGroups(templates);

	const saveSite = async () => {
		setSiteSaving(true);
		setError(null);
		try {
			const updated = await analyticsApi.updateCopilotSiteSettings({ siteName: siteName.trim() });
			setSiteName(updated.siteName ?? "");
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存站点设置失败");
		} finally {
			setSiteSaving(false);
		}
	};

	const resetProviderForm = () => {
		setProviderForm(createRecommendedProviderFormDefaults(templates, EMPTY_PROVIDER_FORM));
	};

	const editProvider = (provider: CopilotProvider) => {
		const next = toProviderForm(provider);
		const knownType = templates.some((item) => item.name === next.providerType);
		setProviderForm(
			next.providerType && !knownType
				? { ...next, providerType: PROVIDER_TYPE_CUSTOM }
				: next,
		);
	};

	const handleProviderTypeChange = (providerType: string) => {
		setProviderForm((current) =>
			applyProviderTypeSelection(current, providerType, templates),
		);
	};

	const saveProvider = async () => {
		setProviderSubmitting(true);
		setError(null);
		try {
			const payload = buildProviderPayload(providerForm);
			if (providerForm.id != null) {
				await analyticsApi.updateCopilotProvider(providerForm.id, payload);
			} else {
				await analyticsApi.createCopilotProvider(payload);
			}
			resetProviderForm();
			setProviders(await analyticsApi.listCopilotProviders());
		} catch (err) {
			setError(err instanceof Error ? err.message : "保存 Provider 失败");
		} finally {
			setProviderSubmitting(false);
		}
	};

	const deleteProvider = async (provider: CopilotProvider) => {
		if (!provider.id || !window.confirm(`确认删除 Provider「${provider.name ?? provider.id}」？`)) {
			return;
		}
		setError(null);
		try {
			await analyticsApi.deleteCopilotProvider(provider.id);
			setProviders(await analyticsApi.listCopilotProviders());
			if (providerForm.id === provider.id) {
				resetProviderForm();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "删除 Provider 失败");
		}
	};

	const testProvider = async (provider: CopilotProvider) => {
		if (!provider.id) return;
		try {
			const result = await analyticsApi.testCopilotProvider(provider.id);
			window.alert(
				result.reachable
					? `连通成功：${result.provider ?? provider.name ?? provider.id}`
					: `连通失败：${result.modelsError ?? "未返回模型列表"}`,
			);
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "测试 Provider 失败");
		}
	};

	const createApiKey = async () => {
		setApiKeySubmitting(true);
		setError(null);
		try {
			const created = await analyticsApi.createCopilotApiKey(
				buildApiKeyPayload(apiKeyName, apiKeyDescription, apiKeyExpiresInDays),
			);
			setRevealedKey(created);
			setApiKeys(await analyticsApi.listCopilotApiKeys());
			setApiKeyName("");
			setApiKeyDescription("");
			setApiKeyExpiresInDays("90");
		} catch (err) {
			setError(err instanceof Error ? err.message : "创建 API Key 失败");
		} finally {
			setApiKeySubmitting(false);
		}
	};

	const rotateApiKey = async (item: CopilotApiKeyItem) => {
		if (!window.confirm(`确认轮换 API Key「${item.name ?? item.prefix ?? item.id}」？`)) {
			return;
		}
		try {
			const rotated = await analyticsApi.rotateCopilotApiKey(item.id);
			setRevealedKey(rotated);
			setApiKeys(await analyticsApi.listCopilotApiKeys());
		} catch (err) {
			setError(err instanceof Error ? err.message : "轮换 API Key 失败");
		}
	};

	const revokeApiKey = async (item: CopilotApiKeyItem) => {
		if (!window.confirm(`确认吊销 API Key「${item.name ?? item.prefix ?? item.id}」？`)) {
			return;
		}
		try {
			await analyticsApi.revokeCopilotApiKey(item.id);
			setApiKeys(await analyticsApi.listCopilotApiKeys());
		} catch (err) {
			setError(err instanceof Error ? err.message : "吊销 API Key 失败");
		}
	};

	return (
		<PageContainer maxWidth="full">
			<PageHeader
				title="Copilot 系统配置"
				subtitle="集中管理站点名称、LLM Provider 和 Copilot API Key。"
				actions={
					<Button variant="secondary" onClick={() => void loadAll()} disabled={loading}>
						刷新
					</Button>
				}
			/>

			{error && (
				<div className="copilot-settings__error" role="alert">
					{error}
				</div>
			)}

			<PageSection title="站点设置" description="站点级信息，供登录页和应用头部展示。">
				<Card>
					<CardBody className="copilot-settings__form-grid">
						<Input
							label="站点名称"
							value={siteName}
							onChange={(event) => setSiteName(event.target.value)}
							placeholder="DTS 智能平台"
						/>
					</CardBody>
					<div className="copilot-settings__card-actions">
						<Button variant="primary" onClick={() => void saveSite()} loading={siteSaving}>
							保存站点设置
						</Button>
					</div>
				</Card>
			</PageSection>

			<PageSection title="LLM Provider" description="手工录入和管理外部大模型配置。">
				<div className="copilot-settings__two-column">
					<Card>
						<CardHeader
							title={providerForm.id != null ? "编辑 Provider" : "新增 Provider"}
							subtitle="新建时默认套用推荐模板；保存后仅展示密钥掩码，留空 API Key 表示不修改。"
						/>
						<CardBody className="copilot-settings__form-grid">
							<div className="copilot-settings__field">
								<label className="copilot-settings__label" htmlFor="provider-type">
									Provider 类型
								</label>
								<select
									id="provider-type"
									className="copilot-settings__select"
									value={providerForm.providerType || ""}
									onChange={(event) => handleProviderTypeChange(event.target.value)}
								>
									<option value="">请选择 Provider Type</option>
									{providerTypeGroups.map((group) => (
										<optgroup key={group.key} label={group.label}>
											{group.options.map((item) => (
												<option key={item.value} value={item.value}>
													{item.label}
												</option>
											))}
										</optgroup>
									))}
								</select>
								<p className="copilot-settings__hint">
									新建 Provider 默认使用推荐模板；选择 Custom 后可完全手工填写。
								</p>
							</div>
							<Input
								label="名称"
								value={providerForm.name}
								onChange={(event) => setProviderForm((current) => ({ ...current, name: event.target.value }))}
							/>
							<Input
								label="Base URL"
								value={providerForm.baseUrl}
								onChange={(event) => setProviderForm((current) => ({ ...current, baseUrl: event.target.value }))}
							/>
							<Input
								label="模型"
								value={providerForm.model}
								onChange={(event) => setProviderForm((current) => ({ ...current, model: event.target.value }))}
							/>
							<Input
								label="API Key"
								type="password"
								value={providerForm.apiKey}
								onChange={(event) => setProviderForm((current) => ({ ...current, apiKey: event.target.value }))}
								helperText={
									providerForm.hasApiKey
										? `当前已保存：${providerForm.apiKeyMasked ?? "已隐藏"}；留空表示不修改`
										: "将由服务端安全存储"
								}
							/>
							<Input
								label="温度"
								value={providerForm.temperature}
								onChange={(event) => setProviderForm((current) => ({ ...current, temperature: event.target.value }))}
							/>
							<Input
								label="最大令牌数"
								value={providerForm.maxTokens}
								onChange={(event) => setProviderForm((current) => ({ ...current, maxTokens: event.target.value }))}
							/>
							<Input
								label="超时秒数"
								value={providerForm.timeoutSeconds}
								onChange={(event) => setProviderForm((current) => ({ ...current, timeoutSeconds: event.target.value }))}
							/>
							<Input
								label="优先级"
								value={providerForm.priority}
								onChange={(event) => setProviderForm((current) => ({ ...current, priority: event.target.value }))}
							/>
							<div className="copilot-settings__switch-group">
								<label className="copilot-settings__checkbox">
									<input
										type="checkbox"
										checked={providerForm.enabled}
										onChange={(event) =>
											setProviderForm((current) => ({ ...current, enabled: event.target.checked }))
										}
									/>
									<span>启用</span>
								</label>
								<label className="copilot-settings__checkbox">
									<input
										type="checkbox"
										checked={providerForm.isDefault}
										onChange={(event) =>
											setProviderForm((current) => ({ ...current, isDefault: event.target.checked }))
										}
									/>
									<span>默认 Provider</span>
								</label>
							</div>
						</CardBody>
						<div className="copilot-settings__card-actions">
							<ButtonGroup>
								<Button variant="primary" onClick={() => void saveProvider()} loading={providerSubmitting}>
									{providerForm.id != null ? "保存 Provider" : "创建 Provider"}
								</Button>
								<Button variant="secondary" onClick={resetProviderForm}>
									重置表单
								</Button>
							</ButtonGroup>
						</div>
					</Card>

					<Card>
						<CardHeader title="Provider 列表" subtitle="点击编辑即可重新录入 API Key，列表中不会展示明文。" />
						<CardBody>
							{loading ? (
								<div className="copilot-settings__placeholder">正在加载 Provider...</div>
							) : providers.length === 0 ? (
								<EmptyState title="还没有 Provider" description="先在左侧创建一个 LLM Provider。" />
							) : (
								<div className="copilot-settings__stack">
									{providers.map((provider) => (
										<div key={provider.id} className="copilot-settings__item">
											<div className="copilot-settings__item-main">
												<div className="copilot-settings__item-title">
													<span>{provider.name ?? `Provider ${provider.id}`}</span>
													<div className="copilot-settings__badges">
														{provider.isDefault && <span className="copilot-settings__badge">默认</span>}
														{provider.enabled === false && <span className="copilot-settings__badge copilot-settings__badge--muted">停用</span>}
														{provider.hasApiKey && <span className="copilot-settings__badge copilot-settings__badge--success">已配置 Key</span>}
													</div>
												</div>
												<div className="copilot-settings__item-meta">
													<div>{provider.providerType ?? "未指定类型"}</div>
													<div>{provider.baseUrl ?? "-"}</div>
													<div>模型: {provider.model ?? "-"}</div>
													<div>密钥: {provider.apiKeyMasked ?? "未配置"}</div>
												</div>
											</div>
											<ButtonGroup>
												<Button variant="secondary" size="sm" onClick={() => editProvider(provider)}>
													编辑
												</Button>
												<Button variant="secondary" size="sm" onClick={() => void testProvider(provider)}>
													测试
												</Button>
												<Button variant="danger" size="sm" onClick={() => void deleteProvider(provider)}>
													删除
												</Button>
											</ButtonGroup>
										</div>
									))}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			</PageSection>

			<PageSection title="Copilot API Key" description="为业务系统或嵌入方生成访问 Copilot 的客户端密钥。">
				<div className="copilot-settings__two-column">
					<Card>
						<CardHeader title="创建 API Key" subtitle="原始 key 只会展示一次，请及时保存。" />
						<CardBody className="copilot-settings__form-grid">
							<Input
								label="名称"
								value={apiKeyName}
								onChange={(event) => setApiKeyName(event.target.value)}
								placeholder="adminweb-prod"
							/>
							<Input
								label="过期天数"
								value={apiKeyExpiresInDays}
								onChange={(event) => setApiKeyExpiresInDays(event.target.value)}
							/>
							<TextArea
								label="说明"
								rows={3}
								value={apiKeyDescription}
								onChange={(event) => setApiKeyDescription(event.target.value)}
								placeholder="说明该 key 供哪个业务系统使用"
							/>
							{revealedKey?.rawKey && (
								<div className="copilot-settings__reveal">
									<div className="copilot-settings__reveal-title">新生成的 Key</div>
									<code>{revealedKey.rawKey}</code>
									<p>{revealedKey.message ?? "关闭页面后将无法再次查看。"}</p>
								</div>
							)}
						</CardBody>
						<div className="copilot-settings__card-actions">
							<Button
								variant="primary"
								onClick={() => void createApiKey()}
								loading={apiKeySubmitting}
								disabled={!apiKeyName.trim()}
							>
								创建 API Key
							</Button>
						</div>
					</Card>

					<Card>
						<CardHeader title="当前 API Keys" subtitle="列表只显示前缀和元数据，支持轮换和吊销。" />
						<CardBody>
							{loading ? (
								<div className="copilot-settings__placeholder">正在加载 API Keys...</div>
							) : apiKeys.length === 0 ? (
								<EmptyState title="还没有 API Key" description="在左侧创建第一条 Copilot API Key。" />
							) : (
								<div className="copilot-settings__stack">
									{apiKeys.map((item) => (
										<div key={item.id} className="copilot-settings__item">
											<div className="copilot-settings__item-main">
												<div className="copilot-settings__item-title">
													<span>{item.name ?? item.prefix ?? `Key ${item.id}`}</span>
													<div className="copilot-settings__badges">
														<span className="copilot-settings__badge">{item.prefix ?? "无前缀"}</span>
														{item.status && (
															<span className="copilot-settings__badge copilot-settings__badge--muted">
																{item.status}
															</span>
														)}
													</div>
												</div>
												<div className="copilot-settings__item-meta">
													<div>创建人: {item.createdBy ?? "-"}</div>
													<div>过期时间: {item.expiresAt ?? "永不过期"}</div>
													<div>最后使用: {item.lastUsedAt ?? "尚未使用"}</div>
													<div>调用次数: {item.usageCount ?? 0}</div>
												</div>
											</div>
											<ButtonGroup>
												<Button variant="secondary" size="sm" onClick={() => void rotateApiKey(item)}>
													轮换
												</Button>
												<Button variant="danger" size="sm" onClick={() => void revokeApiKey(item)}>
													吊销
												</Button>
											</ButtonGroup>
										</div>
									))}
								</div>
							)}
						</CardBody>
					</Card>
				</div>
			</PageSection>
		</PageContainer>
	);
}
