import type { ComponentType, MouseEvent as ReactMouseEvent } from 'react';
import type { ChartMarkArea, ChartMarkLine, SeriesConditionalColor } from '../../types';
import type { ReactEChartsComponent, DataViewModule } from '../../renderers/types';

export const ECHART_COMPONENT_TYPES = new Set([
    'line-chart',
    'bar-chart',
    'pie-chart',
    'gauge-chart',
    'radar-chart',
    'funnel-chart',
    'scatter-chart',
    'map-chart',
    'combo-chart',
    'wordcloud-chart',
    'treemap-chart',
    'sunburst-chart',
    'waterfall-chart',
    'globe-chart',
    'bar3d-chart',
    'scatter3d-chart',
]);

export const ECHART_3D_TYPES = new Set(['globe-chart', 'bar3d-chart', 'scatter3d-chart']);

export const DATAV_COMPONENT_TYPES = new Set([
    'border-box',
    'decoration',
    'scroll-board',
    'scroll-ranking',
    'water-level',
    'digital-flop',
]);

export function isWebGLSupported(): boolean {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
    } catch {
        return false;
    }
}

// ── Chart annotation injection ──
const ANNOTATABLE_TYPES = new Set(['line-chart', 'bar-chart', 'scatter-chart', 'combo-chart', 'waterfall-chart']);

export function injectChartAnnotations(
    option: Record<string, unknown>,
    config: Record<string, unknown>,
): Record<string, unknown> {
    const markLines = config.markLines as ChartMarkLine[] | undefined;
    const markAreas = config.markAreas as ChartMarkArea[] | undefined;
    const conditionalColors = config.conditionalColors as SeriesConditionalColor[] | undefined;

    if ((!markLines || markLines.length === 0) && (!markAreas || markAreas.length === 0) && (!conditionalColors || conditionalColors.length === 0)) {
        return option;
    }

    const series = option.series as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(series) || series.length === 0) return option;

    // Build ECharts markLine data
    const markLineData: Array<Record<string, unknown>> = [];
    if (markLines) {
        for (const ml of markLines) {
            if (ml.type === 'value' && ml.value != null) {
                const item: Record<string, unknown> = {
                    name: ml.name ?? `${ml.value}`,
                    label: { formatter: ml.name ?? `${ml.value}`, position: 'insideEndTop' },
                    lineStyle: { color: ml.color ?? '#ff6b6b', type: ml.lineStyle ?? 'dashed' },
                };
                if (ml.axis === 'x') {
                    item.xAxis = ml.value;
                } else {
                    item.yAxis = ml.value;
                }
                markLineData.push(item);
            } else if (ml.type === 'average' || ml.type === 'min' || ml.type === 'max') {
                markLineData.push({
                    type: ml.type,
                    name: ml.name ?? ml.type,
                    label: { formatter: ml.name ?? ml.type, position: 'insideEndTop' },
                    lineStyle: { color: ml.color ?? '#facc15', type: ml.lineStyle ?? 'dashed' },
                });
            }
        }
    }

    // Build ECharts markArea data
    const markAreaData: Array<Array<Record<string, unknown>>> = [];
    if (markAreas) {
        for (const ma of markAreas) {
            const start: Record<string, unknown> = { name: ma.name ?? '' };
            const end: Record<string, unknown> = {};
            if (ma.axis === 'x') {
                start.xAxis = ma.from;
                end.xAxis = ma.to;
            } else {
                start.yAxis = ma.from;
                end.yAxis = ma.to;
            }
            start.itemStyle = { color: ma.color ?? 'rgba(255, 107, 107, 0.15)' };
            markAreaData.push([start, end]);
        }
    }

    // Build conditional color function
    let colorFn: ((params: { value: unknown }) => string) | undefined;
    if (conditionalColors && conditionalColors.length > 0) {
        colorFn = (params: { value: unknown }) => {
            const val = typeof params.value === 'number' ? params.value : (Array.isArray(params.value) ? Number(params.value[1]) : Number(params.value));
            for (const rule of conditionalColors) {
                let match = false;
                switch (rule.operator) {
                    case '>': match = val > rule.value; break;
                    case '>=': match = val >= rule.value; break;
                    case '<': match = val < rule.value; break;
                    case '<=': match = val <= rule.value; break;
                    case '==': match = val === rule.value; break;
                    case 'between': match = val >= rule.value && val <= (rule.valueTo ?? rule.value); break;
                }
                if (match) return rule.color;
            }
            return '';
        };
    }

    // Inject into first series (markLine/markArea) and all series (conditionalColors)
    const patched = series.map((s, idx) => {
        const result = { ...s };
        if (idx === 0) {
            if (markLineData.length > 0) {
                result.markLine = { symbol: ['none', 'arrow'], data: markLineData, silent: true };
            }
            if (markAreaData.length > 0) {
                result.markArea = { data: markAreaData, silent: true };
            }
        }
        if (colorFn) {
            result.itemStyle = { ...(result.itemStyle as Record<string, unknown> || {}), color: colorFn };
        }
        return result;
    });

    return { ...option, series: patched };
}

/**
 * Shared rendering context passed from the main ComponentRenderer to section renderers.
 * Contains all local variables from the `content` useMemo that the switch cases need.
 */
