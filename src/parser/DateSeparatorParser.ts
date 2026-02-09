import { ParsedDateSeparator } from "../types";

const ISO_DATE_REGEX = /^---\s+(\d{4}-\d{2}-\d{2})\s+---$/;
const NATURAL_DATE_REGEX =
	/^---\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\s+---$/i;

export function parseDateSeparator(text: string): ParsedDateSeparator | null {
	const trimmed = text.trim();

	const isoMatch = ISO_DATE_REGEX.exec(trimmed);
	if (isoMatch) {
		const date = new Date(isoMatch[1] + "T00:00:00");
		if (!isNaN(date.getTime())) {
			return {
				type: "date-separator",
				raw: trimmed,
				date,
				formattedDate: formatDate(date),
			};
		}
	}

	const naturalMatch = NATURAL_DATE_REGEX.exec(trimmed);
	if (naturalMatch) {
		const date = new Date(naturalMatch[1]);
		if (!isNaN(date.getTime())) {
			return {
				type: "date-separator",
				raw: trimmed,
				date,
				formattedDate: formatDate(date),
			};
		}
	}

	return null;
}

function formatDate(date: Date): string {
	return date.toLocaleDateString(undefined, {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}
