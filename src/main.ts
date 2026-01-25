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
import { darkenColor, isOwner, SPEAKER_COLORS, OWNER_COLOR } from "./colorUtils";

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
	private speakerColorMap: Map<string, string> = new Map();
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
				this.viewActionButtons.set(view, button);
				this.updateButtonState(view);
			}
		});
	}

	private updateButtonState(view: MarkdownView) {
		const button = this.viewActionButtons.get(view);
		if (!button || !view.file) return;

		const isEnabled = this.enabledFiles.has(view.file.path);
		button.toggleClass("is-active", isEnabled);
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

		// Force re-render by switching mode
		const currentMode = activeView.getMode();
		if (currentMode === "preview") {
			// Re-render by toggling
			void activeView.setState({ ...activeView.getState(), mode: "source" }, { history: false });
			setTimeout(() => {
				void activeView.setState({ ...activeView.getState(), mode: "preview" }, { history: false });
			}, 50);
		} else {
			// Switch to preview mode to show bubbles
			void activeView.setState({ ...activeView.getState(), mode: "preview" }, { history: false });
		}
	}

	private checkIsOwner(speakerName: string): boolean {
		return isOwner(speakerName, this.settings.ownerName, this.settings.ownerAliases);
	}

	private getSpeakerColor(speakerName: string): string {
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

		const lines = sectionInfo.text.split("\n").slice(sectionInfo.lineStart, sectionInfo.lineEnd + 1);

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

		for (const line of lines) {
			const trimmedLine = line.trim();
			const match = trimmedLine.match(pattern);

			if (match) {
				const speakerName = match[1];
				const message = match[2];

				const bubble = this.createBubble(speakerName, message, filePath);
				container.appendChild(bubble);
			} else if (trimmedLine) {
				const textEl = document.createElement("p");
				textEl.className = "speech-bubbles-regular-text";
				void MarkdownRenderer.render(this.app, trimmedLine, textEl, filePath, this.renderComponent);
				container.appendChild(textEl);
			}
		}

		el.empty();
		el.appendChild(container);
	}

	private createBubble(speakerName: string, message: string, sourcePath: string): HTMLElement {
		const isOwner = this.checkIsOwner(speakerName);
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

		const nameLabel = document.createElement("div");
		nameLabel.className = "speech-bubble-name";
		nameLabel.textContent = speakerName;
		nameLabel.style.color = isOwner ? "rgba(255, 255, 255, 0.85)" : darkenColor(color);
		bubble.appendChild(nameLabel);

		const messageEl = document.createElement("div");
		messageEl.className = "speech-bubble-message";
		void MarkdownRenderer.render(this.app, message, messageEl, sourcePath, this.renderComponent);
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
