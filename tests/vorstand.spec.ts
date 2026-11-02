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
	await expect(page.getByText("Der Vorstand wird jedes Jahr von der Mitgliederversammlung gewählt")).toBeVisible();
	await expect(page.getByRole("main").getByRole("listitem").getByRole("heading", { level: 2 })).toHaveText([
		"Anna Beispiel",
		"Jonas Muster",
		"Maria Platzhalter",
	]);
	await expect(page.getByRole("heading", { level: 2, name: "Mitglied werden" })).toBeVisible();
	await expect(
		page.getByText("Alle Eltern, deren Kinder bei uns betreut werden, sind Mitglied im Verein."),
	).toBeVisible();
});

test("Vorstandsmitglied mit Foto und Mail zeigt beides", async ({ page }) => {
	await page.goto("/vorstand");
	const anna = page.getByRole("main").getByRole("listitem").filter({ hasText: "Anna Beispiel" });

	await expect(anna.getByText("Erste Vorsitzende")).toBeVisible();
	await expect(anna.getByRole("img", { name: "Porträt von Anna Beispiel" })).toBeVisible();
	await expect(anna.getByRole("link", { name: "anna.beispiel@kita-tralau.example" })).toHaveAttribute(
		"href",
		"mailto:anna.beispiel@kita-tralau.example",
	);
});

test("Vorstandsmitglied ohne Foto bzw. Mail wird ohne leere Bilder und Links dargestellt", async ({ page }) => {
	await page.goto("/vorstand");
	const jonas = page.getByRole("main").getByRole("listitem").filter({ hasText: "Jonas Muster" });
	const maria = page.getByRole("main").getByRole("listitem").filter({ hasText: "Maria Platzhalter" });

	await expect(jonas.getByText("Zweiter Vorsitzender")).toBeVisible();
	await expect(jonas.getByRole("img")).toHaveCount(0);
	await expect(jonas.getByRole("link")).toHaveAttribute("href", "mailto:jonas.muster@kita-tralau.example");

	await expect(maria.getByText("Kassenwartin")).toBeVisible();
	await expect(maria.getByRole("img")).toHaveCount(0);
	await expect(maria.getByRole("link")).toHaveCount(0);
});
