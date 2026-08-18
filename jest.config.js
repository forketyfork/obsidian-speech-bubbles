const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
	testEnvironment: "jsdom",
	setupFiles: ["<rootDir>/src/__mocks__/domPolyfills.js"],
	transform: {
		...Object.fromEntries(
			Object.entries(tsJestTransformCfg).map(([pattern, transformer]) => [
				pattern,
				[transformer[0], { ...transformer[1], tsconfig: "tsconfig.test.json" }],
			])
		),
	},
	coverageProvider: "v8",
	coverageDirectory: "coverage",
	collectCoverageFrom: ["**/*.ts", "!**/*.test.ts", "!**/__tests__/**", "!node_modules/**"],
};
