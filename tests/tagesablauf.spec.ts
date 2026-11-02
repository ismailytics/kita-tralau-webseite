import { expect, test } from "@playwright/test";

test("Tagesablauf zeigt die Zeitblöcke in Storyblok-Reihenfolge", async ({ page }) => {
	await page.goto("/tagesablauf");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unser Tagesablauf");
	await expect(page.getByText("So sieht ein typischer Tag bei uns aus.")).toBeVisible();
	await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
		/7:30 – 8:30\s*Ankommen und Freispiel/,
		/8:30 – 9:00\s*Gemeinsames Frühstück/,
		/9:00 – 9:30\s*Morgenkreis/,
		/9:30 – 11:30\s*Spielen im Garten, Ausflüge und Projekte/,
		/11:30 – 12:30\s*Mittagessen/,
		/12:30 – 14:00\s*Ruhezeit, Freispiel und Abholen/,
	]);
});
