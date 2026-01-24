import {
	App,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
} from "obsidian";

interface SpeechBubblesSettings {
	ownerName: string;
	ownerAliases: string[];
}

const DEFAULT_SETTINGS: SpeechBubblesSettings = {
	ownerName: "me",
	ownerAliases: [],
};

// Predefined colors for different speakers (excluding the owner who gets a special color)
const SPEAKER_COLORS = [
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

export default class SpeechBubblesPlugin extends Plugin {
	settings: SpeechBubblesSettings;
	private speakerColorMap: Map<string, string> = new Map();
	private colorIndex = 0;
	private enabledFiles: Set<string> = new Set();

	async onload() {
		await this.loadSettings();

		// Add ribbon icon to toggle speech bubbles view
		this.addRibbonIcon("message-circle", "Toggle Speech Bubbles", () => {
			this.toggleSpeechBubbles();
		});

		// Add command to toggle speech bubbles
		this.addCommand({
			id: "toggle-speech-bubbles",
			name: "Toggle Speech Bubbles View",
			callback: () => {
				this.toggleSpeechBubbles();
			},
		});

		// Register the markdown post processor
		this.registerMarkdownPostProcessor(
			(el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				this.processTranscription(el, ctx);
			}
		);

		// Add settings tab
		this.addSettingTab(new SpeechBubblesSettingTab(this.app, this));
	}

	onunload() {
		// Clean up
		this.enabledFiles.clear();
		this.speakerColorMap.clear();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private toggleSpeechBubbles() {
		const activeView =
			this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) {
			return;
		}

		const file = activeView.file;
		if (!file) {
			return;
		}

		const filePath = file.path;

		if (this.enabledFiles.has(filePath)) {
			this.enabledFiles.delete(filePath);
		} else {
			this.enabledFiles.add(filePath);
		}

		// Reset color map when toggling
		this.speakerColorMap.clear();
		this.colorIndex = 0;

		// Force re-render by switching mode
		const currentMode = activeView.getMode();
		if (currentMode === "preview") {
			// Re-render by toggling
			activeView.setState(
				{ ...activeView.getState(), mode: "source" },
				{ history: false }
			);
			setTimeout(() => {
				activeView.setState(
					{ ...activeView.getState(), mode: "preview" },
					{ history: false }
				);
			}, 50);
		} else {
			// Switch to preview mode to show bubbles
			activeView.setState(
				{ ...activeView.getState(), mode: "preview" },
				{ history: false }
			);
		}
	}

	private isOwner(speakerName: string): boolean {
		const normalizedName = speakerName.toLowerCase().trim();
		const ownerName = this.settings.ownerName.toLowerCase().trim();

		if (normalizedName === ownerName) {
			return true;
		}

		for (const alias of this.settings.ownerAliases) {
			if (normalizedName === alias.toLowerCase().trim()) {
				return true;
			}
		}

		return false;
	}

	private getSpeakerColor(speakerName: string): string {
		if (this.isOwner(speakerName)) {
			return "#007AFF"; // iOS blue for owner
		}

		const normalizedName = speakerName.toLowerCase().trim();

		if (!this.speakerColorMap.has(normalizedName)) {
			const color = SPEAKER_COLORS[this.colorIndex % SPEAKER_COLORS.length];
			this.speakerColorMap.set(normalizedName, color);
			this.colorIndex++;
		}

		return this.speakerColorMap.get(normalizedName) || SPEAKER_COLORS[0];
	}

	private processTranscription(
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		const filePath = ctx.sourcePath;

		// Only process if speech bubbles are enabled for this file
		if (!this.enabledFiles.has(filePath)) {
			return;
		}

		// Pattern to match [[Speaker Name]]: Message
		const pattern = /^\[\[([^\]]+)\]\]:\s*(.*)$/;

		// Process paragraphs
		const paragraphs = el.querySelectorAll("p");

		paragraphs.forEach((p) => {
			const text = p.textContent || "";
			const lines = text.split("\n");
			let hasTranscription = false;

			// Check if any line matches the pattern
			for (const line of lines) {
				if (pattern.test(line.trim())) {
					hasTranscription = true;
					break;
				}
			}

			if (!hasTranscription) {
				return;
			}

			// Create a container for the bubbles
			const container = document.createElement("div");
			container.className = "speech-bubbles-container";

			// Process each line
			for (const line of lines) {
				const trimmedLine = line.trim();
				const match = trimmedLine.match(pattern);

				if (match) {
					const speakerName = match[1];
					const message = match[2];

					const bubble = this.createBubble(speakerName, message);
					container.appendChild(bubble);
				} else if (trimmedLine) {
					// Non-matching lines are rendered as regular text
					const textEl = document.createElement("p");
					textEl.textContent = trimmedLine;
					textEl.className = "speech-bubbles-regular-text";
					container.appendChild(textEl);
				}
			}

			// Replace the original paragraph with the container
			p.replaceWith(container);
		});

		// Also process any internal links that might be rendered separately
		// This handles cases where Obsidian renders [[links]] as anchor elements
		this.processInternalLinks(el);
	}

	private processInternalLinks(el: HTMLElement) {
		// Find all text nodes and their parent elements that might contain our pattern
		const walker = document.createTreeWalker(
			el,
			NodeFilter.SHOW_TEXT,
			null
		);

		const nodesToProcess: { node: Text; parent: HTMLElement }[] = [];

		let node;
		while ((node = walker.nextNode())) {
			const textNode = node as Text;
			const parent = textNode.parentElement;

			if (
				parent &&
				!parent.closest(".speech-bubbles-container") &&
				!parent.closest(".speech-bubble")
			) {
				// Check if this might be part of a transcription line
				const text = textNode.textContent || "";
				if (text.includes(":") || text.startsWith("[[")) {
					nodesToProcess.push({ node: textNode, parent });
				}
			}
		}
	}

	private createBubble(speakerName: string, message: string): HTMLElement {
		const isOwner = this.isOwner(speakerName);
		const color = this.getSpeakerColor(speakerName);

		const wrapper = document.createElement("div");
		wrapper.className = `speech-bubble-wrapper ${isOwner ? "owner" : "other"}`;

		const bubble = document.createElement("div");
		bubble.className = `speech-bubble ${isOwner ? "owner" : "other"}`;

		if (isOwner) {
			bubble.style.backgroundColor = color;
			bubble.style.color = "white";
		} else {
			bubble.style.backgroundColor = color;
			bubble.style.color = "#000000";
		}

		// Add speaker name label for non-owner bubbles
		if (!isOwner) {
			const nameLabel = document.createElement("div");
			nameLabel.className = "speech-bubble-name";
			nameLabel.textContent = speakerName;
			nameLabel.style.color = this.darkenColor(color);
			wrapper.appendChild(nameLabel);
		}

		// Add message content
		const messageEl = document.createElement("div");
		messageEl.className = "speech-bubble-message";
		messageEl.textContent = message;
		bubble.appendChild(messageEl);

		wrapper.appendChild(bubble);

		return wrapper;
	}

	private darkenColor(hex: string): string {
		// Convert hex to RGB, darken, and convert back
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) {
			return "#666666";
		}

		const r = Math.max(0, parseInt(result[1], 16) - 60);
		const g = Math.max(0, parseInt(result[2], 16) - 60);
		const b = Math.max(0, parseInt(result[3], 16) - 60);

		return `rgb(${r}, ${g}, ${b})`;
	}
}

