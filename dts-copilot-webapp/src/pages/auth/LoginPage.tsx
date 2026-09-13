import { type FormEvent, useState } from 'react'
import './auth.css'

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || ''

const agentSteps = [
	{ label: '理解任务意图', state: 'done' },
	{ label: '规划执行步骤', state: 'done' },
	{ label: '调用工具与数据', state: 'done' },
	{ label: '生成工作成果', state: 'active' },
] as const

const agentHighlights = ['任务规划', '工具调用', '数据分析', '成果交付']

function AgentShowcase() {
	return (
		<div className="agent-demo" aria-hidden="true">
			<span className="agent-demo__halo agent-demo__halo--primary" />
			<span className="agent-demo__halo agent-demo__halo--secondary" />

			<div className="agent-demo__bubble">
				整理本周各区域的销售情况，生成一份工作汇报
			</div>

			<div className="agent-demo__card">
				<div className="agent-demo__card-head">
					<span className="agent-demo__avatar" />
					<span className="agent-demo__name">DTS Agent</span>
					<span className="agent-demo__status">执行中</span>
				</div>
				<ul className="agent-demo__steps">
					{agentSteps.map((step, index) => (
						<li
							key={step.label}
							className={`agent-demo__step agent-demo__step--${step.state}`}
							style={{ animationDelay: `${0.4 + index * 0.5}s` }}
						>
							<span className="agent-demo__step-mark" />
							<span>{step.label}</span>
						</li>
					))}
				</ul>
				<div className="agent-demo__result">汇报已生成，可在工作台查看与分发</div>
			</div>
		</div>
	)
}

export default function LoginPage() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
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
						<div className="login-layout__title">DTS 智能体工作助手</div>
						<div className="login-layout__subtitle">AI-Native 智能体工作平台</div>
					</div>
				</header>

				<div className="login-layout__body">
					<section className="dashboard-stage" aria-label="智能体工作助手介绍">
						<div className="dashboard-surface dashboard-surface--showcase">
							<div className="showcase-header">
								<span className="showcase-header__eyebrow">AI Agent Workspace</span>
								<h1 className="showcase-header__title">
									把任务交给智能体，
									<br />
									自动规划、执行、交付
								</h1>
								<p className="showcase-header__subtitle">
									一句话描述工作目标，智能体理解意图、调度工具、完成任务并交付成果。
								</p>
							</div>

							<AgentShowcase />

							<div className="showcase-highlights" aria-label="平台能力">
								{agentHighlights.map((item) => (
									<span key={item} className="showcase-highlight">
										{item}
									</span>
								))}
							</div>
						</div>
					</section>

					<aside className="login-side-panel" aria-label="登录区域">
						<div className="login-side-panel__inner">
							<div className="login-side-panel__intro">
								<span className="login-side-panel__eyebrow">Copilot 登录</span>
								<h1 className="login-title">欢迎登录</h1>
								<p className="login-subtitle">进入 DTS 智能体工作助手</p>
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
									<div style={{ position: 'relative' }}>
										<input
											id="login-password"
											className="login-field__input"
											type={showPassword ? 'text' : 'password'}
											placeholder="请输入密码"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											autoComplete="current-password"
											required
											style={{ paddingRight: 36 }}
										/>
										<button
											type="button"
											onClick={() => setShowPassword((v) => !v)}
											aria-label={showPassword ? '隐藏密码' : '显示密码'}
											style={{
												position: 'absolute',
												right: 8,
												top: '50%',
												transform: 'translateY(-50%)',
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												padding: 4,
												color: 'rgba(255, 255, 255, 0.6)',
												lineHeight: 0,
											}}
										>
											{showPassword ? (
												<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
													<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
													<line x1="1" y1="1" x2="23" y2="23" />
												</svg>
											) : (
												<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
													<circle cx="12" cy="12" r="3" />
												</svg>
											)}
										</button>
									</div>
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
