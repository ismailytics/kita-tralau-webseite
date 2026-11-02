import { expect, test } from "@playwright/test";

test("Über uns ist in der Navigation und zeigt Titel, Intro, Fließtext und Bilder", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("navigation").getByRole("link", { name: "Über uns" }).first().click();
	await expect(page).toHaveURL(/\/ueber-uns\/?$/);

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Über uns");
	await expect(page.getByText(/^Platzhaltertext: Hier stellt der Vorstand/)).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Unser Konzept" })).toBeVisible();
	await expect(page.getByRole("listitem").filter({ hasText: "Viel Zeit draußen im Garten" })).toBeVisible();
	await expect(
		page.getByRole("img", { name: "Spielplatz mit Schaukel unter einem großen Kastanienbaum" }),
	).toBeVisible();
	const bilder = page.getByRole("main").getByRole("list").last().getByRole("img");
	await expect(bilder).toHaveCount(2);
	await expect(bilder.first()).toHaveAccessibleName(
		"Kita-Gebäude mit Laternen und verschneitem Vorplatz unter blauem Himmel",
	);
	await expect(bilder.last()).toHaveAccessibleName(
		"Kiesweg zwischen Rasenflächen führt zum hellen Kita-Gebäude mit großen Fenstern",
	);
});

test("Links und Bilder im Fließtext von Über uns zeigen auf die eigene Domain", async ({ page, baseURL, request }) => {
	await page.goto("/ueber-uns");
	const text = page.locator(".prose");

	await expect(text.getByRole("link", { name: "Vorstand" })).toHaveAttribute("href", "/vorstand");
	const pdf = await text.getByRole("link", { name: "Aufnahmeantrag (PDF)" }).getAttribute("href");
	expect(pdf).toMatch(/^\/dateien\/.+\.pdf$/);
	const antwort = await request.get(pdf as string);
	expect(antwort.ok()).toBe(true);
	expect((await antwort.body()).subarray(0, 5).toString()).toBe("%PDF-");

	const bild = text.getByRole("img", { name: "Spielplatz mit Schaukel unter einem großen Kastanienbaum" });
	await expect(bild).toHaveJSProperty("complete", true);
	expect(await bild.evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(new RegExp(`^${baseURL}/_astro/`));
});
