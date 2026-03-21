import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { analyticsApi, type CurrentUser } from "../api/analyticsApi";
import { setCopilotSessionAccess } from "../api/copilotAuth";
import { APP_HOME_PATH } from "../appShellConfig";
import { getPlatformTokens } from "../api/platformSession";
import { CopilotSidebar } from "../components/copilot/CopilotSidebar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MobileTabBar } from "../components/nav/MobileTabBar";
import {
	SidebarButton,
	SidebarDivider,
	SidebarItem,
	SidebarNav,
	SidebarProvider,
	SidebarSection,
} from "../components/SidebarNav/SidebarNav";
import { getEffectiveLocale, t } from "../i18n";
import {
	Dropdown,
	DropdownItem,
	DropdownSeparator,
} from "../ui/Dropdown/Dropdown";
import { ThemeToggle } from "../ui/ThemeToggle/ThemeToggle";
import { resolvePrivilegedAccess } from "./privilegedAccessPolicy";
import {
	AnalyzeIcon,
	QuestionIcon,
	DashboardIcon,
	CollectionIcon,
	DatabaseIcon,
	ModelIcon,
	MetricIcon,
	TrashIcon,
	SearchIcon,
	ScreenIcon,
	ExploreSessionIcon,
	ReportFactoryIcon,
	FixedReportIcon,
	MetricLensIcon,
	ExpertModeIcon,
	SettingsIcon,
	UserIcon,
	LogoutIcon,
} from "./AppLayout.icons";
import {
	clearSharedUserTokens,
	getUserInfo,
	getUserRoles,
	HeaderBreadcrumb,
} from "./AppLayout.helpers";
import "./layout.css";


