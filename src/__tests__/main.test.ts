jest.mock(
	"obsidian",
	() => {
		class Plugin {
			app: unknown;
			manifest: unknown;

			constructor(app: unknown, manifest: unknown) {
				this.app = app;
				this.manifest = manifest;
			}

			registerMarkdownPostProcessor(_processor: unknown): void {}

			registerEvent(_eventRef: unknown): void {}

			addSettingTab(_settingTab: unknown): void {}

			loadData(): Promise<null> {
				return Promise.resolve(null);
			}

			saveData(_data: unknown): Promise<void> {
				return Promise.resolve();
			}
		}

		class MarkdownView {
			file?: unknown;
			currentMode?: unknown;
			previewMode?: unknown;
		}

		class TFile {
			path: string;

			constructor(path = "") {
				this.path = path;
			}
		}

		class PluginSettingTab {
			containerEl: HTMLDivElement;

			constructor(_app: unknown, _plugin: unknown) {
				this.containerEl = document.createElement("div");
			}
		}

		class Setting {
			constructor(_containerEl: HTMLElement) {}

			setName(_name: string): this {
				return this;
			}

			setDesc(_description: string): this {
				return this;
			}

			setHeading(): this {
				return this;
			}

			addText(_callback: unknown): this {
				return this;
			}

			addSlider(_callback: unknown): this {
				return this;
			}

			addToggle(_callback: unknown): this {
				return this;
			}
		}

		function normalizePath(path: string): string {
			return path;
		}

		function parseFrontMatterTags(frontmatter: unknown): string[] {
			if (!frontmatter || typeof frontmatter !== "object") {
				return [];
			}

			const { tags } = frontmatter as { tags?: unknown };
			if (Array.isArray(tags)) {
				return tags.filter((tag): tag is string => typeof tag === "string");
			}

			if (typeof tags === "string") {
				return tags
					.split(/[\s,]+/)
					.map(tag => tag.trim())
					.filter(tag => tag.length > 0);
			}

			return [];
		}

		return {
			MarkdownView,
			Plugin,
			PluginSettingTab,
			Setting,
			TFile,
			normalizePath,
			parseFrontMatterTags,
		};
	},
	{ virtual: true }
);

import SpeechBubblesPlugin from "../main";
import { MarkdownView, TFile } from "obsidian";

type MockFile = InstanceType<typeof TFile>;
type RerenderFunction = (full?: boolean) => void;
type MockMarkdownView = MarkdownView & {
	file: MockFile;
};

interface MockLeaf {
	view: unknown;
}

interface MockApp {
	metadataCache: {
		on: jest.Mock;
		getFileCache: jest.Mock;
	};
	workspace: {
		iterateAllLeaves: jest.Mock<void, [(leaf: MockLeaf) => void]>;
	};
	vault: {
		getAbstractFileByPath: jest.Mock;
	};
}

type MetadataChangedHandler = (file: MockFile, data: string, cache: Record<string, unknown>) => unknown;

function createApp() {
	const files = new Map<string, MockFile>();
	const fileCaches = new Map<string, Record<string, unknown> | null>();
	const changedHandlers: MetadataChangedHandler[] = [];
	const leaves: MockLeaf[] = [];

	const app: MockApp = {
		metadataCache: {
			on: jest.fn((name: string, callback: MetadataChangedHandler) => {
				if (name === "changed") {
					changedHandlers.push(callback);
				}

				return { name, callback };
			}),
			getFileCache: jest.fn((file: MockFile) => fileCaches.get(file.path) ?? null),
		},
		workspace: {
			iterateAllLeaves: jest.fn((callback: (leaf: MockLeaf) => void) => {
				for (const leaf of leaves) {
					callback(leaf);
				}
			}),
		},
		vault: {
			getAbstractFileByPath: jest.fn((path: string) => files.get(path) ?? null),
		},
	};

	return {
		app,
		fileCaches,
		leaves,
		addFile: (path: string, cache: Record<string, unknown> | null): MockFile => {
			const file = new TFile();
			file.path = path;
			files.set(path, file);
			fileCaches.set(path, cache);
			return file;
		},
		emitMetadataChanged: (file: MockFile): void => {
			const cache = fileCaches.get(file.path) ?? {};
			for (const handler of changedHandlers) {
				handler(file, "", cache ?? {});
			}
		},
	};
}

