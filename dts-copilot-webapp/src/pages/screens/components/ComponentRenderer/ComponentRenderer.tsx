import { memo, useMemo, useEffect, useRef, useState, useCallback, type ComponentType, type MouseEvent as ReactMouseEvent } from 'react';
import type { CardData, ScreenComponent } from '../../types';
import { DRILLABLE_TYPES } from '../../types';
import { useCardDataSource } from '../../hooks/useCardDataSource';
import { useDrillDown } from '../../hooks/useDrillDown';
import { useScreenRuntime } from '../../ScreenRuntimeContext';
import { mapCardDataToConfig } from '../../hooks/cardDataMapper';
import { applyFieldMapping } from '../../hooks/fieldMappingTransform';
import type { FieldMapping } from '../../types';
import { getThemeTokens } from '../../screenThemes';
import { PluginRenderBoundary } from '../../plugins/PluginRenderBoundary';
import { getRendererPlugin } from '../../plugins/registry';
import { readComponentPluginMeta, resolveRuntimePluginId } from '../../plugins/runtime';
import { useScreenPluginRuntime } from '../../plugins/useScreenPluginRuntime';
import type { RendererPlugin } from '../../plugins/types';
import type { ReactEChartsComponent, DataViewModule, ComponentRendererProps } from '../../renderers/types';
import { resolvePresetMapUrl, fetchGeoJsonWithCache } from '../../renderers/shared/geoJsonCache';
import {
    resolveTextColor, estimateVisualTextWidth, truncateTextByVisualWidth,
    normalizeParameterBindings, resolveDataSourceType,
    resolveInteractionValue, resolveInteractionMappedValue,
    resolveInteractionUrlTemplate, resolveFilterOptions, resolveTabOptions,
    resolveComponentVariableVisibility, resolveFilterOptionsFromData,
    normalizeFilterDebounceMs, normalizeCarouselItems, resolveCarouselItemsFromData,
    resolveFilterDefaultValue, resolveDateRangeDefaultValues,
} from '../../renderers/shared/chartUtils';
import {
    buildTableRowActionParams,
    normalizeScreenActionType,
    resolvePreferredDrillValue,
    resolveActionMappingValues,
    resolveActionTemplateText,
} from '../../renderers/shared/actionUtils';
import type { ComponentInteractionMapping, ScreenComponentAction } from '../../types';

import {
    ECHART_COMPONENT_TYPES,
    ECHART_3D_TYPES,
    DATAV_COMPONENT_TYPES,
    injectChartAnnotations,
} from './constants';
import type { RenderSectionContext } from './constants';
import { renderEChartsSection } from './EChartsSection';
import { renderBasicComponentSection } from './BasicComponentSection';
import { renderDataVSection } from './DataVSection';
import { renderSpecialSection } from './SpecialSection';

