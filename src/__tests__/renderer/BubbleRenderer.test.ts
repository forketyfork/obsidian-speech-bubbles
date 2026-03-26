import { BubbleRenderer } from "../../renderer/BubbleRenderer";
import { SpeakerResolver } from "../../config/SpeakerResolver";
import { DEFAULT_SETTINGS, ParsedBubble, TranscriptConfig } from "../../types";

function createConfig(overrides: Partial<TranscriptConfig> = {}): TranscriptConfig {
	return {
		settings: { ...DEFAULT_SETTINGS },
		speakerConfigs: new Map(),
		sides: null,
		...overrides,
	};
}

function createBubble(speakerName: string): ParsedBubble {
	return {
		type: "bubble",
		speaker: {
			name: speakerName,
			normalizedName: speakerName.toLowerCase(),
		},
		timestamp: null,
		messageNodes: [document.createTextNode("You shall not pass!")],
	};
}

function createRenderer(config: TranscriptConfig): BubbleRenderer {
	const app = {
		vault: {
			adapter: {
				getResourcePath: jest.fn((path: string) => `resource://${path}`),
			},
		},
	};

	return new BubbleRenderer(app as never, new SpeakerResolver(config), config.settings);
}

describe("BubbleRenderer", () => {
	it("should apply the configured speaker name color", () => {
		const speakerConfigs = new Map();
		speakerConfigs.set("gandalf", {
			color: "#9CA3AF",
			nameColor: "#ec4899",
		});
		const config = createConfig({ speakerConfigs });
		const renderer = createRenderer(config);

		const element = renderer.createBubble(createBubble("Gandalf"));
		const bubbleEl = element.querySelector<HTMLElement>(".speech-bubbles-bubble");

		expect(bubbleEl).not.toBeNull();
		expect(bubbleEl?.style.getPropertyValue("--speech-bubbles-name-color")).toBe("#ec4899");
	});

	it("should apply the configured speaker name and message sizes", () => {
		const speakerConfigs = new Map();
		speakerConfigs.set("gandalf", {
			nameSize: "1rem",
			messageSize: "18px",
		});
		const config = createConfig({ speakerConfigs });
		const renderer = createRenderer(config);

		const element = renderer.createBubble(createBubble("Gandalf"));
		const bubbleEl = element.querySelector<HTMLElement>(".speech-bubbles-bubble");

		expect(bubbleEl).not.toBeNull();
		expect(bubbleEl?.style.getPropertyValue("--speech-bubbles-name-size")).toBe("1rem");
		expect(bubbleEl?.style.getPropertyValue("--speech-bubbles-message-size")).toBe("18px");
	});

	it("should apply the configured icon size", () => {
		const speakerConfigs = new Map();
		speakerConfigs.set("gandalf", {
			icon: {
				type: "emoji" as const,
				value: "🧙",
			},
			iconSize: "24px",
		});
		const config = createConfig({ speakerConfigs });
		const renderer = createRenderer(config);

		const element = renderer.createBubble(createBubble("Gandalf"));
		const bubbleEl = element.querySelector<HTMLElement>(".speech-bubbles-bubble");

		expect(bubbleEl).not.toBeNull();
		expect(bubbleEl?.style.getPropertyValue("--speech-bubbles-icon-size")).toBe("24px");
	});
});
