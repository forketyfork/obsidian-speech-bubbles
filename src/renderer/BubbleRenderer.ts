import { ParsedBubble, SpeechBubblesSettings, SpeakerIcon } from "../types";
import { darkenColor } from "../colorUtils";
import { SpeakerResolver } from "../config/SpeakerResolver";
import { formatTimestamp } from "../parser/TimestampParser";

export class BubbleRenderer {
	constructor(
		private resolver: SpeakerResolver,
		private settings: SpeechBubblesSettings
	) {}

	createBubble(bubble: ParsedBubble): HTMLElement {
		const speakerName = bubble.speaker.name;
		const side = this.resolver.getSpeakerSide(speakerName);
		const isOwnerSide = side === "right";
		const color = this.resolver.getSpeakerColor(speakerName);
		const icon = this.resolver.getSpeakerIcon(speakerName);

		const wrapper = document.createElement("div");
		wrapper.className = `speech-bubbles-wrapper ${isOwnerSide ? "speech-bubbles-owner" : "speech-bubbles-other"}`;

		const bubbleEl = document.createElement("div");
		bubbleEl.className = `speech-bubbles-bubble ${isOwnerSide ? "speech-bubbles-owner" : "speech-bubbles-other"}`;
		bubbleEl.style.setProperty("--speech-bubbles-color-start", color.start);
		bubbleEl.style.setProperty("--speech-bubbles-color-end", color.end);
		bubbleEl.style.setProperty(
			"--speech-bubbles-name-color",
			isOwnerSide ? "rgba(255, 255, 255, 0.9)" : darkenColor(color.end)
		);

		if (this.settings.showSpeakerNames || icon || bubble.timestamp) {
			const headerEl = document.createElement("div");
			headerEl.className = "speech-bubbles-header";

			if (icon) {
				headerEl.appendChild(this.createAvatarElement(icon));
			}

			if (this.settings.showSpeakerNames) {
				const nameLabel = document.createElement("span");
				nameLabel.className = "speech-bubbles-name";
				nameLabel.textContent = speakerName;
				headerEl.appendChild(nameLabel);
			}

			if (bubble.timestamp) {
				const timestampEl = document.createElement("span");
				timestampEl.className = "speech-bubbles-timestamp";
				timestampEl.textContent = formatTimestamp(bubble.timestamp);
				headerEl.appendChild(timestampEl);
			}

			bubbleEl.appendChild(headerEl);
		}

		const messageEl = document.createElement("div");
		messageEl.className = "speech-bubbles-message";
		for (const node of bubble.messageNodes) {
			messageEl.appendChild(node);
		}
		bubbleEl.appendChild(messageEl);

		wrapper.appendChild(bubbleEl);

		return wrapper;
	}

	private createAvatarElement(icon: SpeakerIcon): HTMLElement {
		const avatarEl = document.createElement("span");
		avatarEl.className = "speech-bubbles-avatar";

		if (icon.type === "emoji") {
			avatarEl.classList.add("speech-bubbles-avatar-emoji");
			avatarEl.textContent = icon.value;
		} else {
			avatarEl.classList.add("speech-bubbles-avatar-image");
			const img = document.createElement("img");
			img.src = icon.value;
			img.alt = "";
			img.className = "speech-bubbles-avatar-img";
			avatarEl.appendChild(img);
		}

		return avatarEl;
	}
}
