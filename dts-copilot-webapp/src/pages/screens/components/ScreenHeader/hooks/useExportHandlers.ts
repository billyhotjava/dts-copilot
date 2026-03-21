import { useCallback } from 'react';
import {
    analyticsApi,
    HttpError,
    type ScreenDetail,
} from '../../../../../api/analyticsApi';
import { buildScreenPayload } from '../../../specV2';
import {
    buildScreenExportPath,
} from '../../../screenRoutePaths';
import type { ScreenConfig } from '../../../types';

export function useExportHandlers({
    id,
    config,
    previewDeviceMode,
}: {
    id: string | undefined;
    config: ScreenConfig;
    previewDeviceMode: 'auto' | 'pc' | 'tablet' | 'mobile';
}) {
    const ensureExportAllowed = useCallback(async (format: 'json' | 'png' | 'pdf') => {
        if (!id) {
            return null;
        }
        try {
            return await analyticsApi.prepareScreenExport(id, {
                format,
                mode: 'draft',
                ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
            });
        } catch (error) {
            if (error instanceof HttpError) {
                let detail: string | null = null;
                try {
                    const payload = JSON.parse(error.bodyText) as { message?: string };
                    if (payload?.message) {
                        detail = payload.message;
                    }
                } catch {
                    // no-op
                }
                throw new Error(detail || error.message || '导出失败');
            }
            throw new Error(error instanceof Error ? error.message : '导出失败');
        }
    }, [id, previewDeviceMode]);

    const downloadBlob = useCallback((blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    const resolveServerRenderPixelRatio = useCallback((format: 'png' | 'pdf') => {
        const browserRatio = typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio)
            ? Math.max(1, Math.min(window.devicePixelRatio, 3))
            : 1;
        const baseRatio = format === 'pdf'
            ? Math.max(1.5, Math.min(browserRatio, 2))
            : Math.max(2, Math.min(browserRatio, 3));
        let tunedRatio = baseRatio;
        if (previewDeviceMode === 'mobile') {
            tunedRatio = Math.min(3, baseRatio + 0.5);
        } else if (previewDeviceMode === 'tablet') {
            tunedRatio = Math.min(3, baseRatio + 0.25);
        }
        return Number(tunedRatio.toFixed(2));
    }, [previewDeviceMode]);

    const renderExportByServer = useCallback(async (format: 'png' | 'pdf') => {
        if (!id) {
            throw new Error('请先保存大屏后再导出');
        }
        const pixelRatio = resolveServerRenderPixelRatio(format);
        const rendered = await analyticsApi.renderScreenExport(id, {
            format,
            mode: 'draft',
            ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
            pixelRatio,
            screenSpec: buildScreenPayload(config),
        });
        const fallbackName = `${config.name || 'screen'}.${format}`;
        downloadBlob(rendered.blob, rendered.fileName || fallbackName);
        return rendered;
    }, [config, downloadBlob, id, previewDeviceMode, resolveServerRenderPixelRatio]);

    const openExportWindow = useCallback((format: 'png' | 'pdf') => {
        if (!id) {
            throw new Error('请先保存大屏后再导出');
        }
        const browserRatio = Number.isFinite(window.devicePixelRatio)
            ? Math.max(1, Math.min(window.devicePixelRatio, 3))
            : 1;
        const baseRatio = format === 'pdf'
            ? Math.max(1.5, Math.min(browserRatio, 2))
            : Math.max(2, Math.min(browserRatio, 3));
        const pixelRatio = previewDeviceMode === 'mobile'
            ? Math.min(3, baseRatio + 0.5)
            : (previewDeviceMode === 'tablet' ? Math.min(3, baseRatio + 0.25) : baseRatio);
        const params = new URLSearchParams();
        params.set('format', format);
        params.set('mode', 'draft');
        params.set('pixelRatio', String(Number(pixelRatio.toFixed(2))));
        if (previewDeviceMode !== 'auto') {
            params.set('device', previewDeviceMode);
        }
        const url = buildScreenExportPath(id ?? '', Object.fromEntries(params.entries()));
        const popup = window.open(url, '_blank', 'noopener,noreferrer');
        if (!popup) {
            throw new Error('请允许弹窗后重试导出');
        }
    }, [id, previewDeviceMode]);

    const handleExportJson = async () => {
        let preparedRequestId: string | undefined;
        try {
            const prepared = await ensureExportAllowed('json');
            preparedRequestId = prepared?.requestId || undefined;
        } catch (error) {
            alert(error instanceof Error ? error.message : '导出失败');
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'failed',
                    format: 'json',
                    mode: 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: preparedRequestId,
                    message: error instanceof Error ? error.message : 'prepare_failed',
                });
            }
            return;
        }
        try {
            const payload = {
                schema: 'dts.screen.spec',
                exportedAt: new Date().toISOString(),
                screenSpec: buildScreenPayload(config),
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${config.name || 'screen'}-spec.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'success',
                    format: 'json',
                    mode: 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: preparedRequestId,
                });
            }
        } catch (error) {
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'failed',
                    format: 'json',
                    mode: 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: preparedRequestId,
                    message: error instanceof Error ? error.message : 'export_failed',
                });
            }
            alert(error instanceof Error ? error.message : 'JSON 导出失败');
        }
    };

    const handleExportPng = async () => {
        let preparedRequestId: string | undefined;
        let preparedSpecDigest: string | undefined;
        try {
            const prepared = await ensureExportAllowed('png');
            preparedRequestId = prepared?.requestId || undefined;
            preparedSpecDigest = prepared?.specDigest || undefined;
        } catch (error) {
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'failed',
                    format: 'png',
                    mode: 'draft',
                    resolvedMode: 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: preparedRequestId,
                    specDigest: preparedSpecDigest,
                    message: error instanceof Error ? error.message : 'prepare_failed',
                });
            }
            alert(error instanceof Error ? error.message : 'PNG 导出失败');
            return;
        }
        try {
            const rendered = await renderExportByServer('png');
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'success',
                    format: 'png',
                    mode: 'draft',
                    resolvedMode: rendered.resolvedMode || 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: rendered.requestId || preparedRequestId,
                    specDigest: rendered.specDigest || preparedSpecDigest,
                });
            }
        } catch (error) {
            console.warn('Failed to export png by server render, fallback to export page:', error);
            try {
                openExportWindow('png');
                if (id) {
                    void analyticsApi.reportScreenExport(id, {
                        status: 'fallback',
                        format: 'png',
                        mode: 'draft',
                        resolvedMode: 'draft',
                        ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                        requestId: preparedRequestId,
                        specDigest: preparedSpecDigest,
                        message: error instanceof Error ? error.message : 'server_render_failed',
                    });
                }
            } catch (fallbackError) {
                console.error('Failed to export png:', fallbackError);
                if (id) {
                    void analyticsApi.reportScreenExport(id, {
                        status: 'failed',
                        format: 'png',
                        mode: 'draft',
                        resolvedMode: 'draft',
                        ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                        requestId: preparedRequestId,
                        specDigest: preparedSpecDigest,
                        message: fallbackError instanceof Error ? fallbackError.message : 'export_failed',
                    });
                }
                alert(fallbackError instanceof Error ? fallbackError.message : 'PNG 导出失败');
            }
        }
    };

    const handleExportPdf = async () => {
        let preparedRequestId: string | undefined;
        let preparedSpecDigest: string | undefined;
        try {
            const prepared = await ensureExportAllowed('pdf');
            preparedRequestId = prepared?.requestId || undefined;
            preparedSpecDigest = prepared?.specDigest || undefined;
        } catch (error) {
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'failed',
                    format: 'pdf',
                    mode: 'draft',
                    resolvedMode: 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: preparedRequestId,
                    specDigest: preparedSpecDigest,
                    message: error instanceof Error ? error.message : 'prepare_failed',
                });
            }
            alert(error instanceof Error ? error.message : 'PDF 导出失败');
            return;
        }
        try {
            const rendered = await renderExportByServer('pdf');
            if (id) {
                void analyticsApi.reportScreenExport(id, {
                    status: 'success',
                    format: 'pdf',
                    mode: 'draft',
                    resolvedMode: rendered.resolvedMode || 'draft',
                    ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                    requestId: rendered.requestId || preparedRequestId,
                    specDigest: rendered.specDigest || preparedSpecDigest,
                });
            }
        } catch (error) {
            console.warn('Failed to export pdf by server render, fallback to export page:', error);
            try {
                openExportWindow('pdf');
                if (id) {
                    void analyticsApi.reportScreenExport(id, {
                        status: 'fallback',
                        format: 'pdf',
                        mode: 'draft',
                        resolvedMode: 'draft',
                        ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                        requestId: preparedRequestId,
                        specDigest: preparedSpecDigest,
                        message: error instanceof Error ? error.message : 'server_render_failed',
                    });
                }
            } catch (fallbackError) {
                console.error('Failed to export pdf:', fallbackError);
                if (id) {
                    void analyticsApi.reportScreenExport(id, {
                        status: 'failed',
                        format: 'pdf',
                        mode: 'draft',
                        resolvedMode: 'draft',
                        ...(previewDeviceMode === 'auto' ? {} : { device: previewDeviceMode }),
                        requestId: preparedRequestId,
                        specDigest: preparedSpecDigest,
                        message: fallbackError instanceof Error ? fallbackError.message : 'export_failed',
                    });
                }
                alert(fallbackError instanceof Error ? fallbackError.message : 'PDF 导出失败');
            }
        }
    };

    return {
        ensureExportAllowed,
        openExportWindow,
        handleExportJson,
        handleExportPng,
        handleExportPdf,
    };
}
