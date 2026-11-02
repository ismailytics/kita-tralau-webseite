import { expect, test } from "@playwright/test";

test("Downloads-Seite ist in der Navigation", async ({ page }) => {
	await page.goto("/");
	await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "Downloads" }).click();

	await expect(page).toHaveURL(/\/downloads\/?$/);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Downloads");
	await expect(page.getByText(/^Formulare, Elternbriefe und weitere Unterlagen/)).toBeVisible();
});

test("zeigt Downloads nach Download-Kategorie gruppiert in der Reihenfolge der Redaktion, leere Kategorien nicht", async ({
	page,
}) => {
	await page.goto("/downloads");

	await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveText(["Formulare", "Elternbriefe"]);
	await expect(page.getByRole("heading", { name: "Speisepläne" })).toHaveCount(0);

	const formulare = page.getByRole("region", { name: "Formulare" });
	await expect(formulare.getByRole("link")).toHaveText([/Aufnahmeantrag/, /Einzugsermächtigung/]);
	await expect(page.getByRole("region", { name: "Elternbriefe" }).getByRole("link")).toHaveText([/Elternbrief Herbst/]);
});

test("Download-Links zeigen auf die eigene Domain und liefern die Datei", async ({ page, request, baseURL }) => {
	await page.goto("/downloads");
	const links = page.getByRole("main").getByRole("link");
	await expect(links).toHaveCount(3);

	for (const href of await links.evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href))) {
		expect(href.startsWith(`${baseURL}/`), href).toBe(true);
		const antwort = await request.get(href);
		expect(antwort.status(), href).toBe(200);
		expect(antwort.headers()["content-type"], href).toContain("application/pdf");
		expect((await antwort.body()).subarray(0, 5).toString(), href).toBe("%PDF-");
	}
});