class SpeechBubblesSettingTab extends PluginSettingTab {
	plugin: SpeechBubblesPlugin;

	constructor(app: App, plugin: SpeechBubblesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Speech Bubbles Settings" });

		new Setting(containerEl)
			.setName("Your name")
			.setDesc(
				"The name used in transcriptions to identify you. Messages from this person will appear on the right side with blue bubbles."
			)
			.addText((text) =>
				text
					.setPlaceholder("me")
					.setValue(this.plugin.settings.ownerName)
					.onChange(async (value) => {
						this.plugin.settings.ownerName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Aliases")
			.setDesc(
				"Other names that should also be treated as you (comma-separated). For example: 'John, John Smith, JS'"
			)
			.addText((text) =>
				text
					.setPlaceholder("John, John Smith")
					.setValue(this.plugin.settings.ownerAliases.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.ownerAliases = value
							.split(",")
							.map((s) => s.trim())
							.filter((s) => s.length > 0);
						await this.plugin.saveSettings();
					})
			);

		containerEl.createEl("h3", { text: "Usage" });

		const usageDiv = containerEl.createEl("div", {
			cls: "speech-bubbles-usage",
		});

		usageDiv.createEl("p", {
			text: "To use speech bubbles in your transcription notes:",
		});

		const list = usageDiv.createEl("ol");
		list.createEl("li", {
			text: "Format your transcription with lines like: [[Speaker Name]]: Message text",
		});
		list.createEl("li", {
			text: "Click the message bubble icon in the ribbon or use the command palette to toggle speech bubbles view",
		});
		list.createEl("li", {
			text: "Switch to Reading view to see the bubbles",
		});

		usageDiv.createEl("p", { text: "Example:" });

		const codeBlock = usageDiv.createEl("pre");
		codeBlock.createEl("code", {
			text: "[[John Smith]]: Hello!\n[[me]]: Hi there!\n[[John Smith]]: How are you doing?",
		});
	}
}
