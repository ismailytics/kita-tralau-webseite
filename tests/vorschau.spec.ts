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

// Seite → Elemente verschachtelter Bloks (Mitglieder, Zeitblöcke, Fragen) und gelisteter Stories (Termine, Alben,
// Beiträge, Download-Kategorien und Downloads), die einzeln bearbeitbar sein müssen.
const VERSCHACHTELT: Record<string, string> = {
	"/": "main li",
	"/vorstand": "main li",
	"/tagesablauf": "main li",
	"/faq": "main details",
	"/termine": "main li",
	"/galerie": "main li",
	"/aktuelles": "main article",
	"/downloads": "main section[aria-labelledby], main section[aria-labelledby] li",
};
// Seiten ohne eigene Story; dort sind nur die gelisteten Stories bearbeitbar.
const OHNE_SEITENSTORY = ["/termine"];

for (const [pfad, bloks] of Object.entries(VERSCHACHTELT)) {
	test(`${pfad}: Seite und alle verschachtelten Bloks sind bearbeitbar`, async ({ page }) => {
		await page.goto(pfad);
		const elemente = page.locator(bloks);
		expect(await elemente.count()).toBeGreaterThan(0);
		for (const element of await elemente.all()) await expect(element).toHaveAttribute("data-blok-c", /"uid":/);
		if (!OHNE_SEITENSTORY.includes(pfad)) await expect(page.locator("main")).toHaveAttribute("data-blok-c", /"uid":/);
	});
}

test("nach dem Speichern erscheint der Hinweis, bei neuer Build-ID lädt die Seite neu", async ({ page }) => {
	await page.goto("/");
	const hinweis = page.getByRole("status");
	await expect(hinweis).toBeHidden();

	await page.evaluate(() => {
		const { bridgeHandler } = window as unknown as { bridgeHandler: [string[], (e: { action: string }) => void][] };
		for (const [events, cb] of bridgeHandler) if (events.includes("change")) cb({ action: "change" });
	});
	await expect(hinweis).toBeVisible();
	await expect(hinweis).toHaveText(/wird aktualisiert/i);

	await page.route("/build-id.txt", (route) => route.fulfill({ body: "neuer-build" }), { times: 1 });
	await page.waitForEvent("load");
	await expect(hinweis).toBeHidden();
});

for (const pfad of ["/ueber-uns", "/impressum", "/datenschutz", "/kontakt", "/galerie/sommer-2026", "/aktuelles/laternelaufen"]) {
	test(`${pfad}: Seite ist bearbeitbar`, async ({ page }) => {
		await page.goto(pfad);
		await expect(page.locator("main")).toHaveAttribute("data-blok-c", /"uid":/);
	});
}
