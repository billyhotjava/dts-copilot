import { useState } from "react";
import { analyticsApi } from "../../api/analyticsApi";
import "./FeedbackButtons.css";

interface Props {
	messageId: string;
	sessionId: string;
	generatedSql?: string;
	routedDomain?: string;
	targetView?: string;
	templateCode?: string;
}

const NEGATIVE_REASONS = [
	"SQL不正确",
	"数据不准确",
	"查错了表",
	"没理解我的意思",
	"响应太慢",
	"其他",
];

type FeedbackState =
	| { step: "idle" }
	| { step: "positive-done" }
	| { step: "negative-form" }
	| { step: "submitted" };

export function FeedbackButtons({
	messageId,
	sessionId,
	generatedSql,
	routedDomain,
	targetView,
	templateCode,
}: Props) {
	const [state, setState] = useState<FeedbackState>({ step: "idle" });
	const [selectedReason, setSelectedReason] = useState<string | null>(null);
	const [detail, setDetail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function resolveSubmitError(err: unknown): string {
		return err instanceof Error && err.message.trim().length > 0 ? err.message : "反馈提交失败，请稍后重试。";
	}

	async function handlePositive() {
		if (submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			await analyticsApi.submitChatFeedback({
				sessionId,
				messageId,
				rating: "positive",
				...(generatedSql ? { generatedSql } : {}),
				...(routedDomain ? { routedDomain } : {}),
				...(targetView ? { targetView } : {}),
				...(templateCode ? { templateCode } : {}),
			});
			setState({ step: "positive-done" });
		} catch (err) {
			setError(resolveSubmitError(err));
		} finally {
			setSubmitting(false);
		}
	}

	function handleNegative() {
		setError(null);
		setState({ step: "negative-form" });
	}

	function handleCancel() {
		setState({ step: "idle" });
		setSelectedReason(null);
		setDetail("");
		setError(null);
	}

	async function handleSubmitNegative() {
		setSubmitting(true);
		setError(null);
		try {
			await analyticsApi.submitChatFeedback({
				sessionId,
				messageId,
				rating: "negative",
				...(selectedReason ? { reason: selectedReason } : {}),
				...(detail.trim() ? { detail: detail.trim() } : {}),
				...(generatedSql ? { generatedSql } : {}),
				...(routedDomain ? { routedDomain } : {}),
				...(targetView ? { targetView } : {}),
				...(templateCode ? { templateCode } : {}),
			});
			setState({ step: "submitted" });
		} catch (err) {
			setError(resolveSubmitError(err));
		} finally {
			setSubmitting(false);
		}
	}

	if (state.step === "submitted") {
		return <div className="feedback-buttons__thanks">感谢反馈</div>;
	}

	if (state.step === "positive-done") {
		return (
			<div className="feedback-buttons">
				<button type="button" className="feedback-buttons__btn feedback-buttons__btn--active" disabled>
					{"\uD83D\uDC4D"}
				</button>
				<button type="button" className="feedback-buttons__btn" disabled>
					{"\uD83D\uDC4E"}
				</button>
			</div>
		);
	}

	return (
		<div className="feedback-buttons__wrapper">
			<div className="feedback-buttons">
				<button
					type="button"
					className="feedback-buttons__btn"
					onClick={() => void handlePositive()}
					disabled={submitting}
				>
					{"\uD83D\uDC4D"}
				</button>
				<button
					type="button"
					className={`feedback-buttons__btn${state.step === "negative-form" ? " feedback-buttons__btn--active" : ""}`}
					onClick={handleNegative}
					disabled={submitting}
				>
					{"\uD83D\uDC4E"}
				</button>
			</div>

			{error && <div className="feedback-buttons__error">{error}</div>}

			{state.step === "negative-form" && (
				<div className="feedback-buttons__form">
					<div className="feedback-buttons__reasons">
						{NEGATIVE_REASONS.map((reason) => (
							<button
								key={reason}
								type="button"
								className={`feedback-buttons__reason-chip${selectedReason === reason ? " feedback-buttons__reason-chip--active" : ""}`}
								onClick={() => setSelectedReason(selectedReason === reason ? null : reason)}
							>
								{reason}
							</button>
						))}
					</div>
					<textarea
						className="feedback-buttons__detail"
						placeholder="补充说明（可选）"
						rows={2}
						value={detail}
						onChange={(e) => setDetail(e.target.value)}
					/>
					<div className="feedback-buttons__form-actions">
						<button
							type="button"
							className="feedback-buttons__submit-btn"
							onClick={() => void handleSubmitNegative()}
							disabled={submitting}
						>
							{submitting ? "提交中..." : "提交"}
						</button>
						<button
							type="button"
							className="feedback-buttons__cancel-btn"
							onClick={handleCancel}
							disabled={submitting}
						>
							取消
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
