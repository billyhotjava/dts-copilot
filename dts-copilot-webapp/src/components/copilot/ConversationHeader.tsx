import type {
	AiAgentChatSession,
	DatabaseListItem,
} from "../../api/analyticsApi";

interface ConversationHeaderProps {
	copilotEnabled: boolean;
	databases: DatabaseListItem[];
	selectedDbId: number | null;
	sending: boolean;
	sessionId: string | null;
	sessions: AiAgentChatSession[];
	onDeleteSession: () => void | Promise<void>;
	onNewChat: () => void;
	onSelectDatabase: (databaseId: number | null) => void;
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
	onSelectDatabase,
	onSelectSession,
}: ConversationHeaderProps) {
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

			{databases.length > 0 && (
				<div className="copilot-chat__db-bar">
					<label className="copilot-chat__db-label" htmlFor="copilot-db-select">
						数据源
					</label>
					<select
						id="copilot-db-select"
						className="copilot-chat__db-select"
						value={selectedDbId ?? ""}
						onChange={(event) => {
							const value = Number(event.target.value);
							onSelectDatabase(Number.isFinite(value) ? value : null);
						}}
						disabled={sending || !copilotEnabled}
					>
						{databases.map((db) => (
							<option key={db.id} value={db.id}>
								{db.name ?? `DB #${db.id}`}
								{db.engine ? ` (${db.engine})` : ""}
							</option>
						))}
					</select>
				</div>
			)}
		</>
	);
}
