import { expect, test } from "@playwright/test";

const FRAGEN = [
	"Ab welchem Alter kann mein Kind zu Ihnen kommen?",
	"Wie melde ich mein Kind an?",
	"Wie werden die Plätze vergeben?",
	"Was kostet ein Platz?",
	"Gibt es ein Mittagessen?",
	"Bis wann muss mein Kind morgens da sein?",
	"Muss ich Mitglied im Verein werden?",
	"Wann ist die Kita geschlossen?",
];

test("FAQ zeigt die Fragen in Storyblok-Reihenfolge, Antworten zugeklappt", async ({ page }) => {
	await page.goto("/faq");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Häufige Fragen");
	await expect(page.locator("summary")).toHaveText(FRAGEN);
	await expect(
		page.getByText("Wir nehmen Kinder ab drei Jahren auf, auch während des Kindergartenjahres"),
	).toBeHidden();
});

test("FAQ lässt sich per Tastatur auf- und zuklappen", async ({ page }) => {
	await page.goto("/faq");
	const frage = page.getByText(FRAGEN[1]);
	const antwort = page.getByText("Vereinbaren Sie bitte einen Termin mit unserer Kitaleiterin");

	await frage.focus();
	await page.keyboard.press("Enter");
	await expect(antwort).toBeVisible();
	await page.keyboard.press("Space");
	await expect(antwort).toBeHidden();
});

test.describe("ohne JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("klappt die FAQ per Klick auf", async ({ page }) => {
		await page.goto("/faq");
		await page.getByText(FRAGEN[0]).click();

		await expect(
			page.getByText("Wir nehmen Kinder ab drei Jahren auf, auch während des Kindergartenjahres"),
		).toBeVisible();
	});
});
