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
