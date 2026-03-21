import { useState, useCallback } from 'react';
import {
    analyticsApi,
    type ScreenDetail,
    type ScreenVersion,
    type ScreenVersionDiff,
} from '../../../../../api/analyticsApi';

export function useVersionHandlers({
    id,
    handleLockHttpError,
    applyScreenDetail,
}: {
    id: string | undefined;
    handleLockHttpError: (error: unknown, fallbackMessage: string) => string;
    applyScreenDetail: (screen: ScreenDetail) => void;
}) {
    const [isLoadingVersions, setIsLoadingVersions] = useState(false);
    const [versionCandidates, setVersionCandidates] = useState<ScreenVersion[]>([]);
    const [versionDiff, setVersionDiff] = useState<ScreenVersionDiff | null>(null);
    const [showVersionHistoryPanel, setShowVersionHistoryPanel] = useState(false);
    const [showVersionComparePanel, setShowVersionComparePanel] = useState(false);
    const [showVersionComparePicker, setShowVersionComparePicker] = useState(false);
    const [showVersionRollbackPanel, setShowVersionRollbackPanel] = useState(false);

    const handleVersionHistory = useCallback(async () => {
        if (!id || isLoadingVersions) return;
        setIsLoadingVersions(true);
        try {
            const versions = await analyticsApi.listScreenVersions(id);
            if (!versions.length) { alert('当前没有已发布版本'); return; }
            setVersionCandidates(versions);
            setShowVersionHistoryPanel(true);
        } catch (error) {
            console.error('Failed to load version history:', error);
            const message = handleLockHttpError(error, '加载版本历史失败');
            alert(message);
        } finally {
            setIsLoadingVersions(false);
        }
    }, [handleLockHttpError, id, isLoadingVersions]);

    const handleConfirmVersionRollback = useCallback(async (versionId: string) => {
        if (!id) return;
        if (!window.confirm(`确认回滚到版本 ID=${versionId} 吗？`)) return;
        setIsLoadingVersions(true);
        try {
            const result = await analyticsApi.rollbackScreenVersion(id, versionId);
            if (result?.screen) applyScreenDetail(result.screen);
            setShowVersionRollbackPanel(false);
            alert('回滚成功，已切换草稿与发布版本');
        } catch (error) {
            console.error('Failed to rollback version:', error);
            const message = handleLockHttpError(error, '回滚失败');
            alert(message);
        } finally {
            setIsLoadingVersions(false);
        }
    }, [applyScreenDetail, handleLockHttpError, id]);

    const handleVersionCompare = useCallback(async () => {
        if (!id || isLoadingVersions) return;
        setIsLoadingVersions(true);
        try {
            const versions = await analyticsApi.listScreenVersions(id);
            if (!versions || versions.length < 2) { alert('至少需要两个版本才能对比'); return; }
            setVersionCandidates(versions);
            setShowVersionComparePicker(true);
        } catch (error) {
            console.error('Failed to compare versions:', error);
            alert('版本对比失败');
        } finally {
            setIsLoadingVersions(false);
        }
    }, [id, isLoadingVersions]);

    const handleConfirmVersionCompare = useCallback(async (fromVersionId: string, toVersionId: string) => {
        if (!id) return;
        setIsLoadingVersions(true);
        try {
            const diff = await analyticsApi.compareScreenVersions(id, fromVersionId, toVersionId);
            setVersionDiff(diff);
            setShowVersionComparePicker(false);
            setShowVersionComparePanel(true);
        } catch (error) {
            console.error('Failed to compare versions:', error);
            alert('版本对比失败');
        } finally {
            setIsLoadingVersions(false);
        }
    }, [id]);

    return {
        isLoadingVersions,
        versionCandidates,
        versionDiff,
        showVersionHistoryPanel, setShowVersionHistoryPanel,
        showVersionComparePanel, setShowVersionComparePanel,
        showVersionComparePicker, setShowVersionComparePicker,
        showVersionRollbackPanel, setShowVersionRollbackPanel,
        handleVersionHistory,
        handleConfirmVersionRollback,
        handleVersionCompare,
        handleConfirmVersionCompare,
    };
}
