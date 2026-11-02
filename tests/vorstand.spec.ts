import { expect, test } from "@playwright/test";

test("Navigation führt zu Vorstand, Tagesablauf und FAQ", async ({ page }) => {
	await page.goto("/");
	const nav = page.getByRole("banner").getByRole("navigation");

	await expect(nav.getByRole("link", { name: "Vorstand" })).toHaveAttribute("href", "/vorstand");
	await expect(nav.getByRole("link", { name: "Tagesablauf" })).toHaveAttribute("href", "/tagesablauf");
	await expect(nav.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/faq");
});

test("Vorstandsseite zeigt Intro, Vorstandsmitglieder in Storyblok-Reihenfolge und Beitritts-Text", async ({
	page,
}) => {
	await page.goto("/vorstand");

	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Der Vorstand");
	await expect(page.getByText("Die Mitgliederversammlung wählt alle zwei Jahre den Vorstand.")).toBeVisible();
	await expect(page.getByRole("main").getByRole("listitem").getByRole("heading", { level: 2 })).toHaveText([
		"Thomas Junker",
		"Eva Noßke",
		"Malte Stobbe",
	]);
	await expect(page.getByRole("heading", { level: 2, name: "Mitglied werden" })).toBeVisible();
	await expect(
		page.getByText(/^Mindestens ein Elternteil jedes betreuten Kindes ist Mitglied im Verein\./),
	).toBeVisible();
});

test("Vorstandsmitglied mit Foto und Mail zeigt beides", async ({ page }) => {
	await page.goto("/vorstand");
	const thomas = page.getByRole("main").getByRole("listitem").filter({ hasText: "Thomas Junker" });

	await expect(thomas.getByText("1. Vorsitzender")).toBeVisible();
	await expect(thomas.getByRole("img", { name: "Porträt von Thomas Junker" })).toBeVisible();
	await expect(thomas.getByRole("link", { name: "kitra.ev@web.de" })).toHaveAttribute("href", "mailto:kitra.ev@web.de");
});

test("Vorstandsmitglied ohne Mail wird ohne leeren Link dargestellt", async ({ page }) => {
	await page.goto("/vorstand");
	const eva = page.getByRole("main").getByRole("listitem").filter({ hasText: "Eva Noßke" });

	await expect(eva.getByText("Schriftführung")).toBeVisible();
	await expect(eva.getByRole("img", { name: "Porträt von Eva Noßke" })).toBeVisible();
	await expect(eva.getByRole("link")).toHaveCount(0);
});
