import type { ScreenHeaderProps } from './types';
import { THEME_OPTIONS, BATCH_ACTION_OPTIONS, type BatchAction } from './types';
import { HeaderMenu } from './HeaderMenu';
import { QuickActionPalette } from './QuickActionPalette';
import { PanelOverlays } from './PanelOverlays';
import { useScreenHeaderState } from './hooks/useScreenHeaderState';

export function ScreenHeader({
    focusMode,
    onToggleFocusMode,
    showLibraryPanel,
    onToggleLibraryPanel,
    showInspectorPanel,
    onToggleInspectorPanel,
}: ScreenHeaderProps = {}) {
    const h = useScreenHeaderState();

    return (
        <>
            <div className="screen-header">
                <div className="screen-header-left">
                    <button type="button" className="header-btn back-btn" onClick={h.handleBack} title="返回列表">
                        ← 返回
                    </button>
                    <div className="screen-header-intro">
                        <div className="screen-name-container">
                            {h.isEditingName ? (
                                <input
                                    type="text"
                                    className="screen-name-input"
                                    value={h.nameValue}
                                    onChange={(e) => h.setNameValue(e.target.value)}
                                    onBlur={h.handleNameBlur}
                                    onKeyDown={h.handleNameKeyDown}
                                    autoFocus
                                />
                            ) : (
                                <span className="screen-name" onClick={h.handleNameClick} title="点击编辑名称">
                                    {h.config.name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="screen-header-right">
                    <div className="header-menu-group" ref={h.menuContainerRef}>
                        <div className="header-mobile-primary-menu">
                            <HeaderMenu
                                label="操作"
                                open={h.activeMenu === 'primary'}
                                onToggle={() => h.setActiveMenu((prev) => (prev === 'primary' ? null : 'primary'))}
                            >
                                <div className="header-menu-section">
                                    <div className="header-menu-section-title">快捷操作</div>
                                    <button
                                        type="button"
                                        className="header-btn"
                                        onClick={() => h.executeMenuAction(h.handlePreview)}
                                        title={`预览大屏（${h.previewDeviceMode === 'auto' ? '自动' : h.previewDeviceMode}）`}
                                    >
                                        预览
                                    </button>
                                    {h.id && (
                                        <button
                                            type="button"
                                            className="header-btn"
                                            onClick={() => h.executeMenuAction(h.handlePublish)}
                                            disabled={h.isPublishing || !h.permissions.canPublish || h.lockedByOther}
                                            title={h.lockedByOther ? `当前由 ${h.lockOwnerText} 持有编辑锁` : '发布当前草稿'}
                                        >
                                            {h.isPublishing ? '发布中...' : '发布'}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="header-btn"
                                        onClick={() => h.executeMenuAction(h.handleSave)}
                                        disabled={h.isSaving || !h.permissions.canEdit || h.lockedByOther}
                                        title={h.lockedByOther ? `当前由 ${h.lockOwnerText} 持有编辑锁` : '保存草稿'}
                                    >
                                        {h.isSaving ? '保存中...' : '保存'}
                                    </button>
                                </div>
                            </HeaderMenu>
                        </div>
                        <HeaderMenu
                            label={`工具箱${h.cycleWarnings.length > 0 ? `(${h.cycleWarnings.length})` : ''}`}
                            open={h.activeMenu === 'tools'}
                            onToggle={() => h.setActiveMenu((prev) => (prev === 'tools' ? null : 'tools'))}
                        >
                            <div className="header-menu-tabs" role="tablist" aria-label="工具箱分区">
                                <button type="button" className={`header-menu-tab ${h.toolsSection === 'design' ? 'is-active' : ''}`} onClick={() => h.setToolsSection('design')}>视图</button>
                                <button type="button" className={`header-menu-tab ${h.toolsSection === 'release' ? 'is-active' : ''}`} onClick={() => h.setToolsSection('release')}>版本导出</button>
                                <button type="button" className={`header-menu-tab ${h.toolsSection === 'governance' ? 'is-active' : ''}`} onClick={() => h.setToolsSection('governance')}>治理</button>
                            </div>
                            {h.toolsSection === 'design' ? (
                                <>
                                    {/* 面板 */}
                                    {onToggleFocusMode && (
                                        <div className="header-menu-section">
                                            <div className="header-menu-section-title">面板</div>
                                            <button type="button" className={`header-btn ${focusMode ? 'active' : ''}`} onClick={() => { onToggleFocusMode(); h.setActiveMenu(null); }} title="Ctrl/Cmd + \\">
                                                {focusMode ? '退出聚焦' : '聚焦模式'}
                                            </button>
                                            {!focusMode && onToggleLibraryPanel && (
                                                <button type="button" className={`header-btn ${showLibraryPanel ? 'active' : ''}`} onClick={onToggleLibraryPanel} title="Ctrl/Cmd+Alt+1">
                                                    {showLibraryPanel ? '隐藏左栏' : '显示左栏'}
                                                </button>
                                            )}
                                            {!focusMode && onToggleInspectorPanel && (
                                                <button type="button" className={`header-btn ${showInspectorPanel ? 'active' : ''}`} onClick={onToggleInspectorPanel} title="Ctrl/Cmd+Alt+2">
                                                    {showInspectorPanel ? '隐藏右栏' : '显示右栏'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {/* 视图 */}
                                    <div className="header-menu-section">
                                        <div className="header-menu-section-title">视图与主题</div>
                                        <button type="button" className="header-btn" onClick={h.handleZoomReset} title="缩放重置为 100%">缩放100%</button>
                                        <button type="button" className="header-btn" onClick={h.handleZoomFit} title="按当前窗口自动适配缩放">缩放适配</button>
                                        <button type="button" className={`header-btn ${h.showGrid ? 'active' : ''}`} onClick={() => h.dispatch({ type: 'TOGGLE_GRID' })} title="显示/隐藏网格">
                                            {h.showGrid ? '隐藏网格' : '显示网格'}
                                        </button>
                                        <select className="header-device-select" value={h.config.theme || ''} onChange={h.handleToolbarThemeChange} title="切换主题">
                                            {THEME_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                        </select>
                                    </div>
                                    {/* 主题工具 */}
                                    <div className="header-menu-section">
                                        <div className="header-menu-section-title">主题工具</div>
                                        <select className="header-device-select" value={h.themeApplyMode} onChange={(e) => h.setThemeApplyMode(e.target.value === 'safe' ? 'safe' : 'force')} title="组件样式应用策略">
                                            <option value="force">强制覆盖</option>
                                            <option value="safe">仅补缺省</option>
                                        </select>
                                        <button type="button" className="header-btn" onClick={() => h.applyThemeToAllComponents(h.themeApplyMode)} title="按当前主题批量刷新组件样式">应用样式</button>
                                        <button type="button" className="header-btn" onClick={h.handleExportThemePack} title="导出主题包">导出主题</button>
                                        <button type="button" className="header-btn" onClick={h.handleImportThemePackClick} title="导入主题包">导入主题</button>
                                    </div>
                                    {/* 批量动作 */}
                                    <div className="header-menu-section">
                                        <div className="header-menu-section-title">批量动作</div>
                                        <select className="header-device-select" value={h.batchAction} onChange={(e) => h.setBatchAction(e.target.value as BatchAction)} title="批量动作">
                                            {BATCH_ACTION_OPTIONS.map((item) => (<option key={item.value} value={item.value}>{item.label}</option>))}
                                        </select>
                                        <button type="button" className="header-btn" onClick={h.executeBatchAction} disabled={!h.canExecuteBatch} title={h.canExecuteBatch ? '执行批量动作' : '请先选择组件'}>执行动作</button>
                                    </div>
                                    {/* 联动 & 设计 */}
                                    <div className="header-menu-section">
                                        <div className="header-menu-section-title">设计与联动</div>
                                        <button type="button" className="header-btn" onClick={() => { h.setActiveMenu(null); h.setShowLinkageGraph(prev => !prev); }} title="查看组件联动关系图">联动关系图</button>
                                        <label className="header-menu-inline-label" htmlFor="screen-design-action">设计动作</label>
                                        <select id="screen-design-action" className="header-device-select" value={h.designAction} onChange={(e) => { const next = e.target.value; if (next === 'session' || next === 'variables' || next === 'interaction' || next === 'collaboration' || next === 'template' || next === 'import' || next === 'command') { h.setDesignAction(next); return; } h.setDesignAction('variables'); }} title="选择设计动作">
                                            <option value="variables">变量管理</option>
                                            <option value="interaction">联动调试</option>
                                            <option value="session">沉淀会话</option>
                                            <option value="collaboration">协作批注</option>
                                            <option value="template">保存模板</option>
                                            <option value="import">导入JSON</option>
                                            <option value="command">命令面板</option>
                                        </select>
                                        <button type="button" className="header-btn" onClick={h.executeDesignAction} disabled={!h.canExecuteDesignAction} title="执行设计动作">执行设计动作</button>
                                    </div>
                                    {/* 帮助 */}
                                    <div className="header-menu-section">
                                        <div className="header-menu-section-title">帮助</div>
                                        <button type="button" className="header-btn" onClick={h.handleShortcutHelp} title="查看快捷键">快捷键</button>
                                    </div>
                                </>
                            ) : null}
                            {h.toolsSection === 'release' ? (
                                <div className="header-menu-section">
                                    <div className="header-menu-section-title">版本与导出</div>
                                    <label className="header-menu-inline-label" htmlFor="screen-preview-device-mode">预览设备</label>
                                    <select id="screen-preview-device-mode" className="header-device-select" value={h.previewDeviceMode} onChange={(e) => { const next = e.target.value; if (next === 'pc' || next === 'tablet' || next === 'mobile') { h.setPreviewDeviceMode(next); return; } h.setPreviewDeviceMode('auto'); }} title="预览设备模式">
                                        <option value="auto">自动</option>
                                        <option value="pc">PC</option>
                                        <option value="tablet">平板</option>
                                        <option value="mobile">手机</option>
                                    </select>
                                    {h.id ? (
                                        <>
                                            <label className="header-menu-inline-label" htmlFor="screen-version-action">版本动作</label>
                                            <select id="screen-version-action" className="header-device-select" value={h.versionAction} onChange={(e) => { h.setVersionAction(e.target.value === 'compare' ? 'compare' : 'history'); }} title="选择版本动作">
                                                <option value="history">版本历史/回滚</option>
                                                <option value="compare">版本对比</option>
                                            </select>
                                            <button type="button" className="header-btn" onClick={h.executeVersionAction} disabled={h.isLoadingVersions || (h.versionAction === 'history' ? !h.permissions.canPublish : !h.permissions.canRead)} title={h.versionAction === 'history' ? '查看版本历史并回滚' : '查看版本差异摘要'}>
                                                {h.isLoadingVersions ? '加载中...' : '执行版本动作'}
                                            </button>
                                        </>
                                    ) : null}
                                    <label className="header-menu-inline-label" htmlFor="screen-export-action">导出动作</label>
                                    <select id="screen-export-action" className="header-device-select" value={h.exportAction} onChange={(e) => { const next = e.target.value; if (next === 'json' || next === 'pdf' || next === 'png') { h.setExportAction(next); return; } h.setExportAction('png'); }} title="选择导出格式">
                                        <option value="png">导出PNG</option>
                                        <option value="pdf">导出PDF</option>
                                        <option value="json">导出JSON</option>
                                    </select>
                                    <button type="button" className="header-btn" onClick={h.executeExportAction} title="执行导出">执行导出</button>
                                </div>
                            ) : null}
                            {h.toolsSection === 'governance' ? (
                                <div className="header-menu-section">
                                    <div className="header-menu-section-title">治理与安全</div>
                                    <label className="header-menu-inline-label" htmlFor="screen-governance-action">治理动作</label>
                                    <select id="screen-governance-action" className="header-device-select" value={h.governanceAction} onChange={(e) => { const next = e.target.value; if (next === 'edit-lock' || next === 'cache' || next === 'compliance' || next === 'health' || next === 'acl' || next === 'audit' || next === 'share-policy' || next === 'share-link') { h.setGovernanceAction(next); return; } h.setGovernanceAction('cache'); }} title="选择治理动作">
                                        <option value="edit-lock">编辑锁{h.lockedByOther ? '(占用)' : (h.editLock?.mine ? '(我)' : '')}</option>
                                        <option value="cache">缓存观测</option>
                                        <option value="compliance">合规</option>
                                        <option value="health">体检</option>
                                        <option value="acl">权限</option>
                                        <option value="audit">审计</option>
                                        <option value="share-policy">分享策略</option>
                                        <option value="share-link">分享链接</option>
                                    </select>
                                    <button type="button" className="header-btn" onClick={h.executeGovernanceAction} disabled={!h.canExecuteGovernanceAction || (h.governanceAction === 'share-link' && h.isSharing)} title="执行治理动作">
                                        {h.governanceAction === 'share-link' && h.isSharing ? '分享中...' : '执行治理动作'}
                                    </button>
                                </div>
                            ) : null}
                        </HeaderMenu>
                        <input ref={h.themeInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={h.handleThemePackFileChange} />
                    </div>
                    <div className="screen-header-primary-actions">
                        <button
                            type="button"
                            className="header-btn header-primary-desktop"
                            onClick={h.handlePreview}
                            disabled={!h.id}
                            title={`预览大屏（${h.previewDeviceMode === 'auto' ? '自动' : h.previewDeviceMode}）`}
                        >
                            预览
                        </button>
                        {h.id ? (
                            <button
                                type="button"
                                className="header-btn header-primary-desktop"
                                onClick={() => void h.handlePublish()}
                                disabled={h.isPublishing || !h.permissions.canPublish || h.lockedByOther}
                                title={h.lockedByOther ? `当前由 ${h.lockOwnerText} 持有编辑锁` : '发布当前草稿'}
                            >
                                {h.isPublishing ? '发布中...' : '发布'}
                            </button>
                        ) : null}
                        <button
                            type="button"
                            data-testid="analytics-screen-primary-action-button"
                            className="header-btn save-btn header-primary-desktop"
                            onClick={() => void h.handleSave()}
                            disabled={h.isSaving || !h.permissions.canEdit || h.lockedByOther}
                            title={h.lockedByOther ? `当前由 ${h.lockOwnerText} 持有编辑锁` : '保存草稿'}
                        >
                            {h.isSaving ? '保存中...' : '保存'}
                        </button>
                    </div>
                    <input
                        ref={h.importInputRef}
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        onChange={h.handleImportJson}
                    />
                </div>
            </div>
            {h.lockedByOther && (
                <div className="screen-lock-notice">
                    编辑锁提示：当前由 {h.lockOwnerText} 编辑中，保存/发布已被保护性禁用。
                    {h.lockErrorText ? ` (${h.lockErrorText})` : ''}
                </div>
            )}
            {h.publishNotice && (
                <div className="screen-publish-notice" data-testid="analytics-screen-publish-notice">
                    <div className="screen-publish-notice-main">
                        <div className="screen-publish-notice-title">
                            已发布 v{h.publishNotice.versionNo}（大屏 #{h.publishNotice.screenId}）
                        </div>
                        <div className="screen-publish-notice-link-row">
                            <span className="screen-publish-notice-label">预览链接</span>
                            <a href={h.publishNotice.previewUrl} target="_blank" rel="noreferrer">{h.publishNotice.previewUrl}</a>
                            <button
                                type="button"
                                className="header-btn"
                                onClick={() => void h.handleCopyUrl(h.publishNotice!.previewUrl)}
                            >
                                复制
                            </button>
                        </div>
                        <div className="screen-publish-notice-link-row">
                            <span className="screen-publish-notice-label">公开链接</span>
                            {h.publishNotice.publicUrl ? (
                                <>
                                    <a href={h.publishNotice.publicUrl} target="_blank" rel="noreferrer">{h.publishNotice.publicUrl}</a>
                                    <button
                                        type="button"
                                        className="header-btn"
                                        onClick={() => void h.handleCopyUrl(h.publishNotice!.publicUrl!)}
                                    >
                                        复制
                                    </button>
                                </>
                            ) : (
                                <span className="screen-publish-notice-muted">未生成（可在"更多/治理/分享链接"中重试）</span>
                            )}
                        </div>
                        {h.publishNotice.warmupText ? (
                            <div className="screen-publish-notice-muted">{h.publishNotice.warmupText.trim()}</div>
                        ) : null}
                    </div>
                    <div className="screen-publish-notice-actions">
                        <button
                            type="button"
                            className="header-btn"
                            onClick={() => h.navigate('/')}
                            title="返回 Analytics 首页"
                        >
                            Analytics首页
                        </button>
                        <button
                            type="button"
                            className="header-btn"
                            onClick={() => h.navigate('/screens')}
                            title="进入大屏管理列表"
                        >
                            大屏中心
                        </button>
                        <button
                            type="button"
                            className="header-btn"
                            onClick={() => { h.setPublishNotice(null); h.setPublishNoticeDismissed(true); }}
                            title="收起发布信息"
                        >
                            收起
                        </button>
                    </div>
                </div>
            )}

            {h.showQuickActions ? (
                <QuickActionPalette
                    filteredQuickActions={h.filteredQuickActions}
                    quickKeyword={h.quickKeyword}
                    setQuickKeyword={h.setQuickKeyword}
                    quickActiveIndex={h.quickActiveIndex}
                    setQuickActiveIndex={h.setQuickActiveIndex}
                    quickInputRef={h.quickInputRef}
                    quickActionRefs={h.quickActionRefs}
                    quickRecentOrder={h.quickRecentOrder}
                    runQuickAction={h.runQuickAction}
                    onClose={() => h.setShowQuickActions(false)}
                />
            ) : null}

            <PanelOverlays
                id={h.id}
                config={h.config}
                selectedIds={h.selectedIds}
                selectComponents={h.selectComponents}
                updateConfig={h.updateConfig}
                cycleWarnings={h.cycleWarnings}
                showVariableManager={h.showVariableManager}
                setShowVariableManager={h.setShowVariableManager}
                showCachePanel={h.showCachePanel}
                setShowCachePanel={h.setShowCachePanel}
                showCompliancePanel={h.showCompliancePanel}
                setShowCompliancePanel={h.setShowCompliancePanel}
                showHealthPanel={h.showHealthPanel}
                setShowHealthPanel={h.setShowHealthPanel}
                showAclPanel={h.showAclPanel}
                setShowAclPanel={h.setShowAclPanel}
                showAuditPanel={h.showAuditPanel}
                setShowAuditPanel={h.setShowAuditPanel}
                showSharePolicyPanel={h.showSharePolicyPanel}
                setShowSharePolicyPanel={h.setShowSharePolicyPanel}
                showInteractionDebugPanel={h.showInteractionDebugPanel}
                setShowInteractionDebugPanel={h.setShowInteractionDebugPanel}
                showCollaborationPanel={h.showCollaborationPanel}
                setShowCollaborationPanel={h.setShowCollaborationPanel}
                showEditLockPanel={h.showEditLockPanel}
                setShowEditLockPanel={h.setShowEditLockPanel}
                showConflictPanel={h.showConflictPanel}
                setShowConflictPanel={h.setShowConflictPanel}
                showVersionComparePanel={h.showVersionComparePanel}
                setShowVersionComparePanel={h.setShowVersionComparePanel}
                showVersionComparePicker={h.showVersionComparePicker}
                setShowVersionComparePicker={h.setShowVersionComparePicker}
                showVersionRollbackPanel={h.showVersionRollbackPanel}
                setShowVersionRollbackPanel={h.setShowVersionRollbackPanel}
                showVersionHistoryPanel={h.showVersionHistoryPanel}
                setShowVersionHistoryPanel={h.setShowVersionHistoryPanel}
                showSnapshotPanel={h.showSnapshotPanel}
                setShowSnapshotPanel={h.setShowSnapshotPanel}
                showLinkageGraph={h.showLinkageGraph}
                setShowLinkageGraph={h.setShowLinkageGraph}
                editLock={h.editLock}
                setEditLock={h.setEditLock}
                setLockErrorText={h.setLockErrorText}
                lastConflict={h.lastConflict}
                conflictLoading={h.conflictLoading}
                handleReloadLatestDraft={h.handleReloadLatestDraft}
                versionDiff={h.versionDiff}
                versionCandidates={h.versionCandidates}
                isLoadingVersions={h.isLoadingVersions}
                handleConfirmVersionRollback={h.handleConfirmVersionRollback}
                handleConfirmVersionCompare={h.handleConfirmVersionCompare}
            />
        </>
    );
}
