import { App, PluginSettingTab, Setting } from "obsidian";
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

	display(): void {
		const { containerEl } = this;
		const settings = this.callbacks.getSettings();

		containerEl.empty();

		new Setting(containerEl)
			.setName("Your name")
			.setDesc(
				"The name used in transcripts to identify you. Messages from this person will appear on the right side with blue bubbles."
			)
			.addText(text =>
				text
					.setPlaceholder("Me")
					.setValue(settings.ownerName)
					.onChange(async value => {
						await this.callbacks.saveSettings({ ownerName: value });
					})
			);

		new Setting(containerEl)
			.setName("Aliases")
			.setDesc("Other names that should also be treated as you, separated by commas")
			.addText(text =>
				text
					.setPlaceholder("Alias 1, alias 2")
					.setValue(settings.ownerAliases.join(", "))
					.onChange(async value => {
						const aliases = value
							.split(",")
							.map(s => s.trim())
							.filter(s => s.length > 0);
						await this.callbacks.saveSettings({ ownerAliases: aliases });
					})
			);

		new Setting(containerEl).setName("Appearance").setHeading();

		new Setting(containerEl)
			.setName("Maximum bubble width")
			.setDesc("Maximum width of speech bubbles as a percentage of the container width (10-100).")
			.addSlider(slider =>
				slider
					.setLimits(10, 100, 5)
					.setValue(settings.bubbleMaxWidth)
					.setDynamicTooltip()
					.onChange(async value => {
						await this.callbacks.saveSettings({ bubbleMaxWidth: value });
					})
			);

		new Setting(containerEl)
			.setName("Bubble corner radius")
			.setDesc("Corner radius of speech bubbles in pixels (0-30).")
			.addSlider(slider =>
				slider
					.setLimits(0, 30, 1)
					.setValue(settings.bubbleRadius)
					.setDynamicTooltip()
					.onChange(async value => {
						await this.callbacks.saveSettings({ bubbleRadius: value });
					})
			);

		new Setting(containerEl)
			.setName("Show speaker names")
			.setDesc("Display the speaker name above each bubble.")
			.addToggle(toggle =>
				toggle.setValue(settings.showSpeakerNames).onChange(async value => {
					await this.callbacks.saveSettings({ showSpeakerNames: value });
				})
			);

		new Setting(containerEl)
			.setName("Compact mode")
			.setDesc("Use smaller spacing and font sizes for a more compact layout.")
			.addToggle(toggle =>
				toggle.setValue(settings.compactMode).onChange(async value => {
					await this.callbacks.saveSettings({ compactMode: value });
				})
			);

		new Setting(containerEl)
			.setName("Your bubble color")
			.setDesc("Custom color for your speech bubbles (leave empty for default indigo).")
			.addText(text =>
				text
					.setPlaceholder("#6366f1")
					.setValue(settings.ownerBubbleColor ?? "")
					.onChange(async value => {
						const color = value.trim() || null;
						await this.callbacks.saveSettings({ ownerBubbleColor: color });
					})
			);

		new Setting(containerEl).setName("Debug").setHeading();

		new Setting(containerEl)
			.setName("Enable debug logging")
			.setDesc("Log toggle and render details to the developer console for troubleshooting.")
			.addToggle(toggle =>
				toggle.setValue(settings.debugLogging).onChange(async value => {
					await this.callbacks.saveSettings({ debugLogging: value });
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
		codeBlock.createEl("code", {
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- code example with proper nouns
			text: "[[John Smith]]: Hello!\n[[me]]: Hi there!\n[[John Smith]]: How are you doing?",
		});

		usageDiv.createEl("p", { text: "Advanced features:" });

		/* eslint-disable obsidianmd/ui/sentence-case -- example text with proper nouns */
		const advancedList = usageDiv.createEl("ul");
		advancedList.createEl("li", {
			text: "Timestamps: [[John]] [14:32]: Hello!",
		});
		advancedList.createEl("li", {
			text: "Date separators: --- 2024-01-15 ---",
		});
		advancedList.createEl("li", {
			text: "Per-speaker colors and icons via frontmatter (see README)",
		});
		/* eslint-enable obsidianmd/ui/sentence-case */
	}
}
