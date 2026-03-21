import type { ScreenTheme, ScreenConfig } from '../../types';

export type PublishNotice = {
    screenId: string | number;
    versionNo: number | string;
    previewUrl: string;
    publicUrl: string | null;
    warmupText?: string;
};

export type QuickActionItem = {
    id: string;
    label: string;
    keywords: string;
    disabled: boolean;
    hotkey?: string;
    run: () => void | Promise<void>;
};

export const DESIGN_ACTION_STORAGE_KEY = 'dts.analytics.screen.header.designAction';
export const GOVERNANCE_ACTION_STORAGE_KEY = 'dts.analytics.screen.header.governanceAction';
export const VERSION_ACTION_STORAGE_KEY = 'dts.analytics.screen.header.versionAction';
export const EXPORT_ACTION_STORAGE_KEY = 'dts.analytics.screen.header.exportAction';
export const QUICK_ACTION_RECENT_STORAGE_KEY = 'dts.analytics.screen.header.quickRecentActions';
export const PRIMARY_ACTION_STORAGE_KEY = 'dts.analytics.screen.header.primaryAction';
export const TOOLS_SECTION_STORAGE_KEY = 'dts.analytics.screen.header.toolsSection';

export const THEME_OPTIONS: { value: ScreenTheme | ''; label: string }[] = [
    { value: '', label: '经典深蓝' },
    { value: 'titanium', label: '钛合金灰' },
    { value: 'glacier', label: '冰川白' },
];

export const BATCH_ACTION_OPTIONS = [
    { value: 'duplicate', label: '复制一份' },
    { value: 'copy', label: '复制' },
    { value: 'paste', label: '粘贴' },
    { value: 'delete', label: '删除' },
    { value: 'bring-top', label: '置于顶层' },
    { value: 'send-bottom', label: '置于底层' },
    { value: 'show', label: '显示' },
    { value: 'hide', label: '隐藏' },
    { value: 'lock', label: '锁定' },
    { value: 'unlock', label: '解锁' },
] as const;

export type BatchAction = typeof BATCH_ACTION_OPTIONS[number]['value'];

export interface ScreenHeaderProps {
    focusMode?: boolean;
    onToggleFocusMode?: () => void;
    showLibraryPanel?: boolean;
    onToggleLibraryPanel?: () => void;
    showInspectorPanel?: boolean;
    onToggleInspectorPanel?: () => void;
}

export function findNextEnabledQuickActionIndex(
    actions: QuickActionItem[],
    startIndex: number,
    direction: 1 | -1,
): number {
    if (actions.length === 0) {
        return -1;
    }
    let cursor = startIndex;
    for (let step = 0; step < actions.length; step += 1) {
        cursor = (cursor + direction + actions.length) % actions.length;
        if (!actions[cursor]?.disabled) {
            return cursor;
        }
    }
    return -1;
}

export function buildPublishNoticeStorageKey(screenId: string | number): string {
    return `dts.analytics.screen.publishNotice.${screenId}`;
}

export function buildExploreSessionSteps(config: ScreenConfig): Array<Record<string, unknown>> {
    const now = new Date().toISOString();
    const componentOutline = [...(config.components ?? [])]
        .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
        .slice(0, 20)
        .map((item) => ({
            id: item.id,
            type: item.type,
            name: item.name,
            visible: item.visible !== false,
            dataSourceType: item.dataSource?.sourceType ?? item.dataSource?.type ?? 'static',
        }));
    return [
        {
            at: now,
            title: '大屏快照',
            type: 'screen_snapshot',
            params: {
                screenId: config.id || null,
                screenName: config.name || null,
                width: config.width,
                height: config.height,
                theme: config.theme || null,
                componentCount: config.components?.length ?? 0,
                globalVariableCount: config.globalVariables?.length ?? 0,
            },
        },
        {
            at: now,
            title: '关键组件概览',
            type: 'component_outline',
            params: {
                components: componentOutline,
            },
        },
    ];
}

export function buildComponentConflictMeta(baseline: ScreenConfig): Record<string, unknown> {
    const baseComponents = (baseline.components ?? []).map((item) => ({
        id: item.id,
        component: item,
    }));
    return {
        mode: 'component',
        baseUpdatedAt: baseline.updatedAt || null,
        baseScreen: {
            name: baseline.name ?? null,
            description: baseline.description ?? null,
            width: baseline.width,
            height: baseline.height,
            backgroundColor: baseline.backgroundColor ?? null,
            backgroundImage: baseline.backgroundImage ?? null,
            theme: baseline.theme ?? null,
        },
        baseComponents,
        baseVariables: baseline.globalVariables ?? [],
    };
}
