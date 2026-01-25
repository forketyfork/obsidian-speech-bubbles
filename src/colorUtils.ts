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

export const SPEAKER_COLORS = [
	"#E8E8E8", // Light gray
	"#DCF8C6", // Light green
	"#FFF9C4", // Light yellow
	"#FFCCBC", // Light orange
	"#E1BEE7", // Light purple
	"#B3E5FC", // Light blue
	"#F0F4C3", // Light lime
	"#FFCDD2", // Light red
	"#D7CCC8", // Light brown
	"#CFD8DC", // Blue gray
];

export const OWNER_COLOR = "#007AFF"; // iOS blue for owner
