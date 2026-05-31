export function mergeTranscript(existing: string, transcript: string): string {
	const current = existing.trim();
	const next = transcript.trim();
	if (!next) return current;
	if (!current) return next;
	if (current.endsWith(next)) return current;
	return `${current} ${next}`;
}
