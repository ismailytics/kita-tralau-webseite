import { expect, test } from "@playwright/test";

test("Header zeigt Logo, Namen und die feste Navigation", async ({ page }) => {
	await page.goto("/");
	const header = page.getByRole("banner");

	await expect(
		header.getByRole("img", { name: "Logo der Kindergruppe Travenbrück" }).filter({ visible: true }),
	).toBeVisible();
	await expect(header.getByText("Kindergruppe Travenbrück e.V.").filter({ visible: true })).toBeVisible();
	await expect(header.getByRole("navigation").getByRole("link", { name: "Start" })).toHaveAttribute("href", "/");
});

test("Footer zeigt Kontaktdaten und Öffnungszeiten aus den Globalen Angaben", async ({ page }) => {
	await page.goto("/");
	const footer = page.getByRole("contentinfo");

	await expect(
		footer.getByText("Elterninitiative in Tralau: eine kleine Gruppe, viel Natur und Zeit zum Spielen."),
	).toBeVisible();
	await expect(footer.getByText("Beispielweg 1, 23843 Travenbrück-Tralau")).toBeVisible();
	await expect(footer.getByRole("link", { name: "04531 123456" })).toHaveAttribute("href", "tel:04531123456");
	await expect(footer.getByRole("link", { name: "kontakt@kita-tralau.example" })).toHaveAttribute(
		"href",
		"mailto:kontakt@kita-tralau.example",
	);
	await expect(footer.getByText("Montag bis Freitag: 7:30 – 14:00 Uhr")).toBeVisible();
	await expect(footer.getByText("Schließzeiten stehen in den Terminen")).toBeVisible();
});

test("Kontakt-CTA führt zur Kontaktseite", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("link", { name: "Kontakt aufnehmen" }).click();

	await expect(page).toHaveURL(/\/kontakt\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kontakt");
});

test.describe("auf dem Smartphone", () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test("öffnet das Menü die Navigation und die Seite läuft nicht seitlich über", async ({ page }) => {
		await page.goto("/");
		expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

		await page.getByRole("button", { name: "Menü öffnen" }).click();
		const menue = page.getByRole("dialog");
		await expect(menue.getByRole("link", { name: "Start" })).toBeVisible();

		await menue.getByRole("button", { name: "Menü schließen" }).click();
		await expect(menue).toBeHidden();
	});
});
