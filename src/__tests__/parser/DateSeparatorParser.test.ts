import { parseDateSeparator } from "../../parser/DateSeparatorParser";

describe("parseDateSeparator", () => {
	it("should parse --- YYYY-MM-DD --- format", () => {
		const result = parseDateSeparator("--- 2024-01-15 ---");
		expect(result).not.toBeNull();
		expect(result!.type).toBe("date-separator");
		expect(result!.date.getFullYear()).toBe(2024);
		expect(result!.date.getMonth()).toBe(0); // January is 0
		expect(result!.date.getDate()).toBe(15);
	});

	it("should parse --- January 15, 2024 --- format", () => {
		const result = parseDateSeparator("--- January 15, 2024 ---");
		expect(result).not.toBeNull();
		expect(result!.type).toBe("date-separator");
		expect(result!.date.getFullYear()).toBe(2024);
		expect(result!.date.getMonth()).toBe(0);
	});

	it("should parse --- February 28 2024 --- format (without comma)", () => {
		const result = parseDateSeparator("--- February 28 2024 ---");
		expect(result).not.toBeNull();
		expect(result!.type).toBe("date-separator");
		expect(result!.date.getMonth()).toBe(1);
	});

	it("should handle case-insensitive month names", () => {
		const result = parseDateSeparator("--- MARCH 1, 2024 ---");
		expect(result).not.toBeNull();
		expect(result!.date.getMonth()).toBe(2);
	});

	it("should handle whitespace around text", () => {
		const result = parseDateSeparator("  --- 2024-01-15 ---  ");
		expect(result).not.toBeNull();
	});

	it("should return null for partial matches", () => {
		expect(parseDateSeparator("--- 2024-01-15")).toBeNull();
		expect(parseDateSeparator("2024-01-15 ---")).toBeNull();
		expect(parseDateSeparator("--- Hello ---")).toBeNull();
	});

	it("should return null for invalid ISO dates", () => {
		const result = parseDateSeparator("--- 2024-13-15 ---");
		expect(result).toBeNull();
	});

	it("should return null for regular text", () => {
		expect(parseDateSeparator("Hello world")).toBeNull();
		expect(parseDateSeparator("[[John]]: Hello")).toBeNull();
	});

	it("should store raw text", () => {
		const result = parseDateSeparator("--- 2024-01-15 ---");
		expect(result).not.toBeNull();
		expect(result!.raw).toBe("--- 2024-01-15 ---");
	});

	it("should format date for display", () => {
		const result = parseDateSeparator("--- 2024-01-15 ---");
		expect(result).not.toBeNull();
		expect(result!.formattedDate).toBeTruthy();
		expect(result!.formattedDate.length).toBeGreaterThan(0);
	});
});
