import { expect, test } from "@playwright/test";

test("Terminliste zeigt alle Termine nach Datum aufsteigend", async ({ page }) => {
	await page.goto("/termine");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termine");
	await expect(page.getByRole("main").getByRole("listitem").locator("h2")).toHaveText([
		"Laternelaufen",
		"Schließtag: Teamfortbildung",
		"Weihnachtsschließzeit",
		"Sommerfest",
	]);
});

test("Termine zeigen Datum, Uhrzeit nur wenn vorhanden und mehrtägige als Zeitraum", async ({ page }) => {
	await page.goto("/termine");
	const termin = (titel: string) => page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: titel }) });

	await expect(termin("Laternelaufen")).toContainText("Fr., 13. November 2026 · 17:00 Uhr");
	await expect(termin("Laternelaufen")).toContainText("Treffpunkt am Gartentor.");
	await expect(termin("Schließtag: Teamfortbildung")).toHaveText(/^\s*Fr\., 27\. November 2026\s*Schließtag: Teamfortbildung\s*$/);
	await expect(termin("Weihnachtsschließzeit")).toContainText("Mi., 23. Dezember 2026 – Fr., 1. Januar 2027");
	await expect(termin("Sommerfest")).toContainText("Sa., 19. Juni 2027 · 14:00 – 17:00 Uhr");
});

test("Termine sind über die Navigation erreichbar", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Termine" }).click();

	await expect(page).toHaveURL(/\/termine\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termine");
});

test("Startseite zeigt unter „Nächste Termine“ die ersten drei Termine", async ({ page }) => {
	await page.goto("/");
	const teaser = page.locator("section").filter({ has: page.getByRole("heading", { level: 2, name: "Nächste Termine" }) });

	await expect(teaser.getByRole("heading", { level: 3 })).toHaveText([
		"Laternelaufen",
		"Schließtag: Teamfortbildung",
		"Weihnachtsschließzeit",
	]);
	await expect(teaser).toContainText("Fr., 13. November 2026 · 17:00 Uhr");
	await teaser.getByRole("link", { name: "Alle Termine" }).click();
	await expect(page).toHaveURL(/\/termine\/?$/);
});
