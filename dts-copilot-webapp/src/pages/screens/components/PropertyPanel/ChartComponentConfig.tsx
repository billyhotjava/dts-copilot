import type { ScreenComponent } from '../../types';
import { PROVINCE_PRESETS } from '../../renderers/shared/geoJsonCache';
import { createChartConfigHelpers } from './ComponentConfig.helpers';
import { ScrollBoardConfig, TableConfig } from './SpecializedConfigs';

type OnChange = (key: string, value: unknown) => void;

/**
 * Config panel for chart-type components:
 * line-chart, bar-chart, pie-chart, gauge-chart, radar-chart, funnel-chart,
 * scatter-chart, map-chart, scroll-board, table, scroll-ranking
 *
 * Returns JSX or undefined if the component type is not handled here.
 */
export function renderChartComponentConfig(
    component: ScreenComponent,
    onChange: OnChange,
): React.JSX.Element | undefined {
    const { type, config } = component;
    const {
        renderSeriesColorRows,
        renderLegendLayoutRows,
        renderCompactPresetRow,
        renderChartPaddingRows,
        renderChartOffsetRows,
        renderAxisLabelRows,
        renderSeriesLabelRows,
    } = createChartConfigHelpers(component, onChange);

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

        default:
            return undefined;
    }
}
