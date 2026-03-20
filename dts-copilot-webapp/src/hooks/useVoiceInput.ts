import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type VoiceState = "idle" | "requesting" | "listening" | "processing" | "error";

export interface UseVoiceInputOptions {
    /** Recognition language, default 'zh-CN' */
    lang?: string;
    /** Continuous recognition, default false (single utterance) */
    continuous?: boolean;
    /** Return interim results, default true */
    interimResults?: boolean;
    /** Max recording duration in seconds, default 30 */
    maxDuration?: number;
    /** Called with recognised text */
    onResult: (text: string, isFinal: boolean) => void;
    /** Called on error */
    onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
    start: () => void;
    stop: () => void;
    state: VoiceState;
    isSupported: boolean;
    errorMessage: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
    "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许麦克风访问",
    "no-speech": "未检测到语音，请重试",
    "audio-capture": "未找到麦克风设备",
    "network": "语音识别服务网络错误",
    "aborted": "语音识别已取消",
    "service-not-allowed": "语音识别服务不可用",
};

/**
 * React hook wrapping the Web Speech API (SpeechRecognition).
 * Handles browser compat, permission, timeout, and cleanup.
 */
export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
    const [state, setState] = useState<VoiceState>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const errorRecoveryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Stable refs so callbacks don't go stale
    const onResultRef = useRef(options.onResult);
    onResultRef.current = options.onResult;
    const onErrorRef = useRef(options.onError);
    onErrorRef.current = options.onError;

    const isSupported = useMemo(() => {
        if (typeof window === "undefined") return false;
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }, []);

    const clearTimers = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (errorRecoveryRef.current) {
            clearTimeout(errorRecoveryRef.current);
            errorRecoveryRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        try {
            recognitionRef.current?.stop();
        } catch {
            // ignore – already stopped
        }
        clearTimers();
    }, [clearTimers]);

    const start = useCallback(() => {
        if (!isSupported) return;
        if (state === "listening" || state === "requesting") return;

        // Clean up any previous instance
        try { recognitionRef.current?.abort(); } catch { /* ignore */ }
        clearTimers();

        setState("requesting");
        setErrorMessage(null);

        const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Ctor) return;

        const recognition = new Ctor();
        recognition.lang = options.lang ?? "zh-CN";
        recognition.continuous = options.continuous ?? false;
        recognition.interimResults = options.interimResults ?? true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setState("listening");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimText = "";
            let finalText = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += transcript;
                } else {
                    interimText += transcript;
                }
            }
            if (finalText) {
                onResultRef.current(finalText, true);
            } else if (interimText) {
                onResultRef.current(interimText, false);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            const msg = ERROR_MESSAGES[event.error] ?? `语音识别错误: ${event.error}`;
            setErrorMessage(msg);
            setState("error");
            onErrorRef.current?.(msg);

            // Auto-recover to idle after 3s
            errorRecoveryRef.current = setTimeout(() => {
                setState((prev) => (prev === "error" ? "idle" : prev));
                setErrorMessage(null);
            }, 3000);
        };

        recognition.onend = () => {
            clearTimers();
            setState((prev) => (prev === "error" ? prev : "idle"));
        };

        recognitionRef.current = recognition;

        // Auto-stop after maxDuration
        const maxMs = (options.maxDuration ?? 30) * 1000;
        timeoutRef.current = setTimeout(() => {
            try { recognition.stop(); } catch { /* ignore */ }
        }, maxMs);

        try {
            recognition.start();
        } catch (e) {
            setState("error");
            const msg = e instanceof Error ? e.message : "无法启动语音识别";
            setErrorMessage(msg);
            onErrorRef.current?.(msg);
        }
    }, [isSupported, state, options.lang, options.continuous, options.interimResults, options.maxDuration, clearTimers]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try { recognitionRef.current?.abort(); } catch { /* ignore */ }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (errorRecoveryRef.current) clearTimeout(errorRecoveryRef.current);
        };
    }, []);

    return { start, stop, state, isSupported, errorMessage };
}
