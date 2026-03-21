import type { ScreenComponent } from '../../types';
import { renderChartComponentConfig } from './ChartComponentConfig';
import { renderWidgetComponentConfig } from './WidgetComponentConfig';
import { renderThreeDComponentConfig } from './ThreeDComponentConfig';

/**
 * Dispatcher that delegates to category-specific config renderers.
 * Maintains the original public API consumed by PropertyPanel.
 */
export function renderComponentConfig(
    component: ScreenComponent,
    onChange: (key: string, value: unknown) => void
) {
    return (
        renderChartComponentConfig(component, onChange)
        ?? renderWidgetComponentConfig(component, onChange)
        ?? renderThreeDComponentConfig(component, onChange)
        ?? (
            <div className="empty-state-hint">
                暂无可配置项
            </div>
        )
    );
}