export const ComponentRenderer = memo(function ComponentRenderer({ component, mode = 'preview', theme, onConfigMeta }: ComponentRendererProps) {
    const { type, config, width, height, dataSource, drillDown } = component;

    const runtime = useScreenRuntime();
    const pluginRuntimeVersion = useScreenPluginRuntime();
    const t = useMemo(() => getThemeTokens(theme), [theme]);
    const pluginMeta = useMemo(() => readComponentPluginMeta(config), [config]);
    const runtimePlugin = useMemo<RendererPlugin | null>(() => {
        const runtimeId = resolveRuntimePluginId(pluginMeta);
        if (!runtimeId) return null;
        return getRendererPlugin(runtimeId) ?? null;
    }, [pluginMeta, pluginRuntimeVersion]);

    // Build ECharts base options from theme tokens
    const themeOptions = useMemo(() => ({
        backgroundColor: "transparent",
        color: t.echarts.colorPalette,
        textStyle: { color: t.textPrimary },
        legend: { textStyle: { color: t.textPrimary } },
        tooltip: {
            backgroundColor: t.echarts.tooltipBg,
            borderColor: t.echarts.tooltipBorder,
            textStyle: { color: t.textPrimary },
        },
    }), [t]);

    const needsECharts = ECHART_COMPONENT_TYPES.has(type);
    const needsDataV = DATAV_COMPONENT_TYPES.has(type);
    const [EChartsComponent, setEChartsComponent] = useState<ReactEChartsComponent | null>(null);
    const [registerMapFn, setRegisterMapFn] = useState<((mapName: string, geoJson: unknown) => boolean) | null>(null);
    const [hasMapFn, setHasMapFn] = useState<((mapName: string) => boolean) | null>(null);
    const [dataViewModule, setDataViewModule] = useState<DataViewModule | null>(null);
    const [mapDrillRegion, setMapDrillRegion] = useState<string | null>(null);
    const [mapReadyVersion, setMapReadyVersion] = useState(0);
    const [tableSort, setTableSort] = useState<{ colIndex: number; order: 'asc' | 'desc' } | null>(null);
    const [tablePage, setTablePage] = useState(1);

    useEffect(() => {
        if (!needsECharts || EChartsComponent) return;
        let cancelled = false;
        const imports: Promise<unknown>[] = [
            import('../../../../components/charts/EChartsRuntime'),
        ];
        if (type === 'wordcloud-chart') {
            imports.push(import('echarts-wordcloud'));
        }
        if (ECHART_3D_TYPES.has(type)) {
            // echarts-gl is an optional peer dep — use variable to bypass Vite static analysis
            const glPkg = 'echarts-gl';
            imports.push(import(/* @vite-ignore */ glPkg).catch(() => null));
        }
        Promise.all(imports).then(([echartsModule]) => {
            const mod = echartsModule as typeof import('../../../../components/charts/EChartsRuntime');
            if (!cancelled) {
                setEChartsComponent(() => mod.default as ReactEChartsComponent);
                if (typeof mod.registerEChartsMap === 'function') {
                    setRegisterMapFn(() => mod.registerEChartsMap);
                }
                if (typeof mod.hasEChartsMap === 'function') {
                    setHasMapFn(() => mod.hasEChartsMap);
                }
            }
        });
        return () => {
            cancelled = true;
        };
    }, [needsECharts, EChartsComponent, type]);

    useEffect(() => {
        if (type !== 'map-chart' || !registerMapFn) return;
        const cfg = config as Record<string, unknown>;
        const mapName = String(cfg.mapName || cfg.mapScope || 'dts-map').trim();
        if (!mapName) return;
        const geoJson = cfg.geoJson;
        const geoJsonUrlRaw = typeof cfg.geoJsonUrl === 'string' ? cfg.geoJsonUrl.trim() : '';
        const presetAllowed = cfg.usePresetGeoJson !== false;
        const presetUrl = presetAllowed ? resolvePresetMapUrl(String(cfg.mapScope || 'china')) : undefined;
        const geoJsonUrl = geoJsonUrlRaw || presetUrl || '';
        let cancelled = false;

        if (geoJson && typeof geoJson === 'object') {
            if (registerMapFn(mapName, geoJson)) {
                setMapReadyVersion((v) => v + 1);
            }
            return;
        }

        if (!geoJsonUrl) {
            return;
        }

        fetchGeoJsonWithCache(geoJsonUrl).then((loaded) => {
            if (cancelled || !loaded || typeof loaded !== 'object') return;
            if (registerMapFn(mapName, loaded)) {
                setMapReadyVersion((v) => v + 1);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [config, registerMapFn, type]);

    useEffect(() => {
        if (!needsDataV || dataViewModule) return;
        let cancelled = false;
        import('@jiaminghi/data-view-react').then((mod) => {
            if (!cancelled) {
                setDataViewModule(mod);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [needsDataV, dataViewModule]);

    useEffect(() => {
        setMapDrillRegion(null);
        setTableSort(null);
        setTablePage(1);
    }, [component.id]);

    const borderBoxComponents = useMemo(() => {
        if (!dataViewModule) return null;
        return {
            1: dataViewModule.BorderBox1,
            2: dataViewModule.BorderBox2,
            3: dataViewModule.BorderBox3,
            4: dataViewModule.BorderBox4,
            5: dataViewModule.BorderBox5,
            6: dataViewModule.BorderBox6,
            7: dataViewModule.BorderBox7,
            8: dataViewModule.BorderBox8,
            9: dataViewModule.BorderBox9,
            10: dataViewModule.BorderBox10,
            11: dataViewModule.BorderBox11,
            12: dataViewModule.BorderBox12,
            13: dataViewModule.BorderBox13,
        } as Record<number, ComponentType<{ children?: React.ReactNode; color?: string[] }>>;
    }, [dataViewModule]);

    const decorationComponents = useMemo(() => {
        if (!dataViewModule) return null;
        return {
            1: dataViewModule.Decoration1,
            2: dataViewModule.Decoration2,
            3: dataViewModule.Decoration3,
            4: dataViewModule.Decoration4,
            5: dataViewModule.Decoration5,
            6: dataViewModule.Decoration6,
            7: dataViewModule.Decoration7,
            8: dataViewModule.Decoration8,
            9: dataViewModule.Decoration9,
            10: dataViewModule.Decoration10,
            11: dataViewModule.Decoration11,
            12: dataViewModule.Decoration12,
        } as Record<number, ComponentType<{ color?: string[]; style?: React.CSSProperties }>>;
    }, [dataViewModule]);

    const dataSourceType = useMemo(() => resolveDataSourceType(dataSource), [dataSource]);
    const sourceBindings = useMemo(() => {
        if (dataSourceType === "card") {
            return normalizeParameterBindings(dataSource?.cardConfig?.parameterBindings);
        }
        if (dataSourceType === "metric") {
            return normalizeParameterBindings(dataSource?.metricConfig?.parameterBindings);
        }
        if (dataSourceType === "sql") {
            const sqlConfig = dataSource?.sqlConfig ?? dataSource?.databaseConfig;
            return normalizeParameterBindings(sqlConfig?.parameterBindings);
        }
        return [];
    }, [dataSource, dataSourceType]);

    const bindingParameters = useMemo(() => {
        if (!sourceBindings.length) return [] as Array<{ name: string; value: string }>;
        const out: Array<{ name: string; value: string }> = [];
        for (const item of sourceBindings) {
            let value = item.value ?? "";
            if (item.variableKey) {
                value = runtime.values[item.variableKey] ?? "";
            }
            if ((item.name || "").trim().length === 0) continue;
            out.push({ name: item.name, value: String(value ?? "") });
        }
        return out;
    }, [sourceBindings, runtime.values]);

    // Drill runtime state should remain available for template-defined drill paths
    // even when the current component is static and only uses breadcrumb/context state.
    const drillRuntimeEnabled = mode === "preview" && drillDown?.enabled === true;
    const drillActive = drillRuntimeEnabled && DRILLABLE_TYPES.has(type);
    const rootCardId = dataSourceType === "card" ? dataSource?.cardConfig?.cardId : undefined;
    const drillState = useDrillDown(
        drillRuntimeEnabled ? rootCardId : undefined,
        drillRuntimeEnabled ? drillDown : undefined,
    );

    const mergedQueryParameters = useMemo(() => {
        const merged = new Map<string, string>();
        for (const item of bindingParameters) {
            const name = (item.name || "").trim();
            if (!name) continue;
            merged.set(name, String(item.value ?? ""));
        }
        for (const item of (drillRuntimeEnabled ? (drillState.queryParameters ?? []) : [])) {
            const name = (item.name || "").trim();
            if (!name) continue;
            merged.set(name, String(item.value ?? ""));
        }
        return Array.from(merged.entries()).map(([name, value]) => ({ name, value }));
    }, [bindingParameters, drillRuntimeEnabled, drillState.queryParameters]);

    const queryContext = useMemo(() => ({
        source: "screen-component",
        componentId: component.id,
        componentType: type,
        mode,
        globalVariables: runtime.values,
    }), [component.id, mode, runtime.values, type]);
    const visibleByVariableRule = mode !== 'preview'
        || resolveComponentVariableVisibility(config, runtime.values);

    // Card data source hook — pass drill overrides when active
    const { data: cardData, loading: cardLoading, error: cardError } = useCardDataSource(
        visibleByVariableRule ? dataSource : undefined,
        drillRuntimeEnabled ? drillState.effectiveCardId : undefined,
        mergedQueryParameters.length > 0 ? mergedQueryParameters : undefined,
        queryContext,
    );

    // Merge card data into config: card data overrides data fields only, not display fields
    const effectiveConfig = useMemo(() => {
        if (!cardData) return config;
        const fieldMapping = config._fieldMapping as FieldMapping | undefined;
        const useFieldMapping = config._useFieldMapping !== false && fieldMapping
            && (fieldMapping.dimension || (fieldMapping.measures && fieldMapping.measures.length > 0));
        if (useFieldMapping) {
            const mapped = applyFieldMapping(type, fieldMapping, cardData);
            return { ...config, ...mapped };
        }
        const mapped = mapCardDataToConfig(type, cardData, config);
        return { ...config, ...mapped };
    }, [config, cardData, type]);

    // Persist _sourceColumns to saved config so PropertyPanel can read them
    const onConfigMetaRef = useRef(onConfigMeta);
    onConfigMetaRef.current = onConfigMeta;
    const [legendDragPreview, setLegendDragPreview] = useState<{ x: number; y: number } | null>(null);
    const legendDragHandlersRef = useRef<{ move: (event: MouseEvent) => void; up: (event: MouseEvent) => void } | null>(null);
    const [chartDragPreview, setChartDragPreview] = useState<{ x: number; y: number } | null>(null);
    const chartDragHandlersRef = useRef<{ move: (event: MouseEvent) => void; up: (event: MouseEvent) => void } | null>(null);

    const clearLegendDragHandlers = useCallback(() => {
        const handlers = legendDragHandlersRef.current;
        if (!handlers) return;
        window.removeEventListener('mousemove', handlers.move);
        window.removeEventListener('mouseup', handlers.up);
        legendDragHandlersRef.current = null;
    }, []);

    const clearChartDragHandlers = useCallback(() => {
        const handlers = chartDragHandlersRef.current;
        if (!handlers) return;
        window.removeEventListener('mousemove', handlers.move);
        window.removeEventListener('mouseup', handlers.up);
        chartDragHandlersRef.current = null;
    }, []);

    useEffect(() => () => {
        clearLegendDragHandlers();
        clearChartDragHandlers();
    }, [clearChartDragHandlers, clearLegendDragHandlers]);

    useEffect(() => {
        setLegendDragPreview(null);
        setChartDragPreview(null);
        clearLegendDragHandlers();
        clearChartDragHandlers();
    }, [clearChartDragHandlers, clearLegendDragHandlers, component.id]);

    const sourceColsKey = (config._sourceColumns as Array<{ name: string }> | undefined)
        ?.map(c => c.name).join(',');

    useEffect(() => {
        if (!onConfigMetaRef.current || !cardData?.cols?.length) return;
        const newCols = cardData.cols.map((c) => ({
            name: c.name,
            displayName: c.display_name || c.name,
            baseType: c.base_type,
        }));
        const newKey = newCols.map(c => c.name).join(',');
        // Only update if columns actually changed (avoid infinite loop)
        if (sourceColsKey !== newKey) {
            onConfigMetaRef.current({ _sourceColumns: newCols });
        }
    }, [cardData, sourceColsKey]);

    // For datetime component, update every second
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        if (type === 'datetime' || type === 'countdown') {
            const timer = setInterval(() => setCurrentTime(new Date()), 1000);
            return () => clearInterval(timer);
        }
    }, [type]);

    const [carouselIndex, setCarouselIndex] = useState(0);
    const [carouselPaused, setCarouselPaused] = useState(false);
    const carouselItems = useMemo(() => {
        if (type !== 'carousel') return [];
        const sourceMode = String(effectiveConfig.itemSourceMode ?? 'auto').trim().toLowerCase();
        const dataItems = resolveCarouselItemsFromData(cardData, effectiveConfig);
        const manualItems = normalizeCarouselItems(effectiveConfig.items);
        if (sourceMode === 'data') {
            return dataItems;
        }
        if (sourceMode === 'manual') {
            return manualItems;
        }
        if (dataItems.length > 0) {
            return dataItems;
        }
        return manualItems;
    }, [cardData, effectiveConfig.dataItemField, effectiveConfig.dataItemMax, effectiveConfig.itemSourceMode, effectiveConfig.items, type]);

    useEffect(() => {
        if (type !== 'carousel') return;
        if (carouselItems.length <= 1) {
            setCarouselIndex(0);
            return;
        }
        const autoPlay = effectiveConfig.autoPlay !== false;
        if (!autoPlay) {
            return;
        }
        const pauseOnHover = effectiveConfig.pauseOnHover !== false;
        if (pauseOnHover && carouselPaused) {
            return;
        }
        const rawSeconds = Number(effectiveConfig.intervalSeconds ?? 4);
        const safeSeconds = Number.isFinite(rawSeconds)
            ? Math.max(1, Math.min(120, Math.floor(rawSeconds)))
            : 4;
        const timer = setInterval(() => {
            setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
        }, safeSeconds * 1000);
        return () => clearInterval(timer);
    }, [carouselItems.length, carouselPaused, effectiveConfig.autoPlay, effectiveConfig.intervalSeconds, effectiveConfig.pauseOnHover, type]);

    const filterInputVariableKey = useMemo(() => {
        if (type !== 'filter-input') return '';
        return String((effectiveConfig.variableKey as string) ?? '').trim();
    }, [effectiveConfig, type]);
    const filterInputRuntimeValue = filterInputVariableKey ? (runtime.values[filterInputVariableKey] ?? '') : '';
    const filterInputDefaultValue = String(effectiveConfig.defaultValue ?? '').trim();
    const [filterInputDraft, setFilterInputDraft] = useState(filterInputRuntimeValue);
    const filterVariableTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    useEffect(() => {
        setFilterInputDraft(filterInputRuntimeValue);
    }, [filterInputRuntimeValue, filterInputVariableKey]);

    useEffect(() => {
        if (type !== 'filter-input' || !filterInputVariableKey || filterInputRuntimeValue) return;
        if (!filterInputDefaultValue) return;
        runtime.setVariable(filterInputVariableKey, filterInputDefaultValue, `filter-input:init:${component.id}`);
    }, [component.id, filterInputDefaultValue, filterInputRuntimeValue, filterInputVariableKey, runtime, type]);

    useEffect(() => () => {
        for (const timer of filterVariableTimersRef.current.values()) {
            clearTimeout(timer);
        }
        filterVariableTimersRef.current.clear();
    }, []);

    const tabVariableKey = useMemo(() => {
        if (type !== 'tab-switcher') return '';
        return String((effectiveConfig.variableKey as string) ?? '').trim();
    }, [effectiveConfig, type]);
    const tabOptions = useMemo(() => {
        if (type !== 'tab-switcher') return [];
        const sourceMode = String(effectiveConfig.optionSourceMode ?? 'manual').trim().toLowerCase();
        if (sourceMode === 'data') {
            const dynamicOptions = resolveFilterOptionsFromData(cardData, effectiveConfig);
            if (dynamicOptions.length > 0) {
                return dynamicOptions;
            }
        }
        return resolveTabOptions(effectiveConfig.options);
    }, [cardData, effectiveConfig, type]);
    const tabDefaultValue = String(effectiveConfig.defaultValue ?? '').trim();
    const tabRuntimeValue = tabVariableKey ? String(runtime.values[tabVariableKey] ?? '') : '';

    useEffect(() => {
        if (type !== 'tab-switcher' || !tabVariableKey || tabOptions.length <= 0) return;
        if (tabRuntimeValue) return;
        const fallbackValue = tabDefaultValue && tabOptions.some((item) => item.value === tabDefaultValue)
            ? tabDefaultValue
            : tabOptions[0]?.value;
        if (fallbackValue) {
            runtime.setVariable(tabVariableKey, fallbackValue, `tab-switcher:init:${component.id}`);
        }
    }, [component.id, runtime, tabDefaultValue, tabOptions, tabRuntimeValue, tabVariableKey, type]);

    const filterSelectVariableKey = useMemo(() => {
        if (type !== 'filter-select') return '';
        return String((effectiveConfig.variableKey as string) ?? '').trim();
    }, [effectiveConfig, type]);
    const filterSelectOptions = useMemo(() => {
        if (type !== 'filter-select') return [] as Array<{ label: string; value: string }>;
        const sourceMode = String(effectiveConfig.optionSourceMode ?? 'manual').trim().toLowerCase();
        if (sourceMode === 'data') {
            const dynamicOptions = resolveFilterOptionsFromData(cardData, effectiveConfig);
            if (dynamicOptions.length > 0) {
                return dynamicOptions;
            }
        }
        return resolveFilterOptions(effectiveConfig.options);
    }, [cardData, effectiveConfig, type]);
    const filterSelectRuntimeValue = filterSelectVariableKey ? String(runtime.values[filterSelectVariableKey] ?? '') : '';
    const filterSelectDefaultValue = String(effectiveConfig.defaultValue ?? '').trim();

    useEffect(() => {
        if (type !== 'filter-select' || !filterSelectVariableKey || filterSelectRuntimeValue) return;
        const fallbackValue = resolveFilterDefaultValue('', filterSelectDefaultValue, filterSelectOptions);
        if (!fallbackValue) return;
        runtime.setVariable(filterSelectVariableKey, fallbackValue, `filter-select:init:${component.id}`);
    }, [
        component.id,
        filterSelectDefaultValue,
        filterSelectOptions,
        filterSelectRuntimeValue,
        filterSelectVariableKey,
        runtime,
        type,
    ]);

    const filterDateStartKey = useMemo(() => {
        if (type !== 'filter-date-range') return '';
        return String((effectiveConfig.startKey as string) ?? '').trim();
    }, [effectiveConfig, type]);
    const filterDateEndKey = useMemo(() => {
        if (type !== 'filter-date-range') return '';
        return String((effectiveConfig.endKey as string) ?? '').trim();
    }, [effectiveConfig, type]);
    const filterDateStartValue = filterDateStartKey ? String(runtime.values[filterDateStartKey] ?? '') : '';
    const filterDateEndValue = filterDateEndKey ? String(runtime.values[filterDateEndKey] ?? '') : '';

    useEffect(() => {
        if (type !== 'filter-date-range') return;
        const defaults = resolveDateRangeDefaultValues(
            filterDateStartValue,
            filterDateEndValue,
            effectiveConfig.defaultStartValue,
            effectiveConfig.defaultEndValue,
        );
        if (filterDateStartKey && !filterDateStartValue && defaults.startValue) {
            runtime.setVariable(filterDateStartKey, defaults.startValue, `filter-date-range:init:${component.id}:start`);
        }
        if (filterDateEndKey && !filterDateEndValue && defaults.endValue) {
            runtime.setVariable(filterDateEndKey, defaults.endValue, `filter-date-range:init:${component.id}:end`);
        }
    }, [
        component.id,
        effectiveConfig.defaultEndValue,
        effectiveConfig.defaultStartValue,
        filterDateEndKey,
        filterDateEndValue,
        filterDateStartKey,
        filterDateStartValue,
        runtime,
        type,
    ]);

    const scheduleFilterVariableUpdate = (
        key: string,
        value: string,
        source: string,
        debounceMsRaw: unknown,
        immediate = false,
    ) => {
        const safeKey = String(key || '').trim();
        if (!safeKey) return;
        const debounceMs = normalizeFilterDebounceMs(debounceMsRaw);
        const currentTimer = filterVariableTimersRef.current.get(safeKey);
        if (currentTimer) {
            clearTimeout(currentTimer);
            filterVariableTimersRef.current.delete(safeKey);
        }
        if (immediate || debounceMs <= 0) {
            runtime.setVariable(safeKey, value, source);
            return;
        }
        const timer = setTimeout(() => {
            filterVariableTimersRef.current.delete(safeKey);
            runtime.setVariable(safeKey, value, `${source}:debounced`);
        }, debounceMs);
        filterVariableTimersRef.current.set(safeKey, timer);
    };

    const interactionMappings = useMemo(() => (
        mode === "preview" && component.interaction?.enabled
            ? (component.interaction.mappings ?? []).filter((m): m is ComponentInteractionMapping => !!m && !!m.variableKey && !!m.sourcePath)
            : []
    ), [component.interaction, mode]);
    const interactionJump = useMemo<{ template: string; openMode: 'self' | 'new-tab' } | null>(() => {
        if (mode !== 'preview' || component.interaction?.enabled !== true || component.interaction?.jumpEnabled !== true) {
            return null;
        }
        const template = String(component.interaction.jumpUrlTemplate || '').trim();
        if (!template) return null;
        return {
            template,
            openMode: component.interaction.jumpOpenMode === 'self' ? 'self' : 'new-tab',
        };
    }, [component.interaction, mode]);
    const componentActions = useMemo(() => (
        mode === 'preview'
            ? (component.actions ?? []).filter((action): action is ScreenComponentAction => normalizeScreenActionType(action?.type) !== null)
            : []
    ), [component.actions, mode]);

    const navigateToResolvedUrl = useCallback((targetUrl: string, openMode: 'self' | 'new-tab', source: string) => {
        runtime.trackEvent({
            kind: 'jump',
            key: 'jumpUrl',
            value: targetUrl,
            source,
            meta: `openMode=${openMode}`,
        });
        if (openMode === 'self') {
            if (targetUrl.startsWith('/') || (() => { try { return new URL(targetUrl).origin === window.location.origin; } catch { return false; } })()) {
                window.location.assign(targetUrl);
            }
            return;
        }
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }, [runtime]);

    const executeComponentActions = useCallback((params: Record<string, unknown>) => {
        if (mode !== 'preview' || componentActions.length === 0) {
            return;
        }
        for (const action of componentActions) {
            const actionType = normalizeScreenActionType(action.type);
            if (!actionType) {
                continue;
            }
            const mappedValues = resolveActionMappingValues(params, action.mappings);
            for (const [key, value] of Object.entries(mappedValues)) {
                runtime.setVariable(key, value, `action:${component.id}:${actionType}`);
            }
            if (actionType === 'set-variable') {
                runtime.trackEvent({
                    kind: 'action',
                    key: actionType,
                    value: Object.keys(mappedValues).join(','),
                    source: `action:${component.id}`,
                    meta: action.label || undefined,
                });
                continue;
            }
            if (actionType === 'drill-down') {
                if (!drillRuntimeEnabled || !drillState.canDrillDown) {
                    continue;
                }
                const clickedValue = resolvePreferredDrillValue(params);
                if (!clickedValue) {
                    continue;
                }
                runtime.trackEvent({
                    kind: 'drill-down',
                    key: 'drillValue',
                    value: clickedValue,
                    source: `action:${component.id}`,
                    meta: action.label || undefined,
                });
                drillState.handleDrill(clickedValue);
                continue;
            }
            if (actionType === 'drill-up') {
                if (!drillRuntimeEnabled || drillState.breadcrumbs.length <= 0) {
                    continue;
                }
                const nextDepth = Math.max(0, drillState.breadcrumbs.length - 2);
                runtime.trackEvent({
                    kind: 'drill-up',
                    key: 'drillDepth',
                    value: String(nextDepth),
                    source: `action:${component.id}`,
                    meta: action.label || undefined,
                });
                drillState.handleRollUp(nextDepth);
                continue;
            }
            if (actionType === 'jump-url') {
                const template = String(action.jumpUrlTemplate || '').trim();
                const targetUrl = resolveInteractionUrlTemplate(template, params);
                if (!targetUrl) {
                    continue;
                }
                navigateToResolvedUrl(targetUrl, action.jumpOpenMode === 'self' ? 'self' : 'new-tab', `action:${component.id}`);
                continue;
            }
            if (actionType === 'open-panel') {
                const title = resolveActionTemplateText(action.panelTitle || action.label || '详情', params);
                const body = resolveActionTemplateText(action.panelBodyTemplate || '', params);
                runtime.trackEvent({
                    kind: 'panel',
                    key: 'open-panel',
                    value: title,
                    source: `panel:${component.id}`,
                    meta: action.label || undefined,
                });
                runtime.openPanel(title || '详情', body, component.name || component.id);
                continue;
            }
            if (actionType === 'emit-intent') {
                const intentName = String(action.intentName || action.label || 'intent').trim() || 'intent';
                const payload = resolveActionTemplateText(action.intentPayloadTemplate || '', params) || JSON.stringify(mappedValues);
                runtime.trackEvent({
                    kind: 'intent',
                    key: intentName,
                    value: payload,
                    source: `intent:${component.id}`,
                    meta: action.label || undefined,
                });
            }
        }
    }, [
        component.id,
        component.name,
        componentActions,
        drillRuntimeEnabled,
        drillState.breadcrumbs.length,
        drillState.canDrillDown,
        drillState.handleDrill,
        drillState.handleRollUp,
        mode,
        navigateToResolvedUrl,
        runtime,
    ]);

    // ECharts click handler for drill-down + variable interaction
    const echartsClickHandler = useMemo(() => {
        const canDrill = drillActive && drillState.canDrillDown;
        const canInteract = interactionMappings.length > 0;
        const canJump = !!interactionJump;
        const canAction = componentActions.length > 0;
        if (!canDrill && !canInteract && !canJump && !canAction) return undefined;

        return {
            click: (params: Record<string, unknown>) => {
                if (canDrill) {
                    const value = (params.name as string | undefined)
                        ?? ((params.data as Record<string, unknown> | undefined)?.name as string | undefined);
                    if (value) {
                        const clicked = String(value);
                        runtime.trackEvent({
                            kind: 'drill-down',
                            key: 'drillValue',
                            value: clicked,
                            source: `drill:${component.id}`,
                            meta: `depth=${drillState.breadcrumbs.length}`,
                        });
                        drillState.handleDrill(clicked);
                    }
                }

                if (canInteract) {
                    for (const mapping of interactionMappings) {
                        const rawNextValue = resolveInteractionValue(params, mapping.sourcePath);
                        const nextValue = resolveInteractionMappedValue(rawNextValue, mapping);
                        if (nextValue != null) {
                            runtime.setVariable(mapping.variableKey, nextValue, `interaction:${component.id}`);
                        }
                    }
                }

                if (canJump && interactionJump) {
                    const targetUrl = resolveInteractionUrlTemplate(interactionJump.template, params);
                    if (targetUrl) {
                        navigateToResolvedUrl(targetUrl, interactionJump.openMode, `interaction:${component.id}`);
                    }
                }

                if (canAction) {
                    executeComponentActions(params);
                }
            },
        };
    }, [
        component.id,
        drillActive,
        drillState.breadcrumbs.length,
        drillState.canDrillDown,
        drillState.handleDrill,
        executeComponentActions,
        interactionJump,
        interactionMappings,
        componentActions.length,
        navigateToResolvedUrl,
        runtime,
    ]);

    const content = useMemo(() => {
        const c = effectiveConfig;
        if (runtimePlugin) {
            return (
                <PluginRenderBoundary title={`插件渲染失败: ${runtimePlugin.name}`}>
                    {runtimePlugin.render({
                        component,
                        mode,
                        theme,
                        width,
                        height,
                        config: c,
                        data: cardData,
                        runtimeValues: runtime.values,
                        setVariable: (key, value) => runtime.setVariable(key, value, `plugin:${runtimePlugin.id}`),
                    })}
                </PluginRenderBoundary>
            );
        }
        const axisFontSize = (c.axisFontSize as number) || 12;
        const legendFontSize = (c.legendFontSize as number) || 12;
        const seriesColors = Array.isArray(c.seriesColors)
            ? (c.seriesColors as string[]).filter((color) => typeof color === 'string' && color.trim().length > 0)
            : [];
        const toNumber = (raw: unknown, fallback: number, min: number, max: number) => {
            const parsed = Number(raw);
            if (!Number.isFinite(parsed)) return fallback;
            return Math.min(max, Math.max(min, parsed));
        };
        const readPaddingOverride = (key: 'chartPaddingTop' | 'chartPaddingRight' | 'chartPaddingBottom' | 'chartPaddingLeft') => {
            const parsed = Number(c[key]);
            if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
            return Math.round(Math.max(0, parsed));
        };
        const compactPresetRaw = String(c.compactLayoutPreset ?? 'auto').trim().toLowerCase();
        const compactPresetEnabled = compactPresetRaw !== 'off';
        const isCompactCanvas = compactPresetEnabled && (width < 560 || height < 320);
        const isTinyCanvas = compactPresetEnabled && (width < 420 || height < 260);
        const titleText = String(c.title ?? '').trim();
        const hasTitle = titleText.length > 0;
        const xAxisData = Array.isArray(c.xAxisData) ? (c.xAxisData as unknown[]) : [];
        const xAxisCategoryCount = xAxisData.length;
        const longestXAxisLabelLength = xAxisData.reduce<number>(
            (max, item) => Math.max(max, String(item ?? '').trim().length),
            0,
        );
        const xAxisLabelRotateRaw = Number(c.xAxisLabelRotate);
        const autoXAxisLabelRotate = isCompactCanvas && (xAxisCategoryCount >= 7 || longestXAxisLabelLength >= 8)
            ? (isTinyCanvas ? -45 : -30)
            : 0;
        const xAxisLabelRotate = Number.isFinite(xAxisLabelRotateRaw)
            ? toNumber(c.xAxisLabelRotate, 0, -90, 90)
            : autoXAxisLabelRotate;
        const xAxisLabelMaxLengthRaw = Number(c.xAxisLabelMaxLength);
        const autoXAxisLabelMaxLength = isCompactCanvas ? (isTinyCanvas ? 8 : 12) : 0;
        const xAxisLabelMaxLength = Number.isFinite(xAxisLabelMaxLengthRaw)
            ? Math.round(Math.min(40, Math.max(0, xAxisLabelMaxLengthRaw)))
            : (longestXAxisLabelLength > autoXAxisLabelMaxLength ? autoXAxisLabelMaxLength : 0);
        const formatXAxisLabel = (value: unknown) => {
            const text = String(value ?? '');
            if (xAxisLabelMaxLength <= 0 || text.length <= xAxisLabelMaxLength) {
                return text;
            }
            const keep = Math.max(1, xAxisLabelMaxLength);
            return `${text.slice(0, keep)}...`;
        };
        const legendNames = (() => {
            const out: string[] = [];
            const seen = new Set<string>();
            const push = (raw: unknown) => {
                const text = String(raw ?? '').trim();
                if (!text || seen.has(text)) return;
                seen.add(text);
                out.push(text);
            };
            if (Array.isArray(c.series)) {
                for (const item of c.series as Array<Record<string, unknown>>) {
                    push(item?.name);
                }
            }
            if (Array.isArray(c.data)) {
                for (const item of c.data as Array<Record<string, unknown>>) {
                    push(item?.name);
                }
            }
            return out;
        })();
        const legendCount = legendNames.length;
        const legendDisplayRaw = String(c.legendDisplay ?? 'auto').trim().toLowerCase();
        const legendDisplayMode = legendDisplayRaw === 'show' || legendDisplayRaw === 'hide' ? legendDisplayRaw : 'auto';
        const longestLegendTextWidth = legendNames.reduce(
            (max, name) => Math.max(max, estimateVisualTextWidth(name, legendFontSize)),
            0,
        );
        const autoHideLegendForDensity = isTinyCanvas
            && legendCount >= 16
            && longestLegendTextWidth >= 90;
        const legendVisibleByAuto = !autoHideLegendForDensity && (legendCount > 1 || !isCompactCanvas);
        const legendVisible = legendDisplayMode === 'show'
            ? true
            : (legendDisplayMode === 'hide' ? false : legendVisibleByAuto);
        const autoLegendAvoid = c.autoLegendAvoid !== false;
        const legendPosRaw = String(c.legendPosition ?? 'auto').trim().toLowerCase();
        const legendPosMode = legendPosRaw === 'top'
            || legendPosRaw === 'bottom'
            || legendPosRaw === 'left'
            || legendPosRaw === 'right'
            || legendPosRaw === 'auto'
            ? legendPosRaw
            : 'auto';
        let legendPosition: 'top' | 'bottom' | 'left' | 'right' = (() => {
            if (legendPosMode !== 'auto') {
                return legendPosMode;
            }
            if (isTinyCanvas) {
                return width >= height ? 'bottom' : 'right';
            }
            if (isCompactCanvas) {
                return legendCount >= 8
                    ? (width >= height ? 'bottom' : 'right')
                    : (width >= height ? 'top' : 'right');
            }
            return width >= height ? 'top' : 'right';
        })();
        if (legendVisible && autoLegendAvoid && isCompactCanvas && (legendPosition === 'left' || legendPosition === 'right')) {
            legendPosition = width >= height ? 'top' : 'bottom';
        }
        if (legendVisible && autoLegendAvoid && isTinyCanvas && legendPosition === 'top' && legendCount >= 8) {
            legendPosition = 'bottom';
        }
        const legendOrientRaw = String(c.legendOrient ?? 'auto').trim().toLowerCase();
        const legendOrient = legendOrientRaw === 'horizontal' || legendOrientRaw === 'vertical'
            ? legendOrientRaw
            : ((legendPosition === 'left' || legendPosition === 'right') ? 'vertical' : 'horizontal');
        const legendAlignRaw = String(c.legendAlign ?? 'auto').trim().toLowerCase();
        const legendAlign = legendAlignRaw === 'start' || legendAlignRaw === 'center' || legendAlignRaw === 'end'
            ? legendAlignRaw
            : 'auto';
        const legendItemGap = toNumber(c.legendItemGap, 12, 0, 80);
        const legendReserveOverrideRaw = Number(c.legendReserveSize);
        const legendReserveOverride = Number.isFinite(legendReserveOverrideRaw) && legendReserveOverrideRaw > 0
            ? Math.round(Math.min(360, Math.max(20, legendReserveOverrideRaw)))
            : undefined;
        const legendOffsetBoundX = Math.max(120, Math.round(width * 0.5));
        const legendOffsetBoundY = Math.max(120, Math.round(height * 0.5));
        const legendOffsetXBase = toNumber(c.legendOffsetX, 0, -legendOffsetBoundX, legendOffsetBoundX);
        const legendOffsetYBase = toNumber(c.legendOffsetY, 0, -legendOffsetBoundY, legendOffsetBoundY);
        const legendOffsetX = legendDragPreview ? legendDragPreview.x : legendOffsetXBase;
        const legendOffsetY = legendDragPreview ? legendDragPreview.y : legendOffsetYBase;
        const legendNameMaxWidthRaw = Number(c.legendNameMaxWidth);
        const legendNameMaxWidthOverride = Number.isFinite(legendNameMaxWidthRaw) && legendNameMaxWidthRaw > 0
            ? Math.round(Math.min(320, Math.max(40, legendNameMaxWidthRaw)))
            : undefined;
        const chartOffsetBoundX = Math.max(40, Math.round(width * 0.45));
        const chartOffsetBoundY = Math.max(40, Math.round(height * 0.45));
        const axisChartOffsetXBase = toNumber(c.chartOffsetX, 0, -chartOffsetBoundX, chartOffsetBoundX);
        const axisChartOffsetYBase = toNumber(c.chartOffsetY, 0, -chartOffsetBoundY, chartOffsetBoundY);
        const chartOffsetX = chartDragPreview ? chartDragPreview.x : axisChartOffsetXBase;
        const chartOffsetY = chartDragPreview ? chartDragPreview.y : axisChartOffsetYBase;
        const legendTextMaxWidth = (() => {
            if (!legendVisible || legendCount <= 0) return 0;
            if (legendNameMaxWidthOverride) {
                return legendNameMaxWidthOverride;
            }
            if (legendPosition === 'left' || legendPosition === 'right') {
                return Math.max(56, Math.min(220, Math.floor(width * 0.32)));
            }
            const slots = Math.max(1, Math.min(legendCount, isTinyCanvas ? 2 : (isCompactCanvas ? 3 : 4)));
            return Math.max(56, Math.min(240, Math.floor((width - 24) / slots) - 28));
        })();
        const shouldTruncateLegend = legendVisible
            && autoLegendAvoid
            && legendTextMaxWidth > 0
            && (isCompactCanvas || longestLegendTextWidth > legendTextMaxWidth + 8);
        const formatLegendText = (name: string) => {
            if (!shouldTruncateLegend) {
                return name;
            }
            return truncateTextByVisualWidth(String(name ?? ''), legendTextMaxWidth, legendFontSize);
        };
        const estimateHorizontalLegendReserve = () => {
            if (!legendVisible || legendCount <= 0) return 0;
            const safeWidth = Math.max(180, width - 24);
            const perItemWidth = Math.max(64, Math.min(280, Math.max(Math.round(legendFontSize * 5.8), longestLegendTextWidth + 26)));
            const itemsPerRow = Math.max(1, Math.floor(safeWidth / perItemWidth));
            const rowCount = Math.max(1, Math.ceil(Math.max(legendCount, 1) / itemsPerRow));
            const rowHeight = Math.max(18, legendFontSize + 8);
            const reserve = rowCount * rowHeight + 8;
            return Math.min(Math.max(40, Math.floor(height * 0.45)), Math.max(32, reserve));
        };
        const estimateVerticalLegendReserve = () => {
            if (!legendVisible || legendCount <= 0) return 0;
            const baseWidth = Math.max(72, Math.min(260, Math.max(Math.round(64 + legendFontSize * 3.5), longestLegendTextWidth + 26)));
            const overflowExtra = legendCount > 8 ? Math.min(60, (legendCount - 8) * 4) : 0;
            const reserve = baseWidth + overflowExtra;
            return Math.min(Math.max(76, Math.floor(width * 0.42)), Math.max(70, reserve));
        };
        const axisLegendReserveDefault = legendPosition === 'left' || legendPosition === 'right'
            ? estimateVerticalLegendReserve()
            : estimateHorizontalLegendReserve();
        const visualLegendReserveDefault = legendPosition === 'left' || legendPosition === 'right'
            ? Math.max(50, axisLegendReserveDefault - 14)
            : Math.max(28, axisLegendReserveDefault - 10);
        const axisLegendReserve = legendReserveOverride ?? axisLegendReserveDefault;
        const visualLegendReserve = legendReserveOverride ?? visualLegendReserveDefault;
        const legendBaseLayout: Record<string, unknown> = (() => {
            if (!legendVisible) {
                return {};
            }
            const resolvedAlign = legendAlign === 'auto'
                ? ((autoLegendAvoid && isCompactCanvas && legendCount > 8) ? 'start' : 'center')
                : legendAlign;
            if (legendPosition === 'bottom') {
                if (resolvedAlign === 'start') return { top: 'auto', bottom: 4, left: 8 };
                if (resolvedAlign === 'end') return { top: 'auto', bottom: 4, right: 8 };
                return { top: 'auto', bottom: 4, left: 'center' };
            }
            if (legendPosition === 'left') {
                if (resolvedAlign === 'start') return { left: 4, top: 8 };
                if (resolvedAlign === 'end') return { left: 4, bottom: 8 };
                return { left: 4, top: 'middle' };
            }
            if (legendPosition === 'right') {
                if (resolvedAlign === 'start') return { right: 4, top: 8 };
                if (resolvedAlign === 'end') return { right: 4, bottom: 8 };
                return { right: 4, top: 'middle' };
            }
            if (resolvedAlign === 'start') return { top: 4, left: 8 };
            if (resolvedAlign === 'end') return { top: 4, right: 8 };
            return { top: 4, left: 'center' };
        })();
        const estimateLegendRenderSize = () => {
            if (!legendVisible || legendCount <= 0) {
                return { width: 0, height: 0 };
            }
            if (legendOrient === 'vertical') {
                const lineHeight = Math.max(18, legendFontSize + 8);
                const estimatedHeight = Math.min(height - 16, Math.max(lineHeight + 8, legendCount * lineHeight));
                const estimatedWidth = Math.min(
                    width - 16,
                    Math.max(72, (legendNameMaxWidthOverride ?? Math.min(260, longestLegendTextWidth)) + 26),
                );
                return { width: estimatedWidth, height: estimatedHeight };
            }
            const perItemWidth = Math.max(64, Math.min(280, Math.max((legendNameMaxWidthOverride ?? longestLegendTextWidth) + 26, Math.round(legendFontSize * 5.8))));
            const itemsPerRow = Math.max(1, Math.floor(Math.max(180, width - 24) / perItemWidth));
            const rows = Math.max(1, Math.ceil(legendCount / itemsPerRow));
            const estimatedWidth = Math.min(width - 16, Math.max(perItemWidth, itemsPerRow * perItemWidth));
            const estimatedHeight = Math.min(height - 16, Math.max(24, rows * (legendFontSize + 8) + 8));
            return { width: estimatedWidth, height: estimatedHeight };
        };
        const legendLayout: Record<string, unknown> = (() => {
            if (!legendVisible || (legendOffsetX === 0 && legendOffsetY === 0)) {
                return legendBaseLayout;
            }
            const next = { ...legendBaseLayout } as Record<string, unknown>;
            const est = estimateLegendRenderSize();
            const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
            if (legendOffsetX !== 0) {
                if (typeof next.left === 'number') {
                    next.left = Math.round(clamp(next.left + legendOffsetX, 0, Math.max(0, width - est.width)));
                } else if (typeof next.right === 'number') {
                    next.right = Math.round(clamp(next.right - legendOffsetX, 0, Math.max(0, width - est.width)));
                } else if (next.left === 'center') {
                    next.left = Math.round(clamp(((width - est.width) / 2) + legendOffsetX, 0, Math.max(0, width - est.width)));
                }
            }
            if (legendOffsetY !== 0) {
                if (typeof next.top === 'number') {
                    next.top = Math.round(clamp(next.top + legendOffsetY, 0, Math.max(0, height - est.height)));
                } else if (typeof next.bottom === 'number') {
                    next.bottom = Math.round(clamp(next.bottom - legendOffsetY, 0, Math.max(0, height - est.height)));
                } else if (next.top === 'middle') {
                    next.top = Math.round(clamp(((height - est.height) / 2) + legendOffsetY, 0, Math.max(0, height - est.height)));
                }
            }
            return next;
        })();
        const legendDragEnabled = mode === 'designer'
            && c.legendDragEnabled === true
            && legendVisible
            && legendCount > 0;
        const chartDragEnabled = mode === 'designer'
            && c.chartDragEnabled === true;
        const legendBoxRect = (() => {
            if (!legendVisible) {
                return { left: 0, top: 0, width: 0, height: 0 };
            }
            const est = estimateLegendRenderSize();
            const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
            let left = 8;
            if (typeof legendLayout.left === 'number') {
                left = legendLayout.left;
            } else if (typeof legendLayout.right === 'number') {
                left = width - legendLayout.right - est.width;
            } else if (legendLayout.left === 'center') {
                left = (width - est.width) / 2;
            }
            let top = 8;
            if (typeof legendLayout.top === 'number') {
                top = legendLayout.top;
            } else if (typeof legendLayout.bottom === 'number') {
                top = height - legendLayout.bottom - est.height;
            } else if (legendLayout.top === 'middle') {
                top = (height - est.height) / 2;
            }
            return {
                left: Math.round(clamp(left, 0, Math.max(0, width - est.width))),
                top: Math.round(clamp(top, 0, Math.max(0, height - est.height))),
                width: Math.max(0, est.width),
                height: Math.max(0, est.height),
            };
        })();
        const legendDragHandleStyle = legendDragEnabled ? {
            position: 'absolute' as const,
            left: Math.max(2, Math.min(width - 14, Math.round(legendBoxRect.left + Math.max(8, legendBoxRect.width / 2) - 6))),
            top: Math.max(2, Math.min(height - 14, Math.round(legendBoxRect.top + 2))),
            width: 12,
            height: 12,
            borderRadius: 999,
            border: `1px solid ${t.textPrimary}`,
            background: t.echarts.colorPalette?.[0] || t.accentColor,
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            cursor: 'grab',
            zIndex: 20,
            opacity: 0.9,
            padding: 0,
        } : null;
        const legendConfig: Record<string, unknown> = {
            show: legendVisible,
            type: c.legendScrollable === false ? 'plain' : 'scroll',
            orient: legendOrient,
            itemGap: legendItemGap,
            ...(shouldTruncateLegend ? { formatter: (name: string) => formatLegendText(name) } : {}),
            textStyle: { color: t.textPrimary, fontSize: legendFontSize },
            pageTextStyle: { color: t.textSecondary, fontSize: Math.max(10, legendFontSize - 1) },
            pageIconColor: t.textSecondary,
            pageIconInactiveColor: t.textMuted,
            ...legendLayout,
        };
        const axisLabelBottomBoost = Math.abs(xAxisLabelRotate) >= 30 ? 16 : 0;
        const axisLabelEllipsisBoost = xAxisLabelMaxLength > 0 ? 6 : 0;
        const axisAutoPadding = {
            left: 56 + (legendPosition === 'left' ? axisLegendReserve : 0),
            right: 30 + (legendPosition === 'right' ? axisLegendReserve : 0),
            top: 18 + (hasTitle ? 28 : 0) + (legendPosition === 'top' ? axisLegendReserve : 0),
            bottom: 42 + (legendPosition === 'bottom' ? axisLegendReserve : 0) + axisLabelBottomBoost + axisLabelEllipsisBoost,
        };
        const axisBaseLeft = readPaddingOverride('chartPaddingLeft') ?? axisAutoPadding.left;
        const axisBaseRight = readPaddingOverride('chartPaddingRight') ?? axisAutoPadding.right;
        const axisBaseTop = readPaddingOverride('chartPaddingTop') ?? axisAutoPadding.top;
        const axisBaseBottom = readPaddingOverride('chartPaddingBottom') ?? axisAutoPadding.bottom;
        const axisGrid = {
            left: Math.max(0, axisBaseLeft + Math.max(0, chartOffsetX)),
            right: Math.max(0, axisBaseRight + Math.max(0, -chartOffsetX)),
            top: Math.max(0, axisBaseTop + Math.max(0, chartOffsetY)),
            bottom: Math.max(0, axisBaseBottom + Math.max(0, -chartOffsetY)),
            containLabel: true,
        };
        const xAxisLabelIntervalRaw = Number(c.xAxisLabelInterval);
        const autoXAxisLabelInterval = (() => {
            if (!xAxisCategoryCount || xAxisCategoryCount <= 1) return 0;
            if (!isCompactCanvas && xAxisCategoryCount <= 12) return 0;
            const projectedWidth = Math.max(
                axisFontSize + 6,
                estimateVisualTextWidth('W'.repeat(Math.max(1, Math.min(16, xAxisLabelMaxLength || longestXAxisLabelLength))), axisFontSize),
            );
            const plotSpan = Math.max(120, width - axisGrid.left - axisGrid.right);
            const perCategorySpan = Math.max(8, plotSpan / xAxisCategoryCount);
            const rotationFactor = Math.max(0.3, Math.cos(Math.abs(xAxisLabelRotate) * Math.PI / 180));
            const neededStep = Math.ceil((projectedWidth * rotationFactor) / perCategorySpan);
            return Math.max(0, Math.min(xAxisCategoryCount - 1, neededStep - 1));
        })();
        const xAxisLabelInterval = Number.isFinite(xAxisLabelIntervalRaw) && xAxisLabelIntervalRaw > 0
            ? Math.max(0, Math.round(xAxisLabelIntervalRaw))
            : autoXAxisLabelInterval;
        const visualAutoPadding = {
            left: 12 + (legendPosition === 'left' ? visualLegendReserve : 0),
            right: 12 + (legendPosition === 'right' ? visualLegendReserve : 0),
            top: 12 + (hasTitle ? 28 : 0) + (legendPosition === 'top' ? visualLegendReserve : 0),
            bottom: 12 + (legendPosition === 'bottom' ? visualLegendReserve : 0),
        };
        const visualPadding = {
            left: readPaddingOverride('chartPaddingLeft') ?? visualAutoPadding.left,
            right: readPaddingOverride('chartPaddingRight') ?? visualAutoPadding.right,
            top: readPaddingOverride('chartPaddingTop') ?? visualAutoPadding.top,
            bottom: readPaddingOverride('chartPaddingBottom') ?? visualAutoPadding.bottom,
        };
        const chartScalePercentRaw = Number(c.chartScalePercent);
        const chartScalePercent = Number.isFinite(chartScalePercentRaw)
            ? toNumber(c.chartScalePercent, 100, 40, 180)
            : (isCompactCanvas ? (isTinyCanvas ? 82 : 90) : 100);
        const chartScale = chartScalePercent / 100;
        const seriesLabelPositionRaw = String(c.seriesLabelPosition ?? 'auto').trim().toLowerCase();
        const seriesLabelPosition = seriesLabelPositionRaw === 'inside'
            || seriesLabelPositionRaw === 'outside'
            || seriesLabelPositionRaw === 'none'
            ? seriesLabelPositionRaw
            : 'auto';
        const seriesLabelFontSize = toNumber(c.seriesLabelFontSize, 12, 10, 28);
        const seriesLabelMinAngleRaw = Number(c.seriesLabelMinAngle);
        const seriesLabelMinAngle = Number.isFinite(seriesLabelMinAngleRaw) && seriesLabelMinAngleRaw > 0
            ? toNumber(c.seriesLabelMinAngle, 2, 1, 45)
            : (isTinyCanvas ? 8 : 2);
        const seriesLabelLineLengthRaw = Number(c.seriesLabelLineLength);
        const seriesLabelLineLength2Raw = Number(c.seriesLabelLineLength2);
        const seriesLabelLineLength = Number.isFinite(seriesLabelLineLengthRaw) && seriesLabelLineLengthRaw > 0
            ? toNumber(c.seriesLabelLineLength, 12, 4, 60)
            : (isTinyCanvas ? 8 : 15);
        const seriesLabelLineLength2 = Number.isFinite(seriesLabelLineLength2Raw) && seriesLabelLineLength2Raw > 0
            ? toNumber(c.seriesLabelLineLength2, 8, 3, 60)
            : (isTinyCanvas ? 5 : 10);
        const axisSeries = Array.isArray(c.series)
            ? (c.series as Array<Record<string, unknown>>)
            : [];
        const axisSeriesCount = axisSeries.length;
        const axisSeriesPointCount = axisSeries.reduce((sum, item) => {
            const data = item?.data;
            return sum + (Array.isArray(data) ? data.length : 0);
        }, 0);
        const axisSeriesDensity = xAxisCategoryCount * Math.max(axisSeriesCount, 1);
        const axisSeriesLabelAutoHide = isCompactCanvas
            ? axisSeriesDensity > (isTinyCanvas ? 18 : 28)
            : axisSeriesDensity > 40;
        const axisSeriesLabelStrategyRaw = String(c.axisSeriesLabelStrategy ?? 'auto').trim().toLowerCase();
        const axisSeriesLabelStrategy = axisSeriesLabelStrategyRaw === 'all'
            || axisSeriesLabelStrategyRaw === 'first'
            || axisSeriesLabelStrategyRaw === 'none'
            ? axisSeriesLabelStrategyRaw
            : 'auto';
        const resolvedAxisSeriesLabelStrategy = (() => {
            if (axisSeriesLabelStrategy !== 'auto') {
                return axisSeriesLabelStrategy;
            }
            if (seriesLabelPosition === 'none' || axisSeriesLabelAutoHide) {
                return 'none';
            }
            if (isTinyCanvas) {
                return axisSeriesCount > 1 ? 'first' : 'all';
            }
            if (axisSeriesCount >= 3 || axisSeriesDensity > 30) {
                return 'first';
            }
            return 'all';
        })();
        const axisSeriesLabelShow = resolvedAxisSeriesLabelStrategy !== 'none';
        const axisSeriesLabelStepRaw = Number(c.axisSeriesLabelStep);
        const autoAxisSeriesLabelStep = (() => {
            if (xAxisCategoryCount <= 0) return 1;
            const baseTarget = isTinyCanvas ? 5 : (isCompactCanvas ? 8 : 12);
            const target = resolvedAxisSeriesLabelStrategy === 'all'
                ? baseTarget
                : Math.max(4, Math.round(baseTarget * 0.8));
            const step = Math.ceil(xAxisCategoryCount / Math.max(1, target));
            return Math.max(1, step);
        })();
        const axisSeriesLabelStep = Number.isFinite(axisSeriesLabelStepRaw) && axisSeriesLabelStepRaw > 0
            ? Math.max(1, Math.round(axisSeriesLabelStepRaw))
            : autoAxisSeriesLabelStep;
        const axisLineLabelPosition = seriesLabelPosition === 'inside' ? 'inside' : 'top';
        const axisBarLabelPosition = seriesLabelPosition === 'inside' ? 'insideTop' : 'top';
        const axisBarLabelColor = axisBarLabelPosition === 'insideTop' ? '#ffffff' : t.textPrimary;
        const formatMeasureValue = (raw: unknown): string => {
            const parsed = Number(raw);
            if (Number.isFinite(parsed)) {
                if (Number.isInteger(parsed)) {
                    return parsed.toLocaleString('zh-CN');
                }
                return parsed.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
            }
            return String(raw ?? '');
        };
        const resolveAxisPointValue = (raw: unknown): unknown => {
            if (Array.isArray(raw)) {
                for (let i = raw.length - 1; i >= 0; i -= 1) {
                    const item = raw[i];
                    if (item !== null && item !== undefined && item !== '') {
                        return item;
                    }
                }
                return '';
            }
            if (raw && typeof raw === 'object') {
                const row = raw as Record<string, unknown>;
                if ('value' in row) {
                    return resolveAxisPointValue(row.value);
                }
            }
            return raw;
        };
        const axisSeriesLabelFormatter = (raw: unknown) => {
            const row = raw && typeof raw === 'object'
                ? (raw as Record<string, unknown>)
                : null;
            const dataIndexRaw = Number(row?.dataIndex);
            if (axisSeriesLabelStep > 1 && Number.isFinite(dataIndexRaw) && dataIndexRaw >= 0) {
                const dataIndex = Math.round(dataIndexRaw);
                if (dataIndex % axisSeriesLabelStep !== 0) {
                    return '';
                }
            }
            const value = resolveAxisPointValue(row?.value ?? raw);
            return formatMeasureValue(value);
        };
        const axisTooltipMaxRowsRaw = Number(c.axisTooltipMaxRows);
        const axisTooltipMaxRows = Number.isFinite(axisTooltipMaxRowsRaw) && axisTooltipMaxRowsRaw > 0
            ? Math.min(50, Math.max(1, Math.round(axisTooltipMaxRowsRaw)))
            : (isTinyCanvas ? 4 : (isCompactCanvas ? 6 : 10));
        const axisTooltipFormatter = (raw: unknown) => {
            const rows = Array.isArray(raw)
                ? raw as Array<Record<string, unknown>>
                : [raw as Record<string, unknown>];
            if (rows.length === 0) {
                return '';
            }
            const first = rows[0] ?? {};
            const axisTitle = String(first.axisValueLabel ?? first.axisValue ?? first.name ?? '').trim();
            const lines = [axisTitle];
            const withPriority = rows.map((row, index) => {
                const value = resolveAxisPointValue(row.value ?? row.data);
                const numeric = Number(value);
                return {
                    row,
                    index,
                    value,
                    weight: Number.isFinite(numeric) ? Math.abs(numeric) : -1,
                };
            });
            const limitedRows = withPriority.length > axisTooltipMaxRows
                ? [...withPriority]
                    .sort((a, b) => (b.weight - a.weight) || (a.index - b.index))
                    .slice(0, axisTooltipMaxRows)
                    .sort((a, b) => a.index - b.index)
                : withPriority;
            for (const item of limitedRows) {
                const row = item.row;
                const marker = typeof row.marker === 'string' ? row.marker : '';
                const seriesName = String(row.seriesName ?? '').trim() || '系列';
                lines.push(`${marker}${seriesName}: ${formatMeasureValue(item.value)}`);
            }
            const hidden = rows.length - limitedRows.length;
            if (hidden > 0) {
                lines.push(`... 其余 ${hidden} 项`);
            }
            return lines.join('<br/>');
        };
        const seriesDataCount = Array.isArray(c.data) ? c.data.length : 0;
        const forceInsideForTiny = isTinyCanvas && seriesDataCount >= 6 && seriesLabelPosition === 'auto';
        const pieLabelPosition = forceInsideForTiny
            ? 'inside'
            : (seriesLabelPosition === 'auto'
                ? 'outside'
                : (seriesLabelPosition === 'outside' ? 'outside' : 'inside'));
        const funnelLabelPosition = forceInsideForTiny
            ? 'inside'
            : (seriesLabelPosition === 'outside' ? 'right' : 'inside');
        const pieLabelShow = seriesLabelPosition !== 'none' && !(isTinyCanvas && seriesDataCount >= 10);
        const funnelLabelShow = seriesLabelPosition !== 'none' && !(isTinyCanvas && seriesDataCount >= 9);
        const chartDataPointCount = (() => {
            if (axisSeriesCount > 0) {
                return axisSeriesPointCount;
            }
            if (Array.isArray(c.data)) {
                return c.data.length;
            }
            return 0;
        })();
        const disableChartAnimation = isTinyCanvas || chartDataPointCount > 2000;
        const chartMotionOption = disableChartAnimation
            ? { animation: false, animationDuration: 0, animationDurationUpdate: 0 }
            : {};
        const plotWidth = Math.max(40, width - visualPadding.left - visualPadding.right);
        const plotHeight = Math.max(40, height - visualPadding.top - visualPadding.bottom);
        const plotCenterX = visualPadding.left + (plotWidth / 2) + chartOffsetX;
        const plotCenterY = visualPadding.top + (plotHeight / 2) + chartOffsetY;
        const pieOuterRadius = Math.max(20, Math.min(plotWidth, plotHeight) * 0.36 * chartScale);
        const pieInnerRadius = Math.max(10, pieOuterRadius * 0.58);
        const radarRadius = Math.max(20, Math.min(plotWidth, plotHeight) * 0.42 * chartScale);
        const funnelLeft = Math.max(0, visualPadding.left + chartOffsetX);
        const funnelRight = Math.max(0, visualPadding.right - chartOffsetX);
        const funnelTop = Math.max(0, visualPadding.top + chartOffsetY);
        const funnelBottom = Math.max(0, visualPadding.bottom - chartOffsetY);
        const chartDragHandleStyle = chartDragEnabled ? {
            position: 'absolute' as const,
            left: Math.max(2, Math.min(width - 14, Math.round(plotCenterX) - 6)),
            top: Math.max(2, Math.min(height - 14, Math.round(plotCenterY) - 6)),
            width: 12,
            height: 12,
            borderRadius: 3,
            border: `1px solid ${t.textPrimary}`,
            background: t.echarts.colorPalette?.[1] || t.accentColor,
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
            cursor: 'move',
            zIndex: 20,
            opacity: 0.92,
            padding: 0,
        } : null;
        const renderUnavailableState = (title: string, detail?: string) => (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: t.placeholder.background,
                border: t.placeholder.border,
                borderRadius: 8,
                color: t.placeholder.color,
                fontSize: 12,
                textAlign: 'center',
                padding: 12,
            }}>
                <strong style={{ fontSize: 12, fontWeight: 600 }}>{title}</strong>
                {detail ? (
                    <span style={{ fontSize: 11, opacity: 0.82, lineHeight: 1.5 }}>{detail}</span>
                ) : null}
            </div>
        );

        if (ECHART_COMPONENT_TYPES.has(type) && !EChartsComponent) {
            return renderUnavailableState('图表引擎未就绪', '正在加载 ECharts 运行时，请稍候。');
        }
        if (DATAV_COMPONENT_TYPES.has(type) && !dataViewModule) {
            return renderUnavailableState('DataV 运行时未就绪', '正在加载 DataV 组件运行时，请稍候。');
        }

        const EChart = EChartsComponent as ReactEChartsComponent;
        const ScrollBoard = dataViewModule?.ScrollBoard;
        const ScrollRankingBoard = dataViewModule?.ScrollRankingBoard;
        const WaterLevelPond = dataViewModule?.WaterLevelPond;
        const DigitalFlop = dataViewModule?.DigitalFlop;
        const renderEChartWithHandles = (
            option: Record<string, unknown>,
            onEvents?: Record<string, (params: Record<string, unknown>) => void>,
        ) => {
            // Inject markLine / markArea / conditionalColors from config
            const annotatedOption = injectChartAnnotations(option, c);
            const chartNode = (
                <EChart
                    style={{ width: '100%', height: '100%' }}
                    option={annotatedOption}
                    onEvents={onEvents}
                />
            );
            const showLegendHandle = legendDragEnabled && !!legendDragHandleStyle;
            const showChartHandle = chartDragEnabled && !!chartDragHandleStyle;
            if (!showLegendHandle && !showChartHandle) {
                return chartNode;
            }
            const handleLegendHandleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                event.stopPropagation();
                clearLegendDragHandlers();
                clearChartDragHandlers();
                const startClientX = event.clientX;
                const startClientY = event.clientY;
                const startOffsetX = legendOffsetX;
                const startOffsetY = legendOffsetY;
                let lastOffsetX = startOffsetX;
                let lastOffsetY = startOffsetY;
                const clampX = (value: number) => Math.round(Math.min(legendOffsetBoundX, Math.max(-legendOffsetBoundX, value)));
                const clampY = (value: number) => Math.round(Math.min(legendOffsetBoundY, Math.max(-legendOffsetBoundY, value)));
                const move = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startClientX;
                    const deltaY = moveEvent.clientY - startClientY;
                    lastOffsetX = clampX(startOffsetX + deltaX);
                    lastOffsetY = clampY(startOffsetY + deltaY);
                    setLegendDragPreview({ x: lastOffsetX, y: lastOffsetY });
                };
                const up = () => {
                    clearLegendDragHandlers();
                    setLegendDragPreview(null);
                    if ((lastOffsetX !== startOffsetX || lastOffsetY !== startOffsetY) && onConfigMetaRef.current) {
                        onConfigMetaRef.current({
                            legendOffsetX: lastOffsetX,
                            legendOffsetY: lastOffsetY,
                            legendDragEnabled: true,
                        });
                    }
                };
                legendDragHandlersRef.current = { move, up };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            };
            const handleChartHandleMouseDown = (event: ReactMouseEvent<HTMLButtonElement>) => {
                event.preventDefault();
                event.stopPropagation();
                clearLegendDragHandlers();
                clearChartDragHandlers();
                const startClientX = event.clientX;
                const startClientY = event.clientY;
                const startOffsetX = chartOffsetX;
                const startOffsetY = chartOffsetY;
                let lastOffsetX = startOffsetX;
                let lastOffsetY = startOffsetY;
                const clampX = (value: number) => Math.round(Math.min(chartOffsetBoundX, Math.max(-chartOffsetBoundX, value)));
                const clampY = (value: number) => Math.round(Math.min(chartOffsetBoundY, Math.max(-chartOffsetBoundY, value)));
                const move = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startClientX;
                    const deltaY = moveEvent.clientY - startClientY;
                    lastOffsetX = clampX(startOffsetX + deltaX);
                    lastOffsetY = clampY(startOffsetY + deltaY);
                    setChartDragPreview({ x: lastOffsetX, y: lastOffsetY });
                };
                const up = () => {
                    clearChartDragHandlers();
                    setChartDragPreview(null);
                    if ((lastOffsetX !== startOffsetX || lastOffsetY !== startOffsetY) && onConfigMetaRef.current) {
                        onConfigMetaRef.current({
                            chartOffsetX: lastOffsetX,
                            chartOffsetY: lastOffsetY,
                            chartDragEnabled: true,
                        });
                    }
                };
                chartDragHandlersRef.current = { move, up };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
            };
            return (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {chartNode}
                    {showLegendHandle ? (
                        <button
                            type="button"
                            style={legendDragHandleStyle!}
                            onMouseDown={handleLegendHandleMouseDown}
                            title="拖拽微调图例位置"
                        />
                    ) : null}
                    {showChartHandle ? (
                        <button
                            type="button"
                            style={chartDragHandleStyle!}
                            onMouseDown={handleChartHandleMouseDown}
                            title="拖拽微调图形位置"
                        />
                    ) : null}
                </div>
            );
        };

        // Build the shared context for section renderers
        const ctx: RenderSectionContext = {
            component, mode, theme, width, height, c, t, themeOptions,
            EChartsComponent, EChart, echartsClickHandler, renderEChartWithHandles,
            renderUnavailableState, axisFontSize, legendFontSize, seriesColors,
            chartMotionOption, legendConfig, axisGrid, xAxisLabelRotate,
            xAxisLabelInterval, formatXAxisLabel, axisTooltipFormatter,
            axisSeriesLabelShow, resolvedAxisSeriesLabelStrategy,
            axisLineLabelPosition, axisBarLabelPosition, axisBarLabelColor,
            seriesLabelFontSize, axisSeriesLabelFormatter,
            isTinyCanvas, isCompactCanvas, plotCenterX, plotCenterY,
            pieOuterRadius, pieInnerRadius, radarRadius,
            funnelLeft, funnelRight, funnelTop, funnelBottom,
            chartScale, visualPadding, pieLabelPosition, pieLabelShow,
            funnelLabelPosition, funnelLabelShow, seriesLabelLineLength,
            seriesLabelLineLength2, seriesLabelMinAngle, xAxisCategoryCount,
            dataViewModule, ScrollBoard, ScrollRankingBoard, WaterLevelPond, DigitalFlop,
            borderBoxComponents, decorationComponents,
            hasMapFn, mapReadyVersion, mapDrillRegion, setMapDrillRegion,
            tableSort, setTableSort, tablePage, setTablePage,
            runtime, currentTime, cardData, filterInputDraft, setFilterInputDraft,
            scheduleFilterVariableUpdate, tabVariableKey, tabOptions,
            tabDefaultValue, tabRuntimeValue, filterSelectVariableKey,
            filterSelectOptions, filterDateStartKey, filterDateEndKey,
            carouselItems, carouselIndex, setCarouselIndex,
            carouselPaused, setCarouselPaused,
            drillRuntimeEnabled, drillState, drillActive,
            componentActions, executeComponentActions,
        };

        // Delegate to section renderers
        const echartsResult = renderEChartsSection(type, ctx);
        if (echartsResult !== undefined) return echartsResult;

        const basicResult = renderBasicComponentSection(type, ctx);
        if (basicResult !== undefined) return basicResult;

        const datavResult = renderDataVSection(type, ctx);
        if (datavResult !== undefined) return datavResult;

        const specialResult = renderSpecialSection(type, ctx);
        if (specialResult !== undefined) return specialResult;

        return renderUnavailableState('组件类型未注册', `当前运行态未找到 ${type} 的渲染器。`);
    }, [
        type,
        effectiveConfig,
        width,
        height,
        currentTime,
        echartsClickHandler,
        t,
        theme,
        themeOptions,
        EChartsComponent,
        dataViewModule,
        borderBoxComponents,
        decorationComponents,
        cardData,
        component,
        mode,
        hasMapFn,
        mapReadyVersion,
        mapDrillRegion,
        tableSort,
        tablePage,
        filterInputDraft,
        legendDragPreview,
        clearLegendDragHandlers,
        runtime.values,
        runtime,
        runtimePlugin,
    ]);

    return (
        !visibleByVariableRule ? null : (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {content}
            {/* Drill-down breadcrumb overlay */}
            {drillRuntimeEnabled && drillState.breadcrumbs.length > 1 && (
                <div style={{
                    position: 'absolute', top: 4, left: 4,
                    display: 'flex', alignItems: 'center', gap: 2,
                    background: t.breadcrumb.background,
                    padding: '2px 8px', borderRadius: 4,
                    fontSize: 11, color: t.breadcrumb.textColor, zIndex: 10,
                }}>
                    {drillState.breadcrumbs.map((crumb, i) => {
                        const isLast = i === drillState.breadcrumbs.length - 1;
                        return (
                            <span key={crumb.depth} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {i > 0 && <span style={{ color: t.textMuted, margin: '0 2px' }}>/</span>}
                                {isLast ? (
                                    <span style={{ color: t.textPrimary }}>{crumb.label}</span>
                                ) : (
                                    <span
                                        style={{ color: t.breadcrumb.linkColor, cursor: 'pointer' }}
                                        onClick={() => {
                                            runtime.trackEvent({
                                                kind: 'drill-up',
                                                key: 'drillDepth',
                                                value: String(crumb.depth),
                                                source: `drill:${component.id}`,
                                            });
                                            drillState.handleRollUp(crumb.depth);
                                        }}
                                    >
                                        {crumb.label}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}
            {/* Card data source loading indicator */}
            {cardLoading && (
                <div style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 8, height: 8, borderRadius: '50%',
                    background: t.accentColor,
                    animation: 'pulse 1.5s ease-in-out infinite',
                }} />
            )}
            {/* Card data source error indicator */}
            {cardError && (
                <div style={{
                    position: 'absolute', bottom: 4, left: 4,
                    fontSize: 10, color: '#ef4444',
                    background: t.errorBg,
                    padding: '2px 6px', borderRadius: 3,
                    maxWidth: '80%', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }} title={cardError}>
                    {cardError}
                </div>
            )}
            {pluginMeta && !runtimePlugin && (
                <div style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    fontSize: 10,
                    color: '#fbbf24',
                    background: 'rgba(30,41,59,0.85)',
                    padding: '2px 6px',
                    borderRadius: 3,
                    maxWidth: '60%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }} title="插件未加载，已使用基础组件渲染">
                    插件未注册，已降级到基础组件
                </div>
                )}
            </div>
        )
    );
});
