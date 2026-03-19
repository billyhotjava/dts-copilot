import { type FormEvent, useEffect, useState } from "react";
import { Button } from "../../ui/Button/Button";
import { Input } from "../../ui/Input/Input";
import "./auth.css";

const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

export default function SetupPage() {
	const [setupToken, setSetupToken] = useState<string | null>(null);
	const [siteName, setSiteName] = useState("DTS Analytics");
	const [username, setUsername] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [bootstrapLoading, setBootstrapLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`${basePath}/api/session/properties`, {
					credentials: "include",
					headers: { accept: "application/json" },
				});
				if (!res.ok) {
					setError("无法获取初始化信息");
					return;
				}
				const data = await res.json();
				if (data["has-user-setup"]) {
					// Already set up, redirect to login
					if (!cancelled) window.location.href = `${basePath}/auth/login`;
					return;
				}
				if (!cancelled) setSetupToken(data["setup-token"] ?? null);
			} catch {
				if (!cancelled) setError("网络错误");
			} finally {
				if (!cancelled) setBootstrapLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError("");
		setFieldErrors({});
		setLoading(true);

		try {
			const response = await fetch(`${basePath}/api/setup`, {
				method: "POST",
				credentials: "include",
				headers: {
					"content-type": "application/json",
					accept: "application/json",
				},
				body: JSON.stringify({
					token: setupToken,
					prefs: {
						site_name: siteName.trim(),
						allow_tracking: false,
					},
					user: {
						username: username.trim(),
						first_name: firstName.trim(),
						last_name: lastName.trim(),
						password,
					},
				}),
			});

			if (!response.ok) {
				const body = await response.json().catch(() => null);
				if (body?.errors && typeof body.errors === "object") {
					setFieldErrors(body.errors as Record<string, string>);
				} else {
					const text =
						typeof body === "string"
							? body
							: body?.error || "初始化失败";
					setError(text);
				}
				return;
			}

			// Setup succeeded — session cookie is set. Full page reload.
			window.location.href = `${basePath}/`;
		} catch {
			setError("网络错误，请检查连接后重试");
		} finally {
			setLoading(false);
		}
	}

	if (bootstrapLoading) {
		return (
			<div className="auth-page">
				<div className="auth-card" style={{ textAlign: "center" }}>
					正在加载...
				</div>
			</div>
		);
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

				<h1 className="auth-title">初始化</h1>
				<p className="auth-subtitle">
					创建管理员账号并配置站点名称
				</p>

				{error && <div className="auth-error">{error}</div>}

				<form className="auth-form" onSubmit={handleSubmit}>
					<Input
						label="站点名称"
						type="text"
						placeholder="DTS Analytics"
						value={siteName}
						onChange={(e) => setSiteName(e.target.value)}
						error={fieldErrors.site_name}
						required
					/>

					<div className="auth-row">
						<Input
							label="姓"
							type="text"
							placeholder="张"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							error={fieldErrors.last_name}
							required
						/>
						<Input
							label="名"
							type="text"
							placeholder="三"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							error={fieldErrors.first_name}
							required
						/>
					</div>

					<Input
						label="用户名"
						type="text"
						placeholder="admin"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						error={fieldErrors.username}
						required
						autoComplete="username"
					/>

					<Input
						label="密码"
						type="password"
						placeholder="至少6位，包含数字"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						error={fieldErrors.password}
						required
						autoComplete="new-password"
					/>

					<Button
						type="submit"
						variant="primary"
						size="lg"
						fullWidth
						loading={loading}
					>
						完成初始化
					</Button>
				</form>
			</div>
		</div>
	);
}
