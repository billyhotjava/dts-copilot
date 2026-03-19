import { useEffect, useMemo, useState } from "react";
import { analyticsApi, type CurrentUser } from "../../api/analyticsApi";
import { PageContainer, PageHeader } from "../../components/PageContainer/PageContainer";
import { ErrorNotice } from "../../components/ErrorNotice";
import { Card, CardBody } from "../../ui/Card/Card";
import { Button } from "../../ui/Button/Button";
import { Badge } from "../../ui/Badge/Badge";
import { Input } from "../../ui/Input/Input";
import { Spinner } from "../../ui/Loading/Spinner";
import { EmptyState } from "../../components/EmptyState";
import { getEffectiveLocale, t, type Locale } from "../../i18n";
import "../page.css";

type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown };

type Dialog =
	| { type: "create" }
	| { type: "edit"; user: CurrentUser }
	| { type: "password"; user: CurrentUser }
	| null;

const PlusIcon = () => (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M5 12h14" /><path d="M12 5v14" />
	</svg>
);

const UserIcon = () => (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
	</svg>
);

export default function UsersPage() {
	const locale: Locale = useMemo(() => getEffectiveLocale(), []);
	const [state, setState] = useState<LoadState<CurrentUser[]>>({ state: "loading" });
	const [dialog, setDialog] = useState<Dialog>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<unknown>(null);

	// Create form
	const [createForm, setCreateForm] = useState({ first_name: "", last_name: "", username: "", password: "" });
	// Edit form
	const [editForm, setEditForm] = useState({ first_name: "", last_name: "", is_superuser: false });
	// Password form
	const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });

	const reload = () => {
		setState({ state: "loading" });
		analyticsApi.listUsers()
			.then((users) => setState({ state: "loaded", value: Array.isArray(users) ? users : [] }))
			.catch((e) => setState({ state: "error", error: e }));
	};

	useEffect(() => { reload(); }, []);

	function openCreate() {
		setCreateForm({ first_name: "", last_name: "", username: "", password: "" });
		setError(null);
		setDialog({ type: "create" });
	}

	function openEdit(user: CurrentUser) {
		setEditForm({
			first_name: user.first_name || "",
			last_name: user.last_name || "",
			is_superuser: user.is_superuser === true,
		});
		setError(null);
		setDialog({ type: "edit", user });
	}

	function openPassword(user: CurrentUser) {
		setPasswordForm({ password: "", confirm: "" });
		setError(null);
		setDialog({ type: "password", user });
	}

	async function handleCreate() {
		if (!createForm.username.trim() || !createForm.first_name.trim()) {
			setError(t(locale, "users.validation.required"));
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await analyticsApi.createUser({
				first_name: createForm.first_name.trim(),
				last_name: createForm.last_name.trim(),
				username: createForm.username.trim(),
				password: createForm.password || undefined,
			});
			setDialog(null);
			reload();
		} catch (e) { setError(e); }
		finally { setSaving(false); }
	}

	async function handleEdit() {
		if (dialog?.type !== "edit") return;
		setSaving(true);
		setError(null);
		try {
			await analyticsApi.updateUser(dialog.user.id, {
				first_name: editForm.first_name.trim(),
				last_name: editForm.last_name.trim(),
				is_superuser: editForm.is_superuser,
			});
			setDialog(null);
			reload();
		} catch (e) { setError(e); }
		finally { setSaving(false); }
	}

	async function handlePassword() {
		if (dialog?.type !== "password") return;
		if (!passwordForm.password || passwordForm.password.length < 6) {
			setError(t(locale, "users.validation.passwordMin"));
			return;
		}
		if (passwordForm.password !== passwordForm.confirm) {
			setError(t(locale, "users.validation.passwordMismatch"));
			return;
		}
		setSaving(true);
		setError(null);
		try {
			await analyticsApi.changeUserPassword(dialog.user.id, { password: passwordForm.password });
			setDialog(null);
		} catch (e) { setError(e); }
		finally { setSaving(false); }
	}

	async function handleToggleActive(user: CurrentUser) {
		try {
			if (user.is_active === false) {
				await analyticsApi.reactivateUser(user.id);
			} else {
				await analyticsApi.deactivateUser(user.id);
			}
			reload();
		} catch (e) { alert(String(e)); }
	}

	return (
		<PageContainer>
			<PageHeader
				title={t(locale, "users.title")}
				subtitle={t(locale, "users.subtitle")}
				actions={
					<Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>
						{t(locale, "users.add")}
					</Button>
				}
			/>

			{state.state === "loading" && (
				<Card><CardBody>
					<div className="loading-container" style={{ padding: "var(--spacing-xl)" }}><Spinner size="lg" /></div>
				</CardBody></Card>
			)}
			{state.state === "error" && <ErrorNotice locale={locale} error={state.error} />}
			{state.state === "loaded" && state.value.length === 0 && (
				<EmptyState title={t(locale, "users.empty")} action={
					<Button variant="primary" icon={<PlusIcon />} onClick={openCreate}>{t(locale, "users.add")}</Button>
				} />
			)}
			{state.state === "loaded" && state.value.length > 0 && (
				<Card>
					<CardBody style={{ padding: 0 }}>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<thead>
								<tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
									<th style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>{t(locale, "users.name")}</th>
									<th style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>{t(locale, "users.username")}</th>
									<th style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>{t(locale, "users.role")}</th>
									<th style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)" }}>{t(locale, "users.status")}</th>
									<th style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-secondary)", textAlign: "right" }}>{t(locale, "users.actions")}</th>
								</tr>
							</thead>
							<tbody>
								{state.value.map((user) => (
									<tr key={user.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
										<td style={{ padding: "var(--spacing-sm) var(--spacing-md)" }}>
											<div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
												<div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-brand)", flexShrink: 0 }}>
													<UserIcon />
												</div>
												<span style={{ fontWeight: "var(--font-weight-medium)" }}>
													{[user.first_name, user.last_name].filter(Boolean).join(" ") || "-"}
												</span>
											</div>
										</td>
										<td style={{ padding: "var(--spacing-sm) var(--spacing-md)", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
											{user.username || user.common_name || "-"}
										</td>
										<td style={{ padding: "var(--spacing-sm) var(--spacing-md)" }}>
											<Badge variant={user.is_superuser ? "info" : "default"} size="sm">
												{user.is_superuser ? t(locale, "users.admin") : t(locale, "users.member")}
											</Badge>
										</td>
										<td style={{ padding: "var(--spacing-sm) var(--spacing-md)" }}>
											<Badge variant={user.is_active !== false ? "success" : "default"} size="sm">
												{user.is_active !== false ? t(locale, "users.active") : t(locale, "users.inactive")}
											</Badge>
										</td>
										<td style={{ padding: "var(--spacing-sm) var(--spacing-md)", textAlign: "right" }}>
											<div style={{ display: "flex", gap: "var(--spacing-xs)", justifyContent: "flex-end" }}>
												<Button variant="tertiary" size="sm" onClick={() => openEdit(user)}>
													{t(locale, "data.edit")}
												</Button>
												<Button variant="tertiary" size="sm" onClick={() => openPassword(user)}>
													{t(locale, "users.resetPassword")}
												</Button>
												<Button
													variant="tertiary"
													size="sm"
													onClick={() => handleToggleActive(user)}
													style={user.is_active !== false ? { color: "var(--color-error)" } : {}}
												>
													{user.is_active !== false ? t(locale, "users.deactivate") : t(locale, "users.activate")}
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardBody>
				</Card>
			)}

			{/* Dialog Overlay */}
			{dialog && (
				<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<Card style={{ maxWidth: 440, width: "90%" }}>
						<CardBody>
							<h3 style={{ margin: "0 0 var(--spacing-md)", fontSize: "var(--font-size-lg)", fontWeight: "var(--font-weight-semibold)" }}>
								{dialog.type === "create" ? t(locale, "users.add") : dialog.type === "edit" ? t(locale, "users.editUser") : t(locale, "users.resetPassword")}
							</h3>

							{error ? <ErrorNotice locale={locale} error={error} /> : null}

							{dialog.type === "create" && (
								<div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
									<Input label={t(locale, "users.firstName")} value={createForm.first_name} onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))} />
									<Input label={t(locale, "users.lastName")} value={createForm.last_name} onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))} />
									<Input label={t(locale, "users.username")} type="text" value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} />
									<Input label={t(locale, "data.password")} type="password" value={createForm.password} placeholder={t(locale, "users.passwordAutoHint")} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} />
								</div>
							)}

							{dialog.type === "edit" && (
								<div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
									<Input label={t(locale, "users.firstName")} value={editForm.first_name} onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))} />
									<Input label={t(locale, "users.lastName")} value={editForm.last_name} onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))} />
									<label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", fontSize: "var(--font-size-sm)", cursor: "pointer" }}>
										<input type="checkbox" checked={editForm.is_superuser} onChange={(e) => setEditForm((p) => ({ ...p, is_superuser: e.target.checked }))} />
										{t(locale, "users.adminRole")}
									</label>
								</div>
							)}

							{dialog.type === "password" && (
								<div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
									<p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
										{t(locale, "users.resetPasswordFor")} <strong>{dialog.user.username || dialog.user.common_name}</strong>
									</p>
									<Input label={t(locale, "users.newPassword")} type="password" value={passwordForm.password} onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))} />
									<Input label={t(locale, "users.confirmPassword")} type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} />
								</div>
							)}

							<div style={{ display: "flex", gap: "var(--spacing-sm)", justifyContent: "flex-end", marginTop: "var(--spacing-lg)" }}>
								<Button variant="secondary" onClick={() => setDialog(null)} disabled={saving}>
									{t(locale, "common.cancel")}
								</Button>
								<Button
									variant="primary"
									loading={saving}
									onClick={dialog.type === "create" ? handleCreate : dialog.type === "edit" ? handleEdit : handlePassword}
								>
									{dialog.type === "create" ? t(locale, "users.add") : t(locale, "common.save")}
								</Button>
							</div>
						</CardBody>
					</Card>
				</div>
			)}
		</PageContainer>
	);
}
