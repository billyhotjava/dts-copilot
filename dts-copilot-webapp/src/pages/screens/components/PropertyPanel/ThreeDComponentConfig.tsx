import type { ScreenComponent } from '../../types';

type OnChange = (key: string, value: unknown) => void;

/**
 * Config panel for 3D visualization components:
 * globe-chart, bar3d-chart, scatter3d-chart
 *
 * Returns JSX or undefined if the component type is not handled here.
 */
export function renderThreeDComponentConfig(
    component: ScreenComponent,
    onChange: OnChange,
): React.JSX.Element | undefined {
    const { type, config } = component;

    switch (type) {
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
            return undefined;
    }
}
