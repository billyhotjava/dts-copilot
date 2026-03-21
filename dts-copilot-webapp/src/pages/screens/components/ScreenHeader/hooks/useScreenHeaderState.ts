import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useScreen } from '../../../ScreenContext';
import { detectInteractionCycles } from '../../../interactionGraph';
import {
    analyticsApi,
    HttpError,
    type ScreenDetail,
} from '../../../../../api/analyticsApi';
import { buildScreenPayload, normalizeScreenConfig, validateScreenPayload } from '../../../specV2';
import { resolveScreenTheme, applyThemeToComponents, getThemeTokens, type ThemeComponentApplyMode } from '../../../screenThemes';
import type { ScreenTheme } from '../../../types';
import { writeTextToClipboard } from '../../../../../hooks/clipboard';
import {
    buildAbsoluteScreenAppUrl,
    buildPublicScreenPath,
    buildScreenPreviewPath,
} from '../../../screenRoutePaths';
import type { ScreenUpdateConflict } from '../../ScreenConflictPanel';
import {
    type PublishNotice,
    type BatchAction,
    DESIGN_ACTION_STORAGE_KEY,
    GOVERNANCE_ACTION_STORAGE_KEY,
    VERSION_ACTION_STORAGE_KEY,
    EXPORT_ACTION_STORAGE_KEY,
    QUICK_ACTION_RECENT_STORAGE_KEY,
    PRIMARY_ACTION_STORAGE_KEY,
    TOOLS_SECTION_STORAGE_KEY,
    buildPublishNoticeStorageKey,
    buildExploreSessionSteps,
    buildComponentConflictMeta,
} from '../types';
import { useExportHandlers } from './useExportHandlers';
import { useEditLock } from './useEditLock';
import { useVersionHandlers } from './useVersionHandlers';

function isTypingTarget(target: EventTarget | null): boolean {
    const node = target as HTMLElement | null;
    if (!node) return false;
    return node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT' || node.isContentEditable;
}

