import { defineConfig } from "@playwright/test";

// --ignore-lock: Astro startet die Vorschau sonst bei erkanntem Agent im Hintergrund.
// Testet die fertigen Builds in dist/ und dist-vorschau/ (vorher `pnpm build` mit Beispielinhalten).
// TEST_PORT: parallele Worktrees brauchen eigene Ports, sonst testet reuseExistingServer fremde Builds.
const port = Number(process.env.TEST_PORT ?? 4322);
const vorschauPort = port + 1000;

export default defineConfig({
	testDir: "tests",
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? "github" : "list",
	use: {
		// Lokal das installierte Chrome (keine Headless-Shell), in CI das von Playwright installierte Chromium.
		channel: process.env.CI ? undefined : "chrome",
	},
	projects: [
		{ name: "prod", testIgnore: /vorschau\.spec/, use: { baseURL: `http://localhost:${port}` } },
		{ name: "vorschau", testMatch: /vorschau\.spec/, use: { baseURL: `http://localhost:${vorschauPort}` } },
	],
	webServer: [
		{
			command: `pnpm exec astro preview --ignore-lock --port ${port}`,
			url: `http://localhost:${port}`,
			reuseExistingServer: !process.env.CI,
		},
		{
			command: `pnpm exec astro preview --ignore-lock --port ${vorschauPort}`,
			env: { VARIANTE: "vorschau" },
			url: `http://localhost:${vorschauPort}`,
			reuseExistingServer: !process.env.CI,
		},
	],
});
