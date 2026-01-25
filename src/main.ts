import {
	App,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
	MarkdownRenderer,
	Component,
} from "obsidian";
import { darkenColor, isOwner, SPEAKER_COLORS, OWNER_COLOR, SpeakerColor } from "./colorUtils";

interface SpeechBubblesSettings {
	ownerName: string;
	ownerAliases: string[];
}

const DEFAULT_SETTINGS: SpeechBubblesSettings = {
	ownerName: "me",
	ownerAliases: [],
};

export default class SpeechBubblesPlugin extends Plugin {
	settings: SpeechBubblesSettings;
	private speakerColorMap: Map<string, SpeakerColor> = new Map();
	private colorIndex = 0;
	private enabledFiles: Set<string> = new Set();
	private renderComponent: Component;
	private viewActionButtons: WeakMap<MarkdownView, HTMLElement> = new WeakMap();

	async onload() {
		await this.loadSettings();

		this.renderComponent = new Component();
		this.renderComponent.load();

		// Add command to toggle speech bubbles
		this.addCommand({
			id: "toggle-speech-bubbles",
			name: "Toggle Speech Bubbles View",
			callback: () => {
				this.toggleSpeechBubbles();
			},
		});

		// Register the markdown post processor
		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.processTranscription(el, ctx);
		});

		// Add view action buttons to existing and new markdown views
		this.app.workspace.onLayoutReady(() => {
			this.addViewActionButtons();
		});
		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.addViewActionButtons();
			})
		);

		// Add settings tab
		this.addSettingTab(new SpeechBubblesSettingTab(this.app, this));
	}

	onunload() {
		this.enabledFiles.clear();
		this.speakerColorMap.clear();
		this.renderComponent.unload();
	}

	private addViewActionButtons() {
		this.app.workspace.iterateAllLeaves(leaf => {
			const view = leaf.view;
			if (view instanceof MarkdownView && !this.viewActionButtons.has(view)) {
				const button = view.addAction("message-circle", "Toggle speech bubbles", () => {
					this.toggleSpeechBubbles(view);
				});
				button.addClass("speech-bubbles-toggle");
				this.viewActionButtons.set(view, button);
				this.updateButtonState(view);
			}
		});
	}

	private updateButtonState(view: MarkdownView) {
		const button = this.viewActionButtons.get(view);
		if (!button || !view.file) return;

		const isEnabled = this.enabledFiles.has(view.file.path);
		button.toggleClass("speech-bubbles-active", isEnabled);
	}

	private updateAllButtonStates() {
		this.app.workspace.iterateAllLeaves(leaf => {
			if (leaf.view instanceof MarkdownView) {
				this.updateButtonState(leaf.view);
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as SpeechBubblesSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private toggleSpeechBubbles(view?: MarkdownView) {
		const activeView = view ?? this.app.workspace.getActiveViewOfType(MarkdownView);
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

		// Update button states
		this.updateAllButtonStates();

		// Force re-render using preview mode's rerender method
		const previewMode = (activeView as unknown as { previewMode?: { rerender: (full: boolean) => void } }).previewMode;
		if (previewMode) {
			previewMode.rerender(true);
		}
	}

	private checkIsOwner(speakerName: string): boolean {
		return isOwner(speakerName, this.settings.ownerName, this.settings.ownerAliases);
	}

	private getSpeakerColor(speakerName: string): SpeakerColor {
		if (this.checkIsOwner(speakerName)) {
			return OWNER_COLOR;
		}

		const normalizedName = speakerName.toLowerCase().trim();

		if (!this.speakerColorMap.has(normalizedName)) {
			const color = SPEAKER_COLORS[this.colorIndex % SPEAKER_COLORS.length];
			this.speakerColorMap.set(normalizedName, color);
			this.colorIndex++;
		}

		return this.speakerColorMap.get(normalizedName) ?? SPEAKER_COLORS[0];
	}

	private processTranscription(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		const filePath = ctx.sourcePath;

		if (!this.enabledFiles.has(filePath)) {
			return;
		}

		const sectionInfo = ctx.getSectionInfo(el);
		if (!sectionInfo) {
			return;
		}

		const allLines = sectionInfo.text.split("\n");
		const lines = allLines.slice(sectionInfo.lineStart, sectionInfo.lineEnd + 1);

		if (lines.length === 0) {
			return;
		}

		const pattern = /^\[\[([^\]]+)\]\]:\s*(.*)$/;

		let hasTranscription = false;
		for (const line of lines) {
			if (pattern.test(line.trim())) {
				hasTranscription = true;
				break;
			}
		}

		if (!hasTranscription) {
			return;
		}

		const container = document.createElement("div");
		container.className = "speech-bubbles-container";

		let nonTranscriptionLines: string[] = [];

		const flushNonTranscriptionLines = () => {
			if (nonTranscriptionLines.length === 0) return;

			const content = nonTranscriptionLines.join("\n");
			if (content.trim()) {
				const textEl = document.createElement("div");
				textEl.className = "speech-bubbles-regular-text";
				try {
					void MarkdownRenderer.render(this.app, content, textEl, filePath, this.renderComponent);
				} catch {
					textEl.textContent = content;
				}
				container.appendChild(textEl);
			}
			nonTranscriptionLines = [];
		};

		for (const line of lines) {
			const match = line.trim().match(pattern);

			if (match) {
				flushNonTranscriptionLines();

				const speakerName = match[1];
				const message = match[2];

				const bubble = this.createBubble(speakerName, message, filePath);
				container.appendChild(bubble);
			} else {
				nonTranscriptionLines.push(line);
			}
		}

		flushNonTranscriptionLines();

		el.empty();
		el.appendChild(container);
	}

	private createBubble(speakerName: string, message: string, sourcePath: string): HTMLElement {
		const isOwnerBubble = this.checkIsOwner(speakerName);
		const color = this.getSpeakerColor(speakerName);

		const wrapper = document.createElement("div");
		wrapper.className = `speech-bubbles-wrapper ${isOwnerBubble ? "speech-bubbles-owner" : "speech-bubbles-other"}`;

		const bubble = document.createElement("div");
		bubble.className = `speech-bubbles-bubble ${isOwnerBubble ? "speech-bubbles-owner" : "speech-bubbles-other"}`;

		const gradientDirection = isOwnerBubble ? "135deg" : "135deg";
		bubble.style.background = `linear-gradient(${gradientDirection}, ${color.start}, ${color.end})`;
		bubble.style.color = isOwnerBubble ? "white" : "#1F2937";

		const nameLabel = document.createElement("div");
		nameLabel.className = "speech-bubbles-name";
		nameLabel.textContent = speakerName;
		nameLabel.style.color = isOwnerBubble ? "rgba(255, 255, 255, 0.9)" : darkenColor(color.end);
		bubble.appendChild(nameLabel);

		const messageEl = document.createElement("div");
		messageEl.className = "speech-bubbles-message";
		try {
			void MarkdownRenderer.render(this.app, message, messageEl, sourcePath, this.renderComponent);
		} catch {
			messageEl.textContent = message;
		}
		bubble.appendChild(messageEl);

		wrapper.appendChild(bubble);

		return wrapper;
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
			.addText(text =>
				text
					.setPlaceholder("me")
					.setValue(this.plugin.settings.ownerName)
					.onChange(async value => {
						this.plugin.settings.ownerName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Aliases")
			.setDesc("Other names that should also be treated as you (comma-separated). For example: 'John, John Smith, JS'")
			.addText(text =>
				text
					.setPlaceholder("John, John Smith")
					.setValue(this.plugin.settings.ownerAliases.join(", "))
					.onChange(async value => {
						this.plugin.settings.ownerAliases = value
							.split(",")
							.map(s => s.trim())
							.filter(s => s.length > 0);
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
			text: "Click the message bubble icon in the view header (top right) or use the command palette to toggle speech bubbles view",
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
