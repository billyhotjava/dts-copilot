import type { ScreenComponent } from '../../types';
import { COLOR_SCHEMES } from '../../colorSchemes';
import {
    DEFAULT_SERIES_COLORS,
    resolveLegendHeuristicLayout,
    applyLegendHeuristicLayout,
} from './PropertyPanelConstants';

type OnChange = (key: string, value: unknown) => void;

/**
 * Shared chart-config helper renderers extracted from ComponentConfig.
 * Each function returns JSX for a logical section of chart property rows.
 */

export function createChartConfigHelpers(
    component: ScreenComponent,
    onChange: OnChange,
) {
    const { config } = component;
    const legendHeuristic = resolveLegendHeuristicLayout(component);
    const configuredSeriesColors = Array.isArray(config.seriesColors)
        ? (config.seriesColors as string[]).map((item) => String(item))
        : [];

    const setSeriesColor = (index: number, color: string) => {
        const next = [...configuredSeriesColors];
        next[index] = color;
        onChange('seriesColors', next);
    };

    const renderSeriesColorRows = (labels: string[]) => {
        if (labels.length === 0) return null;
        return (
            <>
                {/* Color scheme selector */}
                <div className="property-row" style={{ marginTop: 8 }}>
                    <label className="property-label">配色方案</label>
                    <select
                        className="property-input"
                        value={(config._colorScheme as string) || ''}
                        onChange={(e) => {
                            const schemeId = e.target.value;
                            const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
                            if (scheme) {
                                onChange('_colorScheme', schemeId);
                                onChange('seriesColors', scheme.colors);
                            } else {
                                onChange('_colorScheme', '');
                            }
                        }}
                    >
                        <option value="">自定义</option>
                        {COLOR_SCHEMES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                    系列配色
                </div>
                {labels.map((label, idx) => (
                    <div className="property-row" key={`${label}-${idx}`}>
                        <label className="property-label">{label || `系列${idx + 1}`}</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={configuredSeriesColors[idx] || DEFAULT_SERIES_COLORS[idx % DEFAULT_SERIES_COLORS.length]}
                            onChange={(e) => setSeriesColor(idx, e.target.value)}
                        />
                    </div>
                ))}
            </>
        );
    };

    const renderLegendLayoutRows = () => (
        <>
            <div className="property-row">
                <label className="property-label">图例显示</label>
                <select
                    className="property-input"
                    value={(config.legendDisplay as string) || 'auto'}
                    onChange={(e) => onChange('legendDisplay', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="show">显示</option>
                    <option value="hide">隐藏</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">图例位置</label>
                <select
                    className="property-input"
                    value={(config.legendPosition as string) || 'auto'}
                    onChange={(e) => onChange('legendPosition', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="top">上</option>
                    <option value="bottom">下</option>
                    <option value="left">左</option>
                    <option value="right">右</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">启用拖拽微调</label>
                <input
                    type="checkbox"
                    checked={config.legendDragEnabled === true}
                    onChange={(e) => onChange('legendDragEnabled', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">自动避让</label>
                <input
                    type="checkbox"
                    checked={config.autoLegendAvoid !== false}
                    onChange={(e) => onChange('autoLegendAvoid', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例方向</label>
                <select
                    className="property-input"
                    value={(config.legendOrient as string) || 'auto'}
                    onChange={(e) => onChange('legendOrient', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="horizontal">横向</option>
                    <option value="vertical">纵向</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">图例对齐</label>
                <select
                    className="property-input"
                    value={(config.legendAlign as string) || 'auto'}
                    onChange={(e) => onChange('legendAlign', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="start">靠前</option>
                    <option value="center">居中</option>
                    <option value="end">靠后</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">图例间距</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={60}
                    value={(config.legendItemGap as number) || 12}
                    onChange={(e) => onChange('legendItemGap', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例预留(px)</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={360}
                    value={(config.legendReserveSize as number) || 0}
                    onChange={(e) => onChange('legendReserveSize', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例水平偏移</label>
                <input
                    type="number"
                    className="property-input"
                    min={-400}
                    max={400}
                    value={(config.legendOffsetX as number) || 0}
                    onChange={(e) => onChange('legendOffsetX', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例垂直偏移</label>
                <input
                    type="number"
                    className="property-input"
                    min={-400}
                    max={400}
                    value={(config.legendOffsetY as number) || 0}
                    onChange={(e) => onChange('legendOffsetY', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例文本宽(px)</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={320}
                    value={(config.legendNameMaxWidth as number) || 0}
                    onChange={(e) => onChange('legendNameMaxWidth', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">图例偏移</label>
                <button
                    type="button"
                    className="property-input"
                    onClick={() => {
                        onChange('legendOffsetX', 0);
                        onChange('legendOffsetY', 0);
                    }}
                >
                    重置为自动
                </button>
            </div>
            <div className="property-row">
                <label className="property-label">图例避让</label>
                <div style={{ width: '100%' }}>
                    <button
                        type="button"
                        className="property-action-btn"
                        style={{ width: '100%' }}
                        onClick={() => applyLegendHeuristicLayout(component, onChange)}
                        title={legendHeuristic.hint}
                    >
                        一键自动避让
                    </button>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{legendHeuristic.hint}</div>
                </div>
            </div>
        </>
    );

    const renderCompactPresetRow = () => (
        <div className="property-row">
            <label className="property-label">小屏预设</label>
            <select
                className="property-input"
                value={(config.compactLayoutPreset as string) || 'auto'}
                onChange={(e) => onChange('compactLayoutPreset', e.target.value)}
            >
                <option value="auto">自动</option>
                <option value="off">关闭</option>
            </select>
        </div>
    );

    const renderChartPaddingRows = () => (
        <>
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                图形留白(像素)
            </div>
            <div className="property-row">
                <label className="property-label">上留白</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={300}
                    value={(config.chartPaddingTop as number) || 0}
                    onChange={(e) => onChange('chartPaddingTop', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">右留白</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={300}
                    value={(config.chartPaddingRight as number) || 0}
                    onChange={(e) => onChange('chartPaddingRight', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">下留白</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={300}
                    value={(config.chartPaddingBottom as number) || 0}
                    onChange={(e) => onChange('chartPaddingBottom', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">左留白</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={300}
                    value={(config.chartPaddingLeft as number) || 0}
                    onChange={(e) => onChange('chartPaddingLeft', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">图形布局</label>
                <button
                    type="button"
                    className="property-input"
                    onClick={() => {
                        onChange('chartPaddingTop', 0);
                        onChange('chartPaddingRight', 0);
                        onChange('chartPaddingBottom', 0);
                        onChange('chartPaddingLeft', 0);
                        onChange('chartOffsetX', 0);
                        onChange('chartOffsetY', 0);
                    }}
                >
                    一键重置为自动
                </button>
            </div>
        </>
    );

    const renderChartOffsetRows = () => (
        <>
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                图形位置微调
            </div>
            <div className="property-row">
                <label className="property-label">启用拖拽微调</label>
                <input
                    type="checkbox"
                    checked={config.chartDragEnabled === true}
                    onChange={(e) => onChange('chartDragEnabled', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">水平偏移</label>
                <input
                    type="number"
                    className="property-input"
                    min={-400}
                    max={400}
                    value={(config.chartOffsetX as number) || 0}
                    onChange={(e) => onChange('chartOffsetX', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">垂直偏移</label>
                <input
                    type="number"
                    className="property-input"
                    min={-400}
                    max={400}
                    value={(config.chartOffsetY as number) || 0}
                    onChange={(e) => onChange('chartOffsetY', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">图形偏移</label>
                <button
                    type="button"
                    className="property-input"
                    onClick={() => {
                        onChange('chartOffsetX', 0);
                        onChange('chartOffsetY', 0);
                    }}
                >
                    重置为自动
                </button>
            </div>
            <div className="property-row">
                <label className="property-label">图形缩放(%)</label>
                <input
                    type="number"
                    className="property-input"
                    min={40}
                    max={180}
                    value={(config.chartScalePercent as number) || 100}
                    onChange={(e) => onChange('chartScalePercent', Number(e.target.value))}
                />
            </div>
        </>
    );

    const renderAxisLabelRows = () => (
        <>
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                轴标签防拥挤
            </div>
            <div className="property-row">
                <label className="property-label">X轴标签角度</label>
                <input
                    type="number"
                    className="property-input"
                    min={-90}
                    max={90}
                    value={(config.xAxisLabelRotate as number) || 0}
                    onChange={(e) => onChange('xAxisLabelRotate', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">X轴最大字数</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={40}
                    value={(config.xAxisLabelMaxLength as number) || 0}
                    onChange={(e) => onChange('xAxisLabelMaxLength', Number(e.target.value))}
                    placeholder="0=不限"
                />
            </div>
            <div className="property-row">
                <label className="property-label">X轴抽样间隔</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={200}
                    value={(config.xAxisLabelInterval as number) || 0}
                    onChange={(e) => onChange('xAxisLabelInterval', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">标签系列策略</label>
                <select
                    className="property-input"
                    value={(config.axisSeriesLabelStrategy as string) || 'auto'}
                    onChange={(e) => onChange('axisSeriesLabelStrategy', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="all">全部系列</option>
                    <option value="first">仅首系列</option>
                    <option value="none">隐藏标签</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">标签步长</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={200}
                    value={(config.axisSeriesLabelStep as number) || 0}
                    onChange={(e) => onChange('axisSeriesLabelStep', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
            <div className="property-row">
                <label className="property-label">Tooltip行数</label>
                <input
                    type="number"
                    className="property-input"
                    min={0}
                    max={50}
                    value={(config.axisTooltipMaxRows as number) || 0}
                    onChange={(e) => onChange('axisTooltipMaxRows', Number(e.target.value))}
                    placeholder="0=自动"
                />
            </div>
        </>
    );

    const renderSeriesLabelRows = (options?: { includeLeaderLines?: boolean }) => (
        <>
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                数据标签
            </div>
            <div className="property-row">
                <label className="property-label">标签位置</label>
                <select
                    className="property-input"
                    value={(config.seriesLabelPosition as string) || 'auto'}
                    onChange={(e) => onChange('seriesLabelPosition', e.target.value)}
                >
                    <option value="auto">自动</option>
                    <option value="inside">内部</option>
                    <option value="outside">外部</option>
                    <option value="none">隐藏</option>
                </select>
            </div>
            <div className="property-row">
                <label className="property-label">标签字号</label>
                <input
                    type="number"
                    className="property-input"
                    min={10}
                    max={28}
                    value={(config.seriesLabelFontSize as number) || 12}
                    onChange={(e) => onChange('seriesLabelFontSize', Number(e.target.value))}
                />
            </div>
            {(options?.includeLeaderLines ?? true) ? (
                <>
                    <div className="property-row">
                        <label className="property-label">标签最小角度</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={45}
                            value={(config.seriesLabelMinAngle as number) || 0}
                            onChange={(e) => onChange('seriesLabelMinAngle', Number(e.target.value))}
                            placeholder="0=自动"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">引导线长度1</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={60}
                            value={(config.seriesLabelLineLength as number) || 0}
                            onChange={(e) => onChange('seriesLabelLineLength', Number(e.target.value))}
                            placeholder="0=自动"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">引导线长度2</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={60}
                            value={(config.seriesLabelLineLength2 as number) || 0}
                            onChange={(e) => onChange('seriesLabelLineLength2', Number(e.target.value))}
                            placeholder="0=自动"
                        />
                    </div>
                </>
            ) : null}
        </>
    );

    return {
        renderSeriesColorRows,
        renderLegendLayoutRows,
        renderCompactPresetRow,
        renderChartPaddingRows,
        renderChartOffsetRows,
        renderAxisLabelRows,
        renderSeriesLabelRows,
    };
}
