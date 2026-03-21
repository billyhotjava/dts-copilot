import type {
    ChartMarkArea,
    ChartMarkLine,
    DataSourceConfig,
    ScreenComponent,
    SeriesConditionalColor,
} from '../../types';
import {
    resolveDataSourceType,
    type ColumnEntry,
    type SourceColumnOption,
} from './PropertyPanelConstants';

export function CardSourceColumnBindingsEditor({
    title,
    sourceCols,
    columns,
    defaultAlign,
    onColumnsChange,
}: {
    title: string;
    sourceCols: SourceColumnOption[];
    columns: ColumnEntry[] | undefined;
    defaultAlign: NonNullable<ColumnEntry['align']>;
    onColumnsChange: (value: ColumnEntry[] | undefined) => void;
}) {
    const fallbackColumns = sourceCols.map((item) => ({ source: item.name } as ColumnEntry));
    const effectiveColumns = columns ?? fallbackColumns;
    const usedSourceSet = new Set(effectiveColumns.map((item) => item.source));
    const unboundSources = sourceCols.filter((item) => !usedSourceSet.has(item.name));

    const updateColumn = (index: number, patch: Partial<ColumnEntry>) => {
        const next = effectiveColumns.map((item, i) => (i === index ? { ...item, ...patch } : item));
        onColumnsChange(next);
    };

    const handleSourceChange = (index: number, nextSource: string) => {
        const duplicate = effectiveColumns.some((item, i) => i !== index && item.source === nextSource);
        if (duplicate) {
            alert('该字段已被绑定，请选择其他字段');
            return;
        }
        updateColumn(index, { source: nextSource });
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= effectiveColumns.length) return;
        const next = [...effectiveColumns];
        const [current] = next.splice(index, 1);
        next.splice(target, 0, current);
        onColumnsChange(next);
    };

    const handleRemove = (index: number) => {
        onColumnsChange(effectiveColumns.filter((_, i) => i !== index));
    };

    return (
        <>
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                {title}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button
                    type="button"
                    className="header-btn"
                    onClick={() => {
                        if (!unboundSources[0]) return;
                        onColumnsChange([...effectiveColumns, { source: unboundSources[0].name, align: defaultAlign }]);
                    }}
                    disabled={unboundSources.length === 0}
                    title="追加一个未绑定字段"
                >
                    + 添加列
                </button>
                <button
                    type="button"
                    className="header-btn"
                    onClick={() => onColumnsChange(undefined)}
                    title="恢复默认映射（按数据源原始字段）"
                >
                    恢复默认
                </button>
                <button
                    type="button"
                    className="header-btn"
                    onClick={() => onColumnsChange([])}
                    disabled={effectiveColumns.length === 0}
                    title="清空当前映射"
                >
                    清空
                </button>
            </div>
            {effectiveColumns.length === 0 && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 4, marginBottom: 8 }}>
                    当前无字段绑定，请点击"添加列"。
                </div>
            )}
            {effectiveColumns.map((entry, index) => {
                const sourceMeta = sourceCols.find((item) => item.name === entry.source);
                return (
                    <div key={`${entry.source}-${index}`} style={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 4,
                        padding: '6px',
                        marginBottom: 6,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                                列 {index + 1}{sourceMeta ? '' : ' (失效字段)'}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    type="button"
                                    className="header-btn"
                                    onClick={() => handleMove(index, -1)}
                                    disabled={index === 0}
                                    title="上移"
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className="header-btn"
                                    onClick={() => handleMove(index, 1)}
                                    disabled={index >= effectiveColumns.length - 1}
                                    title="下移"
                                >
                                    ↓
                                </button>
                                <button
                                    type="button"
                                    className="header-btn"
                                    onClick={() => handleRemove(index)}
                                    title="删除该列"
                                >
                                    删除
                                </button>
                            </div>
                        </div>
                        <div className="property-row">
                            <label className="property-label">绑定字段</label>
                            <select
                                className="property-input"
                                value={entry.source}
                                onChange={(e) => handleSourceChange(index, e.target.value)}
                            >
                                {!sourceMeta && (
                                    <option value={entry.source}>{entry.source} (失效字段)</option>
                                )}
                                {sourceCols.map((item) => (
                                    <option key={item.name} value={item.name}>
                                        {(item.displayName || item.name)} ({item.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="property-row">
                            <label className="property-label">表头标题</label>
                            <input
                                type="text"
                                className="property-input"
                                placeholder={sourceMeta?.displayName || entry.source}
                                value={entry.alias || ''}
                                onChange={(e) => {
                                    const nextAlias = e.target.value;
                                    if (nextAlias) {
                                        updateColumn(index, { alias: nextAlias });
                                        return;
                                    }
                                    const next = effectiveColumns.map((item, i) => {
                                        if (i !== index) return item;
                                        const { alias: _alias, ...rest } = item;
                                        return rest;
                                    });
                                    onColumnsChange(next);
                                }}
                            />
                        </div>
                        <div className="property-row">
                            <label className="property-label">对齐</label>
                            <select
                                className="property-input"
                                value={(entry.align as string) || defaultAlign}
                                onChange={(e) => updateColumn(index, { align: e.target.value as ColumnEntry['align'] })}
                            >
                                <option value="left">左</option>
                                <option value="center">中</option>
                                <option value="right">右</option>
                            </select>
                        </div>
                        <div className="property-row">
                            <label className="property-label">自动换行</label>
                            <input
                                type="checkbox"
                                checked={entry.wrap === true}
                                onChange={(e) => updateColumn(index, { wrap: e.target.checked })}
                            />
                        </div>
                        <div className="property-row">
                            <label className="property-label">列宽(%)</label>
                            <input
                                type="number"
                                className="property-input"
                                min={5}
                                max={100}
                                value={typeof entry.width === 'number' ? entry.width : ''}
                                placeholder="自动"
                                onChange={(e) => {
                                    const raw = e.target.value.trim();
                                    if (!raw) {
                                        updateColumn(index, { width: undefined });
                                        return;
                                    }
                                    const parsed = Number(raw);
                                    updateColumn(index, {
                                        width: Number.isFinite(parsed) ? Math.max(5, Math.min(100, parsed)) : undefined,
                                    });
                                }}
                            />
                        </div>
                        <div className="property-row">
                            <label className="property-label">格式化</label>
                            <select
                                className="property-input"
                                value={(entry.formatter as string) || 'auto'}
                                onChange={(e) => updateColumn(index, { formatter: e.target.value as ColumnEntry['formatter'] })}
                            >
                                <option value="auto">自动</option>
                                <option value="string">文本</option>
                                <option value="number">数字</option>
                                <option value="percent">百分比</option>
                                <option value="date">日期时间</option>
                            </select>
                        </div>
                    </div>
                );
            })}
        </>
    );
}

/** scroll-board 专用属性面板，支持动态列选择 */
export function ScrollBoardConfig({ component, onChange }: {
    component: ScreenComponent;
    onChange: (key: string, value: unknown) => void;
}) {
    const { config, dataSource } = component;

    // Read _sourceColumns persisted by ComponentRenderer (no separate API call)
    const sourceCols = config._sourceColumns as Array<{ name: string; displayName: string }> ?? [];
    const columns = config.columns as ColumnEntry[] | undefined;
    const hasDynamicSource = resolveDataSourceType(dataSource as DataSourceConfig | undefined) !== 'static';

    // Static fallback: use config.header when no card data source
    const staticHeaders = config.header as string[] || [];
    const columnAlias = config.columnAlias as Record<string, string> || {};

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
            <div className="property-row">
                <label className="property-label">表头颜色</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.headerColor as string) || '#ffffff'}
                    onChange={(e) => onChange('headerColor', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">表头背景</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.headerBGC as string) || '#003366'}
                    onChange={(e) => onChange('headerBGC', e.target.value)}
                />
            </div>

            {/* Card 数据源: 等待列加载 */}
            {hasDynamicSource && sourceCols.length === 0 && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 8, padding: '4px 0' }}>
                    等待数据源加载列信息…
                </div>
            )}

            {/* Card 数据源: 动态列选择 */}
            {hasDynamicSource && sourceCols.length > 0 && (
                <CardSourceColumnBindingsEditor
                    title="显示列 (来自数据源)"
                    sourceCols={sourceCols}
                    columns={columns}
                    defaultAlign="center"
                    onColumnsChange={(value) => onChange('columns', value)}
                />
            )}

            {/* 静态数据源: 按索引的表头别名 (保持向后兼容) */}
            {!hasDynamicSource && staticHeaders.length > 0 && (
                <>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                        表头别名
                    </div>
                    {staticHeaders.map((h, i) => (
                        <div className="property-row" key={i}>
                            <label className="property-label" title={h}>列{i + 1}</label>
                            <input
                                type="text"
                                className="property-input"
                                placeholder={h}
                                value={columnAlias[String(i)] || ''}
                                onChange={(e) => {
                                    const newAlias = { ...columnAlias };
                                    if (e.target.value) {
                                        newAlias[String(i)] = e.target.value;
                                    } else {
                                        delete newAlias[String(i)];
                                    }
                                    onChange('columnAlias', newAlias);
                                }}
                            />
                        </div>
                    ))}
                </>
            )}
        </>
    );
}