export interface RenderSectionContext {
    // Component props
    component: import('../../types').ScreenComponent;
    mode: 'designer' | 'preview';
    theme: string | undefined;
    width: number;
    height: number;

    // Resolved config
    c: Record<string, unknown>;
    t: ReturnType<typeof import('../../screenThemes').getThemeTokens>;
    themeOptions: {
        backgroundColor: string;
        color: string[];
        textStyle: { color: string };
        legend: { textStyle: { color: string } };
        tooltip: {
            backgroundColor: string;
            borderColor: string;
            textStyle: { color: string };
        };
    };

    // ECharts
    EChartsComponent: ReactEChartsComponent | null;
    EChart: ReactEChartsComponent;
    echartsClickHandler: Record<string, (params: Record<string, unknown>) => void> | undefined;
    renderEChartWithHandles: (
        option: Record<string, unknown>,
        onEvents?: Record<string, (params: Record<string, unknown>) => void>,
    ) => React.ReactNode;
    renderUnavailableState: (title: string, detail?: string) => React.ReactNode;

    // Chart layout computed values
    axisFontSize: number;
    legendFontSize: number;
    seriesColors: string[];
    chartMotionOption: Record<string, unknown>;
    legendConfig: Record<string, unknown>;
    axisGrid: { left: number; right: number; top: number; bottom: number; containLabel: boolean };
    xAxisLabelRotate: number;
    xAxisLabelInterval: number;
    formatXAxisLabel: (value: unknown) => string;
    axisTooltipFormatter: (raw: unknown) => string;
    axisSeriesLabelShow: boolean;
    resolvedAxisSeriesLabelStrategy: string;
    axisLineLabelPosition: string;
    axisBarLabelPosition: string;
    axisBarLabelColor: string;
    seriesLabelFontSize: number;
    axisSeriesLabelFormatter: (raw: unknown) => string;
    isTinyCanvas: boolean;
    isCompactCanvas: boolean;

    // Visual layout
    plotCenterX: number;
    plotCenterY: number;
    pieOuterRadius: number;
    pieInnerRadius: number;
    radarRadius: number;
    funnelLeft: number;
    funnelRight: number;
    funnelTop: number;
    funnelBottom: number;
    chartScale: number;
    visualPadding: { left: number; right: number; top: number; bottom: number };

    // Pie/Funnel label
    pieLabelPosition: string;
    pieLabelShow: boolean;
    funnelLabelPosition: string;
    funnelLabelShow: boolean;
    seriesLabelLineLength: number;
    seriesLabelLineLength2: number;
    seriesLabelMinAngle: number;

    // xAxis data
    xAxisCategoryCount: number;

    // DataV
    dataViewModule: DataViewModule | null;
    ScrollBoard: DataViewModule['ScrollBoard'] | undefined;
    ScrollRankingBoard: DataViewModule['ScrollRankingBoard'] | undefined;
    WaterLevelPond: DataViewModule['WaterLevelPond'] | undefined;
    DigitalFlop: DataViewModule['DigitalFlop'] | undefined;
    borderBoxComponents: Record<number, ComponentType<{ children?: React.ReactNode; color?: string[] }>> | null;
    decorationComponents: Record<number, ComponentType<{ color?: string[]; style?: React.CSSProperties }>> | null;

    // Map
    hasMapFn: ((mapName: string) => boolean) | null;
    mapReadyVersion: number;
    mapDrillRegion: string | null;
    setMapDrillRegion: (v: string | null) => void;

    // Table
    tableSort: { colIndex: number; order: 'asc' | 'desc' } | null;
    setTableSort: React.Dispatch<React.SetStateAction<{ colIndex: number; order: 'asc' | 'desc' } | null>>;
    tablePage: number;
    setTablePage: React.Dispatch<React.SetStateAction<number>>;

    // Filters and interaction
    runtime: ReturnType<typeof import('../../ScreenRuntimeContext').useScreenRuntime>;
    currentTime: Date;
    cardData: import('../../types').CardData | null | undefined;
    filterInputDraft: string;
    setFilterInputDraft: React.Dispatch<React.SetStateAction<string>>;
    scheduleFilterVariableUpdate: (
        key: string,
        value: string,
        source: string,
        debounceMsRaw: unknown,
        immediate?: boolean,
    ) => void;
    tabVariableKey: string;
    tabOptions: Array<{ label: string; value: string }>;
    tabDefaultValue: string;
    tabRuntimeValue: string;
    filterSelectVariableKey: string;
    filterSelectOptions: Array<{ label: string; value: string }>;
    filterDateStartKey: string;
    filterDateEndKey: string;
    carouselItems: Array<string>;
    carouselIndex: number;
    setCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
    carouselPaused: boolean;
    setCarouselPaused: React.Dispatch<React.SetStateAction<boolean>>;

    // Drill / Actions
    drillRuntimeEnabled: boolean;
    drillState: {
        canDrillDown: boolean;
        breadcrumbs: Array<{ depth: number; label: string }>;
        handleDrill: (value: string) => void;
        handleRollUp: (depth: number) => void;
        effectiveCardId: string | number | undefined;
        queryParameters: Array<{ name: string; value: string }> | undefined;
    };
    drillActive: boolean;
    componentActions: Array<unknown>;
    executeComponentActions: (params: Record<string, unknown>) => void;
}
