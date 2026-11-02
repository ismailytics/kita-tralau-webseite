import { expect, test } from "@playwright/test";

test("Terminliste zeigt alle Termine nach Datum aufsteigend", async ({ page }) => {
	await page.goto("/termine");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termine");
	await expect(page.getByRole("main").getByRole("listitem").locator("h2")).toHaveText([
		"Schließzeit Winter 2026",
		"Schließzeit Sommer 2027",
		"Schließzeit Winter 2027",
	]);
});

test("Mehrtägige Termine zeigen den Zeitraum, Kurztext nur wenn vorhanden", async ({ page }) => {
	await page.goto("/termine");
	const termin = (titel: string) =>
		page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: titel }) });

	await expect(termin("Schließzeit Winter 2026")).toContainText("Do., 24. Dezember 2026 – So., 3. Januar 2027");
	await expect(termin("Schließzeit Sommer 2027")).toContainText("Mo., 2. – Fr., 13. August 2027");
	await expect(termin("Schließzeit Sommer 2027")).toContainText(
		"Die Betreuungsverträge für dieses Kindergartenjahr enden am 31. Juli 2027.",
	);
	await expect(termin("Schließzeit Winter 2027")).toHaveText(
		/^\s*Fr\., 24\. Dezember 2027\s*–\s*Sa\., 1\. Januar 2028\s*Schließzeit Winter 2027\s*$/,
	);
});

test("Termine sind über die Navigation erreichbar", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Termine" }).click();

	await expect(page).toHaveURL(/\/termine\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termine");
});

test("Startseite zeigt unter „Nächste Termine“ die ersten drei Termine", async ({ page }) => {
	await page.goto("/");
	const teaser = page
		.locator("section")
		.filter({ has: page.getByRole("heading", { level: 2, name: "Nächste Termine" }) });

	await expect(teaser.getByRole("heading", { level: 3 })).toHaveText([
		"Schließzeit Winter 2026",
		"Schließzeit Sommer 2027",
		"Schließzeit Winter 2027",
	]);
	await expect(teaser).toContainText("Do., 24. Dezember 2026 – So., 3. Januar 2027");
	await teaser.getByRole("link", { name: "Alle Termine" }).click();
	await expect(page).toHaveURL(/\/termine\/?$/);
});
