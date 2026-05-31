import { describe, expect, it } from 'vitest';

import {
    buildTableRowActionParams,
    normalizeScreenActionType,
    resolvePreferredDrillValue,
    resolveActionMappingValues,
    resolveActionTemplateText,
} from './actionUtils';

describe('actionUtils', () => {
it('normalizeScreenActionType keeps known action values', () => {
    expect(normalizeScreenActionType('open-panel')).toBe('open-panel');
    expect(normalizeScreenActionType(' emit-intent ')).toBe('emit-intent');
    expect(normalizeScreenActionType('unknown-action')).toBeNull();
});

it('resolveActionMappingValues maps click params into runtime variable payload', () => {
    const result = resolveActionMappingValues(
        {
            name: 'QMS二期',
            value: 12,
            data: { owner: '周工' },
        },
        [
            { variableKey: 'projectId', sourcePath: 'name', transform: 'raw' },
            { variableKey: 'issueCount', sourcePath: 'value', transform: 'number' },
            { variableKey: 'ownerUserId', sourcePath: 'data.owner', transform: 'raw' },
            { variableKey: 'fallbackStage', sourcePath: 'data.stage', transform: 'raw', fallbackValue: '验证' },
        ],
    );

    expect(result).toEqual({
        projectId: 'QMS二期',
        issueCount: '12',
        ownerUserId: '周工',
        fallbackStage: '验证',
    });
});

it('resolveActionTemplateText interpolates placeholders using action params', () => {
    const result = resolveActionTemplateText(
        '项目 {{name}} 由 {{data.owner}} 负责，当前问题数 {{value}}',
        {
            name: '主数据治理',
            value: 6,
            data: { owner: '王工' },
        },
    );

    expect(result).toBe('项目 主数据治理 由 王工 负责，当前问题数 6');
});

it('buildTableRowActionParams exposes row fields by header name and index', () => {
    const params = buildTableRowActionParams(
        ['项目', '责任人', '状态'],
        ['QMS二期', '周工', '推进中'],
    );

    expect(params['项目']).toBe('QMS二期');
    expect(params['责任人']).toBe('周工');
    expect(params['状态']).toBe('推进中');
    expect(params.row).toEqual(['QMS二期', '周工', '推进中']);
    expect(params['row[1]']).toBe('周工');
});

it('resolvePreferredDrillValue picks chart or table drill labels in priority order', () => {
    expect(resolvePreferredDrillValue({ name: '验证' })).toBe('验证');
    expect(resolvePreferredDrillValue({ data: { name: '实施' } })).toBe('实施');
    expect(resolvePreferredDrillValue({ 项目: 'QMS二期', row: ['QMS二期', '周工'] })).toBe('QMS二期');
    expect(resolvePreferredDrillValue({ row: ['PLM整合', '李工'] })).toBe('PLM整合');
});
});
