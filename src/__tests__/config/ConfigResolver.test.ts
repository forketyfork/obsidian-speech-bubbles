import { resolveConfig } from "../../config/ConfigResolver";
import { DEFAULT_SETTINGS } from "../../types";

describe("resolveConfig", () => {
	it("should return config with default settings when no frontmatter", () => {
		const result = resolveConfig(DEFAULT_SETTINGS, null);
		expect(result.settings).toEqual(DEFAULT_SETTINGS);
		expect(result.speakerConfigs.size).toBe(0);
		expect(result.sides).toBeNull();
	});

	it("should merge frontmatter speaker configs", () => {
		const result = resolveConfig(DEFAULT_SETTINGS, {
			"speech-bubbles": {
				speakers: {
					Gandalf: "#9CA3AF",
				},
			},
		});
		expect(result.speakerConfigs.get("gandalf")?.color).toBe("#9CA3AF");
	});

	it("should merge frontmatter sides config", () => {
		const result = resolveConfig(DEFAULT_SETTINGS, {
			"speech-bubbles": {
				sides: {
					left: ["Gandalf"],
					right: ["Sauron"],
				},
			},
		});
		expect(result.sides?.left.has("gandalf")).toBe(true);
		expect(result.sides?.right.has("sauron")).toBe(true);
	});

	it("should use provided settings", () => {
		const customSettings = {
			...DEFAULT_SETTINGS,
			ownerName: "Frodo",
			compactMode: true,
		};
		const result = resolveConfig(customSettings, null);
		expect(result.settings.ownerName).toBe("Frodo");
		expect(result.settings.compactMode).toBe(true);
	});
});
