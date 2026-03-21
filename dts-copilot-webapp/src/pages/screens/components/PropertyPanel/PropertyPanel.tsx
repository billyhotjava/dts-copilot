import { useEffect, useState } from 'react';
import { useScreen } from '../../ScreenContext';
import type {
    ComponentType,
    DataSourceConfig,
    ScreenComponent,
} from '../../types';
import { CardIdPicker } from '../CardIdPicker';
import { getRendererPlugin } from '../../plugins/registry';
import { readComponentPluginMeta, resolveRuntimePluginId } from '../../plugins/runtime';
import { useScreenPluginRuntime } from '../../plugins/useScreenPluginRuntime';
import { wouldCreateParentCycle } from '../../componentHierarchy';
import { analyticsApi } from '../../../../api/analyticsApi';
import { writeTextToClipboard } from '../../../../hooks/clipboard';
import {
    CHART_COMPONENT_TYPES,
    applyChartPresetConfig,
    isChartComponentType,
    type ChartPreset,
} from '../../chartPresets';
import { FieldMappingPanel, isMappable } from '../FieldMappingPanel';
import type { FieldMapping } from '../../types';
import {
    STYLE_CLIPBOARD_KEY,
    LAYOUT_CLIPBOARD_KEY,
    PROPERTY_SECTION_COLLAPSE_KEY,
    PROPERTY_COMPONENT_MODE_KEY,
    PROPERTY_PANEL_DENSITY_KEY,
    PROPERTY_SECTION_KEYS,
    PROPERTY_FOCUS_SECTION_KEYS,
    PROPERTY_SECTION_ESSENTIAL_COLLAPSED,
    buildStyleClipboardPayload,
    resolveTabSwitcherOptionValues,
    resolveDataSourceType,
    resolveExplainCardId,
    serializeVisibilityMatchValues,
    parseVisibilityMatchValues,
    type ExplainState,
    type StyleClipboardPayload,
    type LayoutClipboardPayload,
} from './PropertyPanelConstants';
import { renderQuickChartConfig } from './QuickChartConfig';
import { renderPluginSchemaFields } from './PluginSchemaFields';
import { renderComponentConfig } from './ComponentConfig';
import { renderDataSourceConfig } from './DataSourceConfig';
import { renderInteractionConfig, renderActionConfig } from './InteractionConfig';
import { renderDrillDownConfig } from './DrillDownConfig';
import { ChartAnnotationConfig } from './SpecializedConfigs';

