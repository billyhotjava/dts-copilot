import type { ReactNode } from 'react';

export function HeaderMenu({
    label,
    open,
    onToggle,
    children,
}: {
    label: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <div className={`header-menu ${open ? 'is-open' : ''}`}>
            <button
                type="button"
                className="header-btn header-menu-trigger"
                aria-expanded={open}
                onClick={onToggle}
            >
                {label}
            </button>
            {open ? (
                <div className="header-menu-panel">
                    {children}
                </div>
            ) : null}
        </div>
    );
}
