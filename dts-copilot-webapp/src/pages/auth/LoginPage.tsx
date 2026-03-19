import { type FormEvent, useState } from "react";
import "./auth.css";

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

const featurePills = [
	"项目运营",
	"养护巡检",
	"报花换花",
];

const stats = [
	{ value: "128", label: "在管项目", detail: "项目与现场资产" },
	{ value: "24", label: "今日任务", detail: "巡检与换花执行" },
	{ value: "99.2%", label: "履约达成", detail: "服务计划按时完成" },
];

const quickLinks = [
	"项目看板",
	"任务中心",
	"客户服务",
];

const liveStats = [
	{ value: "36", label: "待巡检" },
	{ value: "12", label: "待换花" },
	{ value: "08", label: "客户反馈" },
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

					<div className="hero-label">植物租赁运营平台</div>
					<h1 className="hero-title">
						让项目、养护与植物资产
						<br />
						<span className="highlight">
							协同运行
						</span>
					</h1>
					<p className="hero-subtitle">覆盖项目、巡检、换花与客户服务。</p>

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
									<strong>LIVE</strong>&nbsp;今日现场任务稳定执行
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
							<h2 className="login-title">欢迎登录</h2>
							<p className="login-desc">使用账号进入植物租赁平台</p>
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
									{loading ? "登录中..." : "进入运营平台"}
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
