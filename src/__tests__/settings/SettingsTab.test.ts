jest.mock(
	"obsidian",
	() => {
		class PluginSettingTab {
			app: unknown;
			containerEl: HTMLDivElement;

			constructor(app: unknown, _plugin: unknown) {
				this.app = app;
				this.containerEl = document.createElement("div");
			}
		}

		return { PluginSettingTab };
	},
	{ virtual: true }
);

import { SpeechBubblesSettingTab, SettingsTabCallbacks } from "../../settings/SettingsTab";
import { DEFAULT_SETTINGS, SpeechBubblesSettings } from "../../types";

interface DefinitionLike {
	name?: string;
	control?: { key: string; type: string; min?: number; max?: number; step?: number };
	render?: (setting: unknown) => void;
	items?: DefinitionLike[];
}

function createTab(overrides: Partial<SpeechBubblesSettings> = {}) {
	let settings: SpeechBubblesSettings = { ...DEFAULT_SETTINGS, ...overrides };
	const saveSettings = jest.fn((partial: Partial<SpeechBubblesSettings>): Promise<void> => {
		settings = { ...settings, ...partial };
		return Promise.resolve();
	});
	const callbacks: SettingsTabCallbacks = {
		getSettings: () => settings,
		saveSettings,
	};
	const tab = new SpeechBubblesSettingTab({} as never, callbacks, { manifest: { id: "speech-bubbles" } });
	return { tab, saveSettings, getSettings: () => settings };
}

function findControl(tab: SpeechBubblesSettingTab, key: string): DefinitionLike {
	function search(items: DefinitionLike[]): DefinitionLike | undefined {
		for (const item of items) {
			if (item.control?.key === key) return item;
			if (item.items) {
				const found = search(item.items);
				if (found) return found;
			}
		}
		return undefined;
	}

	const found = search(tab.getSettingDefinitions() as DefinitionLike[]);
	if (!found) throw new Error(`No definition found for key "${key}"`);
	return found;
}

function findUsageRender(tab: SpeechBubblesSettingTab): (setting: unknown) => void {
	const definitions = tab.getSettingDefinitions() as DefinitionLike[];
	const usageGroup = definitions.find(item => (item as { heading?: string }).heading === "Usage");
	const render = usageGroup?.items?.[0]?.render;
	if (!render) throw new Error("No Usage render definition found");
	return render;
}

describe("SpeechBubblesSettingTab", () => {
	test("declares controls for the plain settings fields", () => {
		const { tab } = createTab();

		expect(findControl(tab, "ownerName").control).toMatchObject({ type: "text", key: "ownerName" });
		expect(findControl(tab, "ownerAliases").control).toMatchObject({ type: "text", key: "ownerAliases" });
		expect(findControl(tab, "bubbleMaxWidth").control).toMatchObject({
			type: "slider",
			key: "bubbleMaxWidth",
			min: 10,
			max: 100,
			step: 5,
		});
		expect(findControl(tab, "bubbleRadius").control).toMatchObject({
			type: "slider",
			key: "bubbleRadius",
			min: 0,
			max: 30,
			step: 1,
		});
		expect(findControl(tab, "showSpeakerNames").control).toMatchObject({ type: "toggle", key: "showSpeakerNames" });
		expect(findControl(tab, "compactMode").control).toMatchObject({ type: "toggle", key: "compactMode" });
		expect(findControl(tab, "ownerBubbleColor").control).toMatchObject({ type: "text", key: "ownerBubbleColor" });
		expect(findControl(tab, "debugLogging").control).toMatchObject({ type: "toggle", key: "debugLogging" });
	});

	test("reads aliases as a comma-joined string and writes them back as a trimmed array", async () => {
		const { tab, getSettings } = createTab({ ownerAliases: ["Bob", "Bobby"] });

		expect(tab.getControlValue("ownerAliases")).toBe("Bob, Bobby");

		await tab.setControlValue("ownerAliases", "Alice,  Al ,, ");

		expect(getSettings().ownerAliases).toEqual(["Alice", "Al"]);
	});

	test("treats a blank bubble color as null and a non-blank one as the trimmed value", async () => {
		const { tab, getSettings } = createTab({ ownerBubbleColor: null });

		expect(tab.getControlValue("ownerBubbleColor")).toBe("");

		await tab.setControlValue("ownerBubbleColor", "  #123456  ");
		expect(getSettings().ownerBubbleColor).toBe("#123456");

		await tab.setControlValue("ownerBubbleColor", "   ");
		expect(getSettings().ownerBubbleColor).toBeNull();
	});

	test("persists slider and toggle values with the correct type", async () => {
		const { tab, getSettings } = createTab();

		await tab.setControlValue("bubbleMaxWidth", 50);
		await tab.setControlValue("bubbleRadius", 12);
		await tab.setControlValue("showSpeakerNames", false);
		await tab.setControlValue("compactMode", true);
		await tab.setControlValue("debugLogging", true);

		expect(getSettings()).toMatchObject({
			bubbleMaxWidth: 50,
			bubbleRadius: 12,
			showSpeakerNames: false,
			compactMode: true,
			debugLogging: true,
		});
	});

	test("calls saveSettings when a control value changes", async () => {
		const { tab, saveSettings } = createTab();

		await tab.setControlValue("ownerName", "Alice");

		expect(saveSettings).toHaveBeenCalledWith({ ownerName: "Alice" });
	});

	test("throws for an unknown setting key", async () => {
		const { tab } = createTab();

		await expect(tab.setControlValue("nonexistent", "value")).rejects.toThrow(/Unknown setting key/);
	});

	test("renders usage instructions into the setting's info element", () => {
		const { tab } = createTab();
		const render = findUsageRender(tab);

		const infoEl = document.createElement("div");
		render({ infoEl });

		expect(infoEl.querySelector(".speech-bubbles-usage")).not.toBeNull();
		expect(infoEl.querySelector("pre code")?.textContent).toContain("[[John Smith]]: Hello!");
	});
});
