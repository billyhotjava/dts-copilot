import type { RefObject } from 'react';
import { findNextEnabledQuickActionIndex, type QuickActionItem } from './types';

interface QuickActionPaletteProps {
    filteredQuickActions: QuickActionItem[];
    quickKeyword: string;
    setQuickKeyword: (value: string) => void;
    quickActiveIndex: number;
    setQuickActiveIndex: (value: number | ((prev: number) => number)) => void;
    quickInputRef: RefObject<HTMLInputElement | null>;
    quickActionRefs: RefObject<Array<HTMLButtonElement | null>>;
    quickRecentOrder: Map<string, number>;
    runQuickAction: (actionId: string, action: () => void | Promise<void>) => void;
    onClose: () => void;
}

export function QuickActionPalette({
    filteredQuickActions,
    quickKeyword,
    setQuickKeyword,
    quickActiveIndex,
    setQuickActiveIndex,
    quickInputRef,
    quickActionRefs,
    quickRecentOrder,
    runQuickAction,
    onClose,
}: QuickActionPaletteProps) {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 21000,
                background: 'rgba(10,18,32,0.55)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 'min(12vh, 92px)',
                paddingLeft: 12,
                paddingRight: 12,
            }}
            onClick={() => {
                onClose();
                setQuickActiveIndex(-1);
            }}
        >
            <div
                style={{
                    width: 'min(680px, 96vw)',
                    maxHeight: '70vh',
                    overflow: 'hidden',
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    boxShadow: '0 20px 70px rgba(2,6,23,0.35)',
                    display: 'grid',
                    gridTemplateRows: 'auto auto 1fr',
                }}
                onClick={(event) => event.stopPropagation()}
            >
                <div style={{ padding: '10px 12px 0', fontSize: 12, color: '#64748b' }}>
                    命令面板（Ctrl/Cmd + K，↑/↓选择，Enter执行，Ctrl/Cmd + Shift + P 预览）
                </div>
                <div style={{ padding: '8px 12px 10px' }}>
                    <input
                        ref={quickInputRef}
                        type="text"
                        className="screen-name-input"
                        style={{ width: '100%', minWidth: 0 }}
                        value={quickKeyword}
                        onChange={(event) => {
                            setQuickKeyword(event.target.value);
                            setQuickActiveIndex(-1);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowDown') {
                                event.preventDefault();
                                setQuickActiveIndex((prev: number) => (
                                    findNextEnabledQuickActionIndex(filteredQuickActions, prev, 1)
                                ));
                                return;
                            }
                            if (event.key === 'ArrowUp') {
                                event.preventDefault();
                                setQuickActiveIndex((prev: number) => {
                                    const seed = prev < 0 ? 0 : prev;
                                    return findNextEnabledQuickActionIndex(filteredQuickActions, seed, -1);
                                });
                                return;
                            }
                            if (event.key !== 'Enter') return;
                            const selected = quickActiveIndex >= 0
                                ? filteredQuickActions[quickActiveIndex]
                                : null;
                            const fallback = filteredQuickActions.find((item) => !item.disabled);
                            const target = selected && !selected.disabled ? selected : fallback;
                            if (!target) return;
                            event.preventDefault();
                            runQuickAction(target.id, target.run);
                        }}
                        placeholder="输入关键词：保存 / 预览 / 发布 / 变量 / 缓存 / 合规 / 导出 ..."
                    />
                </div>
                <div style={{ overflowY: 'auto', padding: '0 12px 12px', display: 'grid', gap: 6 }}>
                    {filteredQuickActions.length === 0 ? (
                        <div style={{ padding: '20px 12px', fontSize: 13, color: '#64748b' }}>
                            未匹配到动作，请换个关键词。
                        </div>
                    ) : (
                        filteredQuickActions.map((item, index) => {
                            const isRecent = quickRecentOrder.has(item.id);
                            return (
                            <button
                                key={item.id}
                                ref={(node) => {
                                    quickActionRefs.current[index] = node;
                                }}
                                type="button"
                                className="header-btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'flex-start',
                                    background: index === quickActiveIndex ? 'rgba(148,163,184,0.2)' : undefined,
                                    borderColor: index === quickActiveIndex ? '#94a3b8' : undefined,
                                }}
                                disabled={item.disabled}
                                onMouseEnter={() => setQuickActiveIndex(index)}
                                onClick={() => runQuickAction(item.id, item.run)}
                                title={item.label}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <span>{item.label}</span>
                                    {isRecent ? (
                                        <span style={{
                                            fontSize: 11,
                                            padding: '1px 6px',
                                            borderRadius: 999,
                                            background: 'rgba(14,116,144,0.15)',
                                            color: '#0e7490',
                                        }}
                                        >
                                            最近
                                        </span>
                                    ) : null}
                                </span>
                                {item.hotkey ? (
                                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b' }}>
                                        {item.hotkey}
                                    </span>
                                ) : null}
                            </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
