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
		"Außengelände",
		"Gruppenräume und Ballbad",
	]);
	await expect(page.getByText("11. September 2023")).toBeVisible();
});

test("ein Album zeigt Titel, Datum und alle Fotos mit Alt-Text", async ({ page }) => {
	await page.goto("/galerie");
	await page.getByRole("link").filter({ hasText: "Außengelände" }).click();

	await expect(page).toHaveURL(/\/galerie\/aussengelaende\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Außengelände");
	await expect(page.getByText("11. September 2023")).toBeVisible();
	const fotos = page.getByRole("main").getByRole("img");
	await expect(fotos).toHaveCount(4);
	await expect(
		page.getByRole("img", { name: "Spielplatz der Kita mit Kletterturm, Rutsche und Sandfläche vor einer Baumreihe" }),
	).toBeVisible();
	await expect(
		page.getByRole("img", {
			name: "Gepflasterte Terrasse vor dem Kita-Gebäude mit Holzbänken, Tischen und einem Holzpferd",
		}),
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
	await page.goto("/galerie/aussengelaende");
	const alt = "Gepflasterte Terrasse vor dem Kita-Gebäude mit Holzbänken, Tischen und einem Holzpferd";

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
