import { useVoiceInput } from "../../hooks/useVoiceInput";
import "./VoiceInputButton.css";

interface VoiceInputButtonProps {
    /** Called with recognised text (interim and final) */
    onTranscript: (text: string, isFinal: boolean) => void;
    /** Disable the button */
    disabled?: boolean;
}

function MicIcon() {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="9" y="1" width="6" height="11" rx="3" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    );
}

export function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
    const { start, stop, state, isSupported, errorMessage } = useVoiceInput({
        lang: "zh-CN",
        continuous: false,
        interimResults: true,
        maxDuration: 30,
        onResult: onTranscript,
    });

    if (!isSupported) return null;

    const isActive = state === "listening";
    const isBusy = state === "requesting" || state === "processing";

    const handleClick = () => {
        if (isActive) {
            stop();
        } else {
            start();
        }
    };

    return (
        <div className="voice-input-wrapper">
            <button
                type="button"
                className={`voice-input-btn voice-input-btn--${state}`}
                onClick={handleClick}
                disabled={disabled || isBusy}
                title={isActive ? "点击停止录音" : "点击开始语音输入"}
                aria-label={isActive ? "停止录音" : "语音输入"}
            >
                <MicIcon />
                {isActive && <span className="voice-input-pulse" />}
                {isActive && <span className="voice-input-pulse voice-input-pulse--delayed" />}
            </button>
            {state === "error" && errorMessage && (
                <div className="voice-input-error" role="alert">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}
