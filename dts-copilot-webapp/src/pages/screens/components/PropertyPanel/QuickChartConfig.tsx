import type { ScreenComponent } from '../../types';
import { CHART_COMPONENT_TYPES, type ChartPreset } from '../../chartPresets';
import { resolveLegendHeuristicLayout, applyLegendHeuristicLayout } from './PropertyPanelConstants';

export function renderQuickChartConfig(
    component: ScreenComponent,
    onChange: (key: string, value: unknown) => void,
    applyPreset: (preset: ChartPreset) => void,
) {
    const { type, config } = component;
    const legendHeuristic = resolveLegendHeuristicLayout(component);
    if (!CHART_COMPONENT_TYPES.has(type)) {
        return null;
    }
    const isAxisChart = type === 'line-chart' || type === 'bar-chart' || type === 'scatter-chart' || type === 'combo-chart' || type === 'waterfall-chart';
    const isLabelChart = type === 'pie-chart' || type === 'funnel-chart' || type === 'radar-chart';
    const isHierarchyChart = type === 'treemap-chart' || type === 'sunburst-chart';
    const showSeriesLabelControls = isLabelChart || isAxisChart || isHierarchyChart;
    const applyLayoutPreset = (preset: 'balanced' | 'compact' | 'spacious') => {
        if (preset === 'compact') {
            onChange('autoLegendAvoid', true);
            onChange('legendDisplay', 'auto');
            onChange('legendPosition', 'bottom');
            onChange('legendOrient', 'horizontal');
            onChange('legendReserveSize', 52);
            onChange('legendAlign', 'start');
            onChange('chartScalePercent', 92);
            onChange('chartOffsetX', 0);
            onChange('chartOffsetY', 0);
            onChange('xAxisLabelRotate', 36);
            onChange('xAxisLabelMaxLength', 8);
            onChange('xAxisLabelInterval', 0);
            onChange('axisSeriesLabelStrategy', 'first');
            onChange('axisSeriesLabelStep', 0);
            onChange('axisTooltipMaxRows', 6);
            return;
        }
        if (preset === 'spacious') {
            onChange('autoLegendAvoid', false);
            onChange('legendDisplay', 'show');
            onChange('legendPosition', 'right');
            onChange('legendOrient', 'vertical');
            onChange('legendReserveSize', 120);
            onChange('legendAlign', 'center');
            onChange('chartScalePercent', 100);
            onChange('chartOffsetX', 0);
            onChange('chartOffsetY', 0);
            onChange('xAxisLabelRotate', 0);
            onChange('xAxisLabelMaxLength', 0);
            onChange('xAxisLabelInterval', 0);
            onChange('axisSeriesLabelStrategy', 'all');
            onChange('axisSeriesLabelStep', 0);
            onChange('axisTooltipMaxRows', 12);
            return;
        }
        onChange('autoLegendAvoid', true);
        onChange('legendDisplay', 'auto');
        onChange('legendPosition', 'auto');
        onChange('legendOrient', 'auto');
        onChange('legendReserveSize', 0);
        onChange('legendAlign', 'auto');
        onChange('chartScalePercent', 100);
        onChange('chartOffsetX', 0);
        onChange('chartOffsetY', 0);
        onChange('xAxisLabelRotate', 0);
        onChange('xAxisLabelMaxLength', 0);
        onChange('xAxisLabelInterval', 0);
        onChange('axisSeriesLabelStrategy', 'auto');
        onChange('axisSeriesLabelStep', 0);
        onChange('axisTooltipMaxRows', 0);
    };

    return (
        <>
            <div className="property-row">
                <label className="property-label">标题</label>
                <input
                    type="text"
                    className="property-input"
                    value={String(config.title ?? '')}
                    onChange={(e) => onChange('title', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">标题字号</label>
                <input
                    type="number"
                    className="property-input"
                    min={10}
                    max={40}
                    value={Number(config.titleFontSize) || 14}
                    onChange={(e) => onChange('titleFontSize', Number(e.target.value))}
                />
            </div>
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
                <label className="property-label">自动避让</label>
                <input
                    type="checkbox"
                    checked={config.autoLegendAvoid !== false}
                    onChange={(e) => onChange('autoLegendAvoid', e.target.checked)}
                />
            </div>
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
            <div className="property-row">
                <label className="property-label">布局预设</label>
                <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                    <button
                        type="button"
                        className="property-action-btn"
                        style={{ flex: 1 }}
                        onClick={() => applyLayoutPreset('balanced')}
                        title="自动避让 + 默认留白"
                    >
                        平衡
                    </button>
                    <button
                        type="button"
                        className="property-action-btn"
                        style={{ flex: 1 }}
                        onClick={() => applyLayoutPreset('compact')}
                        title="紧凑布局，优先保证小容器可读"
                    >
                        紧凑
                    </button>
                    <button
                        type="button"
                        className="property-action-btn"
                        style={{ flex: 1 }}
                        onClick={() => applyLayoutPreset('spacious')}
                        title="图例侧边 + 留白更充分"
                    >
                        留白
                    </button>
                </div>
            </div>
            <div className="property-row">
                <label className="property-label">布局回正</label>
                <button
                    type="button"
                    className="property-action-btn"
                    style={{ width: '100%' }}
                    onClick={() => {
                        onChange('legendOffsetX', 0);
                        onChange('legendOffsetY', 0);
                        onChange('chartOffsetX', 0);
                        onChange('chartOffsetY', 0);
                        onChange('chartPaddingTop', 0);
                        onChange('chartPaddingRight', 0);
                        onChange('chartPaddingBottom', 0);
                        onChange('chartPaddingLeft', 0);
                    }}
                    title="清空图例/图形偏移与留白，回到自动布局"
                >
                    一键回到自动布局
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
            {(type === 'bar-chart') ? (
                <div className="property-row">
                    <label className="property-label">水平方向</label>
                    <input
                        type="checkbox"
                        checked={Boolean(config.horizontal)}
                        onChange={(e) => onChange('horizontal', e.target.checked)}
                    />
                </div>
            ) : null}
            {(type === 'bar-chart' || type === 'line-chart') ? (
                <div className="property-row">
                    <label className="property-label">堆叠模式</label>
                    <select
                        className="property-input"
                        value={(config.stackMode as string) || 'off'}
                        onChange={(e) => onChange('stackMode', e.target.value)}
                    >
                        <option value="off">关闭</option>
                        <option value="stack">堆叠</option>
                    </select>
                </div>
            ) : null}
            {(type === 'wordcloud-chart') ? (
                <>
                    <div className="property-row">
                        <label className="property-label">形状</label>
                        <select
                            className="property-input"
                            value={(config.shape as string) || 'circle'}
                            onChange={(e) => onChange('shape', e.target.value)}
                        >
                            <option value="circle">圆形</option>
                            <option value="cardioid">心形</option>
                            <option value="diamond">菱形</option>
                            <option value="square">正方形</option>
                            <option value="triangle-forward">三角形</option>
                            <option value="star">星形</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">最小字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={8}
                            max={40}
                            value={Array.isArray(config.fontSizeRange) ? (config.fontSizeRange as number[])[0] : 14}
                            onChange={(e) => {
                                const range = Array.isArray(config.fontSizeRange) ? [...config.fontSizeRange] as number[] : [14, 60];
                                range[0] = Number(e.target.value);
                                onChange('fontSizeRange', range);
                            }}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">最大字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={20}
                            max={120}
                            value={Array.isArray(config.fontSizeRange) ? (config.fontSizeRange as number[])[1] : 60}
                            onChange={(e) => {
                                const range = Array.isArray(config.fontSizeRange) ? [...config.fontSizeRange] as number[] : [14, 60];
                                range[1] = Number(e.target.value);
                                onChange('fontSizeRange', range);
                            }}
                        />
                    </div>
                </>
            ) : null}
            {isAxisChart ? (
                <>
                    <div className="property-row">
                        <label className="property-label">X轴角度</label>
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
            ) : null}
            {showSeriesLabelControls ? (
                <>
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
                </>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                <button type="button" className="property-btn-small" onClick={() => applyPreset('business')}>商务预设</button>
                <button type="button" className="property-btn-small" onClick={() => applyPreset('compact')}>紧凑预设</button>
                <button type="button" className="property-btn-small" onClick={() => applyPreset('clear')}>恢复预设</button>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>
                当前为简洁模式，仅显示高频参数。切换到"专业模式"可配置全部细节。
            </div>
        </>
    );
}
