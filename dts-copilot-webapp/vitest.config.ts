import react from "@vitejs/plugin-react";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vitest/config";

const require = createRequire(import.meta.url);
const reactDomClientDir = dirname(require.resolve("react-dom/client"));
const reactForReactDom = resolve(reactDomClientDir, "../react");

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			react: reactForReactDom,
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/test/setup.ts",
		include: ["src/**/*.{test,spec}.{ts,tsx}"],
		css: false,
	},
});
