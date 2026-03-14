/**
 * Shared utilities for analytics pages.
 * Centralises types and helpers that were previously copy-pasted across
 * ExploreSessionsPage, ReportFactoryPage, MetricLensPage and Nl2SqlEvalPage.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LoadState<T> =
	| { state: "loading" }
	| { state: "loaded"; value: T }
	| { state: "error"; error: unknown };

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/**
 * Format an ISO timestamp string for display.
 * Returns "-" for empty/null values, the raw string if parsing fails.
 */
export function formatTime(ts: string | null | undefined): string {
	if (!ts) return "-";
	const d = new Date(ts);
	if (Number.isNaN(d.getTime())) return ts;
	return d.toLocaleString();
}

// ---------------------------------------------------------------------------
// ID helpers
// ---------------------------------------------------------------------------

/**
 * Coerce any id-like value to a plain string.
 * Returns "" for null/undefined.
 */
export function toIdString(id: string | number | null | undefined): string {
	return id == null ? "" : String(id);
}

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

/**
 * Parse a JSON string and return the parsed value.
 * Returns `null` if the string is empty or invalid JSON.
 */
export function parseJsonSafe(text: string): unknown {
	const trimmed = text.trim();
	if (!trimmed) return null;
	try {
		return JSON.parse(trimmed);
	} catch {
		return null;
	}
}