/** Chart annotation config: markLines, markAreas, conditionalColors */
export function ChartAnnotationConfig({ component, onChange }: {
    component: ScreenComponent;
    onChange: (key: string, value: unknown) => void;
}) {
    const { config } = component;
    const markLines = (config.markLines as ChartMarkLine[]) ?? [];
    const markAreas = (config.markAreas as ChartMarkArea[]) ?? [];
    const conditionalColors = (config.conditionalColors as SeriesConditionalColor[]) ?? [];

    const addMarkLine = () => {
        if (markLines.length >= 5) return;
        onChange('markLines', [...markLines, { type: 'value' as const, value: 0, name: '', color: '#ff6b6b', lineStyle: 'dashed' as const, axis: 'y' as const }]);
    };
    const updateMarkLine = (idx: number, patch: Partial<ChartMarkLine>) => {
        onChange('markLines', markLines.map((ml, i) => i === idx ? { ...ml, ...patch } : ml));
    };
    const removeMarkLine = (idx: number) => {
        onChange('markLines', markLines.filter((_, i) => i !== idx));
    };
    const addMarkArea = () => {
        if (markAreas.length >= 3) return;
        onChange('markAreas', [...markAreas, { from: 0, to: 100, name: '', color: 'rgba(255,107,107,0.15)', axis: 'y' as const }]);
    };
    const updateMarkArea = (idx: number, patch: Partial<ChartMarkArea>) => {
        onChange('markAreas', markAreas.map((ma, i) => i === idx ? { ...ma, ...patch } : ma));
    };
    const removeMarkArea = (idx: number) => {
        onChange('markAreas', markAreas.filter((_, i) => i !== idx));
    };
    const addConditionalColor = () => {
        if (conditionalColors.length >= 5) return;
        onChange('conditionalColors', [...conditionalColors, { operator: '>' as const, value: 0, color: '#ef4444' }]);
    };
    const updateConditionalColor = (idx: number, patch: Partial<SeriesConditionalColor>) => {
        onChange('conditionalColors', conditionalColors.map((cc, i) => i === idx ? { ...cc, ...patch } : cc));
    };
    const removeConditionalColor = (idx: number) => {
        onChange('conditionalColors', conditionalColors.filter((_, i) => i !== idx));
    };

    return (
        <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>辅助线 ({markLines.length}/5)</div>
            {markLines.map((ml, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 60px 60px auto', gap: 4, alignItems: 'center' }}>
                    <select className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} value={ml.type}
                        onChange={(e) => updateMarkLine(idx, { type: e.target.value as ChartMarkLine['type'] })}>
                        <option value="value">固定值</option><option value="average">平均</option>
                        <option value="min">最小</option><option value="max">最大</option>
                    </select>
                    {ml.type === 'value' ? (
                        <input type="number" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} value={ml.value ?? 0}
                            onChange={(e) => updateMarkLine(idx, { value: Number(e.target.value) })} />
                    ) : <span />}
                    <input type="text" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} placeholder="标签" value={ml.name ?? ''} onChange={(e) => updateMarkLine(idx, { name: e.target.value })} />
                    <input type="color" className="property-color-input" value={ml.color ?? '#ff6b6b'} onChange={(e) => updateMarkLine(idx, { color: e.target.value })} />
                    <button type="button" className="property-btn-small" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => removeMarkLine(idx)}>×</button>
                </div>
            ))}
            {markLines.length < 5 && (
                <button type="button" className="property-btn-small" onClick={addMarkLine} style={{ fontSize: 11, justifySelf: 'start' }}>+ 辅助线</button>
            )}

            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>标记区域 ({markAreas.length}/3)</div>
            {markAreas.map((ma, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 60px 60px auto', gap: 4, alignItems: 'center' }}>
                    <input type="number" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} placeholder="起始" value={ma.from} onChange={(e) => updateMarkArea(idx, { from: Number(e.target.value) })} />
                    <input type="number" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} placeholder="结束" value={ma.to} onChange={(e) => updateMarkArea(idx, { to: Number(e.target.value) })} />
                    <input type="text" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} placeholder="标签" value={ma.name ?? ''} onChange={(e) => updateMarkArea(idx, { name: e.target.value })} />
                    <input type="color" className="property-color-input" value={ma.color?.startsWith('rgba') ? '#ff6b6b' : (ma.color ?? '#ff6b6b')}
                        onChange={(e) => { const h = e.target.value; const r = parseInt(h.slice(1, 3), 16); const g = parseInt(h.slice(3, 5), 16); const b = parseInt(h.slice(5, 7), 16); updateMarkArea(idx, { color: `rgba(${r},${g},${b},0.15)` }); }} />
                    <button type="button" className="property-btn-small" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => removeMarkArea(idx)}>×</button>
                </div>
            ))}
            {markAreas.length < 3 && (
                <button type="button" className="property-btn-small" onClick={addMarkArea} style={{ fontSize: 11, justifySelf: 'start' }}>+ 标记区域</button>
            )}

            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>条件着色 ({conditionalColors.length}/5)</div>
            {conditionalColors.map((cc, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 60px 60px 40px auto', gap: 4, alignItems: 'center' }}>
                    <select className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} value={cc.operator}
                        onChange={(e) => updateConditionalColor(idx, { operator: e.target.value as SeriesConditionalColor['operator'] })}>
                        <option value=">">{'>'}</option><option value=">=">{'>='}</option><option value="<">{'<'}</option>
                        <option value="<=">{'<='}</option><option value="==">{'=='}</option><option value="between">区间</option>
                    </select>
                    <input type="number" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} value={cc.value}
                        onChange={(e) => updateConditionalColor(idx, { value: Number(e.target.value) })} />
                    {cc.operator === 'between' ? (
                        <input type="number" className="property-input" style={{ fontSize: 11, padding: '3px 4px' }} placeholder="上限" value={cc.valueTo ?? 0}
                            onChange={(e) => updateConditionalColor(idx, { valueTo: Number(e.target.value) })} />
                    ) : <span />}
                    <input type="color" className="property-color-input" value={cc.color} onChange={(e) => updateConditionalColor(idx, { color: e.target.value })} />
                    <button type="button" className="property-btn-small" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => removeConditionalColor(idx)}>×</button>
                </div>
            ))}
            {conditionalColors.length < 5 && (
                <button type="button" className="property-btn-small" onClick={addConditionalColor} style={{ fontSize: 11, justifySelf: 'start' }}>+ 条件着色</button>
            )}
        </div>
    );
}

