import type {
	AiAgentChatSession,
	DatabaseListItem,
} from "../../api/analyticsApi";
import { resolveFederatedDatabase } from "../../lib/federatedDatabase";

interface ConversationHeaderProps {
	copilotEnabled: boolean;
	databases: DatabaseListItem[];
	selectedDbId: number | null;
	sending: boolean;
	sessionId: string | null;
	sessions: AiAgentChatSession[];
	onDeleteSession: () => void | Promise<void>;
	onNewChat: () => void;
	onSelectSession: (sessionId: string | null) => void;
}

export function ConversationHeader({
	copilotEnabled,
	databases,
	selectedDbId,
	sending,
	sessionId,
	sessions,
	onDeleteSession,
	onNewChat,
	onSelectSession,
}: ConversationHeaderProps) {
	const federatedDatabase = resolveFederatedDatabase(databases);

	return (
		<>
			<div className="copilot-chat__session-bar">
				<select
					className="copilot-chat__session-select"
					value={sessionId ?? ""}
					onChange={(event) => {
						const next = event.target.value;
						onSelectSession(next || null);
					}}
					disabled={sending || !copilotEnabled}
				>
					<option value="">新对话（未保存）</option>
					{sessions.map((item) => (
						<option key={item.id} value={item.id}>
							{item.title?.trim() || item.id}
						</option>
					))}
				</select>
				<button
					type="button"
					className="copilot-chat__mini-btn"
					onClick={onNewChat}
					disabled={sending || !copilotEnabled}
				>
					新建
				</button>
				<button
					type="button"
					className="copilot-chat__mini-btn copilot-chat__mini-btn--danger"
					onClick={() => void onDeleteSession()}
					disabled={sending || !sessionId || !copilotEnabled}
				>
					删除
				</button>
			</div>

			{federatedDatabase && (
				<div className="copilot-chat__db-bar">
					<span className="copilot-chat__db-label">
						数据源
					</span>
					<span className="copilot-chat__db-value">
						{federatedDatabase.name ?? `DB #${federatedDatabase.id}`}
						{federatedDatabase.engine ? ` (${federatedDatabase.engine})` : ""}
						{selectedDbId !== federatedDatabase.id ? " · 未就绪" : ""}
					</span>
				</div>
			)}
		</>
	);
}
