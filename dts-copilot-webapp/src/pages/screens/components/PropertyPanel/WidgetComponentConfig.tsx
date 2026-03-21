import type { ScreenComponent } from '../../types';

type OnChange = (key: string, value: unknown) => void;

/**
 * Config panel for widget / control / decoration components:
 * number-card, title, markdown-text, richtext, datetime, countdown, marquee,
 * carousel, tab-switcher, progress-bar, filter-input, filter-select,
 * filter-date-range, image, video, iframe, border-box, decoration,
 * water-level, digital-flop, percent-pond, shape, container
 *
 * Returns JSX or undefined if the component type is not handled here.
 */
export function renderWidgetComponentConfig(
    component: ScreenComponent,
    onChange: OnChange,
): React.JSX.Element | undefined {
    const { type, config } = component;

    switch (type) {
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

        default:
            return undefined;
    }
}