/** table 专用属性面板，支持动态列选择和样式配置 */
export function TableConfig({ component, onChange }: {
    component: ScreenComponent;
    onChange: (key: string, value: unknown) => void;
}) {
    const { config, dataSource } = component;

    const sourceCols = config._sourceColumns as Array<{ name: string; displayName: string }> ?? [];
    const columns = config.columns as ColumnEntry[] | undefined;
    const hasDynamicSource = resolveDataSourceType(dataSource as DataSourceConfig | undefined) !== 'static';

    const staticHeaders = config.header as string[] || [];
    const columnAlias = config.columnAlias as Record<string, string> || {};

    return (
        <>
            <div className="property-row">
                <label className="property-label">字号</label>
                <input
                    type="number"
                    className="property-input"
                    min={10}
                    max={24}
                    value={(config.fontSize as number) || 13}
                    onChange={(e) => onChange('fontSize', Number(e.target.value))}
                />
            </div>
            <div className="property-row">
                <label className="property-label">表头颜色</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.headerColor as string) || '#e5e7eb'}
                    onChange={(e) => onChange('headerColor', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">表头背景</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.headerBackground as string) || '#64748b'}
                    onChange={(e) => onChange('headerBackground', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">正文颜色</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.bodyColor as string) || '#d1d5db'}
                    onChange={(e) => onChange('bodyColor', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">边框颜色</label>
                <input
                    type="color"
                    className="property-color-input"
                    value={(config.borderColor as string) || '#94a3b8'}
                    onChange={(e) => onChange('borderColor', e.target.value)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">启用排序</label>
                <input
                    type="checkbox"
                    checked={config.enableSort !== false}
                    onChange={(e) => onChange('enableSort', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">分页</label>
                <input
                    type="checkbox"
                    checked={config.enablePagination === true}
                    onChange={(e) => onChange('enablePagination', e.target.checked)}
                />
            </div>
            {config.enablePagination === true && (
                <div className="property-row">
                    <label className="property-label">每页条数</label>
                    <input
                        type="number"
                        className="property-input"
                        min={1}
                        max={200}
                        value={(config.pageSize as number) || 10}
                        onChange={(e) => onChange('pageSize', Number(e.target.value))}
                    />
                </div>
            )}
            <div className="property-row">
                <label className="property-label">冻结表头</label>
                <input
                    type="checkbox"
                    checked={config.freezeHeader !== false}
                    onChange={(e) => onChange('freezeHeader', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">冻结首列</label>
                <input
                    type="checkbox"
                    checked={config.freezeFirstColumn === true}
                    onChange={(e) => onChange('freezeFirstColumn', e.target.checked)}
                />
            </div>
            <div className="property-row">
                <label className="property-label">条件格式(JSON)</label>
                <textarea
                    className="property-input"
                    rows={4}
                    defaultValue={JSON.stringify((config.conditionalRules as unknown[]) || [], null, 2)}
                    onBlur={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) {
                            onChange('conditionalRules', []);
                            return;
                        }
                        try {
                            const parsed = JSON.parse(raw);
                            onChange('conditionalRules', Array.isArray(parsed) ? parsed : []);
                        } catch {
                            alert('条件格式 JSON 解析失败');
                        }
                    }}
                    placeholder='[{"columnKey":"amount","operator":">","value":100,"color":"#ef4444"}]'
                />
            </div>
            <div style={{ fontSize: 11, opacity: 0.75, marginTop: -2, marginBottom: 8, lineHeight: 1.5 }}>
                支持按 `columnIndex`、`columnKey` 或 `columnTitle` 匹配列；建议优先使用 `columnKey` 以避免字段重排错位。
            </div>

            {hasDynamicSource && sourceCols.length === 0 && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 8, padding: '4px 0' }}>
                    等待数据源加载列信息…
                </div>
            )}

            {hasDynamicSource && sourceCols.length > 0 && (
                <CardSourceColumnBindingsEditor
                    title="字段绑定 (来自数据源)"
                    sourceCols={sourceCols}
                    columns={columns}
                    defaultAlign="left"
                    onColumnsChange={(value) => onChange('columns', value)}
                />
            )}

            {!hasDynamicSource && staticHeaders.length > 0 && (
                <>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 8, marginBottom: 4 }}>
                        表头别名
                    </div>
                    {staticHeaders.map((h, i) => (
                        <div className="property-row" key={i}>
                            <label className="property-label" title={h}>列{i + 1}</label>
                            <input
                                type="text"
                                className="property-input"
                                placeholder={h}
                                value={columnAlias[String(i)] || ''}
                                onChange={(e) => {
                                    const newAlias = { ...columnAlias };
                                    if (e.target.value) {
                                        newAlias[String(i)] = e.target.value;
                                    } else {
                                        delete newAlias[String(i)];
                                    }
                                    onChange('columnAlias', newAlias);
                                }}
                            />
                        </div>
                    ))}
                </>
            )}
        </>
    );
}
