import { describe, expect, it } from 'vitest';
import { mapCardDataToConfig } from './cardDataMapper';

describe('mapCardDataToConfig', () => {
it('gantt-chart: maps rows to tasks array', () => {
    const cols = [
        { name: 'node_task', display_name: '任务', base_type: 'type/Text' },
        { name: 'node_type', display_name: '类型', base_type: 'type/Text' },
        { name: 'plan_date', display_name: '计划日期', base_type: 'type/Date' },
        { name: 'actual_date', display_name: '实际日期', base_type: 'type/Date' },
        { name: 'is_completed', display_name: '已完成', base_type: 'type/Boolean' },
        { name: 'is_overdue_completed', display_name: '超期完成', base_type: 'type/Boolean' },
        { name: 'is_incomplete', display_name: '未完成', base_type: 'type/Boolean' },
        { name: 'delay_days', display_name: '超期天数', base_type: 'type/Integer' },
        { name: 'risk_level', display_name: '风险等级', base_type: 'type/Text' },
        { name: 'owner', display_name: '责任人', base_type: 'type/Text' },
    ];
    const rows = [
        ['关键算法验证', '重大节点', '2026-02-01', '2026-02-10', true, true, false, 9, '高', '张三'],
        ['需求评审', '里程碑节点', '2026-03-01', null, false, false, true, null, '中', '李四'],
    ];

    const result = mapCardDataToConfig('gantt-chart', { rows, cols });

    expect(Array.isArray(result.tasks)).toBe(true);
    const tasks = result.tasks as Array<Record<string, unknown>>;
    expect(tasks.length).toBe(2);

    expect(tasks[0].name).toBe('关键算法验证');
    expect(tasks[0].type).toBe('重大节点');
    expect(tasks[0].planDate).toBe('2026-02-01');
    expect(tasks[0].actualDate).toBe('2026-02-10');
    expect(tasks[0].isCompleted).toBe(true);
    expect(tasks[0].isOverdue).toBe(true);
    expect(tasks[0].isIncomplete).toBe(false);
    expect(tasks[0].delayDays).toBe(9);
    expect(tasks[0].riskLevel).toBe('高');
    expect(tasks[0].owner).toBe('张三');

    expect(tasks[1].name).toBe('需求评审');
    expect(tasks[1].actualDate).toBe('');
    expect(tasks[1].isIncomplete).toBe(true);
    expect(tasks[1].delayDays).toBe(0);
});

it('gantt-chart: returns empty on no rows', () => {
    const result = mapCardDataToConfig('gantt-chart', { rows: [], cols: [] });
    expect(result).toEqual({});
});
});
