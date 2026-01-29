import { SpeechBubblesSettings, TranscriptConfig } from "../types";
import { parseFrontmatter } from "../parser/FrontmatterParser";

export function resolveConfig(settings: SpeechBubblesSettings, frontmatter: unknown): TranscriptConfig {
	const fmConfig = parseFrontmatter(frontmatter);

	return {
		settings,
		speakerConfigs: fmConfig.speakerConfigs,
		sides: fmConfig.sides,
	};
}
