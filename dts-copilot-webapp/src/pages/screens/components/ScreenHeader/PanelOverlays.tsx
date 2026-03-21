import { GlobalVariableManager } from '../GlobalVariableManager';
import { CacheObservabilityPanel } from '../CacheObservabilityPanel';
import { ScreenCompliancePanel } from '../ScreenCompliancePanel';
import { ScreenAclPanel } from '../ScreenAclPanel';
import { ScreenAuditPanel } from '../ScreenAuditPanel';
import { ScreenSharePolicyPanel } from '../ScreenSharePolicyPanel';
import { ScreenHealthPanel } from '../ScreenHealthPanel';
import { InteractionDebugPanel } from '../InteractionDebugPanel';
import { ScreenCollaborationPanel } from '../ScreenCollaborationPanel';
import { ScreenEditLockPanel } from '../ScreenEditLockPanel';
import { ScreenConflictPanel, type ScreenUpdateConflict } from '../ScreenConflictPanel';
import { ScreenVersionComparePanel } from '../ScreenVersionComparePanel';
import { ScreenVersionComparePickerPanel } from '../ScreenVersionComparePickerPanel';
import { ScreenVersionRollbackPanel } from '../ScreenVersionRollbackPanel';
import { VersionHistoryPanel } from '../VersionHistoryPanel';
import { ScreenSnapshotPanel } from '../ScreenSnapshotPanel';
import { LinkageGraphPanel } from '../LinkageGraphPanel';
import type { ScreenEditLock, ScreenVersion, ScreenVersionDiff } from '../../../../api/analyticsApi';
import type { ScreenConfig } from '../../types';

interface PanelOverlaysProps {
    id: string | undefined;
    config: ScreenConfig;
    selectedIds: string[];
    selectComponents: (ids: string[]) => void;
    updateConfig: (partial: Partial<ScreenConfig>) => void;
    cycleWarnings: string[];
    // Panel visibility
    showVariableManager: boolean;
    setShowVariableManager: (v: boolean) => void;
    showCachePanel: boolean;
    setShowCachePanel: (v: boolean) => void;
    showCompliancePanel: boolean;
    setShowCompliancePanel: (v: boolean) => void;
    showHealthPanel: boolean;
    setShowHealthPanel: (v: boolean) => void;
    showAclPanel: boolean;
    setShowAclPanel: (v: boolean) => void;
    showAuditPanel: boolean;
    setShowAuditPanel: (v: boolean) => void;
    showSharePolicyPanel: boolean;
    setShowSharePolicyPanel: (v: boolean) => void;
    showInteractionDebugPanel: boolean;
    setShowInteractionDebugPanel: (v: boolean) => void;
    showCollaborationPanel: boolean;
    setShowCollaborationPanel: (v: boolean) => void;
    showEditLockPanel: boolean;
    setShowEditLockPanel: (v: boolean) => void;
    showConflictPanel: boolean;
    setShowConflictPanel: (v: boolean) => void;
    showVersionComparePanel: boolean;
    setShowVersionComparePanel: (v: boolean) => void;
    showVersionComparePicker: boolean;
    setShowVersionComparePicker: (v: boolean) => void;
    showVersionRollbackPanel: boolean;
    setShowVersionRollbackPanel: (v: boolean) => void;
    showVersionHistoryPanel: boolean;
    setShowVersionHistoryPanel: (v: boolean) => void;
    showSnapshotPanel: boolean;
    setShowSnapshotPanel: (v: boolean) => void;
    showLinkageGraph: boolean;
    setShowLinkageGraph: (v: boolean) => void;
    // Data
    editLock: ScreenEditLock | null;
    setEditLock: (lock: ScreenEditLock | null) => void;
    setLockErrorText: (text: string | null) => void;
    lastConflict: ScreenUpdateConflict | null;
    conflictLoading: boolean;
    handleReloadLatestDraft: () => Promise<void>;
    versionDiff: ScreenVersionDiff | null;
    versionCandidates: ScreenVersion[];
    isLoadingVersions: boolean;
    handleConfirmVersionRollback: (versionId: string) => Promise<void>;
    handleConfirmVersionCompare: (fromVersionId: string, toVersionId: string) => Promise<void>;
}

