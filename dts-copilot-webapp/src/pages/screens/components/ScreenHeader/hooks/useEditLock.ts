import { useState, useCallback, useEffect } from 'react';
import {
    analyticsApi,
    HttpError,
    type ScreenEditLock,
} from '../../../../../api/analyticsApi';

export function useEditLock({
    id,
    permissions,
}: {
    id: string | undefined;
    permissions: { canRead: boolean; canEdit: boolean };
}) {
    const [editLock, setEditLock] = useState<ScreenEditLock | null>(null);
    const [lockErrorText, setLockErrorText] = useState<string | null>(null);

    const lockedByOther = !!(editLock?.active && !editLock?.mine);
    const lockOwnerText = String(editLock?.ownerName || editLock?.ownerId || '其他用户');

    const refreshLockState = useCallback(async () => {
        if (!id || !permissions.canRead) { setEditLock(null); return; }
        try {
            const lock = await analyticsApi.getScreenEditLock(id);
            setEditLock(lock);
            if (!lock?.active || lock.mine) setLockErrorText(null);
        } catch { /* keep lock workflow non-blocking */ }
    }, [id, permissions.canRead]);

    // Initial fetch
    useEffect(() => {
        if (!id || !permissions.canRead) { setEditLock(null); return; }
        void refreshLockState();
    }, [id, permissions.canRead, refreshLockState]);

    // Acquire lock
    useEffect(() => {
        if (!id || !permissions.canEdit) return;
        let cancelled = false;
        const bootstrap = async () => {
            try {
                const lock = await analyticsApi.acquireScreenEditLock(id, { ttlSeconds: 120 });
                if (!cancelled) { setEditLock(lock); setLockErrorText(null); }
            } catch (error) {
                if (cancelled) return;
                if (error instanceof HttpError) {
                    try {
                        const payload = JSON.parse(error.bodyText) as { lock?: ScreenEditLock; message?: string };
                        if (payload?.lock) setEditLock(payload.lock); else void refreshLockState();
                        setLockErrorText(payload?.message || error.message);
                    } catch { setLockErrorText(error.message); void refreshLockState(); }
                } else {
                    setLockErrorText(error instanceof Error ? error.message : '编辑锁申请失败');
                    void refreshLockState();
                }
            }
        };
        bootstrap();
        return () => { cancelled = true; };
    }, [id, permissions.canEdit, refreshLockState]);

    // Heartbeat when we hold the lock
    useEffect(() => {
        if (!id || !permissions.canEdit || !editLock?.mine) return;
        const timer = window.setInterval(async () => {
            try { const lock = await analyticsApi.heartbeatScreenEditLock(id, { ttlSeconds: 120 }); setEditLock(lock); }
            catch { await refreshLockState(); }
        }, 45000);
        return () => window.clearInterval(timer);
    }, [id, permissions.canEdit, editLock?.mine, refreshLockState]);

    // Poll when someone else holds the lock
    useEffect(() => {
        if (!id || !permissions.canRead || editLock?.mine) return;
        const timer = window.setInterval(() => { void refreshLockState(); }, 30000);
        return () => window.clearInterval(timer);
    }, [id, permissions.canRead, editLock?.mine, refreshLockState]);

    // Release on unload
    useEffect(() => {
        if (!id) return;
        const release = () => { if (editLock?.mine) void analyticsApi.releaseScreenEditLock(id).catch(() => undefined); };
        window.addEventListener('beforeunload', release);
        return () => { window.removeEventListener('beforeunload', release); release(); };
    }, [id, editLock?.mine]);

    // Handle lock-related HTTP errors
    const handleLockHttpError = useCallback((error: unknown, fallbackMessage: string): { message: string; showPanel: boolean } => {
        if (error instanceof HttpError && error.code === 'SCREEN_EDIT_LOCKED') {
            let detail = fallbackMessage;
            try {
                const payload = JSON.parse(error.bodyText) as { message?: string; lock?: ScreenEditLock };
                if (payload?.lock) {
                    setEditLock(payload.lock);
                    const owner = String(payload.lock.ownerName || payload.lock.ownerId || '其他用户');
                    detail = `当前由 ${owner} 持有编辑锁，请稍后重试`;
                } else {
                    void refreshLockState();
                }
                setLockErrorText(payload?.message || detail);
            } catch {
                setLockErrorText(error.message);
                void refreshLockState();
                detail = error.message || fallbackMessage;
            }
            return { message: detail, showPanel: true };
        }
        if (error instanceof Error && error.message) return { message: error.message, showPanel: false };
        return { message: fallbackMessage, showPanel: false };
    }, [refreshLockState]);

    return {
        editLock,
        setEditLock,
        lockErrorText,
        setLockErrorText,
        lockedByOther,
        lockOwnerText,
        refreshLockState,
        handleLockHttpError,
    };
}
