import type { ReactNode } from 'react'
import type { AnalysisProvenanceModel } from '../../pages/analysisProvenanceModel'
import { Badge } from '../../ui/Badge/Badge'
import { Card, CardBody, CardHeader } from '../../ui/Card/Card'
import './AnalysisProvenancePanel.css'

type AnalysisProvenancePanelProps = {
	model: AnalysisProvenanceModel
	actions?: ReactNode
	className?: string
}

export function AnalysisProvenancePanel({
	model,
	actions,
	className = '',
}: AnalysisProvenancePanelProps) {
	return (
		<Card className={`analysis-provenance-panel ${className}`.trim()} style={{ marginBottom: 'var(--spacing-lg)' }}>
			<CardHeader title={model.heading} />
			<CardBody>
				<div className="analysis-provenance-panel__content">
					<div className="analysis-provenance-panel__title">{model.title}</div>
					<div className="analysis-provenance-panel__summary">{model.summary}</div>
					{model.badges.length > 0 ? (
						<div className="analysis-provenance-panel__badges">
							{model.badges.map((badge) => (
								<Badge key={`${badge.variant}-${badge.label}`} variant={badge.variant}>
									{badge.label}
								</Badge>
							))}
						</div>
					) : null}
					{model.details.length > 0 ? (
						<div className="analysis-provenance-panel__details">
							{model.details.map((detail) => (
								<div key={`${detail.label}-${detail.value}`} className="analysis-provenance-panel__detail">
									<span className="analysis-provenance-panel__detail-label">{detail.label}：</span>
									<span>{detail.value}</span>
								</div>
							))}
						</div>
					) : null}
					{actions ? <div className="analysis-provenance-panel__actions">{actions}</div> : null}
				</div>
			</CardBody>
		</Card>
	)
}
