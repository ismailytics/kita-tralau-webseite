import { expect, test } from "@playwright/test";

test("Impressum zeigt die Angaben des Vereins mit Hinweis für den Vorstand", async ({ page }) => {
	await page.goto("/impressum");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Impressum");
	await expect(page.getByText(/^Platzhaltertext: Der Vorstand prüft/)).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Angaben gemäß § 5 DDG" })).toBeVisible();
	await expect(page.getByText("Den Vorstand: Thomas Junker (1. Vorsitzender)")).toBeVisible();
	await expect(page.locator(".prose").getByRole("link", { name: "Kontaktseite" })).toHaveAttribute("href", "/kontakt");
});

test("Datenschutzerklärung zeigt ihren Text und verlinkt same-origin aufs Impressum", async ({ page }) => {
	await page.goto("/datenschutz");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Datenschutzerklärung");
	await expect(page.getByText(/^Platzhaltertext: Der Vorstand ersetzt/)).toBeVisible();
	await expect(page.getByRole("heading", { level: 2, name: "Keine Cookies, keine Tracker" })).toBeVisible();
	await page.locator(".prose").getByRole("link", { name: "Impressum" }).click();
	await expect(page).toHaveURL(/\/impressum\/?$/);
});
