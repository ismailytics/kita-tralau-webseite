import { expect, test } from "@playwright/test";

const FRAGEN = [
	"Ab welchem Alter kann mein Kind zu Ihnen kommen?",
	"Wie melde ich mein Kind an?",
	"Was bedeutet Elterninitiative?",
	"Gibt es ein Mittagessen?",
];

test("FAQ zeigt die Fragen in Storyblok-Reihenfolge, Antworten zugeklappt", async ({ page }) => {
	await page.goto("/faq");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Häufige Fragen");
	await expect(page.locator("summary")).toHaveText(FRAGEN);
	await expect(page.getByText("Wir betreuen Kinder ab drei Jahren bis zum Schuleintritt.")).toBeHidden();
});

test("FAQ lässt sich per Tastatur auf- und zuklappen", async ({ page }) => {
	await page.goto("/faq");
	const frage = page.getByText(FRAGEN[1]);
	const antwort = page.getByText("Die Anmeldung läuft über das Kitaportal");

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

		await expect(page.getByText("Wir betreuen Kinder ab drei Jahren bis zum Schuleintritt.")).toBeVisible();
	});
});
