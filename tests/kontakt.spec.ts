import { expect, test } from "@playwright/test";

test("Kontaktseite zeigt Intro, Adresse und Öffnungszeiten aus den Globalen Angaben", async ({ page }) => {
	await page.goto("/kontakt");
	const inhalt = page.getByRole("main");

	await expect(inhalt.getByRole("heading", { level: 1 })).toHaveText("Kontakt");
	await expect(inhalt.getByText("Wir freuen uns, Sie kennenzulernen.")).toBeVisible();
	await expect(inhalt.getByText("Beispielweg 1")).toBeVisible();
	await expect(inhalt.getByText("23843 Travenbrück-Tralau")).toBeVisible();
	await expect(inhalt.getByRole("link", { name: "04531 123456" })).toHaveAttribute("href", "tel:04531123456");
	await expect(inhalt.getByRole("link", { name: "kontakt@kita-tralau.example" })).toHaveAttribute(
		"href",
		"mailto:kontakt@kita-tralau.example",
	);
	await expect(inhalt.getByText("Montag bis Freitag: 7:30 – 14:00 Uhr")).toBeVisible();
});

test("Kontaktseite verweist für die Anmeldung auf das Kitaportal", async ({ page }) => {
	await page.goto("/kontakt");
	const hinweis = page.getByRole("region", { name: "Anmeldung über das Kitaportal" });

	await expect(hinweis.getByText("Einen Kita-Platz beantragen Sie ausschließlich über das Kitaportal")).toBeVisible();
	await expect(hinweis.getByRole("link", { name: "Zum Kitaportal" })).toHaveAttribute(
		"href",
		"https://www.kitaportal-sh.de/",
	);
});

test("Kontaktseite zeigt ein eigenes Kartenbild mit Quellenangabe und einen Link zur Route", async ({ page, baseURL }) => {
	await page.goto("/kontakt");
	const karte = page.getByRole("img", { name: "Kartenausschnitt von Tralau mit der Lage der Kita" });

	await expect(karte).toBeVisible();
	expect(await karte.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(new RegExp(`^${baseURL}/`));
	await expect(page.getByText("Karte: © OpenStreetMap-Mitwirkende")).toBeVisible();
	await expect(page.getByRole("link", { name: "Route in OpenStreetMap öffnen" })).toHaveAttribute(
		"href",
		/^https:\/\/www\.openstreetmap\.org\//,
	);
	await expect(page.locator("iframe")).toHaveCount(0);
});

test("Kontakt steht in der Navigation", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Kontakt" }).click();

	await expect(page).toHaveURL(/\/kontakt\/?$/);
});
