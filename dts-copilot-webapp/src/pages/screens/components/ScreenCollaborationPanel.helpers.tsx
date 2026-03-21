import type { CSSProperties } from 'react';
import type {
    ScreenCollaborationPresenceRow,
    ScreenComment,
} from '../../../api/analyticsApi';

export function parseCommentId(value: unknown): number {
    const text = String(value ?? '').trim();
    if (!text) return 0;
    const num = Number(text);
    return Number.isFinite(num) && num > 0 ? num : 0;
}

const PRESENCE_SESSION_STORAGE_KEY = 'dts.analytics.collaboration.presence.sessionId';

export function getOrCreatePresenceSessionId(): string {
    if (typeof window === 'undefined') {
        return createPresenceSessionId();
    }
    try {
        const cached = window.sessionStorage.getItem(PRESENCE_SESSION_STORAGE_KEY);
        if (cached && cached.trim()) {
            return cached.trim();
        }
    } catch {
        // ignore read failures and fall back to fresh session id
    }
    const next = createPresenceSessionId();
    try {
        window.sessionStorage.setItem(PRESENCE_SESSION_STORAGE_KEY, next);
    } catch {
        // ignore write failures and keep in-memory session id only
    }
    return next;
}

function createPresenceSessionId(): string {
    const prefix = `collab-${Date.now().toString(36)}`;
    if (typeof window === 'undefined') {
        return `${prefix}-srv`;
    }
    try {
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(6);
            window.crypto.getRandomValues(bytes);
            const suffix = Array.from(bytes)
                .map((item) => item.toString(16).padStart(2, '0'))
                .join('');
            return `${prefix}-${suffix}`;
        }
    } catch {
        // Fall back to Math.random if crypto API is unavailable.
    }
    const fallback = Math.floor(Math.random() * 1e12).toString(36);
    return `${prefix}-${fallback}`;
}

export function parseStreamDelta(event: Event): { rows?: ScreenComment[]; fullReload?: boolean; cursor?: number } | null {
    const message = event as MessageEvent<string>;
    const raw = typeof message.data === 'string' ? message.data.trim() : '';
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { rows?: ScreenComment[]; fullReload?: boolean; cursor?: number };
        return parsed;
    } catch {
        return null;
    }
}

export function parsePresenceStream(event: Event): { rows?: ScreenCollaborationPresenceRow[] } | null {
    const message = event as MessageEvent<string>;
    const raw = typeof message.data === 'string' ? message.data.trim() : '';
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { rows?: ScreenCollaborationPresenceRow[] };
        return parsed;
    } catch {
        return null;
    }
}

export function parseWsEvent(event: MessageEvent<string>): { event?: string; payload?: Record<string, unknown> } | null {
    const raw = typeof event.data === 'string' ? event.data.trim() : '';
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as { event?: string; payload?: Record<string, unknown> };
        return parsed;
    } catch {
        return null;
    }
}

export function computeNextCursor(prev: number, rows: ScreenComment[], cursor?: number): number {
    let next = Number.isFinite(prev) ? prev : 0;
    if (Number.isFinite(cursor as number)) {
        next = Math.max(next, Number(cursor));
    }
    for (const row of rows || []) {
        next = Math.max(next, parseCommentId(row?.id));
    }
    return next;
}

export function mergeCommentRows(current: ScreenComment[], delta: ScreenComment[]): ScreenComment[] {
    if (!Array.isArray(current) || current.length === 0) {
        return Array.isArray(delta) ? [...delta] : [];
    }
    if (!Array.isArray(delta) || delta.length === 0) {
        return [...current];
    }
    const map = new Map<string, ScreenComment>();
    for (const item of current) {
        map.set(String(item.id), item);
    }
    for (const item of delta) {
        map.set(String(item.id), item);
    }
    return Array.from(map.values()).sort((a, b) => {
        const ta = Date.parse(String(a.createdAt || ''));
        const tb = Date.parse(String(b.createdAt || ''));
        if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
            return tb - ta;
        }
        return parseCommentId(b.id) - parseCommentId(a.id);
    });
}

export function StatusBadge({ resolved }: { resolved: boolean }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 56,
            padding: '2px 8px',
            borderRadius: 999,
            border: `1px solid ${resolved ? '#16a34a' : '#f59e0b'}`,
            background: resolved ? 'rgba(22,163,74,0.1)' : 'rgba(245,158,11,0.12)',
            color: resolved ? '#16a34a' : '#f59e0b',
            fontSize: 11,
        }}>
            {resolved ? '已解决' : '待处理'}
        </span>
    );
}

export const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid var(--color-border)',
    fontWeight: 600,
};

export const tdStyle: CSSProperties = {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid var(--color-border)',
    verticalAlign: 'top',
};

export function MetricCell({ title, value }: { title: string; value: string }) {
    return (
        <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: 10,
            background: 'rgba(255,255,255,0.02)',
        }}>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{value}</div>
        </div>
    );
}
