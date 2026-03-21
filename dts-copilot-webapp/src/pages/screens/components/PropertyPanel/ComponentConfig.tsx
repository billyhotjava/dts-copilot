import type { ScreenComponent } from '../../types';
import { PROVINCE_PRESETS } from '../../renderers/shared/geoJsonCache';
import { COLOR_SCHEMES } from '../../colorSchemes';
import {
    DEFAULT_SERIES_COLORS,
    resolveLegendHeuristicLayout,
    applyLegendHeuristicLayout,
    resolveDataSourceType,
    type ColumnEntry,
} from './PropertyPanelConstants';
import type { DataSourceConfig } from '../../types';
import { ScrollBoardConfig, TableConfig } from './SpecializedConfigs';

export function renderComponentConfig(
    component: ScreenComponent,
    onChange: (key: string, value: unknown) => void
) {
    const { type, config } = component;
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

    switch (type) {
        case 'line-chart':
        case 'bar-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.title as string}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">标题字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={36}
                            value={(config.titleFontSize as number) || 14}
                            onChange={(e) => onChange('titleFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">坐标轴字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={28}
                            value={(config.axisFontSize as number) || 12}
                            onChange={(e) => onChange('axisFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">图例字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={28}
                            value={(config.legendFontSize as number) || 12}
                            onChange={(e) => onChange('legendFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">图例位置</label>
                        <select
                            className="property-input"
                            value={(config.legendPosition as string) || 'auto'}
                            onChange={(e) => onChange('legendPosition', e.target.value)}
                        >
                            <option value="auto">自动</option>
                            <option value="top">顶部</option>
                            <option value="bottom">底部</option>
                            <option value="left">左侧</option>
                            <option value="right">右侧</option>
                        </select>
                    </div>
                    {renderLegendLayoutRows()}
                    {renderCompactPresetRow()}
                    {renderChartPaddingRows()}
                    {renderChartOffsetRows()}
                    {renderAxisLabelRows()}
                    {renderSeriesLabelRows({ includeLeaderLines: false })}
                    {renderSeriesColorRows(
                        ((config.series as Array<{ name?: string }> | undefined) || [])
                            .map((item, idx) => (item?.name || '').trim() || `系列${idx + 1}`),
                    )}
                </>
            );

        case 'pie-chart':
        case 'gauge-chart':
        case 'radar-chart':
        case 'funnel-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.title as string}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">标题字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={36}
                            value={(config.titleFontSize as number) || 14}
                            onChange={(e) => onChange('titleFontSize', Number(e.target.value))}
                        />
                    </div>
                    {type !== 'gauge-chart' && (
                        <>
                            <div className="property-row">
                                <label className="property-label">图例字号</label>
                                <input
                                    type="number"
                                    className="property-input"
                                    min={10}
                                    max={28}
                                    value={(config.legendFontSize as number) || 12}
                                    onChange={(e) => onChange('legendFontSize', Number(e.target.value))}
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">图例位置</label>
                                <select
                                    className="property-input"
                                    value={(config.legendPosition as string) || 'auto'}
                                    onChange={(e) => onChange('legendPosition', e.target.value)}
                                >
                                    <option value="auto">自动</option>
                                    <option value="top">顶部</option>
                                    <option value="bottom">底部</option>
                                    <option value="left">左侧</option>
                                    <option value="right">右侧</option>
                                </select>
                            </div>
                            {renderLegendLayoutRows()}
                            {renderCompactPresetRow()}
                            {renderChartPaddingRows()}
                            {renderChartOffsetRows()}
                            {(type === 'pie-chart' || type === 'funnel-chart') && renderSeriesLabelRows()}
                            {renderSeriesColorRows(
                                ((config.data as Array<{ name?: string }> | undefined) || [])
                                    .map((item, idx) => (item?.name || '').trim() || `系列${idx + 1}`),
                            )}
                        </>
                    )}
                    {type === 'gauge-chart' && (
                        <div className="property-row">
                            <label className="property-label">值</label>
                            <input
                                type="number"
                                className="property-input"
                                value={config.value as number}
                                onChange={(e) => onChange('value', Number(e.target.value))}
                            />
                        </div>
                    )}
                </>
            );

        case 'number-card':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.title as string}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">数值</label>
                        <input
                            type="number"
                            className="property-input"
                            value={config.value as number}
                            onChange={(e) => onChange('value', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">前缀</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.prefix as string}
                            onChange={(e) => onChange('prefix', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">标题字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={36}
                            value={(config.titleFontSize as number) || 12}
                            onChange={(e) => onChange('titleFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">数值字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={16}
                            max={72}
                            value={(config.valueFontSize as number) || 32}
                            onChange={(e) => onChange('valueFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">标题颜色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.titleColor as string) || '#ffffff'}
                            onChange={(e) => onChange('titleColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">数值颜色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.valueColor as string) || '#ffffff'}
                            onChange={(e) => onChange('valueColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">背景色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.backgroundColor as string) || '#1a1a2e'}
                            onChange={(e) => onChange('backgroundColor', e.target.value)}
                        />
                    </div>
                </>
            );

        case 'title':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">文本</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.text as string}
                            onChange={(e) => onChange('text', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">字号</label>
                        <input
                            type="number"
                            className="property-input"
                            value={config.fontSize as number}
                            onChange={(e) => onChange('fontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">颜色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={config.color as string}
                            onChange={(e) => onChange('color', e.target.value)}
                        />
                    </div>
                </>
            );

        case 'markdown-text':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">Markdown</label>
                        <textarea
                            className="property-input"
                            rows={8}
                            value={(config.markdown as string) || ''}
                            onChange={(e) => onChange('markdown', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={36}
                            value={(config.fontSize as number) || 14}
                            onChange={(e) => onChange('fontSize', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        case 'richtext':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">HTML 内容</label>
                        <textarea
                            className="property-input"
                            rows={8}
                            value={(config.content as string) || ''}
                            onChange={(e) => onChange('content', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">内边距</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={60}
                            value={(config.padding as number) ?? 12}
                            onChange={(e) => onChange('padding', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">垂直对齐</label>
                        <select
                            className="property-input"
                            value={(config.verticalAlign as string) || 'top'}
                            onChange={(e) => onChange('verticalAlign', e.target.value)}
                        >
                            <option value="top">顶部</option>
                            <option value="middle">居中</option>
                            <option value="bottom">底部</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">溢出</label>
                        <select
                            className="property-input"
                            value={(config.overflow as string) || 'hidden'}
                            onChange={(e) => onChange('overflow', e.target.value)}
                        >
                            <option value="hidden">隐藏</option>
                            <option value="visible">可见</option>
                            <option value="scroll">滚动</option>
                        </select>
                    </div>
                </>
            );

        case 'datetime':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">格式</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.format as string}
                            onChange={(e) => onChange('format', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">字号</label>
                        <input
                            type="number"
                            className="property-input"
                            value={config.fontSize as number}
                            onChange={(e) => onChange('fontSize', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        case 'countdown':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.title as string) || '倒计时'}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">目标时间</label>
                        <input
                            type="datetime-local"
                            className="property-input"
                            value={String(config.targetTime || '').replace('Z', '').slice(0, 16)}
                            onChange={(e) => {
                                const raw = String(e.target.value || '').trim();
                                if (!raw) {
                                    onChange('targetTime', '');
                                    return;
                                }
                                const parsed = Date.parse(raw);
                                if (Number.isFinite(parsed)) {
                                    onChange('targetTime', new Date(parsed).toISOString());
                                }
                            }}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">目标时间变量</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.targetVariableKey as string) || ''}
                            onChange={(e) => onChange('targetVariableKey', e.target.value)}
                            placeholder="releaseDeadline"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示天数</label>
                        <input
                            type="checkbox"
                            checked={config.showDays !== false}
                            onChange={(e) => onChange('showDays', e.target.checked)}
                        />
                    </div>
                </>
            );

        case 'marquee':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">文本</label>
                        <textarea
                            className="property-input"
                            rows={4}
                            value={(config.text as string) || ''}
                            onChange={(e) => onChange('text', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">速度(秒)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={120}
                            value={(config.speed as number) || 40}
                            onChange={(e) => onChange('speed', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        case 'carousel':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.title as string) || '轮播卡片'}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">内容来源</label>
                        <select
                            className="property-input"
                            value={(config.itemSourceMode as string) || 'auto'}
                            onChange={(e) => onChange('itemSourceMode', e.target.value)}
                        >
                            <option value="auto">自动（优先数据）</option>
                            <option value="manual">手工内容</option>
                            <option value="data">数据内容</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">轮播内容</label>
                        <textarea
                            className="property-input"
                            rows={6}
                            value={Array.isArray(config.items) ? config.items.map((item) => String(item ?? '')).join('\n') : String(config.items ?? '')}
                            onChange={(e) => {
                                const items = e.target.value
                                    .split(/\r?\n/g)
                                    .map((item) => item.trim())
                                    .filter((item) => item.length > 0)
                                    .slice(0, 200);
                                onChange('items', items);
                            }}
                            placeholder="每行一条，例如：\n设备在线率 99.2%\n昨日告警 6 条"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">轮播间隔(秒)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={1}
                            max={120}
                            value={(config.intervalSeconds as number) || 4}
                            onChange={(e) => onChange('intervalSeconds', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">自动轮播</label>
                        <input
                            type="checkbox"
                            checked={config.autoPlay !== false}
                            onChange={(e) => onChange('autoPlay', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">数据内容列</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.dataItemField as string) || ''}
                            onChange={(e) => onChange('dataItemField', e.target.value)}
                            placeholder="列名/显示名/序号(1开始)"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">数据行上限</label>
                        <input
                            type="number"
                            className="property-input"
                            min={1}
                            max={500}
                            value={(config.dataItemMax as number) || 50}
                            onChange={(e) => onChange('dataItemMax', Number(e.target.value))}
                            placeholder="数据源接入时生效"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示切换按钮</label>
                        <input
                            type="checkbox"
                            checked={config.showControls !== false}
                            onChange={(e) => onChange('showControls', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">悬停暂停</label>
                        <input
                            type="checkbox"
                            checked={config.pauseOnHover !== false}
                            onChange={(e) => onChange('pauseOnHover', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示指示点</label>
                        <input
                            type="checkbox"
                            checked={config.showDots !== false}
                            onChange={(e) => onChange('showDots', e.target.checked)}
                        />
                    </div>
                </>
            );

        case 'tab-switcher':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.label as string) || '维度切换'}
                            onChange={(e) => onChange('label', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">变量Key</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.variableKey as string) || ''}
                            onChange={(e) => onChange('variableKey', e.target.value)}
                            placeholder="tabKey"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">选项来源</label>
                        <select
                            className="property-input"
                            value={(config.optionSourceMode as string) || 'manual'}
                            onChange={(e) => onChange('optionSourceMode', e.target.value === 'data' ? 'data' : 'manual')}
                        >
                            <option value="manual">手工配置</option>
                            <option value="data">数据源首列</option>
                        </select>
                    </div>
                    {(String(config.optionSourceMode || 'manual') !== 'data') ? (
                        <div className="property-row">
                            <label className="property-label">选项</label>
                            <textarea
                                className="property-input"
                                rows={6}
                                value={Array.isArray(config.options)
                                    ? config.options.map((item) => {
                                        if (item && typeof item === 'object') {
                                            const row = item as Record<string, unknown>;
                                            const label = String(row.label ?? '').trim();
                                            const value = String(row.value ?? '').trim();
                                            return label && value ? `${label}:${value}` : (label || value);
                                        }
                                        return String(item ?? '');
                                    }).join('\n')
                                    : String(config.options ?? '')
                                }
                                onChange={(e) => {
                                    const lines = e.target.value
                                        .split(/\r?\n/g)
                                        .map((line) => line.trim())
                                        .filter((line) => line.length > 0)
                                        .slice(0, 300);
                                    const next = lines.map((line) => {
                                        const idx = line.indexOf(':');
                                        if (idx < 0) {
                                            return { label: line, value: line };
                                        }
                                        const label = line.slice(0, idx).trim();
                                        const value = line.slice(idx + 1).trim();
                                        const safeValue = value || label;
                                        return { label: label || safeValue, value: safeValue };
                                    });
                                    onChange('options', next);
                                }}
                                placeholder={'每行一个选项，可写 label:value\n例如：\n总览:overview\n产线:line'}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="property-row">
                                <label className="property-label">标签列</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={(config.dataOptionLabelField as string) || ''}
                                    onChange={(e) => onChange('dataOptionLabelField', e.target.value)}
                                    placeholder="列名/显示名/序号(1开始)"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">值列</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={(config.dataOptionValueField as string) || ''}
                                    onChange={(e) => onChange('dataOptionValueField', e.target.value)}
                                    placeholder="列名/显示名/序号(1开始)"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">最大选项数</label>
                                <input
                                    type="number"
                                    className="property-input"
                                    min={1}
                                    max={500}
                                    value={(config.dataOptionMax as number) || 100}
                                    onChange={(e) => onChange('dataOptionMax', Number(e.target.value))}
                                />
                            </div>
                        </>
                    )}
                    <div className="property-row">
                        <label className="property-label">默认值</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.defaultValue as string) || ''}
                            onChange={(e) => onChange('defaultValue', e.target.value)}
                            placeholder="首次加载时写入变量"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">紧凑模式</label>
                        <input
                            type="checkbox"
                            checked={config.compact === true}
                            onChange={(e) => onChange('compact', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">激活背景</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.activeBackgroundColor as string) || '#38bdf8'}
                            onChange={(e) => onChange('activeBackgroundColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">激活文字</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.activeTextColor as string) || '#0f172a'}
                            onChange={(e) => onChange('activeTextColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">未激活背景</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.inactiveBackgroundColor as string) || '#1e293b'}
                            onChange={(e) => onChange('inactiveBackgroundColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">未激活文字</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.inactiveTextColor as string) || '#94a3b8'}
                            onChange={(e) => onChange('inactiveTextColor', e.target.value)}
                        />
                    </div>
                </>
            );

        case 'progress-bar':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">值 (%)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={100}
                            value={config.value as number}
                            onChange={(e) => onChange('value', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示标签</label>
                        <input
                            type="checkbox"
                            checked={config.showLabel as boolean}
                            onChange={(e) => onChange('showLabel', e.target.checked)}
                        />
                    </div>
                </>
            );

        case 'filter-input':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.label as string) || '筛选'}
                            onChange={(e) => onChange('label', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">变量Key</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.variableKey as string) || ''}
                            onChange={(e) => onChange('variableKey', e.target.value)}
                            placeholder="keyword"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">占位</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.placeholder as string) || ''}
                            onChange={(e) => onChange('placeholder', e.target.value)}
                            placeholder="请输入关键词"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">默认值</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.defaultValue as string) || ''}
                            onChange={(e) => onChange('defaultValue', e.target.value)}
                            placeholder="初始关键字"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">作用说明</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.scopeHint as string) || ''}
                            onChange={(e) => onChange('scopeHint', e.target.value)}
                            placeholder="作用于项目、风险、交付物"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">防抖(ms)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={5000}
                            step={50}
                            value={Number(config.debounceMs as number) > 0 ? Number(config.debounceMs as number) : 0}
                            onChange={(e) => {
                                const n = Number(e.target.value);
                                onChange('debounceMs', Number.isFinite(n) && n > 0 ? Math.max(50, Math.min(5000, Math.round(n))) : 0);
                            }}
                            placeholder="0=不防抖"
                        />
                    </div>
                </>
            );

        case 'filter-select': {
            const options = Array.isArray(config.options)
                ? (config.options as Array<string | { label?: string; value?: string }>)
                : [];
            const optionSourceMode = String(config.optionSourceMode || 'manual') === 'data' ? 'data' : 'manual';
            const optionText = options
                .map((item) => (typeof item === 'string' ? item : `${item.value || ''}|${item.label || ''}`))
                .join('\n');
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.label as string) || '筛选'}
                            onChange={(e) => onChange('label', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">变量Key</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.variableKey as string) || ''}
                            onChange={(e) => onChange('variableKey', e.target.value)}
                            placeholder="region"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">选项来源</label>
                        <select
                            className="property-input"
                            value={optionSourceMode}
                            onChange={(e) => onChange('optionSourceMode', e.target.value === 'data' ? 'data' : 'manual')}
                        >
                            <option value="manual">手工配置</option>
                            <option value="data">来自数据源</option>
                        </select>
                    </div>
                    {optionSourceMode === 'manual' ? (
                        <div className="property-row">
                            <label className="property-label">选项(每行1个)</label>
                            <textarea
                                className="property-input"
                                rows={5}
                                value={optionText}
                                onChange={(e) => {
                                    const lines = e.target.value
                                        .split('\n')
                                        .map((line) => line.trim())
                                        .filter((line) => line.length > 0);
                                    onChange('options', lines);
                                }}
                                placeholder={'华北\n华东\n华南'}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="property-row">
                                <label className="property-label">值字段</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={(config.dataOptionValueField as string) || ''}
                                    onChange={(e) => onChange('dataOptionValueField', e.target.value)}
                                    placeholder="默认第1列"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">标签字段</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={(config.dataOptionLabelField as string) || ''}
                                    onChange={(e) => onChange('dataOptionLabelField', e.target.value)}
                                    placeholder="默认与值字段相同"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">最大选项数</label>
                                <input
                                    type="number"
                                    className="property-input"
                                    min={1}
                                    max={2000}
                                    value={Number(config.dataOptionMax as number) > 0 ? Number(config.dataOptionMax as number) : 200}
                                    onChange={(e) => {
                                        const n = Number(e.target.value);
                                        onChange('dataOptionMax', Number.isFinite(n) ? Math.max(1, Math.min(2000, n)) : 200);
                                    }}
                                />
                            </div>
                        </>
                    )}
                    <div className="property-row">
                        <label className="property-label">占位</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.placeholder as string) || ''}
                            onChange={(e) => onChange('placeholder', e.target.value)}
                            placeholder="请选择"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">默认值</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.defaultValue as string) || ''}
                            onChange={(e) => onChange('defaultValue', e.target.value)}
                            placeholder="默认选项值"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">作用说明</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.scopeHint as string) || ''}
                            onChange={(e) => onChange('scopeHint', e.target.value)}
                            placeholder="作用于项目、风险、交付物"
                        />
                    </div>
                </>
            );
        }

        case 'filter-date-range':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.label as string) || '日期区间'}
                            onChange={(e) => onChange('label', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">开始变量</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.startKey as string) || ''}
                            onChange={(e) => onChange('startKey', e.target.value)}
                            placeholder="startDate"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">结束变量</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.endKey as string) || ''}
                            onChange={(e) => onChange('endKey', e.target.value)}
                            placeholder="endDate"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">默认开始</label>
                        <input
                            type="date"
                            className="property-input"
                            value={(config.defaultStartValue as string) || ''}
                            onChange={(e) => onChange('defaultStartValue', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">默认结束</label>
                        <input
                            type="date"
                            className="property-input"
                            value={(config.defaultEndValue as string) || ''}
                            onChange={(e) => onChange('defaultEndValue', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">作用说明</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.scopeHint as string) || ''}
                            onChange={(e) => onChange('scopeHint', e.target.value)}
                            placeholder="作用于统计周期过滤"
                        />
                    </div>
                </>
            );

        case 'image':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">图片URL</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.src as string}
                            onChange={(e) => onChange('src', e.target.value)}
                            placeholder="输入图片地址"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">填充方式</label>
                        <select
                            className="property-input"
                            value={config.fit as string}
                            onChange={(e) => onChange('fit', e.target.value)}
                        >
                            <option value="cover">覆盖</option>
                            <option value="contain">包含</option>
                            <option value="fill">拉伸</option>
                        </select>
                    </div>
                </>
            );

        case 'video':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">视频URL</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.src as string}
                            onChange={(e) => onChange('src', e.target.value)}
                            placeholder="输入视频地址"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">自动播放</label>
                        <input
                            type="checkbox"
                            checked={config.autoplay as boolean}
                            onChange={(e) => onChange('autoplay', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">循环</label>
                        <input
                            type="checkbox"
                            checked={config.loop as boolean}
                            onChange={(e) => onChange('loop', e.target.checked)}
                        />
                    </div>
                </>
            );

        case 'iframe':
            return (
                <div className="property-row">
                    <label className="property-label">URL</label>
                    <input
                        type="text"
                        className="property-input"
                        value={config.src as string}
                        onChange={(e) => onChange('src', e.target.value)}
                        placeholder="输入网页地址"
                    />
                </div>
            );

        case 'border-box':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">边框类型</label>
                        <select
                            className="property-input"
                            value={config.boxType as number}
                            onChange={(e) => onChange('boxType', Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((n) => (
                                <option key={n} value={n}>边框 {n}</option>
                            ))}
                        </select>
                    </div>
                </>
            );

        case 'decoration':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">装饰类型</label>
                        <select
                            className="property-input"
                            value={config.decorationType as number}
                            onChange={(e) => onChange('decorationType', Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                                <option key={n} value={n}>装饰 {n}</option>
                            ))}
                        </select>
                    </div>
                </>
            );

        case 'water-level':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">值 (%)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={100}
                            value={config.value as number}
                            onChange={(e) => onChange('value', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">形状</label>
                        <select
                            className="property-input"
                            value={config.shape as string}
                            onChange={(e) => onChange('shape', e.target.value)}
                        >
                            <option value="round">圆形</option>
                            <option value="rect">矩形</option>
                            <option value="roundRect">圆角矩形</option>
                        </select>
                    </div>
                </>
            );

        case 'digital-flop':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">数值</label>
                        <input
                            type="number"
                            className="property-input"
                            value={(config.number as number[])?.[0] || 0}
                            onChange={(e) => onChange('number', [Number(e.target.value)])}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">字号</label>
                        <input
                            type="number"
                            className="property-input"
                            value={(config.style as { fontSize?: number })?.fontSize || 30}
                            onChange={(e) => onChange('style', {
                                ...(config.style as object),
                                fontSize: Number(e.target.value),
                            })}
                        />
                    </div>
                </>
            );

        case 'percent-pond':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">值 (%)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={100}
                            value={config.value as number}
                            onChange={(e) => onChange('value', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">边框宽度</label>
                        <input
                            type="number"
                            className="property-input"
                            min={1}
                            max={10}
                            value={config.borderWidth as number}
                            onChange={(e) => onChange('borderWidth', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        case 'scatter-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={config.title as string}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">标题字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={36}
                            value={(config.titleFontSize as number) || 14}
                            onChange={(e) => onChange('titleFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">坐标轴字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={28}
                            value={(config.axisFontSize as number) || 12}
                            onChange={(e) => onChange('axisFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">图例字号</label>
                        <input
                            type="number"
                            className="property-input"
                            min={10}
                            max={28}
                            value={(config.legendFontSize as number) || 12}
                            onChange={(e) => onChange('legendFontSize', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">图例位置</label>
                        <select
                            className="property-input"
                            value={(config.legendPosition as string) || 'auto'}
                            onChange={(e) => onChange('legendPosition', e.target.value)}
                        >
                            <option value="auto">自动</option>
                            <option value="top">顶部</option>
                            <option value="bottom">底部</option>
                            <option value="left">左侧</option>
                            <option value="right">右侧</option>
                        </select>
                    </div>
                    {renderLegendLayoutRows()}
                    {renderCompactPresetRow()}
                    {renderChartPaddingRows()}
                    {renderChartOffsetRows()}
                    {renderSeriesColorRows(['散点系列'])}
                </>
            );

        case 'map-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.title as string) || '区域地图'}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">地图模式</label>
                        <select
                            className="property-input"
                            value={(config.mapMode as string) || 'region'}
                            onChange={(e) => onChange('mapMode', e.target.value)}
                        >
                            <option value="region">区域填色</option>
                            <option value="bubble">气泡地图</option>
                            <option value="scatter">散点地图</option>
                            <option value="heatmap">热力地图</option>
                            <option value="flow">流向地图</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">地图范围</label>
                        <select
                            className="property-input"
                            value={(config.mapScope as string) || 'china'}
                            onChange={(e) => onChange('mapScope', e.target.value)}
                        >
                            <option value="china">中国</option>
                            <option value="world">世界</option>
                            <optgroup label="省级">
                                {PROVINCE_PRESETS.map(p => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                    {((config.mapMode as string) === 'bubble' || (config.mapMode as string) === 'scatter') ? (
                        <div className="property-row">
                            <label className="property-label">气泡颜色</label>
                            <input
                                type="color"
                                className="property-input"
                                value={(config.bubbleColor as string) || '#3b82f6'}
                                onChange={(e) => onChange('bubbleColor', e.target.value)}
                            />
                        </div>
                    ) : null}
                    {(config.mapMode as string) === 'heatmap' ? (
                        <div className="property-row">
                            <label className="property-label">热力半径</label>
                            <input
                                type="number"
                                className="property-input"
                                min={5}
                                max={80}
                                value={(config.heatmapRadius as number) || 20}
                                onChange={(e) => onChange('heatmapRadius', Number(e.target.value))}
                            />
                        </div>
                    ) : null}
                    {(config.mapMode as string) === 'flow' ? (
                        <div className="property-row">
                            <label className="property-label">流动动画</label>
                            <input
                                type="checkbox"
                                checked={config.showFlowEffect !== false}
                                onChange={(e) => onChange('showFlowEffect', e.target.checked)}
                            />
                        </div>
                    ) : null}
                    <div className="property-row">
                        <label className="property-label">区域变量Key</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.regionVariableKey as string) || ''}
                            onChange={(e) => onChange('regionVariableKey', e.target.value)}
                            placeholder="region"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">区域编码变量Key</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.regionCodeVariableKey as string) || ''}
                            onChange={(e) => onChange('regionCodeVariableKey', e.target.value)}
                            placeholder="region_code"
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">优先使用内置底图</label>
                        <input
                            type="checkbox"
                            checked={config.usePresetGeoJson !== false}
                            onChange={(e) => onChange('usePresetGeoJson', e.target.checked)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">GeoJSON URL(可选)</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.geoJsonUrl as string) || ''}
                            onChange={(e) => onChange('geoJsonUrl', e.target.value)}
                            placeholder="https://.../map.geojson"
                        />
                    </div>
                    {!(config.mapMode as string) || (config.mapMode as string) === 'region' ? (
                        <div className="property-row">
                            <label className="property-label">启用下钻</label>
                            <input
                                type="checkbox"
                                checked={config.enableRegionDrill !== false}
                                onChange={(e) => onChange('enableRegionDrill', e.target.checked)}
                            />
                        </div>
                    ) : null}
                </>
            );

        case 'scroll-board':
            return <ScrollBoardConfig component={component} onChange={onChange} />;

        case 'table':
            return <TableConfig component={component} onChange={onChange} />;

        case 'scroll-ranking':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">行数</label>
                        <input
                            type="number"
                            className="property-input"
                            min={1}
                            max={20}
                            value={config.rowNum as number}
                            onChange={(e) => onChange('rowNum', Number(e.target.value))}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">等待时间(ms)</label>
                        <input
                            type="number"
                            className="property-input"
                            min={500}
                            max={10000}
                            step={500}
                            value={config.waitTime as number || 2000}
                            onChange={(e) => onChange('waitTime', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        case 'shape':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">形状</label>
                        <select
                            className="property-input"
                            value={(config.shapeType as string) || 'rect'}
                            onChange={(e) => onChange('shapeType', e.target.value)}
                        >
                            <option value="rect">矩形</option>
                            <option value="circle">圆形</option>
                            <option value="line">线条</option>
                            <option value="arrow">箭头</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">填充色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.fillColor as string) || '#3b82f6'}
                            onChange={(e) => onChange('fillColor', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">边框色</label>
                        <input
                            type="color"
                            className="property-color-input"
                            value={(config.borderColor as string) || '#60a5fa'}
                            onChange={(e) => onChange('borderColor', e.target.value)}
                        />
                    </div>
                </>
            );

        case 'container':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.title as string) || '容器'}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">内边距</label>
                        <input
                            type="number"
                            className="property-input"
                            min={0}
                            max={80}
                            value={(config.padding as number) || 12}
                            onChange={(e) => onChange('padding', Number(e.target.value))}
                        />
                    </div>
                </>
            );

        // ==================== 3D 可视化 ====================
        case 'globe-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input
                            type="text"
                            className="property-input"
                            value={(config.title as string) || '3D 地球'}
                            onChange={(e) => onChange('title', e.target.value)}
                        />
                    </div>
                    <div className="property-row">
                        <label className="property-label">自动旋转</label>
                        <select className="property-input" value={config.autoRotate !== false ? 'true' : 'false'} onChange={(e) => onChange('autoRotate', e.target.value === 'true')}>
                            <option value="true">开启</option>
                            <option value="false">关闭</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">旋转速度</label>
                        <input type="number" className="property-input" min={1} max={50} value={(config.rotateSpeed as number) || 10} onChange={(e) => onChange('rotateSpeed', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">观测距离</label>
                        <input type="number" className="property-input" min={50} max={500} value={(config.viewDistance as number) || 200} onChange={(e) => onChange('viewDistance', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">底图纹理 URL</label>
                        <input type="text" className="property-input" placeholder="https://..." value={(config.baseTexture as string) || ''} onChange={(e) => onChange('baseTexture', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">高度纹理 URL</label>
                        <input type="text" className="property-input" placeholder="https://..." value={(config.heightTexture as string) || ''} onChange={(e) => onChange('heightTexture', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">大气层效果</label>
                        <select className="property-input" value={config.showAtmosphere !== false ? 'true' : 'false'} onChange={(e) => onChange('showAtmosphere', e.target.value === 'true')}>
                            <option value="true">开启</option>
                            <option value="false">关闭</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">散点大小</label>
                        <input type="number" className="property-input" min={2} max={40} value={(config.pointSize as number) || 12} onChange={(e) => onChange('pointSize', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">背景色</label>
                        <input type="color" className="property-input" value={(config.globeBackground as string) || '#000000'} onChange={(e) => onChange('globeBackground', e.target.value)} />
                    </div>
                </>
            );

        case 'bar3d-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input type="text" className="property-input" value={(config.title as string) || '3D 柱状图'} onChange={(e) => onChange('title', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">视角 Alpha</label>
                        <input type="number" className="property-input" min={0} max={90} value={(config.viewAlpha as number) || 40} onChange={(e) => onChange('viewAlpha', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">视角 Beta</label>
                        <input type="number" className="property-input" min={0} max={360} value={(config.viewBeta as number) || 30} onChange={(e) => onChange('viewBeta', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">自动旋转</label>
                        <select className="property-input" value={config.autoRotate === true ? 'true' : 'false'} onChange={(e) => onChange('autoRotate', e.target.value === 'true')}>
                            <option value="false">关闭</option>
                            <option value="true">开启</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">盒宽</label>
                        <input type="number" className="property-input" min={20} max={300} value={(config.boxWidth as number) || 100} onChange={(e) => onChange('boxWidth', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">盒深</label>
                        <input type="number" className="property-input" min={20} max={300} value={(config.boxDepth as number) || 80} onChange={(e) => onChange('boxDepth', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">盒高</label>
                        <input type="number" className="property-input" min={20} max={300} value={(config.boxHeight as number) || 60} onChange={(e) => onChange('boxHeight', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示标签</label>
                        <select className="property-input" value={config.showLabel === true ? 'true' : 'false'} onChange={(e) => onChange('showLabel', e.target.value === 'true')}>
                            <option value="false">关闭</option>
                            <option value="true">开启</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">色阶低值</label>
                        <input type="color" className="property-input" value={(config.colorRange as string[])?.[0] || '#313695'} onChange={(e) => onChange('colorRange', [e.target.value, (config.colorRange as string[])?.[1] || '#a50026'])} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">色阶高值</label>
                        <input type="color" className="property-input" value={(config.colorRange as string[])?.[1] || '#a50026'} onChange={(e) => onChange('colorRange', [(config.colorRange as string[])?.[0] || '#313695', e.target.value])} />
                    </div>
                </>
            );

        case 'scatter3d-chart':
            return (
                <>
                    <div className="property-row">
                        <label className="property-label">标题</label>
                        <input type="text" className="property-input" value={(config.title as string) || '3D 散点图'} onChange={(e) => onChange('title', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">散点大小</label>
                        <input type="number" className="property-input" min={2} max={30} value={(config.pointSize as number) || 8} onChange={(e) => onChange('pointSize', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">视角 Alpha</label>
                        <input type="number" className="property-input" min={0} max={90} value={(config.viewAlpha as number) || 40} onChange={(e) => onChange('viewAlpha', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">视角 Beta</label>
                        <input type="number" className="property-input" min={0} max={360} value={(config.viewBeta as number) || 30} onChange={(e) => onChange('viewBeta', Number(e.target.value))} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">自动旋转</label>
                        <select className="property-input" value={config.autoRotate === true ? 'true' : 'false'} onChange={(e) => onChange('autoRotate', e.target.value === 'true')}>
                            <option value="false">关闭</option>
                            <option value="true">开启</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">显示标签</label>
                        <select className="property-input" value={config.showLabel === true ? 'true' : 'false'} onChange={(e) => onChange('showLabel', e.target.value === 'true')}>
                            <option value="false">关闭</option>
                            <option value="true">开启</option>
                        </select>
                    </div>
                    <div className="property-row">
                        <label className="property-label">X 轴名称</label>
                        <input type="text" className="property-input" value={(config.xAxisName as string) || 'X'} onChange={(e) => onChange('xAxisName', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">Y 轴名称</label>
                        <input type="text" className="property-input" value={(config.yAxisName as string) || 'Y'} onChange={(e) => onChange('yAxisName', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">Z 轴名称</label>
                        <input type="text" className="property-input" value={(config.zAxisName as string) || 'Z'} onChange={(e) => onChange('zAxisName', e.target.value)} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">色阶低值</label>
                        <input type="color" className="property-input" value={(config.colorRange as string[])?.[0] || '#50a3ba'} onChange={(e) => onChange('colorRange', [e.target.value, (config.colorRange as string[])?.[1] || '#eac736'])} />
                    </div>
                    <div className="property-row">
                        <label className="property-label">色阶高值</label>
                        <input type="color" className="property-input" value={(config.colorRange as string[])?.[1] || '#eac736'} onChange={(e) => onChange('colorRange', [(config.colorRange as string[])?.[0] || '#50a3ba', e.target.value])} />
                    </div>
                </>
            );

        default:
            return (
                <div className="empty-state-hint">
                    暂无可配置项
                </div>
            );
    }
}
