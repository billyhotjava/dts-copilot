import { useState } from "react";
import { analyticsApi } from "../../api/analyticsApi";
import "./FeedbackButtons.css";

interface Props {
	messageId: string;
	sessionId: string;
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

export function FeedbackButtons({ messageId, sessionId }: Props) {
	const [state, setState] = useState<FeedbackState>({ step: "idle" });
	const [selectedReason, setSelectedReason] = useState<string | null>(null);
	const [detail, setDetail] = useState("");
	const [submitting, setSubmitting] = useState(false);

	async function handlePositive() {
		setState({ step: "positive-done" });
		try {
			await analyticsApi.submitChatFeedback({
				sessionId,
				messageId,
				rating: "positive",
			});
		} catch {
			/* ignore */
		}
	}

	function handleNegative() {
		setState({ step: "negative-form" });
	}

	function handleCancel() {
		setState({ step: "idle" });
		setSelectedReason(null);
		setDetail("");
	}

	async function handleSubmitNegative() {
		setSubmitting(true);
		try {
			await analyticsApi.submitChatFeedback({
				sessionId,
				messageId,
				rating: "negative",
				...(selectedReason ? { reason: selectedReason } : {}),
				...(detail.trim() ? { detail: detail.trim() } : {}),
			});
		} catch {
			/* ignore */
		} finally {
			setSubmitting(false);
			setState({ step: "submitted" });
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
				>
					{"\uD83D\uDC4D"}
				</button>
				<button
					type="button"
					className={`feedback-buttons__btn${state.step === "negative-form" ? " feedback-buttons__btn--active" : ""}`}
					onClick={handleNegative}
				>
					{"\uD83D\uDC4E"}
				</button>
			</div>

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
