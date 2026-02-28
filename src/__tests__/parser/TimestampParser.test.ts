import { parseTimestamp, formatTimestamp } from "../../parser/TimestampParser";

describe("parseTimestamp", () => {
	it("should parse [HH:MM] format", () => {
		const result = parseTimestamp("[14:32]: Hello");
		expect(result).not.toBeNull();
		expect(result!.timestamp.hours).toBe(14);
		expect(result!.timestamp.minutes).toBe(32);
		expect(result!.timestamp.seconds).toBeNull();
		expect(result!.remainingText).toBe(": Hello");
	});

	it("should parse [HH:MM:SS] format", () => {
		const result = parseTimestamp("[14:32:45]: Hello");
		expect(result).not.toBeNull();
		expect(result!.timestamp.hours).toBe(14);
		expect(result!.timestamp.minutes).toBe(32);
		expect(result!.timestamp.seconds).toBe(45);
		expect(result!.remainingText).toBe(": Hello");
	});

	it("should parse single-digit hours", () => {
		const result = parseTimestamp("[9:05]: Hello");
		expect(result).not.toBeNull();
		expect(result!.timestamp.hours).toBe(9);
		expect(result!.timestamp.minutes).toBe(5);
	});

	it("should handle leading whitespace", () => {
		const result = parseTimestamp("  [14:32]: Hello");
		expect(result).not.toBeNull();
		expect(result!.timestamp.hours).toBe(14);
	});

	it("should return null for invalid hours (25:00)", () => {
		const result = parseTimestamp("[25:00]: Hello");
		expect(result).toBeNull();
	});

	it("should return null for invalid minutes (14:60)", () => {
		const result = parseTimestamp("[14:60]: Hello");
		expect(result).toBeNull();
	});

	it("should return null for invalid seconds (14:30:60)", () => {
		const result = parseTimestamp("[14:30:60]: Hello");
		expect(result).toBeNull();
	});

	it("should return null for text without timestamp", () => {
		const result = parseTimestamp(": Hello");
		expect(result).toBeNull();
	});

	it("should return null for malformed timestamp", () => {
		const result = parseTimestamp("[14]: Hello");
		expect(result).toBeNull();
	});

	it("should store raw timestamp string", () => {
		const result = parseTimestamp("[14:32]: Hello");
		expect(result).not.toBeNull();
		expect(result!.timestamp.raw).toBe("[14:32]");
	});
});

describe("formatTimestamp", () => {
	it("should format HH:MM timestamp", () => {
		const result = formatTimestamp({
			raw: "[14:32]",
			hours: 14,
			minutes: 32,
			seconds: null,
		});
		expect(result).toBe("14:32");
	});

	it("should format HH:MM:SS timestamp", () => {
		const result = formatTimestamp({
			raw: "[14:32:45]",
			hours: 14,
			minutes: 32,
			seconds: 45,
		});
		expect(result).toBe("14:32:45");
	});

	it("should pad single digits", () => {
		const result = formatTimestamp({
			raw: "[9:05]",
			hours: 9,
			minutes: 5,
			seconds: null,
		});
		expect(result).toBe("09:05");
	});

	it("should pad seconds", () => {
		const result = formatTimestamp({
			raw: "[9:05:03]",
			hours: 9,
			minutes: 5,
			seconds: 3,
		});
		expect(result).toBe("09:05:03");
	});
});
