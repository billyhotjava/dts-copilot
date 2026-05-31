import { Fragment, useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { analyticsApi, type CurrentUser } from "../api/analyticsApi";
import { setCopilotSessionAccess } from "../api/copilotAuth";
import { APP_HOME_PATH } from "../appShellConfig";
import { getPlatformTokens } from "../api/platformSession";
import { CopilotSidebar } from "../components/copilot/CopilotSidebar";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MobileTabBar } from "../components/nav/MobileTabBar";
import {
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
	ChatHistoryIcon,
	CollectionIcon,
	DatabaseIcon,
	MetricIcon,
	ModelIcon,
	NewChatIcon,
	SettingsIcon,
	SignalIcon,
	UserIcon,
	LogoutIcon,
} from "./AppLayout.icons";
import {
	clearSharedUserTokens,
	getUserInfo,
	getUserRoles,
	HeaderBreadcrumb,
} from "./AppLayout.helpers";
import {
	getVisibleGovernanceItems,
	getVisibleNavigation,
	type NavigationIconKey,
} from "./appNavigation";
import "./layout.css";

function getNavigationIcon(icon: NavigationIconKey) {
	switch (icon) {
		case "newChat":
			return <NewChatIcon />;
		case "chatHistory":
			return <ChatHistoryIcon />;
		case "assets":
			return <CollectionIcon />;
		case "signals":
			return <SignalIcon />;
		case "dataSources":
			return <DatabaseIcon />;
		case "models":
			return <ModelIcon />;
		case "metrics":
			return <MetricIcon />;
		case "users":
			return <UserIcon />;
		case "settings":
		case "governance":
			return <SettingsIcon />;
	}
}

export function AppLayout() {
	const location = useLocation();
	const navigate = useNavigate();
	const basePath = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, "") || "";
	const isWorkspaceRoute = location.pathname === APP_HOME_PATH;

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
	if (isPublicRoute) {
		return (
			<div className="public-route-shell">
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</div>
		);
	}

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
	const navigationSections = getVisibleNavigation({
		privileged,
		superuser: Boolean(sessionUser?.is_superuser),
	});
	const governanceItems = getVisibleGovernanceItems({
		privileged,
		superuser: Boolean(sessionUser?.is_superuser),
	});

	const handleLogout = async () => {
		// Revoke session cookie via DELETE /api/session
		try {
			await fetch(`${basePath}/api/session`, { method: "DELETE", credentials: "include" });
		} catch { /* ignore */ }
		setCopilotSessionAccess(false);
		clearSharedUserTokens();
		window.location.href = `${basePath}/auth/login`;
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

	const GovernanceMenu = governanceItems.length > 0 ? (
		<Dropdown
			trigger={
				<button className="governance-menu-trigger" type="button">
					<SettingsIcon />
					<span>{t(locale, "nav.section.governance")}</span>
				</button>
			}
			placement="bottom-end"
		>
			{governanceItems.map((item) => (
				<DropdownItem
					key={item.id}
					icon={getNavigationIcon(item.icon)}
					onClick={() => navigate(item.to)}
				>
					{t(locale, item.labelKey)}
				</DropdownItem>
			))}
		</Dropdown>
	) : null;

	return (
		<SidebarProvider>
				<div className="layout">
					<SidebarNav logo={Logo} logoCollapsed={LogoCollapsed} footer={null}>
						{navigationSections.map((section, index) => (
							<Fragment key={section.id}>
								{index > 0 && <SidebarDivider />}
								<SidebarSection title={t(locale, section.titleKey)}>
									{section.items.map((item) => (
										<SidebarItem
											key={item.id}
											to={item.to}
											icon={getNavigationIcon(item.icon)}
											label={t(locale, item.labelKey)}
											end={item.end}
										/>
									))}
								</SidebarSection>
							</Fragment>
						))}
					</SidebarNav>

					<main className="main">
						<header className="main-header">
							<div className="main-header__left">
								<HeaderBreadcrumb />
							</div>
							<div className="main-header__right">
								{GovernanceMenu}
								<ThemeToggle showLabel={false} />
								{UserMenu}
							</div>
						</header>
						<div className={isWorkspaceRoute ? "main-content main-content--workspace" : "main-content"}>
							<ErrorBoundary>
								{isWorkspaceRoute ? (
									<div className="workspace-shell">
										<Outlet />
									</div>
								) : (
									<Outlet />
								)}
							</ErrorBoundary>
						</div>
					</main>

					{!isWorkspaceRoute && (
						<CopilotSidebar hasSessionAccess={sessionStatus === "ok"} />
					)}
				</div>
				<MobileTabBar />
			</SidebarProvider>
	);
}
