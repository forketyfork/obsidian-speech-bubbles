import { SpeakerResolver } from "../../config/SpeakerResolver";
import { DEFAULT_SETTINGS, TranscriptConfig } from "../../types";
import { OWNER_COLOR, SPEAKER_COLORS } from "../../colorUtils";

function createConfig(overrides: Partial<TranscriptConfig> = {}): TranscriptConfig {
	return {
		settings: { ...DEFAULT_SETTINGS },
		speakerConfigs: new Map(),
		sides: null,
		...overrides,
	};
}

describe("SpeakerResolver", () => {
	describe("getSpeakerColor", () => {
		it("should return owner color for owner speaker", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			const color = resolver.getSpeakerColor("me");
			expect(color).toEqual(OWNER_COLOR);
		});

		it("should return owner color for alias", () => {
			const config = createConfig({
				settings: { ...DEFAULT_SETTINGS, ownerAliases: ["John"] },
			});
			const resolver = new SpeakerResolver(config);
			const color = resolver.getSpeakerColor("John");
			expect(color).toEqual(OWNER_COLOR);
		});

		it("should return custom owner color when configured", () => {
			const config = createConfig({
				settings: { ...DEFAULT_SETTINGS, ownerBubbleColor: "#FF0000" },
			});
			const resolver = new SpeakerResolver(config);
			const color = resolver.getSpeakerColor("me");
			expect(color.end).toBe("#FF0000");
		});

		it("should prioritize frontmatter color over cached", () => {
			const speakerConfigs = new Map();
			speakerConfigs.set("gandalf", { color: "#9CA3AF" });
			const config = createConfig({ speakerConfigs });
			const resolver = new SpeakerResolver(config);
			const color = resolver.getSpeakerColor("Gandalf");
			expect(color.end).toBe("#9CA3AF");
		});

		it("should cycle through palette for other speakers", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			const color1 = resolver.getSpeakerColor("Alice");
			const color2 = resolver.getSpeakerColor("Bob");
			expect(color1).toEqual(SPEAKER_COLORS[0]);
			expect(color2).toEqual(SPEAKER_COLORS[1]);
		});

		it("should return same color for same speaker", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			const color1 = resolver.getSpeakerColor("Alice");
			const color2 = resolver.getSpeakerColor("Alice");
			expect(color1).toEqual(color2);
		});

		it("should be case-insensitive for speaker names", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			const color1 = resolver.getSpeakerColor("Alice");
			const color2 = resolver.getSpeakerColor("ALICE");
			expect(color1).toEqual(color2);
		});
	});

	describe("getSpeakerSide", () => {
		it("should return right for owner speaker", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerSide("me")).toBe("right");
		});

		it("should return left for non-owner speaker", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerSide("Gandalf")).toBe("left");
		});

		it("should use sides config when present", () => {
			const config = createConfig({
				sides: {
					left: new Set(["gandalf"]),
					right: new Set(["sauron"]),
				},
			});
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerSide("Gandalf")).toBe("left");
			expect(resolver.getSpeakerSide("Sauron")).toBe("right");
		});

		it("should prioritize sides config over owner check", () => {
			const config = createConfig({
				sides: {
					left: new Set(["me"]),
					right: new Set(),
				},
			});
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerSide("me")).toBe("left");
		});

		it("should fall back to owner check when speaker not in sides", () => {
			const config = createConfig({
				sides: {
					left: new Set(["gandalf"]),
					right: new Set(),
				},
			});
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerSide("me")).toBe("right");
		});
	});

	describe("getSpeakerIcon", () => {
		it("should return null when no icon configured", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			expect(resolver.getSpeakerIcon("Gandalf")).toBeNull();
		});

		it("should return icon when configured", () => {
			const speakerConfigs = new Map();
			speakerConfigs.set("gandalf", { icon: { type: "emoji" as const, value: "🧙" } });
			const config = createConfig({ speakerConfigs });
			const resolver = new SpeakerResolver(config);
			const icon = resolver.getSpeakerIcon("Gandalf");
			expect(icon?.type).toBe("emoji");
			expect(icon?.value).toBe("🧙");
		});
	});

	describe("reset", () => {
		it("should reset cached colors", () => {
			const config = createConfig();
			const resolver = new SpeakerResolver(config);
			resolver.getSpeakerColor("Alice");
			resolver.getSpeakerColor("Bob");
			resolver.reset();
			const color = resolver.getSpeakerColor("Charlie");
			expect(color).toEqual(SPEAKER_COLORS[0]);
		});
	});
});
