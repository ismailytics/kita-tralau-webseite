import { expect, test } from "@playwright/test";

test("Startseite zeigt Hero, Konzept-Teaser und Kontakt-CTA aus den Beispielinhalten", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Willkommen in der Kindergruppe Travenbrück");
	await expect(page.getByRole("img", { name: "Spielplatz mit Schaukel unter einem großen Kastanienbaum" })).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Unser Konzept" })).toBeVisible();
	await expect(page.getByText("Bei uns lernen Kinder im Spiel")).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Fragen? Sprechen Sie uns an" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Kontakt aufnehmen" })).toBeVisible();
});
