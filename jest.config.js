module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	transform: {
		"^.+.(ts|tsx)$": [
			"babel-jest",
			{
				presets: [
					["@babel/preset-env", { targets: { node: "current" } }],
					["@babel/preset-react", { runtime: "automatic" }],
					"@babel/preset-typescript",
				],
				plugins: ["@babel/plugin-syntax-jsx"],
			},
		],
		"^.+.(js|jsx)$": [
			"babel-jest",
			{
				presets: [
					["@babel/preset-env", { targets: { node: "current" } }],
					["@babel/preset-react", { runtime: "automatic" }],
				],
				plugins: ["@babel/plugin-syntax-jsx"],
			},
		],
	},
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		"\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
			"<rootDir>/__mocks__/fileMock.js",
	},
	setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
	testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
	collectCoverageFrom: [
		"src/app/utils/**/*.{ts,tsx}",
		"!src/app/utils/cart.ts",
		"!src/app/utils/index.ts",
	],
	coverageThreshold: {
		global: {
			branches: 70,
			functions: 70,
			lines: 70,
			statements: 70,
		},
	},
};
