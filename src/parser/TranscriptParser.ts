import { ParsedBubble, ParsedLine, ParsedRegularText, ParsedTimestamp } from "../types";
import { parseDateSeparator } from "./DateSeparatorParser";
import { parseTimestamp } from "./TimestampParser";

export function parseTranscriptLine(nodes: Node[]): ParsedLine {
	if (nodes.length === 1 && nodes[0].nodeType === Node.TEXT_NODE) {
		const dateSeparator = parseDateSeparator(nodes[0].textContent ?? "");
		if (dateSeparator) {
			return dateSeparator;
		}
	}

	const bubble = extractBubbleFromNodes(nodes);
	if (bubble) {
		return bubble;
	}

	return {
		type: "regular-text",
		nodes: nodes,
	} as ParsedRegularText;
}

function extractBubbleFromNodes(nodes: Node[]): ParsedBubble | null {
	let index = 0;

	while (index < nodes.length && isWhitespaceNode(nodes[index])) {
		index++;
	}

	if (index >= nodes.length) {
		return null;
	}

	const firstNode = nodes[index];
	if (!isInternalLinkNode(firstNode)) {
		return null;
	}

	const speakerName = firstNode.textContent?.trim() ?? "";
	if (!speakerName) {
		return null;
	}

	let timestamp: ParsedTimestamp | null = null;
	let colonFound = false;
	const messageNodes: Node[] = [];

	for (let i = index + 1; i < nodes.length; i++) {
		const node = nodes[i];

		if (!colonFound) {
			if (node.nodeType !== Node.TEXT_NODE) {
				return null;
			}

			const text = node.textContent ?? "";

			if (!timestamp) {
				const timestampResult = parseTimestamp(text);
				if (timestampResult) {
					timestamp = timestampResult.timestamp;
					const remaining = timestampResult.remainingText;
					const colonIndex = remaining.indexOf(":");
					if (colonIndex === -1) {
						if (remaining.trim().length === 0) {
							continue;
						}
						return null;
					}
					colonFound = true;
					const afterColon = remaining.slice(colonIndex + 1).replace(/^\s+/, "");
					if (afterColon.length > 0) {
						messageNodes.push(document.createTextNode(afterColon));
					}
					continue;
				}
			}

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

	return {
		type: "bubble",
		speaker: {
			name: speakerName,
			normalizedName: speakerName.toLowerCase().trim(),
		},
		timestamp,
		messageNodes,
	};
}

function isInternalLinkNode(node: Node): node is HTMLElement {
	return node instanceof HTMLElement && node.classList.contains("internal-link");
}

function isWhitespaceNode(node: Node): boolean {
	return node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length === 0;
}

export function splitNodesByLineBreaks(nodes: Node[]): Node[][] {
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
