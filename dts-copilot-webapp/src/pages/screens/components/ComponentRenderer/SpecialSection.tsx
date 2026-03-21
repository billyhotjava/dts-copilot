import { isWebGLSupported } from './constants';
import type { RenderSectionContext } from './constants';

/**
 * Renders 3D visualization types: globe-chart, bar3d-chart, scatter3d-chart.
 *
 * Returns React.ReactNode if the type is handled, or `undefined` if not.
 */
export function renderSpecialSection(
    type: string,
    ctx: RenderSectionContext,
): React.ReactNode | undefined {
    const {
        c, t, themeOptions, chartMotionOption,
        echartsClickHandler, renderEChartWithHandles,
    } = ctx;

    switch (type) {
        case 'globe-chart': {
            if (!isWebGLSupported()) {
                return (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: t.placeholder.background, border: t.placeholder.border,
                        borderRadius: 4, color: '#ef4444', fontSize: 13,
                    }}>
                        当前浏览器不支持 WebGL，无法渲染 3D 组件
                    </div>
                );
            }
            const globeTitle = String(c.title ?? '3D 地球');
            const autoRotate = c.autoRotate !== false;
            const rotateSpeed = Number(c.rotateSpeed ?? 10);
            const baseTexture = String(c.baseTexture ?? '');
            const heightTexture = String(c.heightTexture ?? '');
            const showAtmosphere = c.showAtmosphere !== false;
            const globeBgColor = String(c.globeBackground ?? '#000');
            const scatterData = Array.isArray(c.scatterData)
                ? (c.scatterData as Array<{ name: string; value: [number, number, number] }>)
                : [];
            const flowData = Array.isArray(c.flowData)
                ? (c.flowData as Array<{ coords: [number, number][] }>)
                : [];

            const globeSeries: Array<Record<string, unknown>> = [];
            if (scatterData.length > 0) {
                globeSeries.push({
                    type: 'scatter3D',
                    coordinateSystem: 'globe',
                    data: scatterData.map(d => ({
                        name: d.name,
                        value: d.value,
                    })),
                    symbolSize: Number(c.pointSize ?? 12),
                    itemStyle: { color: t.echarts.colorPalette[0] },
                    label: { show: true, formatter: '{b}', textStyle: { color: '#fff', fontSize: 10 } },
                });
            }
            if (flowData.length > 0) {
                globeSeries.push({
                    type: 'lines3D',
                    coordinateSystem: 'globe',
                    effect: { show: true, trailLength: 0.2, trailWidth: 2, trailOpacity: 0.6 },
                    lineStyle: { width: 1, color: t.echarts.colorPalette[1], opacity: 0.6 },
                    data: flowData.map(f => ({ coords: f.coords })),
                    blendMode: 'lighter',
                });
            }

            return renderEChartWithHandles({
                backgroundColor: globeBgColor,
                globe: {
                    baseTexture: baseTexture || undefined,
                    heightTexture: heightTexture || undefined,
                    shading: 'color',
                    viewControl: {
                        autoRotate,
                        autoRotateSpeed: rotateSpeed,
                        distance: Number(c.viewDistance ?? 200),
                    },
                    light: {
                        ambient: { intensity: 0.6 },
                        main: { intensity: 1.2 },
                    },
                    atmosphere: showAtmosphere ? { show: true, glowPower: 6 } : undefined,
                },
                series: globeSeries,
                title: { text: globeTitle, textStyle: { color: t.textPrimary, fontSize: 14 }, left: 'center', top: 8 },
            }, echartsClickHandler);
        }

        case 'bar3d-chart': {
            if (!isWebGLSupported()) {
                return (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: t.placeholder.background, border: t.placeholder.border,
                        borderRadius: 4, color: '#ef4444', fontSize: 13,
                    }}>
                        当前浏览器不支持 WebGL，无法渲染 3D 组件
                    </div>
                );
            }
            const bar3dTitle = String(c.title ?? '3D 柱状图');
            const xData = Array.isArray(c.xAxisData) ? c.xAxisData as string[] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            const yData = Array.isArray(c.yAxisData) ? c.yAxisData as string[] : ['A', 'B', 'C'];
            const bar3dData = Array.isArray(c.data)
                ? (c.data as Array<[number, number, number]>)
                : xData.flatMap((_, xi) => yData.map((__, yi) => [xi, yi, Math.round(Math.random() * 100)] as [number, number, number]));
            const bar3dMax = Math.max(1, ...bar3dData.map(d => d[2]));
            const colorRangeRaw = c.colorRange as [string, string] | undefined;
            const colorRange = colorRangeRaw ?? ['#313695', '#a50026'];
            const viewAlpha = Number(c.viewAlpha ?? 40);
            const viewBeta = Number(c.viewBeta ?? 30);

            return renderEChartWithHandles({
                ...themeOptions,
                title: { text: bar3dTitle, textStyle: { color: t.textPrimary, fontSize: 14 }, left: 'center', top: 8 },
                tooltip: {},
                visualMap: {
                    max: bar3dMax,
                    inRange: { color: colorRange },
                    textStyle: { color: t.textPrimary },
                },
                xAxis3D: { type: 'category', data: xData, axisLabel: { color: t.textPrimary } },
                yAxis3D: { type: 'category', data: yData, axisLabel: { color: t.textPrimary } },
                zAxis3D: { type: 'value', axisLabel: { color: t.textPrimary } },
                grid3D: {
                    boxWidth: Number(c.boxWidth ?? 100),
                    boxDepth: Number(c.boxDepth ?? 80),
                    boxHeight: Number(c.boxHeight ?? 60),
                    viewControl: { alpha: viewAlpha, beta: viewBeta, autoRotate: c.autoRotate === true },
                    light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } },
                },
                series: [{
                    type: 'bar3D',
                    data: bar3dData.map(d => ({ value: [d[0], d[1], d[2]] })),
                    shading: 'lambert',
                    label: {
                        show: c.showLabel === true,
                        textStyle: { color: '#fff', fontSize: 10 },
                        formatter: (p: Record<string, unknown>) => String((p.value as number[])?.[2] ?? ''),
                    },
                }],
            }, echartsClickHandler);
        }

        case 'scatter3d-chart': {
            if (!isWebGLSupported()) {
                return (
                    <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: t.placeholder.background, border: t.placeholder.border,
                        borderRadius: 4, color: '#ef4444', fontSize: 13,
                    }}>
                        当前浏览器不支持 WebGL，无法渲染 3D 组件
                    </div>
                );
            }
            const scatter3dTitle = String(c.title ?? '3D 散点图');
            const scatter3dData = Array.isArray(c.data)
                ? (c.data as Array<[number, number, number]>)
                : Array.from({ length: 30 }, () => [
                    Math.round(Math.random() * 100),
                    Math.round(Math.random() * 100),
                    Math.round(Math.random() * 100),
                ] as [number, number, number]);
            const scatter3dMax = Math.max(1, ...scatter3dData.map(d => d[2]));
            const sColorRange = (c.colorRange as [string, string]) ?? ['#50a3ba', '#eac736'];
            const sPointSize = Number(c.pointSize ?? 8);

            return renderEChartWithHandles({
                ...themeOptions,
                title: { text: scatter3dTitle, textStyle: { color: t.textPrimary, fontSize: 14 }, left: 'center', top: 8 },
                tooltip: {},
                visualMap: {
                    max: scatter3dMax,
                    inRange: { color: sColorRange },
                    dimension: 2,
                    textStyle: { color: t.textPrimary },
                },
                xAxis3D: { type: 'value', axisLabel: { color: t.textPrimary }, name: String(c.xAxisName ?? 'X') },
                yAxis3D: { type: 'value', axisLabel: { color: t.textPrimary }, name: String(c.yAxisName ?? 'Y') },
                zAxis3D: { type: 'value', axisLabel: { color: t.textPrimary }, name: String(c.zAxisName ?? 'Z') },
                grid3D: {
                    viewControl: {
                        alpha: Number(c.viewAlpha ?? 40),
                        beta: Number(c.viewBeta ?? 30),
                        autoRotate: c.autoRotate === true,
                    },
                    light: { main: { intensity: 1.2 }, ambient: { intensity: 0.3 } },
                },
                series: [{
                    type: 'scatter3D',
                    data: scatter3dData,
                    symbolSize: sPointSize,
                    itemStyle: { opacity: 0.8 },
                    label: {
                        show: c.showLabel === true,
                        textStyle: { color: '#fff', fontSize: 10 },
                    },
                }],
            }, echartsClickHandler);
        }

        default:
            return undefined;
    }
}
