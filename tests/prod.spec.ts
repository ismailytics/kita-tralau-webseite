import { expect, test } from "@playwright/test";

test("Prod-Variante enthält weder Bridge noch Hinweis und ist indexierbar", async ({ page, request }) => {
	await page.goto("/");

	await expect(page.locator('script[src*="storyblok"]')).toHaveCount(0);
	await expect(page.getByRole("status")).toHaveCount(0);
	await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
	expect((await request.get("/build-id.txt")).status()).toBe(404);
});
