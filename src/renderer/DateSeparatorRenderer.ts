import { ParsedDateSeparator } from "../types";

export function createDateSeparator(dateSeparator: ParsedDateSeparator): HTMLElement {
	const wrapper = createDiv({ cls: "speech-bubbles-date-separator" });

	const pill = createSpan({
		cls: "speech-bubbles-date-separator-pill",
		text: dateSeparator.formattedDate,
	});

	wrapper.appendChild(pill);

	return wrapper;
}
