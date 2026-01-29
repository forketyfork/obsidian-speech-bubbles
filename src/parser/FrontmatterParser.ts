import { SpeechBubblesFrontmatter, SpeakerConfig, SpeakerIcon, SidesConfig } from "../types";

export interface ParsedFrontmatterConfig {
	speakerConfigs: Map<string, SpeakerConfig>;
	sides: SidesConfig | null;
}

export function parseFrontmatter(frontmatter: unknown): ParsedFrontmatterConfig {
	const result: ParsedFrontmatterConfig = {
		speakerConfigs: new Map(),
		sides: null,
	};

	if (!frontmatter || typeof frontmatter !== "object") {
		return result;
	}

	const fm = frontmatter as Record<string, unknown>;
	const speechBubbles = fm["speech-bubbles"];

	if (!speechBubbles || typeof speechBubbles !== "object") {
		return result;
	}

	const config = speechBubbles as SpeechBubblesFrontmatter;

	if (config.speakers) {
		result.speakerConfigs = parseSpeakers(config.speakers);
	}

	if (config.sides) {
		result.sides = parseSides(config.sides);
	}

	return result;
}

function parseSpeakers(
	speakers: Record<string, string | { color?: string; icon?: string }>
): Map<string, SpeakerConfig> {
	const result = new Map<string, SpeakerConfig>();

	for (const [name, value] of Object.entries(speakers)) {
		const normalizedName = name.toLowerCase().trim();
		const config: SpeakerConfig = {};

		if (typeof value === "string") {
			config.color = value;
		} else if (typeof value === "object" && value !== null) {
			if (typeof value.color === "string") {
				config.color = value.color;
			}
			if (typeof value.icon === "string") {
				config.icon = parseIcon(value.icon);
			}
		}

		if (config.color || config.icon) {
			result.set(normalizedName, config);
		}
	}

	return result;
}

function parseIcon(icon: string): SpeakerIcon {
	const imageMatch = /^\[\[(.+)\]\]$/.exec(icon);
	if (imageMatch) {
		return { type: "image", value: imageMatch[1] };
	}
	return { type: "emoji", value: icon };
}

function parseSides(sides: { left?: string[]; right?: string[] }): SidesConfig | null {
	const left = new Set<string>();
	const right = new Set<string>();

	if (Array.isArray(sides.left)) {
		for (const name of sides.left) {
			if (typeof name === "string") {
				left.add(name.toLowerCase().trim());
			}
		}
	}

	if (Array.isArray(sides.right)) {
		for (const name of sides.right) {
			if (typeof name === "string") {
				right.add(name.toLowerCase().trim());
			}
		}
	}

	if (left.size === 0 && right.size === 0) {
		return null;
	}

	return { left, right };
}
