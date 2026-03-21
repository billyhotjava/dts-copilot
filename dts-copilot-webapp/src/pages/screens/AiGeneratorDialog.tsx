import type { ScreenAiGenerationResponse } from '../../api/analyticsApi';

interface AiGeneratorDialogProps {
    aiPrompt: string;
    setAiPrompt: (value: string) => void;
    aiRefinePrompt: string;
    setAiRefinePrompt: (value: string) => void;
    aiRefineMode: 'apply' | 'suggest';
    setAiRefineMode: (value: 'apply' | 'suggest') => void;
    aiLoading: boolean;
    aiRefining: boolean;
    aiCreating: boolean;
    aiResult: ScreenAiGenerationResponse | null;
    aiContextHistory: string[];
    setAiContextHistory: (value: string[] | ((prev: string[]) => string[])) => void;
    onGenerate: () => void;
    onRefine: () => void;
    onCreateFromAi: () => void;
    onCopyRecommendations: () => void;
    onClose: () => void;
}

export function AiGeneratorDialog({
    aiPrompt,
    setAiPrompt,
    aiRefinePrompt,
    setAiRefinePrompt,
    aiRefineMode,
    setAiRefineMode,
    aiLoading,
    aiRefining,
    aiCreating,
    aiResult,
    aiContextHistory,
    setAiContextHistory,
    onGenerate,
    onRefine,
    onCreateFromAi,
    onCopyRecommendations,
    onClose,
}: AiGeneratorDialogProps) {
    return (
        <div className="ai-modal-overlay" onClick={onClose}>
            <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <h3 style={{ margin: 0 }}>AI 生成大屏草稿</h3>
                    <button className="action-btn" style={{ maxWidth: 80 }} onClick={onClose}>关闭</button>
                </div>
                <div className="ai-modal-body">
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                        描述业务场景、核心指标、时间粒度，系统将生成可编辑大屏草稿（可再绑定真实数据源）。
                    </div>
                    <textarea
                        className="ai-textarea"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="示例：生成一个制造车间运营大屏，包含产量趋势、良率、设备告警、班组排名和明细表"
                    />
                    <textarea
                        className="ai-textarea"
                        style={{ minHeight: 78 }}
                        value={aiRefinePrompt}
                        onChange={(e) => setAiRefinePrompt(e.target.value)}
                        placeholder="优化指令示例：改成三列布局，首图改成柱状图，切换为浅色主题，增加筛选器，加tab切换场景，移除tab切换，刷新30秒，放大字体"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 12, color: '#94a3b8', minWidth: 88 }}>优化模式</label>
                        <select
                            value={aiRefineMode}
                            onChange={(e) => setAiRefineMode(e.target.value === 'suggest' ? 'suggest' : 'apply')}
                            style={{ maxWidth: 180 }}
                        >
                            <option value="apply">应用模式（默认）</option>
                            <option value="suggest">建议模式（不自动发布）</option>
                        </select>
                    </div>
                    {aiContextHistory.length > 0 && (
                        <div className="ai-context-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>多轮上下文（最近 12 条）</div>
                                <button
                                    className="action-btn"
                                    style={{ maxWidth: 100 }}
                                    onClick={() => setAiContextHistory([])}
                                >
                                    清空上下文
                                </button>
                            </div>
                            <ol className="ai-context-list">
                                {aiContextHistory.map((item, index) => (
                                    <li key={`${item}-${index}`}>{item}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                    {aiResult?.screenSpec && (
                        <AiResultPreview aiResult={aiResult} />
                    )}
                </div>
                <div className="ai-modal-footer">
                    <button className="action-btn" style={{ maxWidth: 100 }} onClick={onClose}>取消</button>
                    <button className="action-btn" style={{ maxWidth: 120 }} onClick={onGenerate} disabled={aiLoading}>
                        {aiLoading ? '生成中...' : '生成方案'}
                    </button>
                    <button className="action-btn" style={{ maxWidth: 130 }} onClick={onRefine} disabled={aiRefining || !aiResult?.screenSpec}>
                        {aiRefining ? '优化中...' : '按指令优化'}
                    </button>
                    <button
                        className="action-btn"
                        style={{ maxWidth: 130 }}
                        onClick={onCopyRecommendations}
                        disabled={!aiResult}
                    >
                        复制建议
                    </button>
                    <button className="primary-btn" onClick={onCreateFromAi} disabled={aiCreating || !aiResult?.screenSpec}>
                        {aiCreating ? '创建中...' : '创建草稿'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AiResultPreview({ aiResult }: { aiResult: ScreenAiGenerationResponse }) {
    return (
        <div className="ai-result-card">
            <div style={{ fontWeight: 600 }}>生成预览</div>
            <div className="ai-result-grid">
                <div className="ai-result-item">名称: {aiResult.screenSpec?.name || '-'}</div>
                <div className="ai-result-item">主题: {aiResult.screenSpec?.theme || '-'}</div>
                <div className="ai-result-item">组件数: {(aiResult.screenSpec?.components || []).length}</div>
                <div className="ai-result-item">质量分: {aiResult.quality?.score ?? '-'}</div>
                <div className="ai-result-item">上下文条数: {aiResult.contextCount ?? 0}</div>
                <div className="ai-result-item">有效上下文: {aiResult.usedContextCount ?? aiResult.contextCount ?? 0}</div>
                <div className="ai-result-item">优化模式: {aiResult.applyMode || 'apply'}</div>
                <div className="ai-result-item">领域: {aiResult.intent?.domain || '-'}</div>
                <div className="ai-result-item">时间范围: {aiResult.intent?.timeRange || '-'}</div>
                <div className="ai-result-item">粒度: {aiResult.intent?.granularity || '-'}</div>
            </div>
            {aiResult.intent && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1' }}>
                    识别指标：{(aiResult.intent.metrics || []).join('、') || '-'}；维度：{(aiResult.intent.dimensions || []).join('、') || '-'}；筛选：{(aiResult.intent.filters || []).join('、') || '-'}
                </div>
            )}
            {Array.isArray(aiResult.quality?.warnings) && aiResult.quality?.warnings.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#fbbf24' }}>
                    {aiResult.quality?.warnings.join('；')}
                </div>
            )}
            {Array.isArray(aiResult.actions) && aiResult.actions.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#38bdf8' }}>
                    {aiResult.applyMode === 'suggest' ? '建议动作：' : '已执行：'}{aiResult.actions.join('；')}
                </div>
            )}
            {Array.isArray(aiResult.queryRecommendations) && aiResult.queryRecommendations.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#93c5fd' }}>
                    查询建议：{aiResult.queryRecommendations.map((q) => `${q.id || '-'}(${q.purpose || '-'})`).join('；')}
                </div>
            )}
            {aiResult.semanticModelHints && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#60a5fa' }}>
                    语义映射：事实表 {aiResult.semanticModelHints.factTable || '-'}，时间字段 {aiResult.semanticModelHints.timeField || '-'}
                </div>
            )}
            {Array.isArray(aiResult.sqlBlueprints) && aiResult.sqlBlueprints.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#bfdbfe' }}>
                    SQL蓝图：{aiResult.sqlBlueprints.map((row) => `${row.queryId || '-'}(${row.purpose || '-'})`).join('；')}
                </div>
            )}
            {aiResult.nl2sqlDiagnostics && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#fca5a5' }}>
                    NL2SQL诊断：状态 {aiResult.nl2sqlDiagnostics.status || '-'}，就绪度 {aiResult.nl2sqlDiagnostics.executionReadiness || '-'}，可执行 {aiResult.nl2sqlDiagnostics.executableBlueprintCount ?? aiResult.nl2sqlDiagnostics.safeCount ?? 0}，需补参 {aiResult.nl2sqlDiagnostics.needsParamsCount ?? 0}，阻断 {aiResult.nl2sqlDiagnostics.blockedCount ?? 0}
                </div>
            )}
            {Array.isArray(aiResult.nl2sqlDiagnostics?.requiredVariables) && aiResult.nl2sqlDiagnostics!.requiredVariables!.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fda4af' }}>
                    识别参数：{aiResult.nl2sqlDiagnostics!.requiredVariables!.slice(0, 8).join('、')}
                </div>
            )}
            {Array.isArray(aiResult.nl2sqlDiagnostics?.pendingVariables) && aiResult.nl2sqlDiagnostics!.pendingVariables!.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fecdd3' }}>
                    待补参数：{aiResult.nl2sqlDiagnostics!.pendingVariables!.slice(0, 8).join('、')}
                </div>
            )}
            {Array.isArray(aiResult.nl2sqlDiagnostics?.autoInjectedVariables) && aiResult.nl2sqlDiagnostics!.autoInjectedVariables!.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fdba74' }}>
                    自动补齐变量：{aiResult.nl2sqlDiagnostics!.autoInjectedVariables!.slice(0, 8).join('、')}
                </div>
            )}
            {Array.isArray(aiResult.nl2sqlDiagnostics?.blueprintChecks) && aiResult.nl2sqlDiagnostics!.blueprintChecks!.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#fecaca' }}>
                    蓝图检查：{aiResult.nl2sqlDiagnostics!.blueprintChecks!.slice(0, 6).map((row) => `${String(row.queryId || '-')}:${String(row.status || '-')}`).join('；')}
                </div>
            )}
            {aiResult.semanticRecall && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#86efac' }}>
                    语义召回：候选表/字段 {aiResult.semanticRecall.schemaCandidates?.length ?? 0}，同义词命中 {aiResult.semanticRecall.synonymHits?.length ?? 0}，few-shot {aiResult.semanticRecall.fewShotExamples?.length ?? 0}
                </div>
            )}
            {Array.isArray(aiResult.vizRecommendations) && aiResult.vizRecommendations.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#a7f3d0' }}>
                    图表建议：{aiResult.vizRecommendations.map((v) => `${v.componentType || '-'}←${v.queryId || '-'}`).join('；')}
                </div>
            )}
        </div>
    );
}