export function PropertyPanel() {
    const {
        state,
        updateComponent,
        updateConfig,
        updateSelectedComponents,
        deleteComponents,
        alignSelected,
        distributeSelected,
        groupSelected,
        ungroupSelected,
    } = useScreen();
    const { config, selectedIds } = state;
    useScreenPluginRuntime();
    const [explainState, setExplainState] = useState<ExplainState | null>(null);
    const [panelFilter, setPanelFilter] = useState('');
    const [styleClipboard, setStyleClipboard] = useState<StyleClipboardPayload | null>(null);
    const [layoutClipboard, setLayoutClipboard] = useState<LayoutClipboardPayload | null>(null);
    const [componentConfigMode, setComponentConfigMode] = useState<'quick' | 'advanced'>(() => {
        if (typeof window === 'undefined') {
            return 'quick';
        }
        try {
            const raw = window.localStorage.getItem(PROPERTY_COMPONENT_MODE_KEY);
            return raw === 'advanced' ? 'advanced' : 'quick';
        } catch {
            return 'quick';
        }
    });
    const [quickActionMode, setQuickActionMode] = useState<'core' | 'layout' | 'nudge' | 'clipboard' | 'all'>('core');
    const [panelDensity, setPanelDensity] = useState<'focus' | 'full'>(() => {
        if (typeof window === 'undefined') {
            return 'focus';
        }
        try {
            const raw = window.localStorage.getItem(PROPERTY_PANEL_DENSITY_KEY);
            return raw === 'full' ? 'full' : 'focus';
        } catch {
            return 'focus';
        }
    });
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

    const selectedComponents = config.components.filter((c) => selectedIds.includes(c.id));
    const selectedComponent = selectedIds.length === 1
        ? config.components.find((c) => c.id === selectedIds[0])
        : null;

    useEffect(() => {
        setExplainState(null);
    }, [selectedComponent?.id]);
    useEffect(() => {
        if (!selectedComponent) return;
        if (!CHART_COMPONENT_TYPES.has(selectedComponent.type)) {
            if (componentConfigMode !== 'advanced') {
                setComponentConfigMode('advanced');
            }
            return;
        }
    }, [componentConfigMode, selectedComponent?.id, selectedComponent?.type]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(PROPERTY_COMPONENT_MODE_KEY, componentConfigMode);
        } catch {
            // ignore storage failure
        }
    }, [componentConfigMode]);
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(PROPERTY_PANEL_DENSITY_KEY, panelDensity);
        } catch {
            // ignore storage failure
        }
    }, [panelDensity]);
    useEffect(() => {
        try {
            const raw = localStorage.getItem(PROPERTY_SECTION_COLLAPSE_KEY);
            if (!raw) {
                setCollapsedSections([...PROPERTY_SECTION_ESSENTIAL_COLLAPSED]);
                return;
            }
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) {
                setCollapsedSections([...PROPERTY_SECTION_ESSENTIAL_COLLAPSED]);
                return;
            }
            setCollapsedSections(parsed.filter((item) => typeof item === 'string'));
        } catch {
            setCollapsedSections([...PROPERTY_SECTION_ESSENTIAL_COLLAPSED]);
        }
    }, []);
    useEffect(() => {
        try {
            localStorage.setItem(PROPERTY_SECTION_COLLAPSE_KEY, JSON.stringify(collapsedSections));
        } catch {
            // ignore storage failure
        }
    }, [collapsedSections]);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STYLE_CLIPBOARD_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as StyleClipboardPayload;
            if (!parsed || typeof parsed !== 'object' || !parsed.type || !parsed.config) return;
            setStyleClipboard(parsed);
        } catch {
            // ignore invalid cache
        }
    }, []);
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(LAYOUT_CLIPBOARD_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as LayoutClipboardPayload;
            if (!parsed || typeof parsed !== 'object') return;
            if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return;
            if (!Number.isFinite(parsed.width) || !Number.isFinite(parsed.height)) return;
            setLayoutClipboard(parsed);
        } catch {
            // ignore invalid cache
        }
    }, []);

    const persistStyleClipboard = (payload: StyleClipboardPayload | null) => {
        setStyleClipboard(payload);
        try {
            if (!payload) {
                sessionStorage.removeItem(STYLE_CLIPBOARD_KEY);
                return;
            }
            sessionStorage.setItem(STYLE_CLIPBOARD_KEY, JSON.stringify(payload));
        } catch {
            // ignore storage failure
        }
    };
    const persistLayoutClipboard = (payload: LayoutClipboardPayload | null) => {
        setLayoutClipboard(payload);
        try {
            if (!payload) {
                sessionStorage.removeItem(LAYOUT_CLIPBOARD_KEY);
                return;
            }
            sessionStorage.setItem(LAYOUT_CLIPBOARD_KEY, JSON.stringify(payload));
        } catch {
            // ignore storage failure
        }
    };

    if (selectedComponents.length === 0) {
        return (
            <div className="property-panel property-panel--empty">
                <div className="property-panel-header">
                    <h3>属性</h3>
                    <p className="property-panel-subtitle">从画布选择一个组件后，这里会展示它的配置、数据和交互能力。</p>
                </div>
                <div className="property-panel-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">🎨</div>
                        <div className="empty-state-text">选择组件以编辑属性</div>
                        <div className="empty-state-hint">点击画布中的组件进行选择</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedComponent) {
        const total = selectedComponents.length;
        const allLocked = selectedComponents.every((item) => item.locked);
        const allVisible = selectedComponents.every((item) => item.visible);
        const grouped = selectedComponents.filter((item) => Boolean(item.groupId)).length;
        const primarySelected = selectedComponents[0];
        return (
            <div className="property-panel property-panel--batch">
                <div className="property-panel-header">
                    <h3>批量属性 ({total})</h3>
                    <p className="property-panel-subtitle">
                        统一处理 {primarySelected?.type || 'selected'} 组件。
                        {grouped > 0 ? ` 当前包含 ${grouped} 个已编组组件。` : ''}
                    </p>
                </div>
                <div className="property-panel-content">
                    <div className="property-section">
                        <div className="property-section-title">批量设置</div>
                        <div className="property-row">
                            <label className="property-label">宽度</label>
                            <input
                                type="number"
                                className="property-input"
                                min={50}
                                onChange={(e) => updateSelectedComponents({ width: Math.max(50, Number(e.target.value) || 50) })}
                                placeholder="统一宽度"
                            />
                        </div>
                        <div className="property-row">
                            <label className="property-label">高度</label>
                            <input
                                type="number"
                                className="property-input"
                                min={50}
                                onChange={(e) => updateSelectedComponents({ height: Math.max(50, Number(e.target.value) || 50) })}
                                placeholder="统一高度"
                            />
                        </div>
                        <div className="property-row">
                            <label className="property-label">锁定</label>
                            <select
                                className="property-input"
                                value={allLocked ? 'locked' : 'unlocked'}
                                onChange={(e) => updateSelectedComponents({ locked: e.target.value === 'locked' })}
                            >
                                <option value="locked">全部锁定</option>
                                <option value="unlocked">全部解锁</option>
                            </select>
                        </div>
                        <div className="property-row">
                            <label className="property-label">可见</label>
                            <select
                                className="property-input"
                                value={allVisible ? 'visible' : 'hidden'}
                                onChange={(e) => updateSelectedComponents({ visible: e.target.value === 'visible' })}
                            >
                                <option value="visible">全部可见</option>
                                <option value="hidden">全部隐藏</option>
                            </select>
                        </div>
                    </div>
                    <div className="property-section">
                        <div className="property-section-title">批量动作</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                            <button type="button" className="property-btn-small" onClick={() => alignSelected('left')} disabled={total < 2}>左对齐</button>
                            <button type="button" className="property-btn-small" onClick={() => alignSelected('right')} disabled={total < 2}>右对齐</button>
                            <button type="button" className="property-btn-small" onClick={() => alignSelected('top')} disabled={total < 2}>顶对齐</button>
                            <button type="button" className="property-btn-small" onClick={() => alignSelected('bottom')} disabled={total < 2}>底对齐</button>
                            <button type="button" className="property-btn-small" onClick={() => distributeSelected('horizontal')} disabled={total < 3}>水平分布</button>
                            <button type="button" className="property-btn-small" onClick={() => distributeSelected('vertical')} disabled={total < 3}>垂直分布</button>
                            <button type="button" className="property-btn-small" onClick={groupSelected} disabled={total < 2}>组合</button>
                            <button type="button" className="property-btn-small" onClick={ungroupSelected} disabled={total < 1}>解组</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                            <button
                                type="button"
                                className="property-btn-small"
                                disabled={!primarySelected}
                                onClick={() => {
                                    if (!primarySelected) return;
                                    updateSelectedComponents({ width: primarySelected.width });
                                }}
                                title="将选中组件宽度统一为首个选中组件宽度"
                            >
                                同步首项宽度
                            </button>
                            <button
                                type="button"
                                className="property-btn-small"
                                disabled={!primarySelected}
                                onClick={() => {
                                    if (!primarySelected) return;
                                    updateSelectedComponents({ height: primarySelected.height });
                                }}
                                title="将选中组件高度统一为首个选中组件高度"
                            >
                                同步首项高度
                            </button>
                        </div>
                    </div>
                    <div className="property-section">
                        <div className="property-section-title">选择概览</div>
                        <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.7 }}>
                            已选组件: {total}<br />
                            已分组组件: {grouped}<br />
                            类型数: {new Set(selectedComponents.map((item) => item.type)).size}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleChange = (key: string, value: unknown) => {
        updateComponent(selectedComponent.id, { [key]: value });
    };

    const handleConfigChange = (key: string, value: unknown) => {
        updateComponent(selectedComponent.id, {
            config: { ...selectedComponent.config, [key]: value },
        });
    };

    const canvasWidth = Number(config.width) || 1920;
    const canvasHeight = Number(config.height) || 1080;
    const normalizedPanelFilter = panelFilter.trim().toLowerCase();
    const sectionVisible = (...aliases: string[]) => {
        if (!normalizedPanelFilter) return true;
        return aliases.some((item) => item.toLowerCase().includes(normalizedPanelFilter));
    };
    const isSectionCollapsedStored = (sectionKey: string) => collapsedSections.includes(sectionKey);
    const isSectionCollapsed = (sectionKey: string) => (
        normalizedPanelFilter ? false : isSectionCollapsedStored(sectionKey)
    );
    const toggleSection = (sectionKey: string) => {
        setCollapsedSections((prev) => {
            if (prev.includes(sectionKey)) {
                return prev.filter((item) => item !== sectionKey);
            }
            return [...prev, sectionKey];
        });
    };
    const collapseAllSections = () => {
        setCollapsedSections([...PROPERTY_SECTION_KEYS]);
    };
    const expandAllSections = () => {
        setCollapsedSections([]);
    };
    const collapseToEssential = () => {
        setCollapsedSections([...PROPERTY_SECTION_ESSENTIAL_COLLAPSED]);
    };
    const applyPanelPreset = (
        preset: '' | '位置' | '组件' | '数据' | '联动' | '下钻' | '解释' | '其他' | '常用',
    ) => {
        if (!preset) {
            setPanelFilter('');
            return;
        }
        if (preset === '常用') {
            setPanelFilter('');
            setPanelDensity('focus');
            collapseToEssential();
            return;
        }
        setPanelFilter(preset);
        setPanelDensity('full');
    };
    const shouldRenderSection = (sectionKey: string, ...aliases: string[]) => {
        if (!sectionVisible(...aliases)) {
            return false;
        }
        if (panelDensity === 'full') {
            return true;
        }
        if (normalizedPanelFilter) {
            return true;
        }
        return PROPERTY_FOCUS_SECTION_KEYS.has(sectionKey);
    };
    const showQuickActionGroup = (group: 'core' | 'layout' | 'nudge' | 'clipboard') => (
        quickActionMode === 'all' || quickActionMode === group
    );
    const getQuickActionFilterButtonStyle = (mode: 'core' | 'layout' | 'nudge' | 'clipboard' | 'all') => (
        quickActionMode === mode
            ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-light)' }
            : undefined
    );

    const alignToCanvas = (mode: 'left' | 'right' | 'top' | 'bottom' | 'h-center' | 'v-center') => {
        if (mode === 'left') {
            handleChange('x', 0);
            return;
        }
        if (mode === 'right') {
            handleChange('x', Math.max(0, canvasWidth - selectedComponent.width));
            return;
        }
        if (mode === 'top') {
            handleChange('y', 0);
            return;
        }
        if (mode === 'bottom') {
            handleChange('y', Math.max(0, canvasHeight - selectedComponent.height));
            return;
        }
        if (mode === 'h-center') {
            handleChange('x', Math.max(0, Math.round((canvasWidth - selectedComponent.width) / 2)));
            return;
        }
        handleChange('y', Math.max(0, Math.round((canvasHeight - selectedComponent.height) / 2)));
    };

    const duplicateCurrentComponent = () => {
        const nextId = `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const maxZ = config.components.length > 0
            ? Math.max(...config.components.map((item) => item.zIndex))
            : 0;
        const maxX = Math.max(0, canvasWidth - selectedComponent.width);
        const maxY = Math.max(0, canvasHeight - selectedComponent.height);
        const clone: ScreenComponent = {
            ...selectedComponent,
            id: nextId,
            x: Math.min(maxX, selectedComponent.x + 20),
            y: Math.min(maxY, selectedComponent.y + 20),
            zIndex: maxZ + 1,
            name: `${selectedComponent.name}-副本`,
        };
        updateConfig({ components: [...config.components, clone] });
    };

    const copyCurrentStyle = () => {
        const payload = buildStyleClipboardPayload(selectedComponent);
        persistStyleClipboard(payload);
        alert(`已复制样式（${Object.keys(payload.config).length} 个外观字段）`);
    };

    const applyCopiedStyle = () => {
        if (!styleClipboard) {
            alert('样式剪贴板为空，请先复制一个组件样式');
            return;
        }
        if (styleClipboard.type !== selectedComponent.type) {
            const confirmed = window.confirm(
                `样式来源类型为「${styleClipboard.type}」，当前为「${selectedComponent.type}」。\n继续应用可能只部分生效，是否继续？`
            );
            if (!confirmed) return;
        }
        updateComponent(selectedComponent.id, {
            width: Math.max(50, Number(styleClipboard.width) || selectedComponent.width),
            height: Math.max(50, Number(styleClipboard.height) || selectedComponent.height),
            config: {
                ...selectedComponent.config,
                ...styleClipboard.config,
            },
        });
    };

    const copyLayoutSnapshot = () => {
        persistLayoutClipboard({
            x: selectedComponent.x,
            y: selectedComponent.y,
            width: selectedComponent.width,
            height: selectedComponent.height,
            copiedAt: new Date().toISOString(),
        });
        alert('布局已复制（位置 + 尺寸）');
    };

    const pasteLayoutSnapshot = () => {
        if (!layoutClipboard) {
            alert('布局剪贴板为空，请先复制布局');
            return;
        }
        const nextWidth = Math.max(50, Math.round(layoutClipboard.width));
        const nextHeight = Math.max(50, Math.round(layoutClipboard.height));
        const maxX = Math.max(0, canvasWidth - nextWidth);
        const maxY = Math.max(0, canvasHeight - nextHeight);
        updateComponent(selectedComponent.id, {
            x: Math.min(maxX, Math.max(0, Math.round(layoutClipboard.x))),
            y: Math.min(maxY, Math.max(0, Math.round(layoutClipboard.y))),
            width: nextWidth,
            height: nextHeight,
        });
    };

    const nudgePosition = (dx: number, dy: number) => {
        const maxX = Math.max(0, canvasWidth - selectedComponent.width);
        const maxY = Math.max(0, canvasHeight - selectedComponent.height);
        updateComponent(selectedComponent.id, {
            x: Math.min(maxX, Math.max(0, selectedComponent.x + dx)),
            y: Math.min(maxY, Math.max(0, selectedComponent.y + dy)),
        });
    };

    const nudgeSize = (dw: number, dh: number) => {
        const nextWidth = Math.min(canvasWidth, Math.max(50, selectedComponent.width + dw));
        const nextHeight = Math.min(canvasHeight, Math.max(50, selectedComponent.height + dh));
        const maxX = Math.max(0, canvasWidth - nextWidth);
        const maxY = Math.max(0, canvasHeight - nextHeight);
        updateComponent(selectedComponent.id, {
            width: nextWidth,
            height: nextHeight,
            x: Math.min(maxX, Math.max(0, selectedComponent.x)),
            y: Math.min(maxY, Math.max(0, selectedComponent.y)),
        });
    };
    const applyChartPreset = (preset: ChartPreset) => {
        if (!isChartComponentType(selectedComponent.type)) {
            alert('当前组件不是图表类型，无法应用图表预设');
            return;
        }
        updateComponent(selectedComponent.id, {
            config: applyChartPresetConfig(selectedComponent.config, preset),
        });
    };

    const copyConfigJson = async () => {
        const text = JSON.stringify(selectedComponent.config || {}, null, 2);
        const copied = await writeTextToClipboard(text);
        alert(copied ? '组件配置JSON已复制' : '复制失败，请重试');
    };

    const pasteConfigJson = () => {
        const current = JSON.stringify(selectedComponent.config || {}, null, 2);
        const input = window.prompt('粘贴组件配置 JSON（将覆盖当前组件配置）', current);
        if (input == null) return;
        try {
            const parsed = JSON.parse(input);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                alert('配置必须是 JSON 对象');
                return;
            }
            updateComponent(selectedComponent.id, { config: parsed as Record<string, unknown> });
            alert('组件配置已更新');
        } catch {
            alert('JSON 格式错误，请检查后重试');
        }
    };

    const applyTabVisibilityRules = () => {
        if (selectedComponent.type !== 'tab-switcher') return;
        const variableKey = String(selectedComponent.config.variableKey || 'tabKey').trim() || 'tabKey';
        const optionValues = resolveTabSwitcherOptionValues(selectedComponent.config.options);
        if (optionValues.length === 0) {
            alert('请先在 Tab 组件中配置可用选项');
            return;
        }
        const targetTypes = new Set<ComponentType>([
            'line-chart',
            'bar-chart',
            'pie-chart',
            'map-chart',
            'table',
            'scroll-board',
            'scroll-ranking',
            'funnel-chart',
            'scatter-chart',
            'radar-chart',
            'gauge-chart',
        ]);
        let assigned = 0;
        let index = 0;
        const nextComponents = config.components.map((item) => {
            if (item.id === selectedComponent.id || !targetTypes.has(item.type)) {
                return item;
            }
            const match = optionValues[index % optionValues.length];
            index += 1;
            assigned += 1;
            return {
                ...item,
                config: {
                    ...item.config,
                    visibilityRuleEnabled: true,
                    visibilityVariableKey: variableKey,
                    visibilityMatchMode: 'equals',
                    visibilityMatchValues: [match],
                },
            };
        });
        if (assigned <= 0) {
            alert('当前画布没有可绑定 Tab 显隐规则的图表/表格组件');
            return;
        }
        updateConfig({ components: nextComponents });
        alert(`已应用 Tab 显隐规则到 ${assigned} 个组件`);
    };

    const clearTabVisibilityRules = () => {
        if (selectedComponent.type !== 'tab-switcher') return;
        const variableKey = String(selectedComponent.config.variableKey || 'tabKey').trim() || 'tabKey';
        let cleared = 0;
        const nextComponents = config.components.map((item) => {
            if (item.id === selectedComponent.id) {
                return item;
            }
            const currentVarKey = String((item.config as Record<string, unknown>).visibilityVariableKey ?? '').trim();
            if (currentVarKey !== variableKey) {
                return item;
            }
            const raw = item.config as Record<string, unknown>;
            const {
                visibilityRuleEnabled: _visibilityRuleEnabled,
                visibilityVariableKey: _visibilityVariableKey,
                visibilityMatchMode: _visibilityMatchMode,
                visibilityMatchValues: _visibilityMatchValues,
                visibilityMatchValue: _visibilityMatchValue,
                ...rest
            } = raw;
            cleared += 1;
            return { ...item, config: rest };
        });
        if (cleared <= 0) {
            alert('未找到可清理的 Tab 显隐规则');
            return;
        }
        updateConfig({ components: nextComponents });
        alert(`已清理 ${cleared} 个组件的 Tab 显隐规则`);
    };

    const pluginMeta = readComponentPluginMeta(selectedComponent.config);
    const runtimePlugin = pluginMeta ? getRendererPlugin(resolveRuntimePluginId(pluginMeta)) : undefined;
    const explainCardId = resolveExplainCardId(selectedComponent);
    const canExplain = Number.isFinite(explainCardId) && (explainCardId ?? 0) > 0;

    const handleExplain = async () => {
        if (!canExplain || !explainCardId) {
            return;
        }
        setExplainState({ state: 'loading' });
        try {
            const value = await analyticsApi.explainCard(explainCardId, { componentId: selectedComponent.id });
            setExplainState({ state: 'loaded', value });
        } catch (error) {
            setExplainState({ state: 'error', error });
        }
    };
    const drillDownContent = shouldRenderSection('drill-down', '下钻', 'drill')
        ? renderDrillDownConfig(selectedComponent, updateComponent, { embedded: true })
        : null;
    const interactionContent = shouldRenderSection('interaction', '联动', '交互', 'interaction', 'jump')
        ? renderInteractionConfig(selectedComponent, config.globalVariables ?? [], updateComponent, { embedded: true })
        : null;
    const actionContent = shouldRenderSection('actions', '动作', '面板', '意图', '跳转')
        ? renderActionConfig(selectedComponent, updateComponent, { embedded: true })
        : null;

    return (
        <div className={`property-panel property-panel--${panelDensity}`}>
            <div className="property-panel-header">
                <h3>属性 - {selectedComponent.name}</h3>
                <p className="property-panel-subtitle">
                    {selectedComponent.type} · {selectedComponent.width} × {selectedComponent.height} · {panelDensity === 'focus' ? '高频视图' : '完整视图'}
                </p>
            </div>
            <div className="property-panel-content">
                <div className="property-section">
                    <div className="property-section-title property-section-title-collapsible">
                        <button
                            type="button"
                            className="property-section-toggle"
                            onClick={() => toggleSection('quick-filter')}
                        >
                            {isSectionCollapsed('quick-filter') ? '▸' : '▾'} 快速定位
                        </button>
                    </div>
                    {!isSectionCollapsed('quick-filter') ? (
                        <>
                            <div className="property-row">
                                <label className="property-label">筛选</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={panelFilter}
                                    onChange={(e) => setPanelFilter(e.target.value)}
                                    placeholder="输入：位置/样式/数据/联动/可见..."
                                />
                            </div>
                            <div className="property-quick-filter-row">
                                <button type="button" className="property-btn-small" onClick={() => applyPanelPreset('')}>清空</button>
                                <select
                                    className="property-input"
                                    style={{ maxWidth: 160, padding: '4px 8px' }}
                                    defaultValue=""
                                    onChange={(event) => {
                                        const next = event.target.value as '' | '位置' | '组件' | '数据' | '联动' | '下钻' | '解释' | '其他' | '常用';
                                        applyPanelPreset(next);
                                        event.currentTarget.value = '';
                                    }}
                                >
                                    <option value="">快速定位到...</option>
                                    <option value="位置">位置与尺寸</option>
                                    <option value="组件">组件配置</option>
                                    <option value="数据">数据源</option>
                                    <option value="联动">联动配置</option>
                                    <option value="下钻">下钻配置</option>
                                    <option value="解释">解释</option>
                                    <option value="其他">其他</option>
                                    <option value="常用">常用视图</option>
                                </select>
                                <button
                                    type="button"
                                    className={`property-btn-small ${panelDensity === 'focus' ? 'is-active' : ''}`}
                                    onClick={() => setPanelDensity('focus')}
                                >
                                    高频
                                </button>
                                <button
                                    type="button"
                                    className={`property-btn-small ${panelDensity === 'full' ? 'is-active' : ''}`}
                                    onClick={() => setPanelDensity('full')}
                                >
                                    全部
                                </button>
                            </div>
                            <div className="property-quick-filter-row">
                                <button type="button" className="property-btn-small" onClick={collapseToEssential}>常用视图</button>
                                <button type="button" className="property-btn-small" onClick={expandAllSections}>全部展开</button>
                                <button type="button" className="property-btn-small" onClick={collapseAllSections}>全部收起</button>
                            </div>
                        </>
                    ) : null}
                </div>

                {shouldRenderSection('quick-actions', '快捷', '操作', '样式', '复制', '对齐') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('quick-actions')}
                            >
                                {isSectionCollapsed('quick-actions') ? '▸' : '▾'} 快捷操作
                            </button>
                        </div>
                        {!isSectionCollapsed('quick-actions') ? (
                            <>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                                    <button type="button" className="property-btn-small" style={getQuickActionFilterButtonStyle('core')} onClick={() => setQuickActionMode('core')}>常用</button>
                                    <button type="button" className="property-btn-small" style={getQuickActionFilterButtonStyle('layout')} onClick={() => setQuickActionMode('layout')}>布局</button>
                                    <button type="button" className="property-btn-small" style={getQuickActionFilterButtonStyle('nudge')} onClick={() => setQuickActionMode('nudge')}>微调</button>
                                    <button type="button" className="property-btn-small" style={getQuickActionFilterButtonStyle('clipboard')} onClick={() => setQuickActionMode('clipboard')}>剪贴板</button>
                                    <button type="button" className="property-btn-small" style={getQuickActionFilterButtonStyle('all')} onClick={() => setQuickActionMode('all')}>全部</button>
                                </div>
                                {showQuickActionGroup('core') ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }}>
                                        <button type="button" className="property-btn-small" onClick={duplicateCurrentComponent}>复制组件</button>
                                        <button type="button" className="property-btn-small" onClick={() => deleteComponents([selectedComponent.id])}>删除组件</button>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('h-center')}>水平居中</button>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('v-center')}>垂直居中</button>
                                    </div>
                                ) : null}
                                {showQuickActionGroup('layout') ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('left')}>贴左</button>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('right')}>贴右</button>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('top')}>贴上</button>
                                        <button type="button" className="property-btn-small" onClick={() => alignToCanvas('bottom')}>贴下</button>
                                    </div>
                                ) : null}
                                {showQuickActionGroup('nudge') ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(-1, 0)} title="X -1">←1</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(1, 0)} title="X +1">→1</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(0, -1)} title="Y -1">↑1</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(0, 1)} title="Y +1">↓1</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(-10, 0)} title="X -10">←10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(10, 0)} title="X +10">→10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(0, -10)} title="Y -10">↑10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgePosition(0, 10)} title="Y +10">↓10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgeSize(-10, 0)} title="宽度 -10">宽-10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgeSize(10, 0)} title="宽度 +10">宽+10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgeSize(0, -10)} title="高度 -10">高-10</button>
                                        <button type="button" className="property-btn-small" onClick={() => nudgeSize(0, 10)} title="高度 +10">高+10</button>
                                    </div>
                                ) : null}
                                {showQuickActionGroup('clipboard') ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                                        <button type="button" className="property-btn-small" onClick={copyCurrentStyle}>复制样式</button>
                                        <button type="button" className="property-btn-small" onClick={applyCopiedStyle}>粘贴样式</button>
                                        <button type="button" className="property-btn-small" onClick={copyLayoutSnapshot}>复制布局</button>
                                        <button type="button" className="property-btn-small" onClick={pasteLayoutSnapshot}>粘贴布局</button>
                                        <button type="button" className="property-btn-small" onClick={() => { void copyConfigJson(); }}>复制配置JSON</button>
                                        <button type="button" className="property-btn-small" onClick={pasteConfigJson}>粘贴配置JSON</button>
                                        <button type="button" className="property-btn-small" onClick={() => persistStyleClipboard(null)}>清空样式板</button>
                                        <button type="button" className="property-btn-small" onClick={() => persistLayoutClipboard(null)}>清空布局板</button>
                                    </div>
                                ) : null}
                                {CHART_COMPONENT_TYPES.has(selectedComponent.type) ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginTop: 6 }}>
                                        <button type="button" className="property-btn-small" onClick={() => applyChartPreset('business')} title="适合白底商务大屏">商务预设</button>
                                        <button type="button" className="property-btn-small" onClick={() => applyChartPreset('compact')} title="适合小尺寸组件">紧凑预设</button>
                                        <button type="button" className="property-btn-small" onClick={() => applyChartPreset('clear')} title="恢复默认可读策略">恢复预设</button>
                                    </div>
                                ) : null}
                                <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>
                                    {styleClipboard
                                        ? `样式剪贴板：${styleClipboard.type}（${Object.keys(styleClipboard.config || {}).length} 字段）`
                                        : '样式剪贴板为空，可先在任意组件点击"复制样式"。'}
                                    <br />
                                    {layoutClipboard
                                        ? `布局剪贴板：${layoutClipboard.width}×${layoutClipboard.height} @ (${layoutClipboard.x}, ${layoutClipboard.y})`
                                        : '布局剪贴板为空，可复制当前组件布局。'}
                                </div>
                            </>
                        ) : null}
                    </div>
                )}

                {/* Position & Size */}
                {shouldRenderSection('position-size', '位置', '尺寸', 'x', 'y', '宽', '高') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('position-size')}
                            >
                                {isSectionCollapsed('position-size') ? '▸' : '▾'} 位置与尺寸
                            </button>
                        </div>
                        {!isSectionCollapsed('position-size') ? (
                            <>
                                <div className="property-row">
                                    <label className="property-label">X</label>
                                    <input
                                        type="number"
                                        className="property-input"
                                        value={selectedComponent.x}
                                        onChange={(e) => handleChange('x', Number(e.target.value))}
                                    />
                                </div>

                                <div className="property-row">
                                    <label className="property-label">Y</label>
                                    <input
                                        type="number"
                                        className="property-input"
                                        value={selectedComponent.y}
                                        onChange={(e) => handleChange('y', Number(e.target.value))}
                                    />
                                </div>

                                <div className="property-row">
                                    <label className="property-label">宽度</label>
                                    <input
                                        type="number"
                                        className="property-input"
                                        value={selectedComponent.width}
                                        onChange={(e) => handleChange('width', Number(e.target.value))}
                                    />
                                </div>

                                <div className="property-row">
                                    <label className="property-label">高度</label>
                                    <input
                                        type="number"
                                        className="property-input"
                                        value={selectedComponent.height}
                                        onChange={(e) => handleChange('height', Number(e.target.value))}
                                    />
                                </div>
                            </>
                        ) : null}
                    </div>
                )}

                {/* Component-specific config */}
                {runtimePlugin?.propertySchema?.fields?.length && shouldRenderSection('plugin-config', '插件', 'plugin', runtimePlugin.name) ? (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('plugin-config')}
                            >
                                {isSectionCollapsed('plugin-config') ? '▸' : '▾'} 插件配置 ({runtimePlugin.name})
                            </button>
                        </div>
                        {!isSectionCollapsed('plugin-config')
                            ? renderPluginSchemaFields(selectedComponent, runtimePlugin.propertySchema.fields, handleConfigChange)
                            : null}
                    </div>
                ) : null}

                {shouldRenderSection('component-config', '组件', '样式', '图表', '外观') && (
                    <div className="property-section">
                        <div
                            className="property-section-title property-section-title-collapsible"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                        >
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('component-config')}
                            >
                                {isSectionCollapsed('component-config') ? '▸' : '▾'} 组件配置
                            </button>
                            {CHART_COMPONENT_TYPES.has(selectedComponent.type) ? (
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                    <button
                                        type="button"
                                        className="property-btn-small"
                                        onClick={() => setComponentConfigMode('quick')}
                                        style={{
                                            minHeight: 24,
                                            padding: '2px 8px',
                                            opacity: componentConfigMode === 'quick' ? 1 : 0.75,
                                        }}
                                    >
                                        简洁
                                    </button>
                                    <button
                                        type="button"
                                        className="property-btn-small"
                                        onClick={() => setComponentConfigMode('advanced')}
                                        style={{
                                            minHeight: 24,
                                            padding: '2px 8px',
                                            opacity: componentConfigMode === 'advanced' ? 1 : 0.75,
                                        }}
                                    >
                                        专业
                                    </button>
                                </div>
                            ) : null}
                        </div>

                        {!isSectionCollapsed('component-config')
                            ? (
                                CHART_COMPONENT_TYPES.has(selectedComponent.type) && componentConfigMode === 'quick'
                                    ? renderQuickChartConfig(selectedComponent, handleConfigChange, applyChartPreset)
                                    : renderComponentConfig(selectedComponent, handleConfigChange)
                            )
                            : null}
                    </div>
                )}

                {/* Data Source */}
                {shouldRenderSection('data-source', '数据', 'sql', 'card', 'api', 'dataset', 'metric') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('data-source')}
                            >
                                {isSectionCollapsed('data-source') ? '▸' : '▾'} 数据源
                            </button>
                        </div>
                        {!isSectionCollapsed('data-source')
                            ? renderDataSourceConfig(selectedComponent, updateComponent, config.globalVariables ?? [])
                            : null}
                    </div>
                )}

                {/* Field Mapping */}
                {shouldRenderSection('data-source', '字段映射', 'field', 'mapping') && isMappable(selectedComponent.type) && (() => {
                    const fmSourceCols = selectedComponent.config._sourceColumns as Array<{ name: string; displayName: string; baseType?: string }> ?? [];
                    const hasFmSource = resolveDataSourceType(selectedComponent.dataSource as DataSourceConfig | undefined) !== 'static';
                    if (!hasFmSource || fmSourceCols.length === 0) return null;
                    const currentMapping = (selectedComponent.config._fieldMapping as FieldMapping) ?? {};
                    const useFieldMapping = selectedComponent.config._useFieldMapping !== false;
                    return (
                        <div className="property-section">
                            <div className="property-section-title property-section-title-collapsible">
                                <button
                                    type="button"
                                    className="property-section-toggle"
                                    onClick={() => toggleSection('field-mapping')}
                                >
                                    {isSectionCollapsed('field-mapping') ? '▸' : '▾'} 字段映射
                                </button>
                                <label style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                                    <input
                                        type="checkbox"
                                        checked={useFieldMapping}
                                        onChange={(e) => {
                                            handleConfigChange('_useFieldMapping', e.target.checked);
                                        }}
                                    />
                                    启用
                                </label>
                            </div>
                            {!isSectionCollapsed('field-mapping') && useFieldMapping ? (
                                <FieldMappingPanel
                                    componentType={selectedComponent.type}
                                    sourceColumns={fmSourceCols}
                                    mapping={currentMapping}
                                    onChange={(newMapping) => handleConfigChange('_fieldMapping', newMapping)}
                                />
                            ) : !isSectionCollapsed('field-mapping') ? (
                                <div style={{ fontSize: 11, color: '#64748b', padding: '4px 0' }}>
                                    字段映射已关闭，使用高级模式直接编辑 config。
                                </div>
                            ) : null}
                        </div>
                    );
                })()}

                {shouldRenderSection('explain', '解释', 'explain') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('explain')}
                            >
                                {isSectionCollapsed('explain') ? '▸' : '▾'} 解释
                            </button>
                        </div>
                        {!isSectionCollapsed('explain') ? (
                            canExplain ? (
                                <div style={{ display: 'grid', gap: 8 }}>
                                    <button
                                        type="button"
                                        className="property-btn-small"
                                        onClick={() => { void handleExplain(); }}
                                    >
                                        解释当前组件
                                    </button>
                                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>
                                        解释来源 CardId: {explainCardId}
                                    </div>
                                    {explainState?.state === 'loading' ? (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>解释生成中...</div>
                                    ) : null}
                                    {explainState?.state === 'error' ? (
                                        <div style={{ fontSize: 12, color: '#ef4444' }}>
                                            解释失败：{explainState.error instanceof Error ? explainState.error.message : 'unknown error'}
                                        </div>
                                    ) : null}
                                    {explainState?.state === 'loaded' ? (
                                        <>
                                            <button
                                                type="button"
                                                className="property-btn-small"
                                                onClick={() => {
                                                    const text = explainState.value.copyJson ?? JSON.stringify(explainState.value.explainCard ?? {}, null, 2);
                                                    void writeTextToClipboard(text);
                                                }}
                                            >
                                                复制解释JSON
                                            </button>
                                            <pre
                                                style={{
                                                    margin: 0,
                                                    padding: 8,
                                                    borderRadius: 8,
                                                    background: 'rgba(15,23,42,0.6)',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    fontSize: 11,
                                                    maxHeight: 240,
                                                    overflow: 'auto',
                                                }}
                                            >
                                                {JSON.stringify(explainState.value.explainCard ?? {}, null, 2)}
                                            </pre>
                                        </>
                                    ) : null}
                                </div>
                            ) : (
                                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>
                                    当前组件未绑定可解释的 Card 数据源。
                                </div>
                            )
                        ) : null}
                    </div>
                )}

                {/* Chart annotations (markLine / markArea / conditionalColors) */}
                {shouldRenderSection('component-config', '标注', '辅助线', 'markLine', 'threshold') && (selectedComponent.type === 'line-chart' || selectedComponent.type === 'bar-chart' || selectedComponent.type === 'scatter-chart' || selectedComponent.type === 'combo-chart' || selectedComponent.type === 'waterfall-chart') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('annotations')}
                            >
                                {isSectionCollapsed('annotations') ? '▸' : '▾'} 标注 / 阈值线
                            </button>
                        </div>
                        {!isSectionCollapsed('annotations') && (
                            <ChartAnnotationConfig
                                component={selectedComponent}
                                onChange={handleConfigChange}
                            />
                        )}
                    </div>
                )}

                {/* Drill-down config */}
                {drillDownContent ? (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('drill-down')}
                            >
                                {isSectionCollapsed('drill-down') ? '▸' : '▾'} 下钻配置
                            </button>
                        </div>
                        {!isSectionCollapsed('drill-down') ? drillDownContent : null}
                    </div>
                ) : null}

                {interactionContent ? (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('interaction')}
                            >
                                {isSectionCollapsed('interaction') ? '▸' : '▾'} 联动配置
                            </button>
                        </div>
                        {!isSectionCollapsed('interaction') ? interactionContent : null}
                    </div>
                ) : null}

                {actionContent ? (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('actions')}
                            >
                                {isSectionCollapsed('actions') ? '▸' : '▾'} 动作入口
                            </button>
                        </div>
                        {!isSectionCollapsed('actions') ? actionContent : null}
                    </div>
                ) : null}

                {/* Visibility & Lock */}
                {shouldRenderSection('other', '其他', '名称', '容器', '锁定', '可见') && (
                    <div className="property-section">
                        <div className="property-section-title property-section-title-collapsible">
                            <button
                                type="button"
                                className="property-section-toggle"
                                onClick={() => toggleSection('other')}
                            >
                                {isSectionCollapsed('other') ? '▸' : '▾'} 其他
                            </button>
                        </div>
                        {!isSectionCollapsed('other') ? (
                            <>
                                <div className="property-row">
                                    <label className="property-label">名称</label>
                                    <input
                                        type="text"
                                        className="property-input"
                                        value={selectedComponent.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>

                                <div className="property-row">
                                    <label className="property-label">所属容器</label>
                                    <select
                                        className="property-input"
                                        value={selectedComponent.parentContainerId || ''}
                                        onChange={(e) => {
                                            const parentId = e.target.value || undefined;
                                            if (!parentId) {
                                                updateComponent(selectedComponent.id, { parentContainerId: undefined });
                                                return;
                                            }
                                            const parent = config.components.find((item) => item.id === parentId && item.type === 'container');
                                            if (!parent) {
                                                updateComponent(selectedComponent.id, { parentContainerId: undefined });
                                                return;
                                            }
                                            if (wouldCreateParentCycle(config.components, selectedComponent.id, parentId)) {
                                                alert('该容器绑定会形成循环引用，请选择其他容器');
                                                return;
                                            }
                                            const maxX = parent.x + Math.max(0, parent.width - selectedComponent.width);
                                            const maxY = parent.y + Math.max(0, parent.height - selectedComponent.height);
                                            const nextX = Math.max(parent.x, Math.min(selectedComponent.x, maxX));
                                            const nextY = Math.max(parent.y, Math.min(selectedComponent.y, maxY));
                                            updateComponent(selectedComponent.id, {
                                                parentContainerId: parentId,
                                                x: nextX,
                                                y: nextY,
                                            });
                                        }}
                                    >
                                        <option value="">-- 无 --</option>
                                        {config.components
                                            .filter((item) => (
                                                item.type === 'container'
                                                && item.id !== selectedComponent.id
                                                && !wouldCreateParentCycle(config.components, selectedComponent.id, item.id)
                                            ))
                                            .map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.name} ({item.id})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {selectedComponent.type === 'container' && (
                                    <div className="property-row">
                                        <label className="property-label">子组件数</label>
                                        <div className="property-input" style={{ display: 'flex', alignItems: 'center' }}>
                                            {config.components.filter((item) => item.parentContainerId === selectedComponent.id).length}
                                        </div>
                                    </div>
                                )}
                                {selectedComponent.type === 'tab-switcher' && (
                                    <div className="property-row" style={{ alignItems: 'flex-start' }}>
                                        <label className="property-label">Tab联动</label>
                                        <div style={{ display: 'grid', gap: 6, width: '100%' }}>
                                            <button type="button" className="property-btn-small" onClick={applyTabVisibilityRules}>
                                                一键应用显隐规则
                                            </button>
                                            <button type="button" className="property-btn-small" onClick={clearTabVisibilityRules}>
                                                清理显隐规则
                                            </button>
                                            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
                                                规则会按 Tab 选项顺序分配到图表/表格组件。
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="property-row">
                                    <label className="property-label">锁定</label>
                                    <input
                                        type="checkbox"
                                        checked={selectedComponent.locked}
                                        onChange={(e) => handleChange('locked', e.target.checked)}
                                    />
                                </div>

                                <div className="property-row">
                                    <label className="property-label">可见</label>
                                    <input
                                        type="checkbox"
                                        checked={selectedComponent.visible}
                                        onChange={(e) => handleChange('visible', e.target.checked)}
                                    />
                                </div>
                                <div className="property-row">
                                    <label className="property-label">多端可见</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {(['pc', 'tablet', 'mobile'] as const).map((device) => {
                                            const current = Array.isArray(selectedComponent.config.visibleOn)
                                                ? selectedComponent.config.visibleOn as string[]
                                                : ['pc', 'tablet', 'mobile'];
                                            const checked = current.includes(device);
                                            const label = device === 'pc' ? 'PC' : device === 'tablet' ? '平板' : '手机';
                                            return (
                                                <label key={device} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            const base = Array.isArray(selectedComponent.config.visibleOn)
                                                                ? selectedComponent.config.visibleOn as string[]
                                                                : ['pc', 'tablet', 'mobile'];
                                                            const next = e.target.checked
                                                                ? Array.from(new Set([...base, device]))
                                                                : base.filter((item) => item !== device);
                                                            handleConfigChange('visibleOn', next);
                                                        }}
                                                    />
                                                    {label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="property-row">
                                    <label className="property-label">变量可见条件</label>
                                    <input
                                        type="checkbox"
                                        checked={selectedComponent.config.visibilityRuleEnabled === true}
                                        onChange={(e) => handleConfigChange('visibilityRuleEnabled', e.target.checked)}
                                    />
                                </div>
                                {selectedComponent.config.visibilityRuleEnabled === true && (
                                    <>
                                        <div className="property-row">
                                            <label className="property-label">变量Key</label>
                                            <input
                                                type="text"
                                                className="property-input"
                                                value={String(selectedComponent.config.visibilityVariableKey ?? '')}
                                                onChange={(e) => handleConfigChange('visibilityVariableKey', e.target.value)}
                                                placeholder="tabKey"
                                            />
                                        </div>
                                        <div className="property-row">
                                            <label className="property-label">匹配模式</label>
                                            <select
                                                className="property-input"
                                                value={String(selectedComponent.config.visibilityMatchMode ?? 'equals')}
                                                onChange={(e) => handleConfigChange('visibilityMatchMode', e.target.value)}
                                            >
                                                <option value="equals">等于任一值</option>
                                                <option value="not-equals">不等于任一值</option>
                                                <option value="contains">包含任一值</option>
                                                <option value="not-contains">不包含任一值</option>
                                                <option value="starts-with">前缀匹配任一值</option>
                                                <option value="ends-with">后缀匹配任一值</option>
                                                <option value="empty">为空</option>
                                                <option value="not-empty">非空</option>
                                            </select>
                                        </div>
                                        {(() => {
                                            const mode = String(selectedComponent.config.visibilityMatchMode ?? 'equals');
                                            if (mode === 'empty' || mode === 'not-empty') {
                                                return null;
                                            }
                                            return (
                                                <div className="property-row">
                                                    <label className="property-label">匹配值</label>
                                                    <textarea
                                                        className="property-input"
                                                        rows={4}
                                                        value={serializeVisibilityMatchValues(selectedComponent.config.visibilityMatchValues)}
                                                        onChange={(e) => handleConfigChange('visibilityMatchValues', parseVisibilityMatchValues(e.target.value))}
                                                        placeholder={'每行一个值，例如：\noverview\nline'}
                                                    />
                                                </div>
                                            );
                                        })()}
                                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: -2 }}>
                                            仅在预览/公开/导出模式生效，设计器中始终可见便于编辑。
                                        </div>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
