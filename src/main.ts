import {
	MarkdownView,
	Plugin,
	MarkdownPostProcessorContext,
	normalizePath,
	parseFrontMatterTags,
	TFile,
} from "obsidian";
import { SpeechBubblesSettings, DEFAULT_SETTINGS } from "./types";
import { resolveConfig } from "./config/ConfigResolver";
import { SpeakerResolver } from "./config/SpeakerResolver";
import { BubbleRenderer } from "./renderer/BubbleRenderer";
import { createDateSeparator } from "./renderer/DateSeparatorRenderer";
import { parseTranscriptLine, splitNodesByLineBreaks } from "./parser/TranscriptParser";
import { SpeechBubblesSettingTab } from "./settings/SettingsTab";

const TRANSCRIPT_TAG = "transcript";

export default class SpeechBubblesPlugin extends Plugin {
	settings: SpeechBubblesSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.processTranscription(el, ctx);
		});

		this.addSettingTab(
			new SpeechBubblesSettingTab(
				this.app,
				{
					getSettings: () => this.settings,
					saveSettings: async (partial: Partial<SpeechBubblesSettings>) => {
						this.settings = { ...this.settings, ...partial };
						await this.saveData(this.settings);
						this.refreshTranscriptViews();
					},
				},
				this
			)
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as SpeechBubblesSettings);
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

		const frontmatter = this.getFileFrontmatter(filePath);
		const config = resolveConfig(this.settings, frontmatter);
		const resolver = new SpeakerResolver(config);
		const bubbleRenderer = new BubbleRenderer(resolver, this.settings);

		let hasTranscription = false;
		const container = document.createElement("div");
		container.className = "speech-bubbles-container";

		if (this.settings.compactMode) {
			container.classList.add("speech-bubbles-compact");
		}

		container.style.setProperty("--speech-bubbles-max-width", `${this.settings.bubbleMaxWidth}%`);
		container.style.setProperty("--speech-bubbles-bubble-radius", `${this.settings.bubbleRadius}px`);

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
				const lineNodes = splitNodesByLineBreaks(Array.from(block.childNodes));
				for (const line of lineNodes) {
					const parsed = parseTranscriptLine(line);

					if (parsed.type === "regular-text") {
						regularLines.push(parsed.nodes);
						continue;
					}

					hasTranscription = true;
					flushRegularLines();

					if (parsed.type === "date-separator") {
						container.appendChild(createDateSeparator(parsed));
					} else if (parsed.type === "bubble") {
						container.appendChild(bubbleRenderer.createBubble(parsed));
					}
				}
				continue;
			}

			const parsed = parseTranscriptLine(Array.from(block.childNodes));
			if (parsed.type === "regular-text") {
				flushRegularLines();
				container.appendChild(block);
				continue;
			}

			hasTranscription = true;
			flushRegularLines();

			if (parsed.type === "date-separator") {
				container.appendChild(createDateSeparator(parsed));
			} else if (parsed.type === "bubble") {
				container.appendChild(bubbleRenderer.createBubble(parsed));
			}
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

	private isSpeechBubblesEnabled(filePath: string): boolean {
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

	private getFileFrontmatter(filePath: string): unknown {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			return null;
		}

		const cache = this.app.metadataCache.getFileCache(file);
		return cache?.frontmatter ?? null;
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
