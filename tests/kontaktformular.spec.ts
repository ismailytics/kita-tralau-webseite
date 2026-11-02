import { expect, type Page, test } from "@playwright/test";
import { mailpitHttpPort, phpPort } from "../playwright.config";

// Seam 2: HTTP-POST gegen das PHP-Skript, Assertion über die Mailpit-API.
const skript = `http://127.0.0.1:${phpPort}/kontaktanfrage.php`;
const mailpit = `http://127.0.0.1:${mailpitHttpPort}/api/v1`;
// Über den PHP-Server, der dist/ und das Skript gemeinsam ausliefert wie später der Hoster.
const kontaktseite = `http://127.0.0.1:${phpPort}/kontakt/`;

const gueltig = {
	name: "Erika Beispiel",
	email: "erika@example.com",
	nachricht: "Haben Sie im Sommer noch einen Platz frei?",
	webseite: "",
	dauer: "12",
};

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
	await request.delete(`${mailpit}/messages`);
});

test("Gültige Kontaktanfrage kommt im Postfach an, Antwort geht an den Besucher", async ({ request }) => {
	const antwort = await request.post(skript, { form: gueltig, maxRedirects: 0 });

	expect(antwort.status()).toBe(303);
	expect(antwort.headers().location).toBe("/kontakt/danke");
	const { messages } = await (await request.get(`${mailpit}/messages`)).json();
	expect(messages).toHaveLength(1);
	const mail = await (await request.get(`${mailpit}/message/${messages[0].ID}`)).json();
	expect(mail.From.Address).toBe("formular@kita-tralau.example");
	expect(mail.To.map((a: { Address: string }) => a.Address)).toEqual(["kontakt@kita-tralau.example"]);
	expect(mail.ReplyTo).toEqual([{ Name: "Erika Beispiel", Address: "erika@example.com" }]);
	expect(mail.Subject).toContain("Erika Beispiel");
	expect(mail.Text).toContain("Haben Sie im Sommer noch einen Platz frei?");
});

const abgelehnt: [string, Record<string, string | undefined>, string][] = [
	["fehlendem Namen", { name: "" }, "/kontakt/ungueltig"],
	["fehlender Mail", { email: "" }, "/kontakt/ungueltig"],
	["ungültiger Mail", { email: "erika(at)example.com" }, "/kontakt/ungueltig"],
	["leerer Nachricht", { nachricht: "   " }, "/kontakt/ungueltig"],
	["zu langem Namen", { name: "E".repeat(101) }, "/kontakt/ungueltig"],
	["zu langer Nachricht", { nachricht: "x".repeat(5001) }, "/kontakt/ungueltig"],
	["Zeilenumbruch im Namen", { name: "Erika\r\nBcc: spam@example.com" }, "/kontakt/ungueltig"],
	// Bots sollen nicht merken, dass sie erkannt wurden.
	["ausgefülltem Honeypot", { webseite: "https://spam.example" }, "/kontakt/danke"],
	["zu schnellem Absenden", { dauer: "1" }, "/kontakt/fehler"],
	["unsinniger Dauer", { dauer: "-5" }, "/kontakt/fehler"],
	// Ein POST ohne das Feld kommt nicht aus dem Formular (das schickt es mit JS gefüllt, ohne JS leer).
	["fehlender Dauer", { dauer: undefined }, "/kontakt/fehler"],
];

for (const [fall, felder, ziel] of abgelehnt) {
	test(`Keine Mail bei ${fall}`, async ({ request }) => {
		const form = Object.fromEntries(Object.entries({ ...gueltig, ...felder }).filter(([, wert]) => wert !== undefined));
		const antwort = await request.post(skript, { form, maxRedirects: 0 });

		expect(antwort.status()).toBe(303);
		expect(antwort.headers().location).toBe(ziel);
		const { messages } = await (await request.get(`${mailpit}/messages`)).json();
		expect(messages).toHaveLength(0);
	});
}

test("Leere Dauer (Formular ohne JS) prüft nur den Honeypot, die Anfrage kommt an", async ({ request }) => {
	const antwort = await request.post(skript, { form: { ...gueltig, dauer: "" }, maxRedirects: 0 });

	expect(antwort.headers().location).toBe("/kontakt/danke");
	const { messages } = await (await request.get(`${mailpit}/messages`)).json();
	expect(messages).toHaveLength(1);
});

test("Ohne Formulardaten (GET) geht keine Mail raus", async ({ request }) => {
	const antwort = await request.get(skript, { maxRedirects: 0 });

	expect(antwort.status()).toBe(303);
	expect(antwort.headers().location).toBe("/kontakt");
	const { messages } = await (await request.get(`${mailpit}/messages`)).json();
	expect(messages).toHaveLength(0);
});

async function formularAbsenden(page: Page) {
	const formular = page.getByRole("form", { name: "Kontaktformular" });
	await formular.getByLabel("Name").fill("Erika Beispiel");
	await formular.getByLabel("E-Mail").fill("erika@example.com");
	await formular.getByLabel("Nachricht").fill("Gibt es einen Tag der offenen Tür?");
	await formular.getByRole("button", { name: "Nachricht senden" }).click();
}

test("Mit JavaScript: sofortiges Absenden gilt als Bot, nach ein paar Sekunden kommt die Anfrage an", async ({
	page,
	request,
}) => {
	await page.clock.install();
	await page.goto(kontaktseite);
	await formularAbsenden(page);
	await expect(page).toHaveURL(/\/kontakt\/fehler\/?$/);

	await page.goto(kontaktseite);
	await page.clock.fastForward(5000);
	await formularAbsenden(page);
	await expect(page).toHaveURL(/\/kontakt\/danke\/?$/);
	const { messages } = await (await request.get(`${mailpit}/messages`)).json();
	expect(messages).toHaveLength(1);
});

test.describe("ohne JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("Besucher schickt das Formular ab und sieht die Bestätigung", async ({ page, request }) => {
		await page.goto(kontaktseite);
		await formularAbsenden(page);

		await expect(page).toHaveURL(/\/kontakt\/danke\/?$/);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Vielen Dank für Ihre Nachricht");
		const { messages } = await (await request.get(`${mailpit}/messages`)).json();
		expect(messages).toHaveLength(1);
	});
});
