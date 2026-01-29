import { ParsedDateSeparator } from "../types";

export function createDateSeparator(dateSeparator: ParsedDateSeparator): HTMLElement {
	const wrapper = document.createElement("div");
	wrapper.className = "speech-bubbles-date-separator";

	const pill = document.createElement("span");
	pill.className = "speech-bubbles-date-separator-pill";
	pill.textContent = dateSeparator.formattedDate;

	wrapper.appendChild(pill);

	return wrapper;
}