export function useScreenHeaderState() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const {
        state,
        dispatch,
        updateConfig,
        loadConfig,
        markBaseline,
        selectComponents,
        isSaving,
        setIsSaving,
        copyComponents,
        pasteComponents,
        clipboard,
        deleteComponents,
        updateSelectedComponents,
    } = useScreen();
    const { config } = state;
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(config.name);
    const [isSharing, setIsSharing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showVariableManager, setShowVariableManager] = useState(false);
    const [showCachePanel, setShowCachePanel] = useState(false);
    const [showCompliancePanel, setShowCompliancePanel] = useState(false);
    const [showHealthPanel, setShowHealthPanel] = useState(false);
    const [showAclPanel, setShowAclPanel] = useState(false);
    const [showAuditPanel, setShowAuditPanel] = useState(false);
    const [showSharePolicyPanel, setShowSharePolicyPanel] = useState(false);
    const [showInteractionDebugPanel, setShowInteractionDebugPanel] = useState(false);
    const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
    const [showEditLockPanel, setShowEditLockPanel] = useState(false);
    const [showConflictPanel, setShowConflictPanel] = useState(false);
    const [showSnapshotPanel, setShowSnapshotPanel] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [quickKeyword, setQuickKeyword] = useState('');
    const [quickActiveIndex, setQuickActiveIndex] = useState(-1);
    const [quickRecentIds, setQuickRecentIds] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = window.localStorage.getItem(QUICK_ACTION_RECENT_STORAGE_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed
                .map((item) => String(item || '').trim())
                .filter((item) => item.length > 0)
                .slice(0, 8);
        } catch {
            return [];
        }
    });
    const [designAction, setDesignAction] = useState<
        'session' | 'variables' | 'interaction' | 'collaboration' | 'template' | 'import' | 'command'
    >(() => {
        if (typeof window === 'undefined') return 'variables';
        const raw = window.localStorage.getItem(DESIGN_ACTION_STORAGE_KEY);
        if (
            raw === 'session'
            || raw === 'variables'
            || raw === 'interaction'
            || raw === 'collaboration'
            || raw === 'template'
            || raw === 'import'
            || raw === 'command'
        ) {
            return raw;
        }
        return 'variables';
    });
    const [governanceAction, setGovernanceAction] = useState<
        'edit-lock' | 'cache' | 'compliance' | 'health' | 'acl' | 'audit' | 'share-policy' | 'share-link'
    >(() => {
        if (typeof window === 'undefined') return 'cache';
        const raw = window.localStorage.getItem(GOVERNANCE_ACTION_STORAGE_KEY);
        if (
            raw === 'edit-lock'
            || raw === 'cache'
            || raw === 'compliance'
            || raw === 'health'
            || raw === 'acl'
            || raw === 'audit'
            || raw === 'share-policy'
            || raw === 'share-link'
        ) {
            return raw;
        }
        return 'cache';
    });
    const [previewDeviceMode, setPreviewDeviceMode] = useState<'auto' | 'pc' | 'tablet' | 'mobile'>('auto');
    const [versionAction, setVersionAction] = useState<'history' | 'compare'>(() => {
        if (typeof window === 'undefined') return 'history';
        const raw = window.localStorage.getItem(VERSION_ACTION_STORAGE_KEY);
        return raw === 'compare' ? 'compare' : 'history';
    });
    const [exportAction, setExportAction] = useState<'json' | 'png' | 'pdf'>(() => {
        if (typeof window === 'undefined') return 'png';
        const raw = window.localStorage.getItem(EXPORT_ACTION_STORAGE_KEY);
        if (raw === 'json' || raw === 'pdf' || raw === 'png') {
            return raw;
        }
        return 'png';
    });
    const [primaryAction, setPrimaryAction] = useState<'preview' | 'publish' | 'save'>(() => {
        if (typeof window === 'undefined') return 'save';
        const raw = window.localStorage.getItem(PRIMARY_ACTION_STORAGE_KEY);
        if (raw === 'preview' || raw === 'publish' || raw === 'save') {
            return raw;
        }
        return 'save';
    });
    const [toolsSection, setToolsSection] = useState<'design' | 'release' | 'governance'>(() => {
        if (typeof window === 'undefined') return 'design';
        const raw = window.localStorage.getItem(TOOLS_SECTION_STORAGE_KEY);
        if (raw === 'design' || raw === 'release' || raw === 'governance') {
            return raw;
        }
        return 'design';
    });
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [batchAction, setBatchAction] = useState<BatchAction>('duplicate');
    const [themeApplyMode, setThemeApplyMode] = useState<ThemeComponentApplyMode>('force');
    const [showLinkageGraph, setShowLinkageGraph] = useState(false);
    const themeInputRef = useRef<HTMLInputElement | null>(null);
    const { selectedIds, showGrid, zoom } = state;

    const canExecuteBatch = (() => {
        if (batchAction === 'paste') return clipboard.length > 0;
        if (batchAction === 'copy' || batchAction === 'duplicate') return selectedIds.length > 0;
        return selectedIds.length > 0;
    })();

    const executeBatchAction = useCallback(() => {
        if (batchAction === 'copy') { if (selectedIds.length > 0) copyComponents(); return; }
        if (batchAction === 'paste') { if (clipboard.length > 0) pasteComponents(); return; }
        if (batchAction === 'duplicate') {
            if (selectedIds.length === 0) return;
            copyComponents();
            setTimeout(() => pasteComponents(), 0);
            return;
        }
        if (batchAction === 'bring-top') {
            if (selectedIds.length === 0) return;
            const selected = config.components.filter(c => selectedIds.includes(c.id)).sort((a, b) => a.zIndex - b.zIndex);
            for (const item of selected) dispatch({ type: 'REORDER_LAYER', payload: { id: item.id, direction: 'top' } });
            return;
        }
        if (batchAction === 'send-bottom') {
            if (selectedIds.length === 0) return;
            const selected = config.components.filter(c => selectedIds.includes(c.id)).sort((a, b) => b.zIndex - a.zIndex);
            for (const item of selected) dispatch({ type: 'REORDER_LAYER', payload: { id: item.id, direction: 'bottom' } });
            return;
        }
        if (batchAction === 'show') { if (selectedIds.length > 0) updateSelectedComponents({ visible: true }); return; }
        if (batchAction === 'hide') { if (selectedIds.length > 0) updateSelectedComponents({ visible: false }); return; }
        if (batchAction === 'unlock') { if (selectedIds.length > 0) updateSelectedComponents({ locked: false }); return; }
        if (batchAction === 'lock') { if (selectedIds.length > 0) updateSelectedComponents({ locked: true }); return; }
        if (batchAction === 'delete') { if (selectedIds.length > 0) deleteComponents(selectedIds); }
    }, [batchAction, selectedIds, clipboard, copyComponents, pasteComponents, deleteComponents, updateSelectedComponents, dispatch, config.components]);

    const handleToolbarThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as ScreenTheme | '';
        const theme = value || undefined;
        const tokens = getThemeTokens(theme);
        updateConfig({ theme, backgroundColor: tokens.canvasBackground });
    }, [updateConfig]);

    const applyThemeToAllComponents = useCallback((mode: ThemeComponentApplyMode) => {
        const nextComponents = applyThemeToComponents(config.components, config.theme, mode);
        updateConfig({ components: nextComponents });
    }, [config.components, config.theme, updateConfig]);

    const handleZoomReset = useCallback(() => dispatch({ type: 'SET_ZOOM', payload: 100 }), [dispatch]);

    const handleZoomFit = useCallback(() => {
        const el = document.querySelector('.canvas-container') as HTMLElement | null;
        const aw = el ? Math.max(320, el.clientWidth - 24) : Math.max(480, (window.visualViewport?.width ?? window.innerWidth) - 420);
        const ah = el ? Math.max(240, el.clientHeight - 24) : Math.max(260, (window.visualViewport?.height ?? window.innerHeight) - 160);
        const cw = Number(config.width) || 1920;
        const ch = Number(config.height) || 1080;
        const fitPercent = Math.min(300, Math.max(25, Math.floor(Math.min(aw / cw, ah / ch) * 100)));
        dispatch({ type: 'SET_ZOOM', payload: fitPercent });
    }, [dispatch, config.width, config.height]);

    const handleExportThemePack = useCallback(() => {
        const payload = {
            schema: 'dts.screen-theme-pack',
            version: 1,
            name: config.name,
            theme: config.theme || 'legacy-dark',
            backgroundColor: config.backgroundColor,
            backgroundImage: config.backgroundImage || null,
            applyToComponents: true,
            componentStyleMode: themeApplyMode,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-pack-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }, [config.name, config.theme, config.backgroundColor, config.backgroundImage, themeApplyMode]);

    const handleImportThemePackClick = useCallback(() => themeInputRef.current?.click(), []);

    const handleThemePackFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const content = await file.text();
            const raw = JSON.parse(content);
            if (!raw || typeof raw !== 'object') { alert('主题包格式不正确'); return; }
            if (raw.schema && raw.schema !== 'dts.screen-theme-pack') { alert('主题包 schema 不匹配'); return; }
            const normalizeTheme = (t: unknown) => {
                if (t === 'legacy-dark' || t === 'titanium' || t === 'glacier') return t as ScreenTheme;
                return undefined;
            };
            const nextTheme = normalizeTheme(raw.theme) || config.theme;
            const fallbackBg = getThemeTokens(nextTheme).canvasBackground;
            const nextBg = typeof raw.backgroundColor === 'string' && raw.backgroundColor.trim().length > 0 ? raw.backgroundColor.trim() : fallbackBg;
            updateConfig({
                theme: nextTheme,
                backgroundColor: nextBg,
                backgroundImage: typeof raw.backgroundImage === 'string' && raw.backgroundImage.trim().length > 0 ? raw.backgroundImage.trim() : undefined,
            });
            const importMode = raw.componentStyleMode === 'safe' ? 'safe' : 'force';
            if (raw.applyToComponents !== false) {
                const confirmed = window.confirm(`主题包已导入，是否批量应用组件样式？\n策略：${importMode === 'force' ? '强制覆盖' : '仅补缺省'}`);
                if (confirmed) {
                    const nextComps = applyThemeToComponents(config.components, nextTheme, importMode as ThemeComponentApplyMode);
                    updateConfig({ components: nextComps });
                }
            }
        } catch { alert('主题包解析失败'); }
    }, [config.theme, config.components, updateConfig]);

    const handleShortcutHelp = useCallback(() => {
        alert([
            '快捷键说明', '',
            'Ctrl/Cmd + Z：撤销', 'Ctrl/Cmd + Y / Shift+Z：重做',
            'Ctrl/Cmd + C / V：复制 / 粘贴', 'Ctrl/Cmd + D：复制一份',
            'Ctrl/Cmd + A：全选', 'Ctrl/Cmd + \\：聚焦模式',
            'Ctrl/Cmd + Alt + 1/2：左栏/右栏', 'Ctrl/Cmd + 1/2：属性/图层',
            'Ctrl/Cmd + K：命令面板', 'Delete / Backspace：删除',
            '方向键：移动 1px', 'Shift+方向键：移动 10px',
            'Ctrl/Cmd + =/- ：缩放', 'Ctrl/Cmd + 0：100%',
        ].join('\n'));
    }, []);

    const [conflictLoading, setConflictLoading] = useState(false);
    const [lastConflict, setLastConflict] = useState<ScreenUpdateConflict | null>(null);
    const [publishNotice, setPublishNotice] = useState<PublishNotice | null>(null);
    const [publishNoticeDismissed, setPublishNoticeDismissed] = useState(false);
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const quickInputRef = useRef<HTMLInputElement | null>(null);
    const quickActionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const menuContainerRef = useRef<HTMLDivElement | null>(null);
    const [activeMenu, setActiveMenu] = useState<'primary' | 'tools' | null>(null);
    const [permissions, setPermissions] = useState({
        canRead: true,
        canEdit: true,
        canPublish: true,
        canManage: true,
    });

    const cycleWarnings = useMemo(() => detectInteractionCycles(config), [config]);

    // --- Edit lock (extracted hook) ---
    const {
        editLock, setEditLock, lockErrorText, setLockErrorText,
        lockedByOther, lockOwnerText, refreshLockState,
        handleLockHttpError: handleLockHttpErrorRaw,
    } = useEditLock({ id, permissions });

    // --- localStorage sync effects ---
    useEffect(() => {
        if (!id || typeof window === 'undefined') { setPublishNotice(null); return; }
        try {
            const raw = window.localStorage.getItem(buildPublishNoticeStorageKey(id));
            if (!raw) { setPublishNotice(null); return; }
            const parsed = JSON.parse(raw) as PublishNotice;
            if (!parsed || String(parsed.screenId || '') !== String(id)) { setPublishNotice(null); return; }
            setPublishNotice(parsed);
        } catch { setPublishNotice(null); }
    }, [id]);

    useEffect(() => {
        if (!id || typeof window === 'undefined') return;
        const key = buildPublishNoticeStorageKey(id);
        if (!publishNotice || String(publishNotice.screenId || '') !== String(id)) { window.localStorage.removeItem(key); return; }
        window.localStorage.setItem(key, JSON.stringify(publishNotice));
    }, [id, publishNotice]);

    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(DESIGN_ACTION_STORAGE_KEY, designAction); }, [designAction]);
    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(GOVERNANCE_ACTION_STORAGE_KEY, governanceAction); }, [governanceAction]);
    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(VERSION_ACTION_STORAGE_KEY, versionAction); }, [versionAction]);
    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(EXPORT_ACTION_STORAGE_KEY, exportAction); }, [exportAction]);
    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(PRIMARY_ACTION_STORAGE_KEY, primaryAction); }, [primaryAction]);
    useEffect(() => { if (typeof window === 'undefined') return; window.localStorage.setItem(TOOLS_SECTION_STORAGE_KEY, toolsSection); }, [toolsSection]);

    useEffect(() => { if (!id && primaryAction === 'publish') setPrimaryAction('save'); }, [id, primaryAction]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!quickRecentIds.length) { window.localStorage.removeItem(QUICK_ACTION_RECENT_STORAGE_KEY); return; }
        window.localStorage.setItem(QUICK_ACTION_RECENT_STORAGE_KEY, JSON.stringify(quickRecentIds.slice(0, 8)));
    }, [quickRecentIds]);

    useEffect(() => {
        if (!activeMenu) return;
        const handlePointerDown = (event: MouseEvent) => {
            const node = menuContainerRef.current;
            if (!node) return;
            if (!node.contains(event.target as Node)) setActiveMenu(null);
        };
        const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setActiveMenu(null); };
        window.addEventListener('mousedown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);
        return () => { window.removeEventListener('mousedown', handlePointerDown); window.removeEventListener('keydown', handleEscape); };
    }, [activeMenu]);

    useEffect(() => {
        if (!id) { setPermissions({ canRead: true, canEdit: true, canPublish: true, canManage: true }); return; }
        let cancelled = false;
        analyticsApi.getScreen(id, { mode: 'draft', fallbackDraft: true }).then((s) => {
            if (!cancelled) setPermissions({ canRead: s.canRead !== false, canEdit: s.canEdit !== false, canPublish: s.canPublish !== false, canManage: s.canManage !== false });
        }).catch(() => { if (!cancelled) setPermissions({ canRead: true, canEdit: true, canPublish: true, canManage: false }); });
        return () => { cancelled = true; };
    }, [id]);

    // --- Core actions ---
    const applyScreenDetail = useCallback((screen: ScreenDetail) => {
        const normalized = normalizeScreenConfig(screen, { id: screen.id });
        if (normalized.warnings.length > 0) console.warn('[screen-spec-v2] normalized with warnings:', normalized.warnings);
        const resolvedTheme = resolveScreenTheme(normalized.config.theme, normalized.config.backgroundColor);
        loadConfig({ ...normalized.config, theme: resolvedTheme });
    }, [loadConfig]);

    const handleNameClick = () => { setNameValue(config.name); setIsEditingName(true); };
    const handleNameBlur = () => { setIsEditingName(false); if (nameValue.trim() && nameValue !== config.name) updateConfig({ name: nameValue.trim() }); };
    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleNameBlur();
        else if (e.key === 'Escape') { setIsEditingName(false); setNameValue(config.name); }
    };

    const saveScreen = useCallback(async (): Promise<string | number | undefined> => {
        if (isSaving) return id;
        setIsSaving(true);
        try {
            const payload = buildScreenPayload(config) as Record<string, unknown>;
            const baseline = state.baselineConfig;
            if (id && baseline?.updatedAt) payload._conflict = buildComponentConflictMeta(baseline);
            const validation = validateScreenPayload(payload);
            if (validation.errors.length > 0) throw new Error(`配置校验失败：${validation.errors.join('；')}`);
            if (validation.warnings.length > 0) console.warn('[screen-spec-v2] save payload warnings:', validation.warnings);
            if (id) {
                const updated = await analyticsApi.updateScreen(id, payload);
                const normalized = normalizeScreenConfig(updated, { id: updated.id });
                const resolvedTheme = resolveScreenTheme(normalized.config.theme, normalized.config.backgroundColor);
                const synced = { ...normalized.config, theme: resolvedTheme };
                updateConfig(synced);
                markBaseline(synced);
                return id;
            }
            const result = await analyticsApi.createScreen(payload);
            if (result.id) navigate(`/screens/${result.id}/edit`, { replace: true });
            return result.id;
        } finally { setIsSaving(false); }
    }, [config, id, isSaving, markBaseline, navigate, setIsSaving, state.baselineConfig, updateConfig]);

    const handleLockHttpError = useCallback((error: unknown, fallbackMessage: string): string => {
        const result = handleLockHttpErrorRaw(error, fallbackMessage);
        if (result.showPanel) setShowEditLockPanel(true);
        return result.message;
    }, [handleLockHttpErrorRaw]);

    const handleUpdateConflictError = useCallback((error: unknown, fallbackMessage: string): string => {
        if (!(error instanceof HttpError) || error.code !== 'SCREEN_UPDATE_CONFLICT') return fallbackMessage;
        const toStrArr = (v: unknown) => Array.isArray(v) ? v.map((i) => String(i || '').trim()).filter(Boolean) : [];
        let detail = fallbackMessage;
        try {
            const p = JSON.parse(error.bodyText) as { code?: string; message?: string; componentIds?: unknown; fields?: unknown };
            const next: ScreenUpdateConflict = { code: String(p?.code || 'SCREEN_UPDATE_CONFLICT'), message: String(p?.message || '检测到并发编辑冲突'), componentIds: toStrArr(p?.componentIds), fields: toStrArr(p?.fields) };
            setLastConflict(next);
            if (next.componentIds.length > 0) selectComponents(next.componentIds);
            setShowConflictPanel(true);
            detail = next.message || fallbackMessage;
        } catch {
            setLastConflict({ code: 'SCREEN_UPDATE_CONFLICT', message: error.message || fallbackMessage, componentIds: [], fields: [] });
            setShowConflictPanel(true); detail = error.message || fallbackMessage;
        }
        return detail;
    }, [selectComponents]);

    const handleReloadLatestDraft = useCallback(async () => {
        if (!id) return;
        setConflictLoading(true);
        try { const latest = await analyticsApi.getScreen(id, { mode: 'draft', fallbackDraft: true }); applyScreenDetail(latest); setShowConflictPanel(false); }
        catch (error) { const message = error instanceof Error ? error.message : '重载最新草稿失败'; alert(message); }
        finally { setConflictLoading(false); }
    }, [applyScreenDetail, id]);

    const handleSave = useCallback(async () => {
        try { await saveScreen(); }
        catch (error) {
            console.error('Failed to save screen:', error);
            alert(error instanceof HttpError && error.code === 'SCREEN_UPDATE_CONFLICT' ? handleUpdateConflictError(error, '保存失败，存在并发冲突') : handleLockHttpError(error, '保存失败'));
        }
    }, [handleLockHttpError, handleUpdateConflictError, saveScreen]);

    const handlePreview = () => {
        if (id) {
            const suffix = previewDeviceMode === 'auto' ? '' : `?device=${encodeURIComponent(previewDeviceMode)}`;
            window.open(`${buildScreenPreviewPath(id)}${suffix}`, '_blank', 'noopener,noreferrer');
        } else { alert('请先保存大屏后再预览'); }
    };

    // Ctrl+S save & Ctrl+Shift+P preview shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const hotkey = event.ctrlKey || event.metaKey;
            if (!hotkey || isTypingTarget(event.target)) return;
            if (event.key.toLowerCase() === 's' && !event.shiftKey) {
                event.preventDefault();
                if (!isSaving && permissions.canEdit && !lockedByOther) void handleSave();
            } else if (event.shiftKey && event.key.toLowerCase() === 'p') {
                event.preventDefault();
                handlePreview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave, handlePreview, isSaving, lockedByOther, permissions.canEdit]);

    const handleSaveAsTemplate = useCallback(async () => {
        if (isSavingTemplate) return;
        setIsSavingTemplate(true);
        try {
            const screenId = await saveScreen();
            if (!screenId) { alert('请先保存大屏后再存为模板'); return; }
            const templateName = (window.prompt('模板名称', (config.name || '未命名大屏') + '-模板') || '').trim();
            if (!templateName) return;
            const templateDesc = window.prompt('模板描述（可选）', config.description || '') || '';
            const vis = (window.prompt('模板可见范围（personal/team/global）', 'team') || 'team').trim().toLowerCase();
            const scope = vis === 'personal' || vis === 'global' ? vis : 'team';
            await analyticsApi.createScreenTemplateFromScreen(screenId, { name: templateName, description: templateDesc, category: 'custom', thumbnail: '🧩', visibilityScope: scope, listed: true });
            alert(`已保存到${scope === 'personal' ? '个人' : scope === 'global' ? '全局' : '团队'}模板`);
        } catch (error) {
            console.error('Failed to save template:', error);
            alert(error instanceof HttpError && error.code === 'SCREEN_UPDATE_CONFLICT' ? handleUpdateConflictError(error, '存模板失败，存在并发冲突') : handleLockHttpError(error, '存模板失败'));
        } finally { setIsSavingTemplate(false); }
    }, [config.description, config.name, handleLockHttpError, handleUpdateConflictError, isSavingTemplate, saveScreen]);

    const handlePublish = useCallback(async () => {
        if (isPublishing) return;
        setIsPublishing(true);
        try {
            const screenId = await saveScreen();
            if (!screenId) { alert('请先保存大屏'); return; }
            const result = await analyticsApi.publishScreen(screenId);
            const warmup = result.warmup;
            const versionNo = result.version?.versionNo ?? '-';
            const warmupText = warmup ? `\nWarmup: 总计 ${warmup.totalDatabaseSources || 0}，成功 ${warmup.warmed || 0}，跳过 ${warmup.skipped || 0}，失败 ${warmup.failed || 0}` : '';
            const previewUrl = buildAbsoluteScreenAppUrl(window.location.origin, buildScreenPreviewPath(screenId));
            let publicUrl: string | null = null;
            try { const policy = await analyticsApi.createScreenPublicLink(screenId, {}); if (policy?.uuid) publicUrl = buildAbsoluteScreenAppUrl(window.location.origin, buildPublicScreenPath(policy.uuid)); }
            catch (linkError) { console.warn('Publish: public link failed:', linkError); }
            setPublishNotice({ screenId, versionNo, previewUrl, publicUrl, warmupText });
            alert('发布成功，版本 v' + versionNo + warmupText);
        } catch (error) {
            console.error('Failed to publish screen:', error);
            alert(error instanceof HttpError && error.code === 'SCREEN_UPDATE_CONFLICT' ? handleUpdateConflictError(error, '发布失败，存在并发冲突') : handleLockHttpError(error, '发布失败'));
        } finally { setIsPublishing(false); }
    }, [handleLockHttpError, handleUpdateConflictError, isPublishing, saveScreen]);

    useEffect(() => {
        if (!id || !permissions.canRead || publishNotice || publishNoticeDismissed) return;
        let cancelled = false;
        analyticsApi.getScreen(id, { mode: 'published' }).then((published) => {
            if (cancelled) return;
            const versionNo = Number(published?.publishedVersionNo || 0);
            if (versionNo > 0) setPublishNotice({ screenId: id, versionNo, previewUrl: buildAbsoluteScreenAppUrl(window.location.origin, buildScreenPreviewPath(id)), publicUrl: null, warmupText: '' });
        }).catch(() => {});
        return () => { cancelled = true; };
    }, [id, permissions.canRead, publishNotice, publishNoticeDismissed]);

    // --- Version handlers (extracted hook) ---
    const {
        isLoadingVersions, versionCandidates, versionDiff,
        showVersionHistoryPanel, setShowVersionHistoryPanel,
        showVersionComparePanel, setShowVersionComparePanel,
        showVersionComparePicker, setShowVersionComparePicker,
        showVersionRollbackPanel, setShowVersionRollbackPanel,
        handleVersionHistory, handleConfirmVersionRollback,
        handleVersionCompare, handleConfirmVersionCompare,
    } = useVersionHandlers({ id, handleLockHttpError, applyScreenDetail });

    // --- Import / Share / Misc ---
    const handleOpenImport = () => { importInputRef.current?.click(); };

    const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            const content = await file.text();
            const parsed = JSON.parse(content) as Record<string, unknown>;
            const source = (parsed.screenSpec || parsed) as Record<string, unknown>;
            const normalized = normalizeScreenConfig(source, { id: id || '' });
            if (normalized.warnings.length > 0) console.warn('[screen-import] normalized warnings:', normalized.warnings);
            const validation = validateScreenPayload(buildScreenPayload(normalized.config));
            if (validation.errors.length > 0) { alert(`JSON 导入失败，配置不合法：${validation.errors.join('；')}`); return; }
            if (validation.warnings.length > 0) console.warn('[screen-import] validate warnings:', validation.warnings);
            loadConfig(normalized.config);
            alert('JSON 导入完成');
        } catch (error) { console.error('Failed to import screen json:', error); alert('JSON 导入失败，请检查文件格式'); }
    };

    const handleShare = async () => {
        if (!id || isSharing) return;
        setIsSharing(true);
        try {
            const { uuid } = await analyticsApi.createScreenPublicLink(id, {});
            if (!uuid) { alert('未获取到分享链接，请先发布后重试'); return; }
            const baseUrl = buildAbsoluteScreenAppUrl(window.location.origin, buildPublicScreenPath(uuid));
            const embedUrl = `${baseUrl}?embed=1&hideControls=1`;
            const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen style="border: none;"></iframe>`;
            const globalVars = config.globalVariables ?? [];
            const paramHint = globalVars.length > 0 ? `\n\n可透传参数：\n${globalVars.map(v => `  ?var_${v.key}=值`).join('\n')}` : '';
            const shareInfo = `链接分享：\n${baseUrl}\n\n嵌入代码（iframe）：\n${iframeCode}${paramHint}`;
            const copied = await writeTextToClipboard(baseUrl);
            alert(copied ? `分享链接已复制到剪贴板\n\n${shareInfo}` : shareInfo);
        } catch (err) { console.error('Failed to create public link:', err); alert('创建分享链接失败，请先发布版本'); }
        finally { setIsSharing(false); }
    };

    const handleCreateExploreSession = useCallback(async () => {
        if (!permissions.canRead) { alert('当前无读权限，无法沉淀分析会话'); return; }
        const defaultTitle = `${config.name || '未命名大屏'} 分析会话`;
        const titleInput = window.prompt('会话标题', defaultTitle);
        if (titleInput === null) return;
        const questionInput = window.prompt('问题描述（可选）', `围绕大屏「${config.name || '未命名大屏'}」展开分析`) ?? '';
        const conclusionInput = window.prompt('阶段结论（可选）', '') ?? '';
        const tagsInput = window.prompt('标签（逗号分隔，可选）', '大屏,复盘') ?? '';
        const tags = tagsInput.split(',').map((item) => item.trim()).filter((item) => item.length > 0).slice(0, 20);
        const created = await analyticsApi.createExploreSession({ title: titleInput.trim() || defaultTitle, question: questionInput.trim() || null, conclusion: conclusionInput.trim() || null, tags, steps: buildExploreSessionSteps(config) });
        const createdId = created?.id != null ? `#${created.id}` : '';
        if (createdId && window.confirm(`已创建分析会话 ${createdId}，是否打开会话中心？`)) { navigate('/explore-sessions'); return; }
        alert(`已创建分析会话 ${createdId}`.trim());
    }, [config, navigate, permissions.canRead]);

    const handleBack = () => { navigate('/screens'); };

    const handleCopyUrl = useCallback(async (url: string) => {
        const copied = await writeTextToClipboard(url);
        alert(copied ? '链接已复制到剪贴板' : `复制失败，请手工复制：\n${url}`);
    }, []);

    // --- Export handlers ---
    const { handleExportJson, handleExportPng, handleExportPdf } = useExportHandlers({ id, config, previewDeviceMode });

    // --- Menu action dispatchers ---
    const executeMenuAction = useCallback((action: () => void | Promise<void>) => {
        setActiveMenu(null);
        window.setTimeout(() => { void Promise.resolve(action()).catch((error) => { console.error('Failed to execute header menu action:', error); }); }, 0);
    }, []);

    const executeVersionAction = useCallback(() => {
        if (versionAction === 'history') { if (!permissions.canPublish || isLoadingVersions) return; void executeMenuAction(handleVersionHistory); return; }
        if (!permissions.canRead || isLoadingVersions) return;
        void executeMenuAction(handleVersionCompare);
    }, [executeMenuAction, handleVersionCompare, handleVersionHistory, isLoadingVersions, permissions.canPublish, permissions.canRead, versionAction]);

    const executeExportAction = useCallback(() => {
        if (exportAction === 'json') { void executeMenuAction(handleExportJson); return; }
        if (exportAction === 'pdf') { void executeMenuAction(handleExportPdf); return; }
        void executeMenuAction(handleExportPng);
    }, [executeMenuAction, exportAction, handleExportJson, handleExportPdf, handleExportPng]);

    const canExecuteDesignAction = useMemo(() => {
        if (designAction === 'session') return permissions.canRead;
        if (designAction === 'collaboration') return !!id && permissions.canRead;
        if (designAction === 'template') return permissions.canEdit && !isSavingTemplate;
        return true;
    }, [designAction, id, isSavingTemplate, permissions.canEdit, permissions.canRead]);

    const executeDesignAction = useCallback(() => {
        if (designAction === 'session') { if (!permissions.canRead) return; void executeMenuAction(handleCreateExploreSession); return; }
        if (designAction === 'variables') { void executeMenuAction(() => setShowVariableManager(true)); return; }
        if (designAction === 'interaction') { void executeMenuAction(() => setShowInteractionDebugPanel(true)); return; }
        if (designAction === 'collaboration') { if (!id || !permissions.canRead) return; void executeMenuAction(() => setShowCollaborationPanel(true)); return; }
        if (designAction === 'template') { if (!permissions.canEdit || isSavingTemplate) return; void executeMenuAction(handleSaveAsTemplate); return; }
        if (designAction === 'import') { void executeMenuAction(handleOpenImport); return; }
        void executeMenuAction(() => { setQuickKeyword(''); setShowQuickActions(true); });
    }, [designAction, executeMenuAction, handleCreateExploreSession, handleOpenImport, handleSaveAsTemplate, id, isSavingTemplate, permissions.canEdit, permissions.canRead]);

    const canExecuteGovernanceAction = useMemo(() => {
        if (governanceAction === 'edit-lock') return !!id && permissions.canRead;
        if (governanceAction === 'acl' || governanceAction === 'audit') return !!id && permissions.canManage;
        if (governanceAction === 'share-policy' || governanceAction === 'share-link') return !!id && permissions.canPublish;
        return true;
    }, [governanceAction, id, permissions.canManage, permissions.canPublish, permissions.canRead]);

    const executeGovernanceAction = useCallback(() => {
        if (governanceAction === 'edit-lock') { if (!id || !permissions.canRead) return; void executeMenuAction(() => setShowEditLockPanel(true)); return; }
        if (governanceAction === 'cache') { void executeMenuAction(() => setShowCachePanel(true)); return; }
        if (governanceAction === 'compliance') { void executeMenuAction(() => setShowCompliancePanel(true)); return; }
        if (governanceAction === 'health') { void executeMenuAction(() => setShowHealthPanel(true)); return; }
        if (governanceAction === 'acl') { if (!id || !permissions.canManage) return; void executeMenuAction(() => setShowAclPanel(true)); return; }
        if (governanceAction === 'audit') { if (!id || !permissions.canManage) return; void executeMenuAction(() => setShowAuditPanel(true)); return; }
        if (governanceAction === 'share-policy') { if (!id || !permissions.canPublish) return; void executeMenuAction(() => setShowSharePolicyPanel(true)); return; }
        if (!id || !permissions.canPublish || isSharing) return;
        void executeMenuAction(handleShare);
    }, [executeMenuAction, governanceAction, handleShare, id, isSharing, permissions.canManage, permissions.canPublish, permissions.canRead]);

    const canExecutePrimaryAction = useMemo(() => {
        if (primaryAction === 'preview') return Boolean(id);
        if (primaryAction === 'publish') return Boolean(id) && !isPublishing && permissions.canPublish && !lockedByOther;
        return !isSaving && permissions.canEdit && !lockedByOther;
    }, [id, isPublishing, isSaving, lockedByOther, permissions.canEdit, permissions.canPublish, primaryAction]);

    const executePrimaryAction = useCallback(() => {
        if (primaryAction === 'preview') { handlePreview(); return; }
        if (primaryAction === 'publish') { if (!id || isPublishing || !permissions.canPublish || lockedByOther) return; void handlePublish(); return; }
        if (isSaving || !permissions.canEdit || lockedByOther) return;
        void handleSave();
    }, [handlePreview, handlePublish, handleSave, id, isPublishing, isSaving, lockedByOther, permissions.canEdit, permissions.canPublish, primaryAction]);

    // --- Quick actions ---
    const quickActions = useMemo(() => {
        return [
            { id: 'save', label: isSaving ? '保存中...' : '保存草稿', keywords: 'save 保存 草稿', disabled: isSaving || !permissions.canEdit || lockedByOther, hotkey: 'Ctrl/Cmd + S', run: handleSave },
            { id: 'preview', label: '预览大屏', keywords: 'preview 预览', disabled: !id, hotkey: 'Ctrl/Cmd + Shift + P', run: handlePreview },
            { id: 'publish', label: isPublishing ? '发布中...' : '发布版本', keywords: 'publish 发布 版本', disabled: isPublishing || !permissions.canPublish || lockedByOther || !id, run: handlePublish },
            { id: 'save-template', label: isSavingTemplate ? '模板保存中...' : '保存为模板', keywords: '模板 template 保存', disabled: isSavingTemplate || !permissions.canEdit || lockedByOther, run: handleSaveAsTemplate },
            { id: 'version-history', label: isLoadingVersions ? '版本处理中...' : '版本历史/回滚', keywords: '版本 回滚 history rollback', disabled: isLoadingVersions || !permissions.canPublish || !id, run: handleVersionHistory },
            { id: 'version-compare', label: isLoadingVersions ? '版本处理中...' : '版本对比', keywords: '版本 对比 compare diff', disabled: isLoadingVersions || !permissions.canRead || !id, run: handleVersionCompare },
            { id: 'snapshot', label: '快照与报告', keywords: '快照 截图 定时 报告 snapshot report', disabled: !id, run: () => setShowSnapshotPanel(true) },
            { id: 'variables', label: '变量管理', keywords: '变量 variable', disabled: false, run: () => setShowVariableManager(true) },
            { id: 'cache', label: '缓存观测', keywords: '缓存 cache', disabled: false, run: () => setShowCachePanel(true) },
            { id: 'compliance', label: '合规检查', keywords: '合规 compliance', disabled: false, run: () => setShowCompliancePanel(true) },
            { id: 'health', label: '体检报告', keywords: '体检 健康 health', disabled: false, run: () => setShowHealthPanel(true) },
            { id: 'governance-lock', label: '编辑锁状态', keywords: '编辑锁 lock', disabled: !id || !permissions.canRead, run: () => setShowEditLockPanel(true) },
            { id: 'governance-acl', label: '权限矩阵', keywords: '权限 acl', disabled: !id || !permissions.canManage, run: () => setShowAclPanel(true) },
            { id: 'governance-audit', label: '审计记录', keywords: '审计 audit', disabled: !id || !permissions.canManage, run: () => setShowAuditPanel(true) },
            { id: 'share', label: isSharing ? '分享中...' : '分享链接', keywords: '分享 share 链接', disabled: isSharing || !permissions.canPublish || !id, run: handleShare },
            { id: 'export-png', label: '导出 PNG', keywords: '导出 export png', disabled: false, run: handleExportPng },
            { id: 'export-pdf', label: '导出 PDF', keywords: '导出 export pdf', disabled: false, run: handleExportPdf },
            { id: 'export-json', label: '导出 JSON', keywords: '导出 export json', disabled: false, run: handleExportJson },
            { id: 'command-help', label: '命令面板帮助', keywords: '命令 面板 help 快捷键', disabled: false, hotkey: 'Ctrl/Cmd + K', run: () => alert('可输入关键词，使用 ↑/↓ 选择，Enter 执行。') },
        ];
    }, [handleExportJson, handleExportPdf, handleExportPng, handlePreview, handlePublish, handleSave, handleSaveAsTemplate, handleShare, handleVersionCompare, handleVersionHistory, id, isPublishing, isSaving, isSavingTemplate, isSharing, isLoadingVersions, lockedByOther, permissions.canEdit, permissions.canManage, permissions.canPublish, permissions.canRead]);

    const quickRecentOrder = useMemo(() => {
        const mapping = new Map<string, number>();
        quickRecentIds.forEach((rid, index) => { mapping.set(rid, index); });
        return mapping;
    }, [quickRecentIds]);

    const filteredQuickActions = useMemo(() => {
        const keyword = quickKeyword.trim().toLowerCase();
        const matched = keyword
            ? quickActions.filter((item) => { const label = item.label.toLowerCase(); const extra = String(item.keywords || '').toLowerCase(); const hotkey = String(item.hotkey || '').toLowerCase(); return label.includes(keyword) || extra.includes(keyword) || hotkey.includes(keyword); })
            : quickActions.slice();
        return matched.sort((a, b) => {
            const aRecent = quickRecentOrder.has(a.id) ? quickRecentOrder.get(a.id)! : Number.MAX_SAFE_INTEGER;
            const bRecent = quickRecentOrder.has(b.id) ? quickRecentOrder.get(b.id)! : Number.MAX_SAFE_INTEGER;
            if (aRecent !== bRecent) return aRecent - bRecent;
            return a.label.toLowerCase().localeCompare(b.label.toLowerCase(), 'zh-CN');
        });
    }, [quickActions, quickKeyword, quickRecentOrder]);

    const runQuickAction = useCallback((actionId: string, action: () => void | Promise<void>) => {
        setShowQuickActions(false);
        setQuickKeyword('');
        setQuickActiveIndex(-1);
        setActiveMenu(null);
        setQuickRecentIds((prev) => [actionId, ...prev.filter((item) => item !== actionId)].slice(0, 8));
        window.setTimeout(() => { void Promise.resolve(action()).catch((error) => { console.error('Failed to run quick action:', error); }); }, 0);
    }, []);

    // Quick action focus/scroll/keyboard effects
    useEffect(() => {
        if (!showQuickActions) return;
        setQuickActiveIndex((prev) => {
            const firstEnabled = filteredQuickActions.findIndex((item) => !item.disabled);
            if (firstEnabled < 0) return -1;
            if (prev >= 0 && prev < filteredQuickActions.length && !filteredQuickActions[prev]?.disabled) return prev;
            return firstEnabled;
        });
    }, [filteredQuickActions, showQuickActions]);

    useEffect(() => { if (!showQuickActions || quickActiveIndex < 0) return; quickActionRefs.current[quickActiveIndex]?.scrollIntoView({ block: 'nearest' }); }, [quickActiveIndex, showQuickActions]);

    useEffect(() => {
        if (!showQuickActions) return;
        const timer = window.setTimeout(() => { quickInputRef.current?.focus(); quickInputRef.current?.select(); }, 0);
        return () => window.clearTimeout(timer);
    }, [showQuickActions]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const hotkey = event.ctrlKey || event.metaKey;
            if (hotkey && event.key.toLowerCase() === 'k') { if (isTypingTarget(event.target)) return; event.preventDefault(); setShowQuickActions((prev) => { const next = !prev; if (next) { setQuickKeyword(''); setQuickActiveIndex(-1); } return next; }); return; }
            if (event.key === 'Escape' && showQuickActions) { event.preventDefault(); setShowQuickActions(false); setQuickActiveIndex(-1); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showQuickActions]);

    return {
        id, navigate, state, dispatch, config, updateConfig, loadConfig, selectComponents, isSaving, clipboard,
        isEditingName, nameValue, setNameValue, handleNameClick, handleNameBlur, handleNameKeyDown,
        showVariableManager, setShowVariableManager, showCachePanel, setShowCachePanel,
        showCompliancePanel, setShowCompliancePanel, showHealthPanel, setShowHealthPanel,
        showAclPanel, setShowAclPanel, showAuditPanel, setShowAuditPanel,
        showSharePolicyPanel, setShowSharePolicyPanel, showInteractionDebugPanel, setShowInteractionDebugPanel,
        showCollaborationPanel, setShowCollaborationPanel, showEditLockPanel, setShowEditLockPanel,
        showConflictPanel, setShowConflictPanel,
        showVersionComparePanel, setShowVersionComparePanel, showVersionComparePicker, setShowVersionComparePicker,
        showVersionRollbackPanel, setShowVersionRollbackPanel, showVersionHistoryPanel, setShowVersionHistoryPanel,
        showSnapshotPanel, setShowSnapshotPanel, showLinkageGraph, setShowLinkageGraph,
        showQuickActions, setShowQuickActions,
        quickKeyword, setQuickKeyword, quickActiveIndex, setQuickActiveIndex,
        quickInputRef, quickActionRefs, quickRecentOrder, filteredQuickActions, runQuickAction,
        activeMenu, setActiveMenu, menuContainerRef,
        batchAction, setBatchAction, canExecuteBatch, executeBatchAction,
        themeApplyMode, setThemeApplyMode, themeInputRef,
        handleToolbarThemeChange, applyThemeToAllComponents, handleZoomReset, handleZoomFit, handleShortcutHelp,
        handleExportThemePack, handleImportThemePackClick, handleThemePackFileChange,
        selectedIds, showGrid, zoom,
        designAction, setDesignAction, canExecuteDesignAction, executeDesignAction,
        governanceAction, setGovernanceAction, canExecuteGovernanceAction, executeGovernanceAction,
        versionAction, setVersionAction, executeVersionAction,
        exportAction, setExportAction, executeExportAction,
        toolsSection, setToolsSection, previewDeviceMode, setPreviewDeviceMode,
        primaryAction, setPrimaryAction, canExecutePrimaryAction, executePrimaryAction,
        handleSave, handlePublish, handlePreview, handleShare, handleSaveAsTemplate, isSavingTemplate, handleBack,
        isLoadingVersions, versionCandidates, versionDiff,
        handleVersionHistory, handleVersionCompare, handleConfirmVersionRollback, handleConfirmVersionCompare,
        conflictLoading, lastConflict, handleReloadLatestDraft,
        editLock, setEditLock, lockErrorText, setLockErrorText, lockedByOther, lockOwnerText,
        publishNotice, setPublishNotice, publishNoticeDismissed, setPublishNoticeDismissed,
        permissions, isPublishing, isSharing, cycleWarnings,
        importInputRef, handleImportJson, handleOpenImport,
        handleExportJson, handleExportPng, handleExportPdf,
        handleCopyUrl, executeMenuAction, handleCreateExploreSession,
    };
}
