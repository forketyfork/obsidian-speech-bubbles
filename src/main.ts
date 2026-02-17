import {
	App,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
	normalizePath,
	parseFrontMatterTags,
	TFile,
} from "obsidian";
import { darkenColor, isOwner, SPEAKER_COLORS, OWNER_COLOR, SpeakerColor } from "./colorUtils";

interface SpeechBubblesSettings {
	ownerName: string;
	ownerAliases: string[];
	debugLogging: boolean;
}

const TRANSCRIPT_TAG = "transcript";

const DEFAULT_SETTINGS: SpeechBubblesSettings = {
	ownerName: "me",
	ownerAliases: [],
	debugLogging: false,
};

export default class SpeechBubblesPlugin extends Plugin {
	settings: SpeechBubblesSettings;
	private speakerColorMap: Map<string, SpeakerColor> = new Map();
	private colorIndex = 0;

	async onload() {
		await this.loadSettings();

		// Register the markdown post processor
		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.processTranscription(el, ctx);
		});

		// Add settings tab
		this.addSettingTab(new SpeechBubblesSettingTab(this.app, this));
	}

	onunload() {
		this.speakerColorMap.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as SpeechBubblesSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.refreshTranscriptViews();
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
		const filePath = normalizePath(ctx.sourcePath);

		if (!this.isSpeechBubblesEnabled(filePath)) {
			this.logDebug("Skipping transcript render (not tagged)", { filePath });
			return;
		}

		if (el.querySelector(".speech-bubbles-container")) {
			return;
		}

		const childBlocks = Array.from(el.children).filter((node): node is HTMLElement => node instanceof HTMLElement);
		const blocks = el.tagName === "P" ? [el] : childBlocks;
		if (blocks.length === 0) {
			this.logDebug("Skipping transcript render (empty section)", { filePath });
			return;
		}

		let hasTranscription = false;
		const container = document.createElement("div");
		container.className = "speech-bubbles-container";
		let regularLines: Node[][] = [];

		const flushRegularLines = () => {
			if (regularLines.length === 0) {
				return;
			}

			const textEl = document.createElement("div");
			textEl.className = "speech-bubbles-regular-text";
			for (let i = 0; i < regularLines.length; i++) {
				if (i > 0) {
					textEl.appendChild(document.createElement("br"));
				}
				for (const node of regularLines[i]) {
					textEl.appendChild(node);
				}
			}
			container.appendChild(textEl);
			regularLines = [];
		};

		for (const block of blocks) {
			if (block.tagName === "P") {
				const lineNodes = this.splitNodesByLineBreaks(Array.from(block.childNodes));
				for (const line of lineNodes) {
					const transcription = this.extractTranscriptionFromNodes(line);
					if (!transcription) {
						regularLines.push(line);
						continue;
					}

					hasTranscription = true;
					flushRegularLines();

					const bubble = this.createBubbleFromNodes(transcription.speakerName, transcription.messageNodes);
					container.appendChild(bubble);
				}
				continue;
			}

			const transcription = this.extractTranscriptionFromNodes(Array.from(block.childNodes));
			if (!transcription) {
				flushRegularLines();
				container.appendChild(block);
				continue;
			}

			hasTranscription = true;
			flushRegularLines();

			const bubble = this.createBubbleFromNodes(transcription.speakerName, transcription.messageNodes);
			container.appendChild(bubble);
		}

		flushRegularLines();

		if (!hasTranscription) {
			this.logDebug("Skipping transcript render (no transcript lines)", { filePath });
			return;
		}

		this.logDebug("Rendering transcript bubbles", { filePath });

		if (el.tagName === "P") {
			el.replaceWith(container);
		} else {
			el.empty();
			el.appendChild(container);
		}
	}

	private createBubbleFromNodes(speakerName: string, messageNodes: Node[]): HTMLElement {
		const isOwnerBubble = this.checkIsOwner(speakerName);
		const color = this.getSpeakerColor(speakerName);

		const wrapper = document.createElement("div");
		wrapper.className = `speech-bubbles-wrapper ${isOwnerBubble ? "speech-bubbles-owner" : "speech-bubbles-other"}`;

		const bubble = document.createElement("div");
		bubble.className = `speech-bubbles-bubble ${isOwnerBubble ? "speech-bubbles-owner" : "speech-bubbles-other"}`;
		bubble.style.setProperty("--speech-bubbles-color-start", color.start);
		bubble.style.setProperty("--speech-bubbles-color-end", color.end);
		bubble.style.setProperty(
			"--speech-bubbles-name-color",
			isOwnerBubble ? "rgba(255, 255, 255, 0.9)" : darkenColor(color.end)
		);

		const nameLabel = document.createElement("div");
		nameLabel.className = "speech-bubbles-name";
		nameLabel.textContent = speakerName;
		bubble.appendChild(nameLabel);

		const messageEl = document.createElement("div");
		messageEl.className = "speech-bubbles-message";
		for (const node of messageNodes) {
			messageEl.appendChild(node);
		}
		bubble.appendChild(messageEl);

		wrapper.appendChild(bubble);

		return wrapper;
	}

	private extractTranscriptionFromNodes(nodes: Node[]): { speakerName: string; messageNodes: Node[] } | null {
		let index = 0;

		while (index < nodes.length && this.isWhitespaceNode(nodes[index])) {
			index++;
		}

		if (index >= nodes.length) {
			return null;
		}

		const firstNode = nodes[index];
		if (!this.isInternalLinkNode(firstNode)) {
			return null;
		}

		const speakerName = firstNode.textContent?.trim() ?? "";
		if (!speakerName) {
			return null;
		}

		let colonFound = false;
		const messageNodes: Node[] = [];

		for (let i = index + 1; i < nodes.length; i++) {
			const node = nodes[i];

			if (!colonFound) {
				if (node.nodeType !== Node.TEXT_NODE) {
					return null;
				}

				const text = node.textContent ?? "";
				const colonIndex = text.indexOf(":");
				if (colonIndex === -1) {
					if (text.trim().length === 0) {
						continue;
					}
					return null;
				}

				colonFound = true;
				const afterColon = text.slice(colonIndex + 1).replace(/^\s+/, "");
				if (afterColon.length > 0) {
					messageNodes.push(document.createTextNode(afterColon));
				}
				continue;
			}

			messageNodes.push(node);
		}

		if (!colonFound) {
			return null;
		}

		return { speakerName, messageNodes };
	}

	private splitNodesByLineBreaks(nodes: Node[]): Node[][] {
		const lines: Node[][] = [];
		let current: Node[] = [];

		const pushLine = () => {
			if (current.length > 0) {
				lines.push(current);
			}
			current = [];
		};

		for (const node of nodes) {
			if (node instanceof HTMLBRElement) {
				pushLine();
				continue;
			}

			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent ?? "";
				if (text.includes("\n")) {
					const parts = text.split("\n");
					for (let i = 0; i < parts.length; i++) {
						if (parts[i].length > 0) {
							current.push(document.createTextNode(parts[i]));
						}
						if (i < parts.length - 1) {
							pushLine();
						}
					}
					continue;
				}
			}

			current.push(node);
		}

		if (current.length > 0) {
			lines.push(current);
		}

		return lines;
	}

	private isInternalLinkNode(node: Node): node is HTMLElement {
		return node instanceof HTMLElement && node.classList.contains("internal-link");
	}

	private isWhitespaceNode(node: Node): boolean {
		return node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length === 0;
	}

	private isSpeechBubblesEnabled(filePath: string): boolean {
		return this.isEnabledByFrontmatter(filePath);
	}

	private isEnabledByFrontmatter(filePath: string): boolean {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			return false;
		}

		const cache = this.app.metadataCache.getFileCache(file);
		const tags = parseFrontMatterTags(cache?.frontmatter);
		if (!tags || tags.length === 0) {
			return false;
		}

		return tags.some(tag => this.normalizeTag(tag) === TRANSCRIPT_TAG);
	}

	private normalizeTag(tag: string): string {
		return tag.replace(/^#/, "").trim().toLowerCase();
	}

	private refreshTranscriptViews() {
		this.app.workspace.iterateAllLeaves(leaf => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView) || !view.file) {
				return;
			}

			const filePath = normalizePath(view.file.path);
			if (!this.isSpeechBubblesEnabled(filePath)) {
				return;
			}

			this.rerenderView(view);
		});
	}

	private rerenderView(view: MarkdownView) {
		const currentMode = view.currentMode as unknown as { rerender?: (full?: boolean) => void };
		if (typeof currentMode.rerender === "function") {
			currentMode.rerender(true);
			return;
		}

		view.previewMode?.rerender(true);
	}

	private logDebug(message: string, details?: Record<string, unknown>) {
		if (!this.settings.debugLogging) {
			return;
		}

		if (details) {
			console.error(`[Speech Bubbles] ${message}`, details);
		} else {
			console.error(`[Speech Bubbles] ${message}`);
		}
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

		new Setting(containerEl).setName("Speech bubbles settings").setHeading();

		new Setting(containerEl)
			.setName("Your name")
			.setDesc(
				"The name used in transcripts to identify you. Messages from this person will appear on the right side with blue bubbles."
			)
			.addText(text =>
				text
					// eslint-disable-next-line obsidianmd/ui/sentence-case -- literal example value, not a UI label
					.setPlaceholder("me")
					.setValue(this.plugin.settings.ownerName)
					.onChange(async value => {
						this.plugin.settings.ownerName = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Aliases")
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- contains proper name examples
			.setDesc("Other names that should also be treated as you (comma-separated), e.g. 'John, John Smith, JS'")
			.addText(text =>
				text
					// eslint-disable-next-line obsidianmd/ui/sentence-case -- proper name examples
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

		new Setting(containerEl)
			.setName("Enable debug logging")
			.setDesc("Log toggle and render details to the developer console for troubleshooting.")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.debugLogging).onChange(async value => {
					this.plugin.settings.debugLogging = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setName("Usage").setHeading();

		const usageDiv = containerEl.createEl("div", {
			cls: "speech-bubbles-usage",
		});

		usageDiv.createEl("p", {
			text: "To use speech bubbles in your transcript notes:",
		});

		const list = usageDiv.createEl("ol");
		list.createEl("li", {
			text: "Format your transcript with lines like: [[speaker name]]: message text",
		});
		list.createEl("li", {
			text: "Add the transcript tag to the note frontmatter to enable speech bubbles",
		});
		list.createEl("li", {
			text: "Switch to reading view to see the bubbles",
		});

		usageDiv.createEl("p", { text: "Example:" });

		const codeBlock = usageDiv.createEl("pre");
		const codeEl = codeBlock.createEl("code");
		// eslint-disable-next-line obsidianmd/ui/sentence-case -- code example, not a UI label
		codeEl.textContent = "[[John Smith]]: Hello!\n[[me]]: Hi there!\n[[John Smith]]: How are you doing?";
	}
}
