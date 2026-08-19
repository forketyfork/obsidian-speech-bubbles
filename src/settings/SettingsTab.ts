import { App, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import { SpeechBubblesSettings } from "../types";

export interface SettingsTabCallbacks {
	getSettings(): SpeechBubblesSettings;
	saveSettings(settings: Partial<SpeechBubblesSettings>): Promise<void>;
}

export class SpeechBubblesSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private callbacks: SettingsTabCallbacks,
		plugin: { manifest: { id: string } }
	) {
		super(app, plugin as never);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: "Your name",
				desc: "The name used in transcripts to identify you. Messages from this person will appear on the right side with blue bubbles.",
				control: {
					type: "text",
					key: "ownerName",
					placeholder: "Me",
				},
			},
			{
				name: "Aliases",
				desc: "Other names that should also be treated as you, separated by commas",
				control: {
					type: "text",
					key: "ownerAliases",
					placeholder: "Alias 1, alias 2",
				},
			},
			{
				type: "group",
				heading: "Appearance",
				items: [
					{
						name: "Maximum bubble width",
						desc: "Maximum width of speech bubbles as a percentage of the container width (10-100).",
						control: {
							type: "slider",
							key: "bubbleMaxWidth",
							min: 10,
							max: 100,
							step: 5,
						},
					},
					{
						name: "Bubble corner radius",
						desc: "Corner radius of speech bubbles in pixels (0-30).",
						control: {
							type: "slider",
							key: "bubbleRadius",
							min: 0,
							max: 30,
							step: 1,
						},
					},
					{
						name: "Show speaker names",
						desc: "Display the speaker name above each bubble.",
						control: {
							type: "toggle",
							key: "showSpeakerNames",
						},
					},
					{
						name: "Compact mode",
						desc: "Use smaller spacing and font sizes for a more compact layout.",
						control: {
							type: "toggle",
							key: "compactMode",
						},
					},
					{
						name: "Your bubble color",
						desc: "Custom color for your speech bubbles (leave empty for default indigo).",
						control: {
							type: "text",
							key: "ownerBubbleColor",
							placeholder: "#6366f1",
						},
					},
				],
			},
			{
				type: "group",
				heading: "Debug",
				items: [
					{
						name: "Enable debug logging",
						desc: "Log toggle and render details to the developer console for troubleshooting.",
						control: {
							type: "toggle",
							key: "debugLogging",
						},
					},
				],
			},
			{
				type: "group",
				heading: "Usage",
				items: [
					{
						name: "",
						render: (setting: Setting) => {
							setting.infoEl.empty();

							const usageDiv = setting.infoEl.createDiv({
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
							const exampleLines = [
								"[[John Smith]]: Hello!",
								"[[me]]: Hi there!",
								"[[John Smith]]: How are you doing?",
							];
							codeEl.textContent = exampleLines.join("\n");

							usageDiv.createEl("p", { text: "Advanced features:" });

							const advancedItems = [
								"Timestamps: [[John]] [14:32]: Hello!",
								"Date separators: --- 2024-01-15 ---",
								"Per-speaker colors, sizes, and icons via frontmatter (see README)",
							];
							const advancedList = usageDiv.createEl("ul");
							for (const item of advancedItems) {
								advancedList.createEl("li", { text: item });
							}
						},
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		const settings = this.callbacks.getSettings();

		switch (key) {
			case "ownerAliases":
				return settings.ownerAliases.join(", ");
			case "ownerBubbleColor":
				return settings.ownerBubbleColor ?? "";
			default:
				return settings[key as keyof SpeechBubblesSettings];
		}
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case "ownerAliases": {
				const aliases = String(value)
					.split(",")
					.map(s => s.trim())
					.filter(s => s.length > 0);
				return this.callbacks.saveSettings({ ownerAliases: aliases });
			}
			case "ownerBubbleColor": {
				const color = String(value).trim() || null;
				return this.callbacks.saveSettings({ ownerBubbleColor: color });
			}
			case "ownerName":
				return this.callbacks.saveSettings({ ownerName: String(value) });
			case "bubbleMaxWidth":
				return this.callbacks.saveSettings({ bubbleMaxWidth: Number(value) });
			case "bubbleRadius":
				return this.callbacks.saveSettings({ bubbleRadius: Number(value) });
			case "showSpeakerNames":
				return this.callbacks.saveSettings({ showSpeakerNames: Boolean(value) });
			case "compactMode":
				return this.callbacks.saveSettings({ compactMode: Boolean(value) });
			case "debugLogging":
				return this.callbacks.saveSettings({ debugLogging: Boolean(value) });
			default:
				throw new Error(`Unknown setting key: ${key}`);
		}
	}
}