export function PanelOverlays(props: PanelOverlaysProps) {
    const {
        id, config, selectedIds, selectComponents, updateConfig, cycleWarnings,
        showVariableManager, setShowVariableManager,
        showCachePanel, setShowCachePanel,
        showCompliancePanel, setShowCompliancePanel,
        showHealthPanel, setShowHealthPanel,
        showAclPanel, setShowAclPanel,
        showAuditPanel, setShowAuditPanel,
        showSharePolicyPanel, setShowSharePolicyPanel,
        showInteractionDebugPanel, setShowInteractionDebugPanel,
        showCollaborationPanel, setShowCollaborationPanel,
        showEditLockPanel, setShowEditLockPanel,
        showConflictPanel, setShowConflictPanel,
        showVersionComparePanel, setShowVersionComparePanel,
        showVersionComparePicker, setShowVersionComparePicker,
        showVersionRollbackPanel, setShowVersionRollbackPanel,
        showVersionHistoryPanel, setShowVersionHistoryPanel,
        showSnapshotPanel, setShowSnapshotPanel,
        showLinkageGraph, setShowLinkageGraph,
        editLock, setEditLock, setLockErrorText,
        lastConflict, conflictLoading, handleReloadLatestDraft,
        versionDiff, versionCandidates, isLoadingVersions,
        handleConfirmVersionRollback, handleConfirmVersionCompare,
    } = props;

    return (
        <>
            <GlobalVariableManager
                open={showVariableManager}
                variables={config.globalVariables ?? []}
                cycleWarnings={cycleWarnings}
                onClose={() => setShowVariableManager(false)}
                onChange={(next) => updateConfig({ globalVariables: next })}
            />

            <InteractionDebugPanel
                open={showInteractionDebugPanel}
                cycleWarnings={cycleWarnings}
                onClose={() => setShowInteractionDebugPanel(false)}
            />

            <CacheObservabilityPanel
                open={showCachePanel}
                onClose={() => setShowCachePanel(false)}
            />

            <ScreenCompliancePanel
                open={showCompliancePanel}
                screenId={id}
                onClose={() => setShowCompliancePanel(false)}
            />

            <ScreenHealthPanel
                open={showHealthPanel}
                screenId={id}
                onClose={() => setShowHealthPanel(false)}
            />

            <ScreenAclPanel
                open={showAclPanel}
                screenId={id}
                onClose={() => setShowAclPanel(false)}
            />

            <ScreenAuditPanel
                open={showAuditPanel}
                screenId={id}
                onClose={() => setShowAuditPanel(false)}
            />

            <ScreenCollaborationPanel
                open={showCollaborationPanel}
                screenId={id}
                components={config.components ?? []}
                selectedIds={selectedIds ?? []}
                onLocateComponent={(componentId) => {
                    const target = String(componentId || '').trim();
                    if (!target) return;
                    const exists = (config.components ?? []).some((item) => item.id === target);
                    if (exists) {
                        selectComponents([target]);
                    }
                }}
                onClose={() => setShowCollaborationPanel(false)}
            />

            <ScreenEditLockPanel
                open={showEditLockPanel}
                screenId={id}
                lock={editLock}
                onChange={(next) => {
                    setEditLock(next);
                    if (!next?.active || next.mine) {
                        setLockErrorText(null);
                    }
                }}
                onClose={() => setShowEditLockPanel(false)}
            />

            <ScreenConflictPanel
                open={showConflictPanel}
                conflict={lastConflict}
                loading={conflictLoading}
                onClose={() => setShowConflictPanel(false)}
                onReloadLatest={handleReloadLatestDraft}
                onSelectConflictComponents={(ids) => {
                    const idSet = new Set((config.components ?? []).map((item) => item.id));
                    const filtered = ids.filter((item) => idSet.has(item));
                    selectComponents(filtered);
                }}
            />

            <ScreenVersionComparePanel
                open={showVersionComparePanel}
                diff={versionDiff}
                onClose={() => setShowVersionComparePanel(false)}
            />

            <ScreenVersionComparePickerPanel
                open={showVersionComparePicker}
                versions={versionCandidates}
                loading={isLoadingVersions}
                onClose={() => setShowVersionComparePicker(false)}
                onCompare={handleConfirmVersionCompare}
            />

            <ScreenVersionRollbackPanel
                open={showVersionRollbackPanel}
                versions={versionCandidates}
                loading={isLoadingVersions}
                onClose={() => setShowVersionRollbackPanel(false)}
                onRollback={handleConfirmVersionRollback}
            />

            <VersionHistoryPanel
                open={showVersionHistoryPanel}
                versions={versionCandidates}
                currentConfig={config}
                loading={isLoadingVersions}
                onClose={() => setShowVersionHistoryPanel(false)}
                onRollback={handleConfirmVersionRollback}
                onCompare={handleConfirmVersionCompare}
            />

            <ScreenSnapshotPanel
                open={showSnapshotPanel}
                screenId={id}
                onClose={() => setShowSnapshotPanel(false)}
            />

            <ScreenSharePolicyPanel
                open={showSharePolicyPanel}
                screenId={id}
                onClose={() => setShowSharePolicyPanel(false)}
            />

            {showLinkageGraph && (
                <LinkageGraphPanel
                    config={config}
                    selectedIds={selectedIds}
                    onClose={() => setShowLinkageGraph(false)}
                />
            )}
        </>
    );
}
