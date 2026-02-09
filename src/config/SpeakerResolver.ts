import { SpeakerColor, SpeakerIcon, TranscriptConfig } from "../types";
import { isOwner, SPEAKER_COLORS, OWNER_COLOR, hexToSpeakerColor } from "../colorUtils";

export class SpeakerResolver {
	private colorIndex = 0;
	private cachedColors: Map<string, SpeakerColor> = new Map();

	constructor(private config: TranscriptConfig) {}

	getSpeakerColor(speakerName: string): SpeakerColor {
		const normalized = speakerName.toLowerCase().trim();

		const speakerConfig = this.config.speakerConfigs.get(normalized);
		if (speakerConfig?.color) {
			return hexToSpeakerColor(speakerConfig.color);
		}

		if (this.isOwnerSpeaker(speakerName)) {
			const ownerColor = this.config.settings.ownerBubbleColor;
			if (ownerColor) {
				return hexToSpeakerColor(ownerColor);
			}
			return OWNER_COLOR;
		}

		if (!this.cachedColors.has(normalized)) {
			const color = SPEAKER_COLORS[this.colorIndex % SPEAKER_COLORS.length];
			this.cachedColors.set(normalized, color);
			this.colorIndex++;
		}

		return this.cachedColors.get(normalized) ?? SPEAKER_COLORS[0];
	}

	getSpeakerSide(speakerName: string): "left" | "right" {
		const normalized = speakerName.toLowerCase().trim();

		if (this.config.sides) {
			if (this.config.sides.right.has(normalized)) {
				return "right";
			}
			if (this.config.sides.left.has(normalized)) {
				return "left";
			}
		}

		if (this.isOwnerSpeaker(speakerName)) {
			return "right";
		}

		return "left";
	}

	getSpeakerIcon(speakerName: string): SpeakerIcon | null {
		const normalized = speakerName.toLowerCase().trim();
		const speakerConfig = this.config.speakerConfigs.get(normalized);
		return speakerConfig?.icon ?? null;
	}

	isOwnerSpeaker(speakerName: string): boolean {
		return isOwner(speakerName, this.config.settings.ownerName, this.config.settings.ownerAliases);
	}

	reset(): void {
		this.colorIndex = 0;
		this.cachedColors.clear();
	}
}
