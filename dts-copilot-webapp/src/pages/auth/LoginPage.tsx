import { type FormEvent, useState } from "react";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import "./auth.css";

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

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
		<div className="auth-page">
			<div className="auth-card">
				<div className="auth-logo">
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

				<h1 className="auth-title">登录</h1>
				<p className="auth-subtitle">使用用户名和密码登录分析平台</p>

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
						登录
					</Button>
				</form>
			</div>
		</div>
	);
}
