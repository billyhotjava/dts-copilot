import { type FormEvent, useState } from 'react'
import './auth.css'

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || ''

const safetyChips = [
	'Schema 感知',
	'权限约束',
	'SQL 安全校验',
]

const sqlLines = [
	'SELECT region, SUM(order_amount) AS revenue',
	'FROM sales_orders',
	"WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'",
	'GROUP BY region',
	'ORDER BY revenue DESC',
]

const resultRows = [
	{ name: '华东', count: '128.6w' },
	{ name: '华南', count: '96.4w' },
	{ name: '华北', count: '74.8w' },
]

const capabilityCards = [
	{
		title: 'NL2SQL 智能生成',
		description: '自然语言问题自动转成可执行 SQL。',
	},
	{
		title: '多数据源分析',
		description: '统一接入多类数据源，保持同一分析入口。',
	},
	{
		title: 'AI 对话与可视化',
		description: '从提问到结果表格与图表输出一体完成。',
	},
]

function AnalysisChainShowcase() {
	return (
		<div className="analysis-chain" aria-hidden="true">
			<span className="analysis-chain__halo analysis-chain__halo--primary" />
			<span className="analysis-chain__halo analysis-chain__halo--secondary" />

			<div className="analysis-flow">
				<article className="analysis-node analysis-node--prompt">
					<div className="analysis-node__step">01</div>
					<div className="analysis-node__eyebrow">PROMPT</div>
					<div className="analysis-node__title">自然语言提问</div>
					<div className="analysis-node__bubble">
						最近30天各区域销售额排名
					</div>
					<div className="analysis-node__meta">用户只描述问题，不需要手写 SQL。</div>
				</article>

				<div className="analysis-flow__beam analysis-flow__beam--1">
					<span className="analysis-flow__pulse" />
				</div>

				<article className="analysis-node analysis-node--guard">
					<div className="analysis-node__step">02</div>
					<div className="analysis-node__eyebrow">GUARD</div>
					<div className="analysis-node__title">Schema 感知与 SQL 安全校验</div>
					<div className="analysis-node__chips">
						{safetyChips.map((chip) => (
							<span key={chip} className="analysis-chip">
								{chip}
							</span>
						))}
					</div>
					<div className="analysis-node__meta">自动识别字段、表结构与访问边界。</div>
				</article>

				<div className="analysis-flow__beam analysis-flow__beam--2">
					<span className="analysis-flow__pulse" />
				</div>

				<article className="analysis-node analysis-node--sql">
					<div className="analysis-node__step">03</div>
					<div className="analysis-node__eyebrow">SQL</div>
					<div className="analysis-node__title">生成 SQL</div>
					<pre className="analysis-node__code">
						{sqlLines.map((line) => (
							<div key={line}>{line}</div>
						))}
					</pre>
				</article>

				<div className="analysis-flow__beam analysis-flow__beam--3">
					<span className="analysis-flow__pulse" />
				</div>

				<article className="analysis-node analysis-node--result">
					<div className="analysis-node__step">04</div>
					<div className="analysis-node__eyebrow">RESULT</div>
					<div className="analysis-node__title">结果表格 / 图表输出</div>
					<div className="analysis-result">
						<div className="analysis-table">
							<div className="analysis-table__head">
								<span>区域</span>
								<span>销售额</span>
							</div>
							{resultRows.map((row) => (
								<div key={row.name} className="analysis-table__row">
									<span>{row.name}</span>
									<span>{row.count}</span>
								</div>
							))}
						</div>
						<div className="analysis-chart">
							<span className="analysis-chart__bar analysis-chart__bar--1" />
							<span className="analysis-chart__bar analysis-chart__bar--2" />
							<span className="analysis-chart__bar analysis-chart__bar--3" />
						</div>
					</div>
				</article>
			</div>
		</div>
	)
}

export default function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const response = await fetch(`${basePath}/api/session`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'content-type': 'application/json',
					accept: 'application/json',
				},
				body: JSON.stringify({ username: username.trim(), password }),
			})

			if (!response.ok) {
				const body = await response.json().catch(() => null)
				const msg = body?.errors?.password || body?.error || '登录失败，请重试'
				setError(msg)
				return
			}

			try {
				window.sessionStorage.setItem(
					'dts.copilot.login.username',
					username.trim(),
				)
			} catch {
				// ignore storage failures
			}

			window.location.href = `${basePath}/`
		} catch {
			setError('网络错误，请检查连接后重试')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth-page auth-page--login-dashboard">
			<div className="login-layout">
				<header className="login-layout__header">
					<div className="login-layout__heading">
						<div className="login-layout__title">DTS 智能数据分析助手</div>
						<div className="login-layout__subtitle">AI-Native 智能数据分析平台</div>
					</div>
				</header>

				<div className="login-layout__body">
					<section className="dashboard-stage" aria-label="NL2SQL 封面">
						<div className="dashboard-surface dashboard-surface--showcase">
							<div className="showcase-header">
								<span className="showcase-header__eyebrow">NL2SQL COPILOT</span>
								<h1 className="showcase-header__title">
									自然语言提问，
									<br />
									直接生成安全 SQL 与分析结果
								</h1>
								<p className="showcase-header__subtitle">
									从问题、Schema 理解到安全 SQL 与结果呈现，形成一条可解释的智能分析链。
								</p>
							</div>

							<AnalysisChainShowcase />

							<div className="showcase-capabilities" aria-label="平台能力">
								{capabilityCards.map((card) => (
									<article key={card.title} className="showcase-capability-card">
										<div className="showcase-capability-card__title">{card.title}</div>
										<div className="showcase-capability-card__description">
											{card.description}
										</div>
									</article>
								))}
							</div>
						</div>

						<p className="dashboard-caption">让问题沿分析链直接抵达结果</p>
					</section>

					<aside className="login-side-panel" aria-label="登录区域">
						<div className="login-side-panel__inner">
							<div className="login-side-panel__intro">
								<span className="login-side-panel__eyebrow">Copilot 登录</span>
								<h1 className="login-title">欢迎登录</h1>
								<p className="login-subtitle">进入 DTS 智能数据分析助手</p>
							</div>

							{error && <div className="auth-error auth-error--dashboard">{error}</div>}

							<form className="login-form" onSubmit={handleSubmit}>
								<label className="login-field" htmlFor="login-username">
									<span className="login-field__label">用户名</span>
									<input
										id="login-username"
										className="login-field__input"
										type="text"
										placeholder="请输入用户名"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										autoComplete="username"
										autoFocus
										required
									/>
								</label>

								<label className="login-field" htmlFor="login-password">
									<span className="login-field__label">密码</span>
									<input
										id="login-password"
										className="login-field__input"
										type="password"
										placeholder="请输入密码"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										autoComplete="current-password"
										required
									/>
								</label>

								<button
									type="submit"
									className="login-submit"
									disabled={loading}
								>
									{loading ? '登录中...' : '进入平台'}
								</button>
							</form>
						</div>
					</aside>
				</div>
			</div>
		</div>
	)
}
