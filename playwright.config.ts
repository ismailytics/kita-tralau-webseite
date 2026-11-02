import { defineConfig } from "@playwright/test";

// --ignore-lock: Astro startet die Vorschau sonst bei erkanntem Agent im Hintergrund.
// Testet den fertigen Build in dist/ (vorher `pnpm build` mit Beispielinhalten).
const port = 4322;

export default defineConfig({
	testDir: "tests",
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://localhost:${port}`,
		// Lokal das installierte Chrome (keine Headless-Shell), in CI das von Playwright installierte Chromium.
		channel: process.env.CI ? undefined : "chrome",
	},
	webServer: {
		command: `pnpm exec astro preview --ignore-lock --port ${port}`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !process.env.CI,
	},
});
