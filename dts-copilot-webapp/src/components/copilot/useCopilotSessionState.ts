import { useCallback, useEffect, useRef, useState } from "react";
import type {
	AiAgentChatMessage,
	AiAgentChatSession,
	AiAgentPendingAction,
	DatabaseListItem,
} from "../../api/analyticsApi";
import { analyticsApi } from "../../api/analyticsApi";
import { attachAnalysisDraftLinksToMessages } from "./copilotAnalysisDraftLinks";
import type { CopilotSessionFocusRequest } from "./copilotSessionFocus";
import { shouldRestorePersistedCopilotSession } from "./copilotSessionBootstrap";
import {
	DATASOURCE_ID_KEY,
	SESSION_ID_KEY,
	getStoredDatasourceId,
	getStoredSessionId,
	sortMessages,
	toArray,
} from "./CopilotChat.helpers";

interface ValueRef<T> {
	current: T;
}

interface UseCopilotSessionStateInput {
	activeStreamingSessionIdRef: ValueRef<string | null>;
	copilotEnabled: boolean;
	focusRequest: CopilotSessionFocusRequest | null;
	streamInFlightRef: ValueRef<boolean>;
}

export function useCopilotSessionState({
	activeStreamingSessionIdRef,
	copilotEnabled,
	focusRequest,
	streamInFlightRef,
}: UseCopilotSessionStateInput) {
	const initialStoredSessionId = useRef(getStoredSessionId());
	const [sessionId, setSessionId] = useState<string | null>(
		() => initialStoredSessionId.current,
	);
	const [sessions, setSessions] = useState<AiAgentChatSession[]>([]);
	const [messages, setMessages] = useState<AiAgentChatMessage[]>([]);
	const [pendingAction, setPendingAction] =
		useState<AiAgentPendingAction | null>(null);
	const [databases, setDatabases] = useState<DatabaseListItem[]>([]);
	const [selectedDbId, setSelectedDbId] = useState<number | null>(() =>
		getStoredDatasourceId(),
	);
	const [focusNotice, setFocusNotice] = useState<string | null>(null);
	const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);

	const reloadSessions = useCallback(async () => {
		if (!copilotEnabled) {
			setSessions([]);
			return [];
		}
		try {
			const rows = await analyticsApi.listAiAgentSessions(50);
			const list = sortSessionsByLastActiveAt(
				toArray<AiAgentChatSession>(rows),
			);
			setSessions(list);
			return list;
		} catch {
			return [];
		}
	}, [copilotEnabled]);

	const reloadMessages = useCallback(
		async (sid: string) => {
			if (!copilotEnabled) {
				setMessages([]);
				setPendingAction(null);
				return;
			}
			try {
				const detail = await analyticsApi.getAiAgentSession(sid);
				let nextMessages = sortMessages(detail.messages ?? []);
				try {
					const drafts = await analyticsApi.listAnalysisDrafts();
					nextMessages = attachAnalysisDraftLinksToMessages(nextMessages, drafts);
				} catch {
					/* draft linking is best-effort */
				}
				setMessages(nextMessages);
				setPendingAction(detail.pendingAction ?? null);
			} catch {
				/* ignore */
			}
		},
		[copilotEnabled],
	);

	useEffect(() => {
		try {
			if (sessionId) {
				sessionStorage.setItem(SESSION_ID_KEY, sessionId);
			} else {
				sessionStorage.removeItem(SESSION_ID_KEY);
			}
		} catch {
			/* ignore */
		}
	}, [sessionId]);

	useEffect(() => {
		if (!copilotEnabled) return;
		let active = true;
		void (async () => {
			try {
				const res = await analyticsApi.listDatabases();
				if (!active) return;
				const list = toArray<DatabaseListItem>(res.data);
				setDatabases(list);
				setSelectedDbId((prev) => {
					if (prev != null && list.some((db) => db.id === prev)) return prev;
					return list.length > 0 ? list[0].id : null;
				});
			} catch {
				/* ignore */
			}
		})();
		return () => {
			active = false;
		};
	}, [copilotEnabled]);

	useEffect(() => {
		try {
			if (selectedDbId != null) {
				sessionStorage.setItem(DATASOURCE_ID_KEY, String(selectedDbId));
			} else {
				sessionStorage.removeItem(DATASOURCE_ID_KEY);
			}
		} catch {
			/* ignore */
		}
	}, [selectedDbId]);

	useEffect(() => {
		let active = true;
		void (async () => {
			const list = await reloadSessions();
			if (!active) return;
			const restoredSessionId = initialStoredSessionId.current;
			if (
				restoredSessionId &&
				list.some((item) => item.id === restoredSessionId)
			) {
				try {
					const detail =
						await analyticsApi.getAiAgentSession(restoredSessionId);
					if (!active) return;
					if (!shouldRestorePersistedCopilotSession(detail)) {
						setSessionId(null);
						setMessages([]);
						setPendingAction(null);
						initialStoredSessionId.current = null;
						try {
							sessionStorage.removeItem(SESSION_ID_KEY);
						} catch {
							/* ignore */
						}
						return;
					}
				} catch {
					/* ignore */
				}
			}
			if (
				sessionId &&
				list.length > 0 &&
				!list.some((item) => item.id === sessionId)
			) {
				setSessionId(null);
			}
		})();
		return () => {
			active = false;
		};
	}, [reloadSessions, sessionId]);

	useEffect(() => {
		if (!copilotEnabled) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		if (!sessionId) {
			setMessages([]);
			setPendingAction(null);
			return;
		}
		if (
			streamInFlightRef.current &&
			activeStreamingSessionIdRef.current === sessionId
		) {
			return;
		}
		void reloadMessages(sessionId);
	}, [
		activeStreamingSessionIdRef,
		copilotEnabled,
		reloadMessages,
		sessionId,
		streamInFlightRef,
	]);

	useEffect(() => {
		if (!focusRequest?.sessionId) return;
		setSessionId(focusRequest.sessionId);
		setFocusNotice(focusRequest.notice);
		setFocusedMessageId(focusRequest.messageId ?? null);
		void reloadMessages(focusRequest.sessionId);
	}, [focusRequest, reloadMessages]);

	return {
		databases,
		focusedMessageId,
		focusNotice,
		messages,
		pendingAction,
		reloadMessages,
		reloadSessions,
		selectedDbId,
		sessionId,
		sessions,
		setFocusedMessageId,
		setFocusNotice,
		setMessages,
		setPendingAction,
		setSelectedDbId,
		setSessionId,
	};
}

function sortSessionsByLastActiveAt(
	sessions: AiAgentChatSession[],
): AiAgentChatSession[] {
	return [...sessions].sort(
		(left, right) =>
			parseSessionActivityTime(right) - parseSessionActivityTime(left),
	);
}

function parseSessionActivityTime(session: AiAgentChatSession): number {
	const timestamp = Date.parse(session.lastActiveAt ?? session.createdAt ?? "");
	return Number.isFinite(timestamp) ? timestamp : 0;
}
