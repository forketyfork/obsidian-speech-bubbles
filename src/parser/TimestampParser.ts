import { ParsedTimestamp } from "../types";

const TIMESTAMP_REGEX = /^\s*\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/;

export interface TimestampParseResult {
	timestamp: ParsedTimestamp;
	remainingText: string;
}

export function parseTimestamp(text: string): TimestampParseResult | null {
	const match = TIMESTAMP_REGEX.exec(text);
	if (!match) {
		return null;
	}

	const hours = parseInt(match[1], 10);
	const minutes = parseInt(match[2], 10);
	const seconds = match[3] ? parseInt(match[3], 10) : null;

	if (hours > 23 || minutes > 59 || (seconds !== null && seconds > 59)) {
		return null;
	}

	return {
		timestamp: {
			raw: match[0].trim(),
			hours,
			minutes,
			seconds,
		},
		remainingText: text.slice(match[0].length),
	};
}

export function formatTimestamp(timestamp: ParsedTimestamp): string {
	const hours = String(timestamp.hours).padStart(2, "0");
	const minutes = String(timestamp.minutes).padStart(2, "0");

	if (timestamp.seconds !== null) {
		const seconds = String(timestamp.seconds).padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	}

	return `${hours}:${minutes}`;
}
