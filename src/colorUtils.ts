export function darkenColor(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		return "#666666";
	}

	const r = Math.max(0, parseInt(result[1], 16) - 60);
	const g = Math.max(0, parseInt(result[2], 16) - 60);
	const b = Math.max(0, parseInt(result[3], 16) - 60);

	return `rgb(${r}, ${g}, ${b})`;
}

export function isOwner(speakerName: string, ownerName: string, ownerAliases: string[]): boolean {
	const normalizedName = speakerName.toLowerCase().trim();
	const normalizedOwner = ownerName.toLowerCase().trim();

	if (normalizedName === normalizedOwner) {
		return true;
	}

	for (const alias of ownerAliases) {
		if (normalizedName === alias.toLowerCase().trim()) {
			return true;
		}
	}

	return false;
}

export interface SpeakerColor {
	start: string;
	end: string;
}

export const SPEAKER_COLORS: SpeakerColor[] = [
	{ start: "#E0E7FF", end: "#C7D2FE" }, // Indigo tint
	{ start: "#DCFCE7", end: "#BBF7D0" }, // Emerald tint
	{ start: "#FEF3C7", end: "#FDE68A" }, // Amber tint
	{ start: "#FFE4E6", end: "#FECDD3" }, // Rose tint
	{ start: "#F3E8FF", end: "#E9D5FF" }, // Purple tint
	{ start: "#CFFAFE", end: "#A5F3FC" }, // Cyan tint
	{ start: "#FEE2E2", end: "#FECACA" }, // Red tint
	{ start: "#E0F2FE", end: "#BAE6FD" }, // Sky tint
	{ start: "#FEF9C3", end: "#FEF08A" }, // Yellow tint
	{ start: "#D1FAE5", end: "#A7F3D0" }, // Teal tint
];

export const OWNER_COLOR: SpeakerColor = {
	start: "#6366F1", // Indigo
	end: "#8B5CF6", // Violet
};
