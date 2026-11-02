import { expect, test } from "@playwright/test";

// Ersetzt die echte Storyblok-Bridge: merkt sich die Event-Handler, damit der Test „change“ auslösen kann.
const FAKE_BRIDGE = `window.StoryblokBridge = class {
	on(events, cb) { (window.bridgeHandler ??= []).push([events, cb]); }
};`;

test.beforeEach(async ({ page }) => {
	await page.route("https://app.storyblok.com/**", (route) =>
		route.fulfill({ contentType: "text/javascript", body: FAKE_BRIDGE }),
	);
});

test("Vorschau bindet die Bridge ein, setzt noindex und macht alle Bloks bearbeitbar", async ({ page }) => {
	const bridge = page.waitForRequest("https://app.storyblok.com/f/storyblok-v2-latest.js");
	await page.goto("/");
	await bridge;

	await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
	// Globale Angaben in Header und Footer, Startseite im Hauptbereich.
	for (const bereich of ["header", "footer", "main"]) {
		await expect(page.locator(bereich).first()).toHaveAttribute("data-blok-c", /"uid":/);
	}
});

test("nach dem Speichern erscheint der Hinweis, bei neuer Build-ID lädt die Seite neu", async ({ page }) => {
	await page.goto("/");
	const hinweis = page.getByRole("status");
	await expect(hinweis).toBeHidden();

	await page.evaluate(() => {
		for (const [events, cb] of (window as any).bridgeHandler) if (events.includes("change")) cb({ action: "change" });
	});
	await expect(hinweis).toBeVisible();
	await expect(hinweis).toHaveText(/wird aktualisiert/i);

	await page.route("/build-id.txt", (route) => route.fulfill({ body: "neuer-build" }), { times: 1 });
	await page.waitForEvent("load");
	await expect(hinweis).toBeHidden();
});
