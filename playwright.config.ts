import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

// --ignore-lock: Astro startet die Vorschau sonst bei erkanntem Agent im Hintergrund.
// Testet die fertigen Builds in dist/ und dist-vorschau/ (vorher `pnpm build` mit Beispielinhalten).
// TEST_PORT: parallele Worktrees brauchen eigene Ports, sonst testet reuseExistingServer fremde Builds.
const port = Number(process.env.TEST_PORT ?? 4322);
const vorschauPort = port + 1000;
// Kontaktformular (Seam 2): PHP-Built-in-Server auf dist/ und Mailpit, Ports abgeleitet vom TEST_PORT.
// In CI läuft Mailpit als Service-Container auf den per Umgebung gesetzten Ports.
export const phpPort = port + 10000;
export const mailpitSmtpPort = Number(process.env.MAILPIT_SMTP_PORT ?? port + 11000);
export const mailpitHttpPort = Number(process.env.MAILPIT_HTTP_PORT ?? port + 12000);

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
		{
			command: `mailpit --smtp 127.0.0.1:${mailpitSmtpPort} --listen 127.0.0.1:${mailpitHttpPort}`,
			url: `http://127.0.0.1:${mailpitHttpPort}/livez`,
			// Immer wiederverwenden: In CI läuft Mailpit schon als Service-Container.
			reuseExistingServer: true,
		},
		{
			command: `php -S 127.0.0.1:${phpPort} -t dist`,
			url: `http://127.0.0.1:${phpPort}/kontaktanfrage.php`,
			reuseExistingServer: !process.env.CI,
			env: {
				KONTAKTFORMULAR_KONFIG: resolve("kontaktformular.konfig.example.php"),
				MAILPIT_SMTP_PORT: String(mailpitSmtpPort),
			},
		},
	],
});
