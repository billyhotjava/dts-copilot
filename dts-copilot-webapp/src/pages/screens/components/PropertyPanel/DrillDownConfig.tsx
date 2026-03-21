import type { DrillLevel, ScreenComponent } from '../../types';
import { CardIdPicker } from '../CardIdPicker';
import { DRILL_CONFIGURABLE_TYPES } from './PropertyPanelConstants';

export function renderDrillDownConfig(
    component: ScreenComponent,
    updateComponent: (id: string, updates: Partial<ScreenComponent>) => void,
    options?: { embedded?: boolean },
) {
    const { type, dataSource, drillDown } = component;
    const cardId = dataSource?.type === 'card' ? dataSource.cardConfig?.cardId : undefined;

    // Show for drill-capable components backed by a valid card data source.
    if (!DRILL_CONFIGURABLE_TYPES.has(type) || dataSource?.type !== 'card' || !cardId || cardId <= 0) {
        return null;
    }

    const enabled = drillDown?.enabled ?? false;
    const levels = drillDown?.levels ?? [];

    const setDrillDown = (updates: Partial<typeof drillDown>) => {
        updateComponent(component.id, {
            drillDown: { enabled, levels, ...drillDown, ...updates },
        });
    };

    const updateLevel = (index: number, field: keyof DrillLevel, value: string | number) => {
        const newLevels = [...levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setDrillDown({ levels: newLevels });
    };

    const removeLevel = (index: number) => {
        setDrillDown({ levels: levels.filter((_, i) => i !== index) });
    };

    const addLevel = () => {
        setDrillDown({ levels: [...levels, { cardId: 0, paramName: '', label: '' }] });
    };

    const content = (
        <>
            <div className="property-row">
                <label className="property-label">启用下钻</label>
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setDrillDown({ enabled: e.target.checked })}
                />
            </div>

            {enabled && (
                <>
                    {levels.map((level, i) => (
                        <div key={i} style={{
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 4,
                            padding: 8,
                            marginBottom: 8,
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 4,
                                fontSize: 11,
                                color: '#888',
                            }}>
                                <span>层级 {i + 1}</span>
                                <button
                                    className="property-btn-small"
                                    onClick={() => removeLevel(i)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#ef4444', cursor: 'pointer', fontSize: 11,
                                    }}
                                >
                                    删除
                                </button>
                            </div>
                            <div className="property-row">
                                <label className="property-label">Card</label>
                                <CardIdPicker
                                    value={level.cardId || 0}
                                    onChange={(cardId) => updateLevel(i, 'cardId', cardId)}
                                    placeholder="-- 下钻目标 --"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">参数名</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={level.paramName}
                                    onChange={(e) => updateLevel(i, 'paramName', e.target.value)}
                                    placeholder="如: region"
                                />
                            </div>
                            <div className="property-row">
                                <label className="property-label">标签</label>
                                <input
                                    type="text"
                                    className="property-input"
                                    value={level.label}
                                    onChange={(e) => updateLevel(i, 'label', e.target.value)}
                                    placeholder="如: 地区"
                                />
                            </div>
                        </div>
                    ))}

                    <button
                        className="property-input"
                        onClick={addLevel}
                        style={{
                            width: '100%', cursor: 'pointer',
                            textAlign: 'center', color: '#6366f1',
                        }}
                    >
                        + 添加下钻层级
                    </button>
                </>
            )}
        </>
    );

    if (options?.embedded) {
        return content;
    }
    return (
        <div className="property-section">
            <div className="property-section-title">下钻配置</div>
            {content}
        </div>
    );
}
