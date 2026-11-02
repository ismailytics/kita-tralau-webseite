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