function createMarkdownView(
	file: MockFile,
	options: {
		currentModeRerender?: RerenderFunction;
		previewModeRerender?: RerenderFunction;
		hasSpeechBubbles?: boolean;
	} = {}
): MockMarkdownView {
	const view = new MarkdownView({} as never) as unknown as MockMarkdownView;
	view.file = file;
	view.currentMode = {} as MarkdownView["currentMode"];
	const previewContainer = document.createElement("div");
	if (options.hasSpeechBubbles) {
		const speechBubblesContainer = document.createElement("div");
		speechBubblesContainer.className = "speech-bubbles-container";
		previewContainer.appendChild(speechBubblesContainer);
	}
	view.previewMode = { containerEl: previewContainer } as unknown as MarkdownView["previewMode"];

	if (options.currentModeRerender) {
		view.currentMode = { rerender: options.currentModeRerender } as unknown as MarkdownView["currentMode"];
	}

	if (options.previewModeRerender) {
		view.previewMode = {
			containerEl: previewContainer,
			rerender: options.previewModeRerender,
		} as unknown as MarkdownView["previewMode"];
	}

	return view;
}

describe("SpeechBubblesPlugin metadata refresh", () => {
	it("rerenders every open markdown view for the changed transcript file", async () => {
		const { app, fileCaches, leaves, addFile, emitMetadataChanged } = createApp();
		const changedFile = addFile("transcripts/demo.md", {
			frontmatter: {
				tags: ["transcript"],
				speakers: {
					alice: { nameColor: "#ec4899" },
				},
			},
		});
		const otherTranscriptFile = addFile("transcripts/other.md", {
			frontmatter: {
				tags: ["transcript"],
			},
		});

		const currentModeRerender = jest.fn<void, [boolean?]>();
		const previewModeRerender = jest.fn<void, [boolean?]>();
		const unrelatedViewRerender = jest.fn<void, [boolean?]>();

		leaves.push(
			{ view: createMarkdownView(changedFile, { currentModeRerender }) },
			{ view: createMarkdownView(changedFile, { previewModeRerender }) },
			{ view: createMarkdownView(otherTranscriptFile, { currentModeRerender: unrelatedViewRerender }) }
		);

		const plugin = new SpeechBubblesPlugin(app as never, { id: "obsidian-speech-bubbles" } as never);
		await plugin.onload();

		fileCaches.set(changedFile.path, {
			frontmatter: {
				tags: ["transcript"],
				speakers: {
					alice: { nameColor: "#14b8a6" },
				},
			},
		});

		emitMetadataChanged(changedFile);

		expect(currentModeRerender).toHaveBeenCalledWith(true);
		expect(previewModeRerender).toHaveBeenCalledWith(true);
		expect(unrelatedViewRerender).not.toHaveBeenCalled();
	});

	it("skips metadata-triggered rerenders for non-transcript notes without rendered speech bubbles", async () => {
		const { app, leaves, addFile, emitMetadataChanged } = createApp();
		const regularFile = addFile("notes/regular.md", {
			frontmatter: {
				tags: ["daily"],
			},
		});
		const rerender = jest.fn<void, [boolean?]>();

		leaves.push({ view: createMarkdownView(regularFile, { currentModeRerender: rerender }) });

		const plugin = new SpeechBubblesPlugin(app as never, { id: "obsidian-speech-bubbles" } as never);
		await plugin.onload();

		emitMetadataChanged(regularFile);

		expect(rerender).not.toHaveBeenCalled();
	});

	it("rerenders a note that just lost transcript eligibility when speech bubbles are still rendered", async () => {
		const { app, fileCaches, leaves, addFile, emitMetadataChanged } = createApp();
		const changedFile = addFile("transcripts/demo.md", {
			frontmatter: {
				tags: ["transcript"],
			},
		});
		const previewModeRerender = jest.fn<void, [boolean?]>();

		leaves.push({
			view: createMarkdownView(changedFile, {
				previewModeRerender,
				hasSpeechBubbles: true,
			}),
		});

		const plugin = new SpeechBubblesPlugin(app as never, { id: "obsidian-speech-bubbles" } as never);
		await plugin.onload();

		fileCaches.set(changedFile.path, {
			frontmatter: {
				tags: ["daily"],
			},
		});

		emitMetadataChanged(changedFile);

		expect(previewModeRerender).toHaveBeenCalledWith(true);
	});
});
