import { TEMPLATE_CATEGORY_LABELS } from '../screenTemplates';
import { SCREEN_SCHEMA_VERSION } from '../specV2';
import type { TemplateSelection } from './TemplateGallery';

export const CATEGORY_LABELS: Record<string, string> = {
    business: '商务',
    tech: '科技',
    dashboard: '仪表盘',
    monitor: '监控',
    official: '官方',
    industry: '行业',
    ...TEMPLATE_CATEGORY_LABELS,
};

export const VISIBILITY_LABELS: Record<string, string> = {
    personal: '个人',
    team: '团队',
    global: '全局',
};

export const INDUSTRY_AUDIT_RESULT_LABELS: Record<string, string> = {
    success: '成功',
    partial: '部分成功',
    failed: '失败',
    rejected: '拒绝',
};

export function templateText(template: {
    name?: string;
    description?: string | null;
    category?: string;
    tags?: string[];
}) {
    return [template.name || '', template.description || '', template.category || '', ...(template.tags || [])]
        .join(' ')
        .toLowerCase();
}

export function normalizeTemplateCategory(value?: string | null): string {
    const text = String(value || '').trim().toLowerCase();
    return text || 'custom';
}

export function asTemplatePackage(selection: TemplateSelection): Record<string, unknown> {
    if (selection.kind === 'builtin') {
        return {
            packageType: 'screen-template',
            exportedAt: new Date().toISOString(),
            template: {
                name: selection.template.name,
                description: selection.template.description,
                category: selection.template.category,
                thumbnail: selection.template.thumbnail,
                config: selection.template.config,
            },
        };
    }

    const template = selection.template;
    return {
        packageType: 'screen-template',
        exportedAt: new Date().toISOString(),
        template: {
            name: template.name,
            description: template.description,
            category: template.category,
            thumbnail: template.thumbnail,
            tags: template.tags,
            visibilityScope: template.visibilityScope,
            listed: template.listed !== false,
            themePack: template.themePack,
            config: {
                schemaVersion: template.schemaVersion ?? SCREEN_SCHEMA_VERSION,
                width: template.width,
                height: template.height,
                backgroundColor: template.backgroundColor,
                backgroundImage: template.backgroundImage,
                theme: template.theme,
                themePack: template.themePack,
                components: template.components || [],
                globalVariables: template.globalVariables || [],
            },
        },
    };
}

export function formatAuditTime(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function summarizeAuditDetails(details: unknown): string {
    if (details == null) return '-';
    if (typeof details === 'string') return details;
    try {
        const text = JSON.stringify(details);
        if (!text) return '-';
        return text.length > 120 ? `${text.slice(0, 120)}...` : text;
    } catch {
        return '-';
    }
}

export function parseRuntimeTargetsInput(input: string): Array<Record<string, unknown>> {
    const text = String(input || '').trim();
    if (!text) return [];
    const rows = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
    const targets: Array<Record<string, unknown>> = [];
    for (const row of rows) {
        const rawParts = row.split(',');
        const head = rawParts.slice(0, 7).map((item) => item.trim());
        const tail = rawParts.slice(7).join(',').trim();
        const [id, protocol, host, portText, pathOrEmpty, requiredText, expectedStatus] = head;
        const expectedBodyContains = tail || undefined;
        const port = Number(portText || '');
        if (!host || !Number.isFinite(port) || port <= 0) {
            continue;
        }
        const required = requiredText ? !['false', '0', 'no', 'n'].includes(requiredText.toLowerCase()) : true;
        const item: Record<string, unknown> = {
            id: id || undefined,
            protocol: protocol || 'tcp',
            host,
            port,
            required,
        };
        if (pathOrEmpty) {
            item.path = pathOrEmpty;
        }
        if (expectedStatus) {
            item.expectedStatus = expectedStatus;
        }
        if (expectedBodyContains) {
            item.expectedBodyContains = expectedBodyContains;
        }
        targets.push(item);
    }
    return targets;
}
