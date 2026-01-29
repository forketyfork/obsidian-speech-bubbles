import { darkenColor, isOwner, lightenColor, hexToSpeakerColor, SPEAKER_COLORS, OWNER_COLOR } from "../colorUtils";

describe("darkenColor", () => {
	it("should darken a light gray color", () => {
		const result = darkenColor("#E8E8E8");
		expect(result).toBe("rgb(172, 172, 172)");
	});

	it("should darken a light green color", () => {
		const result = darkenColor("#DCF8C6");
		expect(result).toBe("rgb(160, 188, 138)");
	});

	it("should handle colors that would go below 0", () => {
		const result = darkenColor("#303030");
		expect(result).toBe("rgb(0, 0, 0)");
	});

	it("should return fallback color for invalid hex", () => {
		const result = darkenColor("invalid");
		expect(result).toBe("#666666");
	});

	it("should handle hex without # prefix", () => {
		const result = darkenColor("E8E8E8");
		expect(result).toBe("rgb(172, 172, 172)");
	});

	it("should handle uppercase and lowercase hex", () => {
		const resultLower = darkenColor("#e8e8e8");
		const resultUpper = darkenColor("#E8E8E8");
		expect(resultLower).toBe(resultUpper);
	});
});

describe("lightenColor", () => {
	it("should lighten a dark color", () => {
		const result = lightenColor("#000000", 0.5);
		expect(result).toBe("#808080");
	});

	it("should lighten a color by a small amount", () => {
		const result = lightenColor("#6366F1", 0.2);
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("should return the same color for invalid hex", () => {
		const result = lightenColor("invalid", 0.5);
		expect(result).toBe("invalid");
	});

	it("should not exceed white", () => {
		const result = lightenColor("#FFFFFF", 0.5);
		expect(result).toBe("#ffffff");
	});
});

describe("hexToSpeakerColor", () => {
	it("should create a gradient from a hex color", () => {
		const result = hexToSpeakerColor("#6366F1");
		expect(result.start).toMatch(/^#[0-9a-f]{6}$/i);
		expect(result.end).toBe("#6366F1");
	});

	it("should have a lighter start than end", () => {
		const result = hexToSpeakerColor("#000000");
		expect(result.start).not.toBe(result.end);
	});
});

describe("isOwner", () => {
	it("should return true when name matches owner name", () => {
		expect(isOwner("John", "John", [])).toBe(true);
	});

	it("should return true when name matches owner name case-insensitively", () => {
		expect(isOwner("JOHN", "john", [])).toBe(true);
		expect(isOwner("john", "JOHN", [])).toBe(true);
	});

	it("should return true when name matches an alias", () => {
		expect(isOwner("Johnny", "John", ["Johnny", "J"])).toBe(true);
	});

	it("should return true when name matches an alias case-insensitively", () => {
		expect(isOwner("JOHNNY", "John", ["johnny", "J"])).toBe(true);
	});

	it("should return false when name does not match owner or aliases", () => {
		expect(isOwner("Jane", "John", ["Johnny", "J"])).toBe(false);
	});

	it("should handle whitespace in names", () => {
		expect(isOwner("  John  ", "John", [])).toBe(true);
		expect(isOwner("John", "  John  ", [])).toBe(true);
	});

	it("should handle whitespace in aliases", () => {
		expect(isOwner("Johnny", "John", ["  Johnny  "])).toBe(true);
	});

	it("should return false for empty name", () => {
		expect(isOwner("", "John", [])).toBe(false);
	});

	it("should return true when empty name matches empty owner", () => {
		expect(isOwner("", "", [])).toBe(true);
	});
});

describe("SPEAKER_COLORS", () => {
	it("should have 10 predefined colors", () => {
		expect(SPEAKER_COLORS).toHaveLength(10);
	});

	it("should have valid hex color format for start and end", () => {
		const hexPattern = /^#[0-9A-Fa-f]{6}$/;
		for (const color of SPEAKER_COLORS) {
			expect(color.start).toMatch(hexPattern);
			expect(color.end).toMatch(hexPattern);
		}
	});
});

describe("OWNER_COLOR", () => {
	it("should have gradient colors", () => {
		const hexPattern = /^#[0-9A-Fa-f]{6}$/;
		expect(OWNER_COLOR.start).toMatch(hexPattern);
		expect(OWNER_COLOR.end).toMatch(hexPattern);
	});
});
