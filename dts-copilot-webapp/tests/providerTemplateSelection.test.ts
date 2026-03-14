import test from 'node:test'
import assert from 'node:assert/strict'
import {
	PROVIDER_TYPE_CUSTOM,
	applyProviderTypeSelection,
	buildProviderTypeGroups,
	createRecommendedProviderFormDefaults,
} from '../src/pages/admin/providerTemplateCatalog.js'

const templates = [
	{
		name: 'OPENAI',
		displayName: 'OpenAI',
		region: 'INTERNATIONAL',
		recommended: false,
		sortOrder: 20,
		defaultBaseUrl: 'https://api.openai.com/v1',
		defaultModel: 'gpt-4o',
		defaultTemperature: 0.3,
		defaultMaxTokens: 4096,
		defaultTimeoutSeconds: 60,
	},
	{
		name: 'DEEPSEEK',
		displayName: 'DeepSeek',
		region: 'CHINA',
		recommended: true,
		sortOrder: 10,
		defaultBaseUrl: 'https://api.deepseek.com/v1',
		defaultModel: 'deepseek-chat',
		defaultTemperature: 0.3,
		defaultMaxTokens: 4096,
		defaultTimeoutSeconds: 60,
	},
	{
		name: 'OLLAMA',
		displayName: 'Ollama',
		region: 'LOCAL',
		recommended: false,
		sortOrder: 5,
		defaultBaseUrl: 'http://localhost:11434/v1',
		defaultModel: 'qwen2.5-coder:7b',
		defaultTemperature: 0.3,
		defaultMaxTokens: 4096,
		defaultTimeoutSeconds: 60,
	},
]

test('defaults new provider forms to the recommended standard template', () => {
	const form = createRecommendedProviderFormDefaults(templates)

	assert.equal(form.providerType, 'DEEPSEEK')
	assert.equal(form.baseUrl, 'https://api.deepseek.com/v1')
	assert.equal(form.model, 'deepseek-chat')
	assert.equal(form.name, 'DeepSeek')
})

test('builds grouped provider type options and appends custom entry', () => {
	const groups = buildProviderTypeGroups(templates)

	assert.deepEqual(groups.map((group) => group.label), ['国际主流', '中国主流', '本地部署', '自定义'])
	assert.equal(groups[0]?.options[0]?.value, 'OPENAI')
	assert.equal(groups[1]?.options[0]?.value, 'DEEPSEEK')
	assert.equal(groups[2]?.options[0]?.value, 'OLLAMA')
	assert.equal(groups[3]?.options[0]?.value, PROVIDER_TYPE_CUSTOM)
})

test('keeps manual fields when switching to custom provider type', () => {
	const updated = applyProviderTypeSelection(
		{
			id: 7,
			name: 'My Private Gateway',
			baseUrl: 'https://llm.example.com/v1',
			apiKey: '',
			model: 'custom-model',
			temperature: '0.7',
			maxTokens: '8192',
			timeoutSeconds: '45',
			isDefault: false,
			enabled: true,
			priority: '0',
			providerType: 'OPENAI',
			apiKeyMasked: 'sk-****1234',
			hasApiKey: true,
		},
		PROVIDER_TYPE_CUSTOM,
		templates,
	)

	assert.equal(updated.providerType, PROVIDER_TYPE_CUSTOM)
	assert.equal(updated.name, 'My Private Gateway')
	assert.equal(updated.baseUrl, 'https://llm.example.com/v1')
	assert.equal(updated.model, 'custom-model')
	assert.equal(updated.hasApiKey, true)
	assert.equal(updated.apiKeyMasked, 'sk-****1234')
})
