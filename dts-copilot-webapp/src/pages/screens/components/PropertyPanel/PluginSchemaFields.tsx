import type { ScreenComponent } from '../../types';
import type { PropertySchemaField } from '../../plugins/types';

export function renderPluginSchemaFields(
    component: ScreenComponent,
    fields: PropertySchemaField[],
    onChange: (key: string, value: unknown) => void,
) {
    if (!Array.isArray(fields) || fields.length === 0) {
        return null;
    }
    return (
        <>
            {fields.map((field) => {
                const key = String(field?.key || '').trim();
                if (!key) return null;
                const label = field?.label || key;
                const value = component.config[key] ?? field?.defaultValue;
                const description = String(field?.description || '').trim();
                const descriptionNode = description ? (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, lineHeight: 1.45 }}>
                        {description}
                    </div>
                ) : null;
                if (field.type === 'boolean') {
                    return (
                        <div className="property-row" key={key}>
                            <label className="property-label">{label}</label>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="checkbox"
                                    checked={Boolean(value)}
                                    onChange={(e) => onChange(key, e.target.checked)}
                                />
                                {descriptionNode}
                            </div>
                        </div>
                    );
                }
                if (field.type === 'number') {
                    const min = Number.isFinite(field.min) ? Number(field.min) : undefined;
                    const max = Number.isFinite(field.max) ? Number(field.max) : undefined;
                    const step = Number.isFinite(field.step) ? Number(field.step) : undefined;
                    return (
                        <div className="property-row" key={key}>
                            <label className="property-label">{label}</label>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="number"
                                    className="property-input"
                                    min={min}
                                    max={max}
                                    step={step}
                                    value={Number(value ?? 0)}
                                    onChange={(e) => onChange(key, Number(e.target.value))}
                                />
                                {descriptionNode}
                            </div>
                        </div>
                    );
                }
                if (field.type === 'select') {
                    const options = Array.isArray(field.options)
                        ? field.options
                            .map((item) => {
                                if (!item || typeof item !== 'object') return null;
                                const labelText = String(item.label ?? '').trim();
                                const rawValue = (item as { value?: unknown }).value;
                                if (!labelText) return null;
                                if (
                                    typeof rawValue !== 'string'
                                    && typeof rawValue !== 'number'
                                    && typeof rawValue !== 'boolean'
                                ) {
                                    return null;
                                }
                                return {
                                    label: labelText,
                                    value: rawValue,
                                };
                            })
                            .filter((item): item is { label: string; value: string | number | boolean } => !!item)
                        : [];
                    const selectedIndex = options.findIndex((item) => String(item.value) === String(value));
                    return (
                        <div className="property-row" key={key}>
                            <label className="property-label">{label}</label>
                            <div style={{ flex: 1 }}>
                                <select
                                    className="property-input"
                                    value={selectedIndex >= 0 ? String(selectedIndex) : ''}
                                    onChange={(e) => {
                                        const nextIdx = Number(e.target.value);
                                        if (!Number.isFinite(nextIdx) || nextIdx < 0 || nextIdx >= options.length) {
                                            return;
                                        }
                                        onChange(key, options[nextIdx].value);
                                    }}
                                >
                                    {selectedIndex < 0 && (
                                        <option value="">-- 请选择 --</option>
                                    )}
                                    {options.map((item, idx) => (
                                        <option key={`${item.label}-${idx}`} value={String(idx)}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                {descriptionNode}
                            </div>
                        </div>
                    );
                }
                if (field.type === 'color') {
                    const fallback = typeof value === 'string' && value ? value : '#3b82f6';
                    return (
                        <div className="property-row" key={key}>
                            <label className="property-label">{label}</label>
                            <div style={{ flex: 1 }}>
                                <input
                                    type="color"
                                    className="property-color-input"
                                    value={fallback}
                                    onChange={(e) => onChange(key, e.target.value)}
                                />
                                {descriptionNode}
                            </div>
                        </div>
                    );
                }
                if (field.type === 'array' || field.type === 'json') {
                    const isArray = field.type === 'array';
                    const snapshot = JSON.stringify(
                        value ?? (isArray ? [] : {}),
                        null,
                        2,
                    );
                    return (
                        <div className="property-row" key={key}>
                            <label className="property-label">{label}</label>
                            <div style={{ flex: 1 }}>
                                <button
                                    type="button"
                                    className="header-btn"
                                    onClick={() => {
                                        const input = window.prompt(`${label} (${isArray ? 'JSON数组' : 'JSON对象'})`, snapshot);
                                        if (input == null) return;
                                        try {
                                            const parsed = JSON.parse(input);
                                            if (isArray && !Array.isArray(parsed)) {
                                                alert(`${label} 需要是 JSON 数组`);
                                                return;
                                            }
                                            if (!isArray && (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed))) {
                                                alert(`${label} 需要是 JSON 对象`);
                                                return;
                                            }
                                            onChange(key, parsed);
                                        } catch {
                                            alert(`${label} JSON 格式错误`);
                                        }
                                    }}
                                >
                                    编辑JSON
                                </button>
                                <pre style={{
                                    margin: '6px 0 0',
                                    maxHeight: 120,
                                    overflow: 'auto',
                                    fontSize: 11,
                                    opacity: 0.8,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}
                                >
                                    {snapshot}
                                </pre>
                                {descriptionNode}
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="property-row" key={key}>
                        <label className="property-label">{label}</label>
                        <div style={{ flex: 1 }}>
                            <input
                                type="text"
                                className="property-input"
                                value={String(value ?? '')}
                                placeholder={String(field?.placeholder || '')}
                                onChange={(e) => onChange(key, e.target.value)}
                            />
                            {descriptionNode}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