export function AppLayout() {
	const location = useLocation();
	const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";

	// Auth guard: platform token OR session cookie.
	const isPublicRoute = location.pathname.startsWith("/public/");
	const tokens = getPlatformTokens();
	const hasPlatformToken = Boolean(tokens.accessToken);

	// For standalone mode (no platform token), verify session via /api/session/properties.
	const [sessionStatus, setSessionStatus] = useState<"checking" | "ok" | "login" | "setup">(
		hasPlatformToken || isPublicRoute ? "ok" : "checking",
	);
	const [sessionUser, setSessionUser] = useState<CurrentUser | null>(null);

	useEffect(() => {
		if (hasPlatformToken || isPublicRoute || sessionStatus !== "checking") return;
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`${basePath}/api/session/properties`, {
					credentials: "include",
					headers: { accept: "application/json" },
				});
				if (!res.ok) {
					if (!cancelled) setSessionStatus("login");
					return;
				}
				const data = await res.json();
				if (!data["has-user-setup"]) {
					if (!cancelled) setSessionStatus("setup");
				} else {
					if (!cancelled) setSessionStatus("ok");
				}
			} catch {
				if (!cancelled) setSessionStatus("login");
			}
		})();
		return () => { cancelled = true; };
	}, [hasPlatformToken, isPublicRoute, sessionStatus, basePath]);

	useEffect(() => {
		if (hasPlatformToken || isPublicRoute || sessionStatus !== "ok") return;
		let cancelled = false;
		analyticsApi
			.getCurrentUser()
			.then((user) => {
				if (!cancelled) {
					setSessionUser(user);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setSessionUser(null);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [hasPlatformToken, isPublicRoute, sessionStatus]);

	useEffect(() => {
		if (hasPlatformToken || isPublicRoute) {
			return;
		}
		setCopilotSessionAccess(sessionStatus === "ok");
	}, [hasPlatformToken, isPublicRoute, sessionStatus]);

	if (sessionStatus === "checking") {
		return (
			<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
				正在验证登录状态...
			</div>
		);
	}
	if (sessionStatus === "setup") return <Navigate to="/auth/setup" replace />;
	if (sessionStatus === "login") return <Navigate to="/auth/login" replace />;

	const locale = getEffectiveLocale();
	const userInfo = getUserInfo();
	const userRoles = getUserRoles();
	// In standalone mode (sessionUser present), all logged-in users see
	// data & tools sections.  Platform mode still uses role-based check.
	const privileged = sessionUser
		? true
		: resolvePrivilegedAccess({
			roles: userRoles,
			personnelLevel: userInfo.personnelLevel,
			isSuperuser: false,
		});
	const sessionUserName =
		sessionUser?.common_name ||
		[sessionUser?.first_name, sessionUser?.last_name].filter(Boolean).join(" ") ||
		sessionUser?.username ||
		"";
	const displayName = userInfo.fullName || userInfo.username || sessionUserName || "用户";

	const handleLogout = async () => {
		// Revoke session cookie via DELETE /api/session
		try {
			await fetch(`${basePath}/api/session`, { method: "DELETE", credentials: "include" });
		} catch { /* ignore */ }
		setCopilotSessionAccess(false);
		clearSharedUserTokens();
		window.location.href = `${basePath}/auth/login`;
	};

	const handleExpertMode = () => {
		window.open("/expert/", "_blank");
	};

	const Logo = (
		<Link
			to={APP_HOME_PATH}
			className="sidebar-logo-link"
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				textDecoration: "none",
				paddingLeft: "8px",
			}}
		>
			<svg
				role="img"
				aria-label="dts logo"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 64 64"
				fill="none"
				width="32"
				height="32"
				style={{ color: "var(--color-brand)", flexShrink: 0 }}
			>
				<circle
					cx="32"
					cy="32"
					r="29"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
				/>
				<circle
					cx="32"
					cy="32"
					r="22"
					stroke="currentColor"
					strokeOpacity="0.25"
					strokeWidth="2"
					strokeDasharray="5 4"
				/>
				<circle
					cx="32"
					cy="32"
					r="14"
					stroke="currentColor"
					strokeOpacity="0.25"
					strokeWidth="2"
				/>
				<path
					d="M10 30 C18 18, 46 18, 54 30"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
					fill="none"
				/>
				<path
					d="M10 34 C18 46, 46 46, 54 34"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
					fill="none"
				/>
				<line
					x1="32"
					y1="32"
					x2="32"
					y2="8"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="54"
					y2="32"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="10"
					y2="32"
					stroke="currentColor"
					strokeOpacity="0.4"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="45"
					y2="19"
					stroke="currentColor"
					strokeOpacity="0.4"
					strokeWidth="2"
				/>
				<circle
					cx="32"
					cy="32"
					r="4.5"
					fill="currentColor"
					fillOpacity="0.95"
				/>
				<circle cx="32" cy="8" r="3" fill="currentColor" fillOpacity="0.9" />
				<circle
					cx="54"
					cy="32"
					r="2.6"
					fill="currentColor"
					fillOpacity="0.85"
				/>
				<circle
					cx="10"
					cy="32"
					r="2.6"
					fill="currentColor"
					fillOpacity="0.75"
				/>
				<circle cx="45" cy="19" r="2.4" fill="currentColor" fillOpacity="0.8" />
				<path
					d="M26 12 l2 -2 m-2 6 l3 -3"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<path
					d="M50 40 l2 -2 m-4 0 l3 -3"
					stroke="currentColor"
					strokeOpacity="0.5"
					strokeWidth="2"
				/>
			</svg>
			<div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
				<span
					style={{
						fontSize: "18px",
						fontWeight: 700,
						letterSpacing: "-0.025em",
						color: "var(--color-sidebar-text)",
					}}
				>
					DTS 智能平台
				</span>
				<span
					style={{
						fontSize: "10px",
						fontWeight: 500,
						color: "var(--color-sidebar-text-muted)",
						textTransform: "uppercase",
						letterSpacing: "0.05em",
						marginTop: "4px",
						opacity: 0.8,
					}}
				>
					AI Native Analytics
				</span>
			</div>
		</Link>
	);

	const LogoCollapsed = (
		<Link
			to={APP_HOME_PATH}
			className="sidebar-logo-link"
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<svg
				role="img"
				aria-label="dts logo"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 64 64"
				fill="none"
				width="32"
				height="32"
				style={{ color: "var(--color-brand)" }}
			>
				<circle
					cx="32"
					cy="32"
					r="29"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
				/>
				<circle
					cx="32"
					cy="32"
					r="22"
					stroke="currentColor"
					strokeOpacity="0.25"
					strokeWidth="2"
					strokeDasharray="5 4"
				/>
				<circle
					cx="32"
					cy="32"
					r="14"
					stroke="currentColor"
					strokeOpacity="0.25"
					strokeWidth="2"
				/>
				<path
					d="M10 30 C18 18, 46 18, 54 30"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
					fill="none"
				/>
				<path
					d="M10 34 C18 46, 46 46, 54 34"
					stroke="currentColor"
					strokeOpacity="0.35"
					strokeWidth="2"
					fill="none"
				/>
				<line
					x1="32"
					y1="32"
					x2="32"
					y2="8"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="54"
					y2="32"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="10"
					y2="32"
					stroke="currentColor"
					strokeOpacity="0.4"
					strokeWidth="2"
				/>
				<line
					x1="32"
					y1="32"
					x2="45"
					y2="19"
					stroke="currentColor"
					strokeOpacity="0.4"
					strokeWidth="2"
				/>
				<circle
					cx="32"
					cy="32"
					r="4.5"
					fill="currentColor"
					fillOpacity="0.95"
				/>
				<circle cx="32" cy="8" r="3" fill="currentColor" fillOpacity="0.9" />
				<circle
					cx="54"
					cy="32"
					r="2.6"
					fill="currentColor"
					fillOpacity="0.85"
				/>
				<circle
					cx="10"
					cy="32"
					r="2.6"
					fill="currentColor"
					fillOpacity="0.75"
				/>
				<circle cx="45" cy="19" r="2.4" fill="currentColor" fillOpacity="0.8" />
				<path
					d="M26 12 l2 -2 m-2 6 l3 -3"
					stroke="currentColor"
					strokeOpacity="0.6"
					strokeWidth="2"
				/>
				<path
					d="M50 40 l2 -2 m-4 0 l3 -3"
					stroke="currentColor"
					strokeOpacity="0.5"
					strokeWidth="2"
				/>
			</svg>
		</Link>
	);

	const UserMenu = (
		<Dropdown
			trigger={
				<button className="header-user-trigger" type="button">
					<UserIcon />
				</button>
			}
			placement="bottom-end"
		>
			<div className="header-user-info">
				<div className="header-user-info__avatar">
					<UserIcon />
				</div>
				<div className="header-user-info__details">
					<div className="header-user-info__name">{displayName}</div>
					{userInfo.email && (
						<div className="header-user-info__email">
							{userInfo.email}
							{userInfo.username ? `（${userInfo.username}）` : null}
						</div>
					)}
				</div>
			</div>
			<DropdownSeparator />
			<DropdownItem icon={<LogoutIcon />} danger onClick={handleLogout}>
				退出
			</DropdownItem>
		</Dropdown>
	);

	return (
		<SidebarProvider>
				<div className="layout">
					<SidebarNav logo={Logo} logoCollapsed={LogoCollapsed} footer={null}>
						{/* Core: all users see dashboards and screens */}
						<SidebarSection title={t(locale, "nav.section.core")}>
							<SidebarItem
								to={APP_HOME_PATH}
								icon={<DashboardIcon />}
								label={t(locale, "nav.dashboards")}
								end
							/>
							<SidebarItem
								to="/screens"
								icon={<ScreenIcon />}
								label={t(locale, "nav.screens")}
							/>
						</SidebarSection>

						{/* Data + Tools: privileged users only */}
						{privileged && (
							<>
								<SidebarDivider />

								<SidebarSection title={t(locale, "nav.section.data")}>
									{/* 数据源管理：仅管理员 */}
									{sessionUser?.is_superuser && (
										<SidebarItem
											to="/data"
											icon={<DatabaseIcon />}
											label={t(locale, "nav.data")}
											end
										/>
									)}
									<SidebarItem
										to="/models"
										icon={<ModelIcon />}
										label={t(locale, "nav.models")}
									/>
									<SidebarItem
										to="/metrics"
										icon={<MetricIcon />}
										label={t(locale, "nav.metrics")}
									/>
									<SidebarItem
										to="/trash"
										icon={<TrashIcon />}
										label={t(locale, "nav.trash")}
									/>
								</SidebarSection>

								<SidebarDivider />

								<SidebarSection title={t(locale, "nav.section.tools")}>
									<SidebarItem
										to="/analyze"
										icon={<AnalyzeIcon />}
										label={t(locale, "nav.analyze")}
									/>
									<SidebarItem
										to="/questions"
										icon={<QuestionIcon />}
										label={t(locale, "nav.questions")}
									/>
									<SidebarItem
										to="/collections"
										icon={<CollectionIcon />}
										label={t(locale, "nav.collections")}
										end
									/>
									<SidebarItem
										to="/explore-sessions"
										icon={<ExploreSessionIcon />}
										label={t(locale, "nav.exploreSessions")}
									/>
									<SidebarItem
										to="/report-factory"
										icon={<ReportFactoryIcon />}
										label={t(locale, "nav.reportFactory")}
									/>
									<SidebarItem
										to="/fixed-reports"
										icon={<FixedReportIcon />}
										label={t(locale, "nav.fixedReports")}
									/>
									<SidebarItem
										to="/metric-lens"
										icon={<MetricLensIcon />}
										label={t(locale, "nav.metricLens")}
									/>
									<SidebarItem
										to="/search"
										icon={<SearchIcon />}
										label={t(locale, "nav.search")}
									/>
								</SidebarSection>

								{/* 管理区：仅管理员可见（用户管理 + LLM/系统配置） */}
								{sessionUser?.is_superuser && (
									<>
										<SidebarDivider />

										<SidebarSection title={t(locale, "nav.section.admin")}>
											<SidebarItem
												to="/admin/users"
												icon={<UserIcon />}
												label={t(locale, "nav.users")}
											/>
											<SidebarItem
												to="/admin/settings/copilot"
												icon={<SettingsIcon />}
												label={t(locale, "nav.systemSettings")}
											/>
											<SidebarButton
												icon={<ExpertModeIcon />}
												label={t(locale, "nav.expertMode")}
												onClick={handleExpertMode}
											/>
										</SidebarSection>
									</>
								)}
							</>
						)}
					</SidebarNav>

					<main className="main">
						<header className="main-header">
							<div className="main-header__left">
									<HeaderBreadcrumb />
							</div>
							<div className="main-header__right">
								<ThemeToggle showLabel={false} />
								{UserMenu}
							</div>
						</header>
						<div className="main-content">
							<ErrorBoundary>
								<Outlet />
							</ErrorBoundary>
						</div>
					</main>

					<CopilotSidebar hasSessionAccess={sessionStatus === "ok"} />
				</div>
				<MobileTabBar />
			</SidebarProvider>
	);
}
