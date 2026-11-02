import { expect, test } from "@playwright/test";

test("Tagesablauf zeigt die Zeitblöcke in Storyblok-Reihenfolge", async ({ page }) => {
	await page.goto("/tagesablauf");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unser Tagesablauf");
	await expect(page.getByText("So sieht ein Tag bei uns aus.")).toBeVisible();
	await expect(page.getByRole("main").getByRole("listitem")).toHaveText([
		/7:30 – 9:00\s*Freispielzeit/,
		/9:00 – 9:30\s*Morgenkreis/,
		/9:30 – 10:00\s*Frühstück mit anschließendem Zähneputzen/,
		/10:00 – 11:00\s*Kleingruppenarbeit und Freispielzeit/,
		/11:00 – 12:00\s*Aufenthalt im Freien/,
		/12:00 – 13:00\s*Mittagessen, kalt und warm/,
		/13:00 – 13:30\s*Ruhepause/,
		/13:30 – 15:00\s*Freispielzeit/,
		/15:00 – 15:30\s*Kreis und Nachmittagssnack/,
		/15:30 – 17:00\s*Freispielzeit/,
	]);
});
