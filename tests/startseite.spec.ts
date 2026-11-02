import { expect, test } from "@playwright/test";

test("Startseite zeigt Hero, Konzept-Teaser und Kontakt-CTA aus den Beispielinhalten", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Herzlich willkommen in der Kindergruppe Travenbrück",
	);
	await expect(
		page.getByRole("img", { name: "Spielplatz der Kita mit Kletterturm, Rutsche und Sandfläche vor einer Baumreihe" }),
	).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Wer wir sind" })).toBeVisible();
	await expect(page.getByText("Als elternorganisierter Kindergarten")).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "So erreichen Sie uns" })).toBeVisible();
	await expect(page.getByRole("link", { name: "Kontakt aufnehmen" })).toBeVisible();
});

test("Konzept-CTA führt zu Über uns", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: "Mehr über uns" }).click();
	await expect(page).toHaveURL(/\/ueber-uns\/?$/);
});
