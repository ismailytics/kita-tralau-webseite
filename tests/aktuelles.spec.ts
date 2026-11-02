import { expect, test } from "@playwright/test";

test("Aktuelles listet alle Beiträge, neueste zuerst, und ist in der Navigation", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("navigation").getByRole("link", { name: "Aktuelles" }).first().click();
	await expect(page).toHaveURL(/\/aktuelles\/?$/);

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Aktuelles");
	const beitraege = page.getByRole("article");
	await expect(beitraege.getByRole("heading", { level: 2 })).toHaveText([
		"Laternelaufen am 11. November",
		"Neue Schaukel im Garten",
		"Willkommen im neuen Kitajahr",
	]);

	const erster = beitraege.first();
	await expect(erster.getByText("28. Oktober 2026")).toBeVisible();
	await expect(erster.getByText("Am Martinstag ziehen wir mit Laternen durch Tralau.")).toBeVisible();
	await expect(
		erster.getByRole("img", { name: "Betonröhre zum Durchkriechen auf der Wiese unter dem Kastanienbaum" }),
	).toBeVisible();
});

test("Ein Beitrag zeigt Titel, Datum, Teaserbild und den vollständigen Fließtext", async ({ page }) => {
	await page.goto("/aktuelles");
	await page.getByRole("link", { name: "Laternelaufen am 11. November" }).click();
	await expect(page).toHaveURL(/\/aktuelles\/laternelaufen\/?$/);

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Laternelaufen am 11. November");
	await expect(page.getByText("28. Oktober 2026")).toBeVisible();
	await expect(
		page.getByRole("img", { name: "Betonröhre zum Durchkriechen auf der Wiese unter dem Kastanienbaum" }),
	).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Ablauf" })).toBeVisible();
	await expect(page.getByRole("listitem").filter({ hasText: "17:30 Uhr: Umzug durchs Dorf" })).toBeVisible();
	await expect(
		page.getByRole("img", { name: "Blaue Doppelschaukel auf Holzhackschnitzeln, dahinter ein Drehteller" }),
	).toBeVisible();
});

test("Links und Bilder im Fließtext zeigen auf die eigene Domain", async ({ page, baseURL, request }) => {
	await page.goto("/aktuelles/laternelaufen");
	const text = page.locator(".prose");

	await expect(text.getByRole("link", { name: "neuen Schaukel" })).toHaveAttribute("href", "/aktuelles/neue-schaukel-im-garten");
	await expect(text.getByRole("link", { name: "Laternelaufen" })).toHaveAttribute(
		"href",
		"https://de.wikipedia.org/wiki/Laternelaufen",
	);

	const pdf = await text.getByRole("link", { name: "Elternbrief (PDF)" }).getAttribute("href");
	expect(pdf).toMatch(/^\/dateien\/.+\.pdf$/);
	const antwort = await request.get(pdf as string);
	expect(antwort.ok()).toBe(true);
	expect((await antwort.body()).subarray(0, 5).toString()).toBe("%PDF-");

	const bild = text.getByRole("img", { name: "Blaue Doppelschaukel auf Holzhackschnitzeln, dahinter ein Drehteller" });
	await expect(bild).toHaveJSProperty("complete", true);
	expect(await bild.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(new RegExp(`^${baseURL}/_astro/`));

	await page.getByRole("link", { name: "neuen Schaukel" }).click();
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Neue Schaukel im Garten");
});

test("Interne Story-Links auf die Startseite werden zu /", async ({ page }) => {
	await page.goto("/aktuelles/willkommen-im-neuen-kitajahr");
	await expect(page.locator(".prose").getByRole("link", { name: "Startseite" })).toHaveAttribute("href", "/");
});
