export interface SpeechBubblesSettings {
	ownerName: string;
	ownerAliases: string[];
	debugLogging: boolean;
	bubbleMaxWidth: number;
	bubbleRadius: number;
	showSpeakerNames: boolean;
	compactMode: boolean;
	ownerBubbleColor: string | null;
}

export const DEFAULT_SETTINGS: SpeechBubblesSettings = {
	ownerName: "me",
	ownerAliases: [],
	debugLogging: false,
	bubbleMaxWidth: 75,
	bubbleRadius: 18,
	showSpeakerNames: true,
	compactMode: false,
	ownerBubbleColor: null,
};

export interface SpeakerColor {
	start: string;
	end: string;
}

export interface SpeakerIcon {
	type: "emoji" | "image";
	value: string;
}

export interface SpeakerConfig {
	color?: string;
	icon?: SpeakerIcon;
}

export interface SidesConfig {
	left: Set<string>;
	right: Set<string>;
}

export interface SpeechBubblesFrontmatter {
	speakers?: Record<string, string | { color?: string; icon?: string }>;
	sides?: {
		left?: string[];
		right?: string[];
	};
}

export interface TranscriptConfig {
	settings: SpeechBubblesSettings;
	speakerConfigs: Map<string, SpeakerConfig>;
	sides: SidesConfig | null;
}

export interface ParsedTimestamp {
	raw: string;
	hours: number;
	minutes: number;
	seconds: number | null;
}

export interface ParsedSpeaker {
	name: string;
	normalizedName: string;
}

export interface ParsedBubble {
	type: "bubble";
	speaker: ParsedSpeaker;
	timestamp: ParsedTimestamp | null;
	messageNodes: Node[];
}

export interface ParsedDateSeparator {
	type: "date-separator";
	raw: string;
	date: Date;
	formattedDate: string;
}

export interface ParsedRegularText {
	type: "regular-text";
	nodes: Node[];
}

export type ParsedLine = ParsedBubble | ParsedDateSeparator | ParsedRegularText;
