import { expect, test } from "@playwright/test";

// Alle Seiten der Site. Neue Seiten hier eintragen, dann gelten die Prüfungen auch für sie.
const SEITEN = ["/", "/termine", "/vorstand", "/tagesablauf", "/faq", "/downloads", "/kontakt"];

for (const pfad of SEITEN) {
	test.describe(`Seite ${pfad}`, () => {
		test("macht keine Requests an fremde Domains und meldet keine CSP-Verletzung", async ({ page, baseURL }) => {
			const fremd: string[] = [];
			const konsole: string[] = [];
			page.on("request", (r) => {
				const url = r.url();
				if (!url.startsWith(`${baseURL}/`) && !url.startsWith("data:")) fremd.push(url);
			});
			page.on("console", (m) => {
				if (m.type() === "error" || m.type() === "warning") konsole.push(m.text());
			});
			page.on("pageerror", (e) => konsole.push(e.message));

			await page.goto(pfad, { waitUntil: "networkidle" });
			await page.mouse.wheel(0, 10_000); // lazy geladene Bilder auslösen
			await page.waitForLoadState("networkidle");

			expect(fremd).toEqual([]);
			expect(konsole).toEqual([]);
			await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveAttribute(
				"content",
				/default-src 'self'.*script-src 'self' 'sha/,
			);
		});

		test("alle Bilder haben einen Alt-Text", async ({ page }) => {
			await page.goto(pfad);
			const ohneAlt = await page.locator("img").evaluateAll((imgs) =>
				imgs.filter((i) => !i.getAttribute("alt")?.trim()).map((i) => i.getAttribute("src")),
			);
			expect(ohneAlt).toEqual([]);
		});

		test("die Überschriftenhierarchie ist lückenlos", async ({ page }) => {
			await page.goto(pfad);
			const ebenen = await page
				.locator("h1, h2, h3, h4, h5, h6")
				.evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));

			expect(ebenen.filter((e) => e === 1)).toHaveLength(1);
			expect(ebenen[0]).toBe(1);
			ebenen.forEach((e, i) => i > 0 && expect(e, `h${ebenen[i - 1]} → h${e}`).toBeLessThanOrEqual(ebenen[i - 1] + 1));
		});
	});
}
