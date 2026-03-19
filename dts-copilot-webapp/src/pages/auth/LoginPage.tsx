import { type FormEvent, useState } from "react";
import "./auth.css";

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

const featurePills = [
	"智能问答",
	"指标诊断",
	"趋势预警",
	"大屏交付",
];

const stats = [
	{ value: "128", label: "活跃看板", detail: "覆盖经营、项目与数据专题" },
	{ value: "24", label: "实时分析", detail: "跨数据源联动洞察" },
	{ value: "99.2%", label: "指标可用性", detail: "面向关键决策链路" },
];

const quickLinks = [
	"看板中心",
	"Copilot 问答",
	"实时大屏",
	"数据目录",
];

const liveStats = [
	{ value: "1.4s", label: "查询延迟" },
	{ value: "07", label: "告警命中" },
	{ value: "16", label: "新增洞察" },
];

function BrandMark() {
	return (
		<div className="logo-icon" aria-hidden="true">
			<span className="logo-icon__spark">✦</span>
		</div>
	);
}

function UserIcon() {
	return (
		<svg
			className="input-icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
			<circle cx="12" cy="7" r="4" />
		</svg>
	);
}

function LockIcon() {
	return (
		<svg
			className="input-icon"
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
			<path d="M7 11V7a5 5 0 0 1 10 0v4" />
		</svg>
	);
}

function EyeIcon({ visible }: { visible: boolean }) {
	return visible ? (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M2.06 12.34a1 1 0 0 1 0-.68C3.42 8.34 7.03 4 12 4c2.22 0 4.18.86 5.83 2.16" />
			<path d="M20.94 11.66a1 1 0 0 1 0 .68C19.58 15.66 15.97 20 11 20c-2.22 0-4.18-.86-5.83-2.16" />
			<path d="m3 3 18 18" />
			<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
		</svg>
	) : (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
			<circle cx="12" cy="12" r="3" />
		</svg>
	);
}

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [rememberLogin, setRememberLogin] = useState(true);

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
				const msg = body?.errors?.password || body?.error || "登录失败，请重试";
				setError(msg);
				return;
			}

			try {
				if (rememberLogin) {
					window.sessionStorage.setItem("dts.copilot.login.username", username.trim());
				} else {
					window.sessionStorage.removeItem("dts.copilot.login.username");
				}
			} catch {
				// ignore storage failures
			}

			window.location.href = `${basePath}/`;
		} catch {
			setError("网络错误，请检查连接后重试");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-page auth-page--login">
			<div className="ambient" aria-hidden="true" />
			<div className="dot-grid" aria-hidden="true" />

			<div className="page">
				<section className="hero" aria-label="平台封面">
					<div className="logo">
						<BrandMark />
						<span className="logo-text">DTS Analytics</span>
						<span className="logo-tag">v2.0</span>
					</div>

					<div className="hero-label">数据分析中枢</div>
					<h1 className="hero-title">
						让指标、趋势与
						<br />
						智能问答
						<br />
						<span className="highlight">
							在同一张封面上
							<br />
							协同工作
						</span>
					</h1>
					<p className="hero-subtitle">
						统一接入业务数据、实时监控经营变化、快速生成分析洞察与专题看板。
						<br />
						基于自然语言的智能查询，让数据触手可及。
					</p>

					<div className="features" aria-label="核心能力">
						{featurePills.map((item) => (
							<span key={item} className="pill">
								<span className="pill-dot" />
								{item}
							</span>
						))}
					</div>

					<div className="stats" aria-label="关键指标">
						{stats.map((stat) => (
							<div key={stat.label} className="stat">
								<div className="stat-number">{stat.value}</div>
								<div className="stat-label">{stat.label}</div>
								<div className="stat-desc">{stat.detail}</div>
							</div>
						))}
					</div>

					<div className="live-bar">
						<div className="live-bar-inner">
							<div className="live-dot-wrap">
								<span className="live-dot" />
								<span className="live-text">
									<strong>LIVE</strong>&nbsp;分析链路正在稳定运行
								</span>
							</div>
							<div className="live-stats">
								{liveStats.map((item) => (
									<div key={item.label} className="live-stat">
										<div className="live-stat-val">{item.value}</div>
										<div className="live-stat-label">{item.label}</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="login-side" aria-label="登录区域">
					<div className="login-card">
						<div className="login-header">
							<h2 className="login-title">欢迎回来</h2>
							<p className="login-desc">使用用户名和密码进入分析平台</p>
						</div>

						{error && <div className="auth-error auth-error--panel">{error}</div>}

						<form onSubmit={handleSubmit}>
							<div className="form-group">
								<label className="form-label" htmlFor="login-username">
									用户名
								</label>
								<div className="input-wrap">
									<UserIcon />
									<input
										id="login-username"
										type="text"
										className="form-input"
										placeholder="请输入用户名"
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										autoComplete="username"
										autoFocus
										required
									/>
								</div>
							</div>

							<div className="form-group">
								<label className="form-label" htmlFor="login-password">
									密码
								</label>
								<div className="input-wrap">
									<LockIcon />
									<input
										id="login-password"
										type={showPassword ? "text" : "password"}
										className="form-input"
										placeholder="请输入密码"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										autoComplete="current-password"
										required
									/>
									<button
										type="button"
										className="password-toggle"
										onClick={() => setShowPassword((v) => !v)}
										aria-label={showPassword ? "隐藏密码" : "显示密码"}
									>
										<EyeIcon visible={showPassword} />
									</button>
								</div>
							</div>

							<div className="form-options">
								<label className="remember-wrap">
									<input
										type="checkbox"
										checked={rememberLogin}
										onChange={(e) => setRememberLogin(e.target.checked)}
									/>
									<span className="remember-label">记住登录</span>
								</label>
								<a className="forgot-link" href="#/" onClick={(e) => e.preventDefault()}>
									忘记密码？
								</a>
							</div>

							<button type="submit" className="btn-login" disabled={loading}>
								<span>
									{loading ? "登录中..." : "进入分析平台"}
									<span className="arrow">→</span>
								</span>
							</button>
						</form>

						<div className="divider">
							<span>登录后可访问</span>
						</div>

						<div className="quick-access">
							<div className="quick-links">
								{quickLinks.map((item) => (
									<span key={item} className="quick-link">
										{item}
									</span>
								))}
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
