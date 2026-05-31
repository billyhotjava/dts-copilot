import { describe, expect, it } from 'vitest';

import { resolveDateRangeDefaultValues, resolveFilterDefaultValue } from './chartUtils';

describe('chartUtils', () => {
it('resolveFilterDefaultValue prefers current runtime value when present', () => {
    expect(resolveFilterDefaultValue('QMS二期', 'PLM整合', [
        { label: 'QMS二期', value: 'QMS二期' },
        { label: 'PLM整合', value: 'PLM整合' },
    ])).toBe('QMS二期');
});

it('resolveFilterDefaultValue falls back to configured default or first option', () => {
    expect(resolveFilterDefaultValue('', 'PLM整合', [
        { label: 'QMS二期', value: 'QMS二期' },
        { label: 'PLM整合', value: 'PLM整合' },
    ])).toBe('PLM整合');

    expect(resolveFilterDefaultValue('', '', [
        { label: 'QMS二期', value: 'QMS二期' },
        { label: 'PLM整合', value: 'PLM整合' },
    ])).toBe('QMS二期');
});

it('resolveDateRangeDefaultValues fills missing values only', () => {
    expect(
        resolveDateRangeDefaultValues('', '2026-03-31', '2026-03-01', '2026-03-31'),
    ).toEqual({ startValue: '2026-03-01', endValue: '2026-03-31' });
});
});
