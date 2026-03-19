export type ParsedSseEvent = {
	event: string;
	data: string;
};

type ParsedSseEventHandler = (event: ParsedSseEvent) => void;

export function createSseEventParser(onEvent: ParsedSseEventHandler) {
	let buffer = "";
	let currentEvent = "";
	let currentData: string[] = [];

	function flushEvent() {
		if (!currentEvent && currentData.length === 0) {
			return;
		}
		onEvent({
			event: currentEvent || "message",
			data: currentData.join("\n"),
		});
		currentEvent = "";
		currentData = [];
	}

	function consumeLine(rawLine: string) {
		const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
		if (line === "") {
			flushEvent();
			return;
		}
		if (line.startsWith(":")) {
			return;
		}

		const separatorIndex = line.indexOf(":");
		const field = separatorIndex === -1 ? line : line.slice(0, separatorIndex);
		let value = separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);
		if (value.startsWith(" ")) {
			value = value.slice(1);
		}

		switch (field) {
			case "event":
				currentEvent = value.trim();
				break;
			case "data":
				currentData.push(value);
				break;
			default:
				break;
		}
	}

	return {
		push(chunk: string) {
			if (!chunk) {
				return;
			}
			buffer += chunk;
			let lineBreakIndex = buffer.indexOf("\n");
			while (lineBreakIndex !== -1) {
				consumeLine(buffer.slice(0, lineBreakIndex));
				buffer = buffer.slice(lineBreakIndex + 1);
				lineBreakIndex = buffer.indexOf("\n");
			}
		},
		finish() {
			if (buffer.length > 0) {
				consumeLine(buffer);
				buffer = "";
			}
			flushEvent();
		},
	};
}
