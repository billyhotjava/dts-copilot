# Sprint 工作流规范

## 目录结构

所有迭代工作放在 `worklog/` 下，按以下层级组织：

```
worklog/
└── v1.0.0/                          # 产品版本号
    ├── sprint-queue.md              # 全局 Sprint 看板
    │
    ├── sprint-18-202604/            # Sprint 目录：sprint-{序号}-{YYYYMM}
    │   ├── README.md                # Sprint 概览（目标、背景、完成标准）
    │   ├── features/                # Feature 目录
    │   │   ├── F1-UI重构/
    │   │   │   ├── README.md        # Feature 概览
    │   │   │   ├── T01-完善css.md   # Task 详情
    │   │   │   ├── T02-拆分大组件.md
    │   │   │   └── T03-图片优化.md
    │   │   └── F2-性能优化/
    │   │       ├── README.md
    │   │       ├── T01-bundle分析.md
    │   │       └── T02-懒加载.md
    │   ├── assets/                   # Sprint 资产（SQL、配置、截图等）
    │   └── it/                      # 集成测试与验收
    │       └── README.md
    │
    └── sprint-19-202604/            # 下一个 Sprint
        └── ...
```

## 命名规范

| 层级 | 命名格式 | 示例 |
|------|---------|------|
| Sprint 目录 | `sprint-{序号}-{YYYYMM}` | `sprint-18-202604` |
| Feature 目录 | `F{序号}-{中文名}` | `F1-UI重构` |
| Task 文件 | `T{序号}-{中文名}.md` | `T01-完善css.md` |
| Sprint README | 固定 `README.md` | - |
| 资产目录 | 固定 `assets/` | - |
| 测试目录 | 固定 `it/` | - |

## Sprint README 模板

```markdown
# Sprint-{序号}: {主题} ({前缀})

**时间**: {YYYY-MM}
**状态**: READY | IN_PROGRESS | DONE
**目标**: 一句话描述本 Sprint 要达成的业务目标

## 背景
为什么要做这个 Sprint

## Feature 列表

| ID | Feature | Task 数 | 状态 |
|----|---------|---------|------|
| F1 | UI 重构 | 5 | READY |
| F2 | 性能优化 | 3 | READY |

## 完成标准
- [ ] 标准 1
- [ ] 标准 2
```

## Feature README 模板

```markdown
# F{序号}: {Feature 名称}

**优先级**: P0 | P1 | P2
**状态**: READY | IN_PROGRESS | DONE

## 目标
Feature 要解决的问题

## Task 列表

| ID | Task | 优先级 | 状态 | 依赖 |
|----|------|--------|------|------|
| T01 | 完善 CSS | P0 | READY | - |
| T02 | 拆分大组件 | P0 | READY | T01 |

## 完成标准
- [ ] 标准 1
```

## Task 文件模板

```markdown
# T{序号}: {Task 名称}

**优先级**: P0 | P1 | P2
**状态**: READY | IN_PROGRESS | DONE
**依赖**: T{xx} 或 无

## 目标
一句话说清楚要做什么

## 技术设计
具体实现方案

## 影响范围
涉及的文件和模块

## 完成标准
- [ ] 标准 1
- [ ] 标准 2
```

## sprint-queue.md 格式

Sprint 看板按时间倒序排列，每个 Sprint 用表格列出 Feature 和状态：

```markdown
## Sprint-18: 前端现代化优化 (202604)

| Feature | Task 数 | 状态 |
|---------|---------|------|
| F1-UI重构 | 5 | READY |
| F2-性能优化 | 3 | READY |

**统计**: READY=8, IN_PROGRESS=0, DONE=0
```

## 工作流程

1. **规划阶段**：创建 Sprint 目录 → 拆分 Feature → 拆分 Task → 更新 sprint-queue.md
2. **执行阶段**：按 Feature 内 Task 依赖顺序执行，每完成一个 Task 更新状态
3. **验收阶段**：执行 it/ 下的测试计划，更新完成标准
4. **收尾阶段**：Sprint 状态改为 DONE，更新 sprint-queue.md 总体统计

## 状态流转

```
READY → IN_PROGRESS → DONE
                    → BLOCKED (记录阻塞原因)
```

## 与代码分支的关系

- 每个 Sprint 对应一个 feature 分支：`feature/sprint-{序号}-{关键词}`
- Feature 内的 Task 不单独建分支，在 Sprint 分支上按 Task 顺序提交
- 提交信息格式：`feat(F{n}/T{nn}): {描述}` 或 `fix(F{n}/T{nn}): {描述}`
