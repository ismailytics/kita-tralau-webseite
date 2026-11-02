import { expect, test } from "@playwright/test";

test("Galerie steht in der Navigation und zeigt alle Alben, neueste zuerst", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Galerie" }).click();

	await expect(page).toHaveURL(/\/galerie\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Galerie");
	await expect(
		page.getByText("Aus Rücksicht auf die Kinder zeigen unsere Alben nur Gebäude und Gelände."),
	).toBeVisible();
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
	await expect(
		page.getByRole("img", { name: "Kita-Gebäude mit Laternen und verschneitem Vorplatz unter blauem Himmel" }),
	).toBeVisible();
	await expect(
		page.getByRole("img", { name: "Eingangsseite der Kita im Schnee, davor ein umzäunter Spielbereich" }),
	).toBeVisible();
	await expect(page.getByRole("link", { name: "Alle Alben" })).toHaveAttribute("href", "/galerie/");
});

test("Lightbox zeigt ein Foto groß, per Tastatur bedienbar, ohne fremde Requests und CSP-Verletzung", async ({
	page,
	baseURL,
}) => {
	const fremd: string[] = [];
	const konsole: string[] = [];
	page.on("request", (r) => {
		if (!r.url().startsWith(`${baseURL}/`) && !r.url().startsWith("data:")) fremd.push(r.url());
	});
	page.on("console", (m) => {
		if (m.type() === "error" || m.type() === "warning") konsole.push(m.text());
	});
	page.on("pageerror", (e) => konsole.push(e.message));
	await page.goto("/galerie/winter-2026");
	const alt = "Eingangsseite der Kita im Schnee, davor ein umzäunter Spielbereich";

	await page.getByRole("link", { name: alt }).focus();
	await page.keyboard.press("Enter");
	const lightbox = page.getByRole("dialog");
	await expect(lightbox).toBeVisible();
	const gross = lightbox.getByRole("img", { name: alt });
	await expect(gross).toBeVisible();
	await expect.poll(() => gross.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(800);

	await page.keyboard.press("Escape");
	await expect(lightbox).toBeHidden();
	await expect(page.getByRole("link", { name: alt })).toBeFocused();

	await page.getByRole("link", { name: alt }).click();
	await lightbox.getByRole("button", { name: "Schließen" }).click();
	await expect(lightbox).toBeHidden();

	expect(fremd).toEqual([]);
	expect(konsole).toEqual([]);
});
