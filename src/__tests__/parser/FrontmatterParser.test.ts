import { parseFrontmatter } from "../../parser/FrontmatterParser";

describe("parseFrontmatter", () => {
	it("should return empty config for null frontmatter", () => {
		const result = parseFrontmatter(null);
		expect(result.speakerConfigs.size).toBe(0);
		expect(result.sides).toBeNull();
	});

	it("should return empty config for non-object frontmatter", () => {
		const result = parseFrontmatter("string");
		expect(result.speakerConfigs.size).toBe(0);
		expect(result.sides).toBeNull();
	});

	it("should return empty config for missing speech-bubbles key", () => {
		const result = parseFrontmatter({ tags: ["transcript"] });
		expect(result.speakerConfigs.size).toBe(0);
		expect(result.sides).toBeNull();
	});

	describe("speaker colors", () => {
		it("should parse simple speaker colors (string format)", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: "#9CA3AF",
						Frodo: "#34D399",
					},
				},
			});
			expect(result.speakerConfigs.get("gandalf")?.color).toBe("#9CA3AF");
			expect(result.speakerConfigs.get("frodo")?.color).toBe("#34D399");
		});

		it("should parse speaker objects with color", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: { color: "#9CA3AF" },
					},
				},
			});
			expect(result.speakerConfigs.get("gandalf")?.color).toBe("#9CA3AF");
		});

		it("should normalize speaker names to lowercase", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						GANDALF: "#9CA3AF",
					},
				},
			});
			expect(result.speakerConfigs.has("gandalf")).toBe(true);
			expect(result.speakerConfigs.has("GANDALF")).toBe(false);
		});
	});

	describe("speaker icons", () => {
		it("should parse emoji icons", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: { icon: "🧙" },
					},
				},
			});
			const config = result.speakerConfigs.get("gandalf");
			expect(config?.icon?.type).toBe("emoji");
			expect(config?.icon?.value).toBe("🧙");
		});

		it("should parse vault image paths", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: { icon: "[[avatars/gandalf.png]]" },
					},
				},
			});
			const config = result.speakerConfigs.get("gandalf");
			expect(config?.icon?.type).toBe("image");
			expect(config?.icon?.value).toBe("avatars/gandalf.png");
		});

		it("should parse both color and icon", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: { color: "#9CA3AF", icon: "🧙" },
					},
				},
			});
			const config = result.speakerConfigs.get("gandalf");
			expect(config?.color).toBe("#9CA3AF");
			expect(config?.icon?.value).toBe("🧙");
		});
	});

	describe("sides", () => {
		it("should parse left and right sides", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					sides: {
						left: ["Gandalf", "Frodo"],
						right: ["Sauron"],
					},
				},
			});
			expect(result.sides?.left.has("gandalf")).toBe(true);
			expect(result.sides?.left.has("frodo")).toBe(true);
			expect(result.sides?.right.has("sauron")).toBe(true);
		});

		it("should normalize side names to lowercase", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					sides: {
						left: ["GANDALF"],
					},
				},
			});
			expect(result.sides?.left.has("gandalf")).toBe(true);
		});

		it("should return null sides when empty", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					sides: {},
				},
			});
			expect(result.sides).toBeNull();
		});

		it("should handle only left side", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					sides: {
						left: ["Gandalf"],
					},
				},
			});
			expect(result.sides?.left.has("gandalf")).toBe(true);
			expect(result.sides?.right.size).toBe(0);
		});

		it("should handle only right side", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					sides: {
						right: ["Sauron"],
					},
				},
			});
			expect(result.sides?.left.size).toBe(0);
			expect(result.sides?.right.has("sauron")).toBe(true);
		});
	});

	describe("combined config", () => {
		it("should parse speakers and sides together", () => {
			const result = parseFrontmatter({
				"speech-bubbles": {
					speakers: {
						Gandalf: { color: "#9CA3AF", icon: "🧙" },
					},
					sides: {
						left: ["Gandalf"],
						right: ["Sauron"],
					},
				},
			});
			expect(result.speakerConfigs.get("gandalf")?.color).toBe("#9CA3AF");
			expect(result.sides?.left.has("gandalf")).toBe(true);
		});
	});
});
