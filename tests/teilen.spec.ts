import { expect, test, type Page } from "@playwright/test";

// Teilen-Vorschau und Favicon: absolute URLs auf die eigene Domain (SITE_URL), Bilder aus dem Build (ADR-0003).
const SITE = process.env.SITE_URL ?? "https://kita-tralau.example";

const meta = (page: Page, name: string) => page.locator(`meta[property="${name}"], meta[name="${name}"]`);

// Ein Pfad auf der eigenen Domain muss im Build existieren und ein Bild sein.
async function bildAusDemBuild(page: Page, url: string) {
	expect(url.startsWith(`${SITE}/_astro/`), url).toBe(true);
	const antwort = await page.request.get(new URL(url).pathname);
	expect(antwort.status()).toBe(200);
	expect(antwort.headers()["content-type"]).toMatch(/^image\/(jpeg|png)/);
}

for (const { pfad, titel, beschreibung } of [
	{ pfad: "/", titel: "Kindergruppe Travenbrück e.V.", beschreibung: /./ },
	{ pfad: "/aktuelles/laternelaufen", titel: "Laternelaufen am 11. November", beschreibung: /./ },
	{ pfad: "/termine", titel: "Termine", beschreibung: /^Termine und Schließzeiten/ },
	{ pfad: "/galerie/sommer-2026", titel: "Sommer rund ums Haus" },
]) {
	test(`${pfad}: OG- und Twitter-Meta zeigen auf die eigene Domain`, async ({ page }) => {
		await page.goto(pfad);

		await expect(meta(page, "og:title")).toHaveAttribute("content", titel);
		if (beschreibung) await expect(meta(page, "og:description")).toHaveAttribute("content", beschreibung);
		await expect(meta(page, "og:site_name")).toHaveAttribute("content", "Kindergruppe Travenbrück e.V.");
		await expect(meta(page, "og:url")).toHaveAttribute("content", new RegExp(`^${SITE}${pfad.replace(/\/$/, "")}/?$`));
		await expect(meta(page, "og:image:alt")).toHaveAttribute("content", /./);
		await expect(meta(page, "twitter:card")).toHaveAttribute("content", "summary_large_image");
		await bildAusDemBuild(page, (await meta(page, "og:image").getAttribute("content"))!);
	});
}

test("Beitrag und Album teilen ihr eigenes Bild, nicht das der Startseite", async ({ page }) => {
	await page.goto("/");
	const start = await meta(page, "og:image").getAttribute("content");
	for (const pfad of ["/aktuelles/laternelaufen", "/galerie/sommer-2026"]) {
		await page.goto(pfad);
		expect(await meta(page, "og:image").getAttribute("content"), pfad).not.toBe(start);
	}
	await page.goto("/aktuelles/laternelaufen");
	await expect(meta(page, "og:image")).toHaveAttribute("content", /\/roehre_/);
});

test("Favicon kommt aus dem Logo der Globalen Angaben, same-origin", async ({ page }) => {
	await page.goto("/");
	for (const rel of ["icon", "apple-touch-icon"]) {
		const href = await page.locator(`link[rel="${rel}"]`).getAttribute("href");
		expect(href).toMatch(/^\/_astro\/logo_.*\.png$/);
		await bildAusDemBuild(page, `${SITE}${href}`);
	}
	await expect(page.locator('link[rel="shortcut icon"]')).toHaveCount(0);
});

test("Bilder tragen kein inferSize-Attribut ins HTML", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("img[infersize]")).toHaveCount(0);
});
