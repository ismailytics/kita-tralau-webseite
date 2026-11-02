import { expect, test } from "@playwright/test";

test("Galerie steht in der Navigation und zeigt alle Alben, neueste zuerst", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Galerie" }).click();

	await expect(page).toHaveURL(/\/galerie\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Galerie");
	await expect(page.getByText("Aus Rücksicht auf die Kinder zeigen unsere Alben nur Gebäude und Gelände.")).toBeVisible();
	await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveText([
		"Sommer rund ums Haus",
		"Winter auf dem Gelände",
		"Der Anbau entsteht",
	]);
	await expect(page.getByText("27. Juni 2026")).toBeVisible();
});

test("ein Album zeigt Titel, Datum und alle Fotos mit Alt-Text", async ({ page }) => {
	await page.goto("/galerie");
	await page.getByRole("link", { name: /Winter auf dem Gelände/ }).click();

	await expect(page).toHaveURL(/\/galerie\/winter-2026\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Winter auf dem Gelände");
	await expect(page.getByText("20. Januar 2026")).toBeVisible();
	const fotos = page.getByRole("main").getByRole("img");
	await expect(fotos).toHaveCount(2);
	await expect(page.getByRole("img", { name: "Kita-Gebäude mit Laternen und verschneitem Vorplatz unter blauem Himmel" })).toBeVisible();
	await expect(page.getByRole("img", { name: "Eingangsseite der Kita im Schnee, davor ein umzäunter Spielbereich" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Alle Alben" })).toHaveAttribute("href", "/galerie/");
});
