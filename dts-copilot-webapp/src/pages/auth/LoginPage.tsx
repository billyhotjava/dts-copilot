import { type FormEvent, useState } from "react";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import "./auth.css";

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

const loginHighlights = [
	{ value: "128", label: "活跃看板", detail: "覆盖经营、项目与数据专题" },
	{ value: "24", label: "实时分析", detail: "跨数据源联动洞察" },
	{ value: "99.2%", label: "指标可用性", detail: "面向关键决策链路" },
];

const loginSignals = [
	"智能问答",
	"指标诊断",
	"趋势预警",
	"大屏交付",
];

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(`${basePath}/api/session`, {
				method: "POST",
				credentials: "include",
				headers: {
					"content-type": "application/json",
					accept: "application/json",
				},
				body: JSON.stringify({ username: username.trim(), password }),
			});

			if (!response.ok) {
				const body = await response.json().catch(() => null);
				const msg =
					body?.errors?.password || body?.error || "登录失败，请重试";
				setError(msg);
				return;
			}

			try {
				window.sessionStorage.setItem(
					"dts.copilot.login.username",
					username.trim(),
				);
			} catch {
				// ignore storage failures
			}

			// Session cookie is set by Set-Cookie header.
			// Full page reload to ensure clean state with new session.
			window.location.href = `${basePath}/`;
		} catch {
			setError("网络错误，请检查连接后重试");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-page auth-page--login">
			<div className="auth-page__glow auth-page__glow--left" />
			<div className="auth-page__glow auth-page__glow--right" />
			<div className="auth-shell">
				<section className="auth-hero" aria-label="平台封面">
					<div className="auth-logo auth-logo--hero">
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M12 2v4" />
							<path d="M12 18v4" />
							<path d="m4.93 4.93 2.83 2.83" />
							<path d="m16.24 16.24 2.83 2.83" />
							<path d="M2 12h4" />
							<path d="M18 12h4" />
							<path d="m4.93 19.07 2.83-2.83" />
							<path d="m16.24 4.93 2.83-2.83" />
						</svg>
						<span className="auth-logo__text">DTS Analytics</span>
					</div>

					<div className="auth-hero__eyebrow">数据分析中枢</div>
					<h1 className="auth-hero__title">
						让指标、趋势与智能问答
						<span>在同一张封面上协同工作</span>
					</h1>
					<p className="auth-hero__subtitle">
						统一接入业务数据、实时监控经营变化、快速生成分析洞察与专题看板。
					</p>

					<div className="auth-hero__signals" aria-label="核心能力">
						{loginSignals.map((signal) => (
							<span key={signal} className="auth-signal-pill">
								{signal}
							</span>
						))}
					</div>

					<div className="auth-highlight-grid">
						{loginHighlights.map((item) => (
							<article key={item.label} className="auth-highlight-card">
								<div className="auth-highlight-card__value">{item.value}</div>
								<div className="auth-highlight-card__label">{item.label}</div>
								<div className="auth-highlight-card__detail">{item.detail}</div>
							</article>
						))}
					</div>

					<div className="auth-insight-panel" aria-label="运行态摘要">
						<div className="auth-insight-panel__header">
							<div>
								<p className="auth-insight-panel__label">今日数据脉冲</p>
								<h2 className="auth-insight-panel__title">分析链路正在稳定运行</h2>
							</div>
							<div className="auth-insight-panel__badge">Live</div>
						</div>
						<div className="auth-insight-chart" aria-hidden="true">
							<span className="auth-insight-chart__line" />
							<span className="auth-insight-chart__line auth-insight-chart__line--secondary" />
							<div className="auth-insight-chart__bars">
								<span />
								<span />
								<span />
								<span />
								<span />
								<span />
							</div>
						</div>
						<div className="auth-insight-metrics">
							<div>
								<span>查询延迟</span>
								<strong>1.4s</strong>
							</div>
							<div>
								<span>告警命中</span>
								<strong>07</strong>
							</div>
							<div>
								<span>新增洞察</span>
								<strong>16</strong>
							</div>
						</div>
					</div>
				</section>

				<div className="auth-card auth-card--login">
					<div className="auth-card__header">
						<h2 className="auth-title">登录</h2>
						<p className="auth-subtitle">使用用户名和密码进入分析平台</p>
					</div>

					{error && <div className="auth-error">{error}</div>}

					<form className="auth-form" onSubmit={handleSubmit}>
						<Input
							label="用户名"
							type="text"
							placeholder="请输入用户名"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							autoFocus
							autoComplete="username"
						/>
						<Input
							label="密码"
							type="password"
							placeholder="请输入密码"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>
						<Button
							type="submit"
							variant="primary"
							size="lg"
							fullWidth
							loading={loading}
						>
							进入分析平台
						</Button>
					</form>

					<div className="auth-card__footer">
						<span className="auth-card__footer-label">登录后可访问</span>
						<div className="auth-card__footer-items">
							<span>看板中心</span>
							<span>Copilot 问答</span>
							<span>实时大屏</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
