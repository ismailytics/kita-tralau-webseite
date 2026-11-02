import assert from "node:assert/strict";
import { test } from "node:test";
import { assetUrlsUmschreiben, assetZuordnung } from "./storyblok-push.mjs";

const lokal = { id: 1, short_filename: "logo.svg", filename: "https://a.storyblok.com/f/0/abc/logo.svg" };

test("Asset mit gleicher ID im Ziel-Space wird darauf abgebildet", () => {
	const ziel = { id: 1, short_filename: "logo.svg", filename: "https://a.storyblok.com/f/42/abc/logo.svg" };
	assert.deepEqual(assetZuordnung([lokal], [{ id: 9, short_filename: "logo.svg" }, ziel]), [
		{ old_id: 1, new_id: 1, old_filename: lokal.filename, new_filename: ziel.filename },
	]);
});

test("Asset mit gleichem Dateinamen wird zugeordnet statt neu angelegt", () => {
	const ziel = { id: 9, short_filename: "logo.svg", filename: "https://a.storyblok.com/f/42/def/logo.svg" };
	assert.deepEqual(assetZuordnung([lokal], [{ id: 8, short_filename: "anderes.svg" }, ziel]), [
		{ old_id: 1, new_id: 9, old_filename: lokal.filename, new_filename: ziel.filename },
	]);
});

test("Unbekanntes Asset bleibt ohne Zuordnung und wird angelegt", () => {
	assert.deepEqual(assetZuordnung([lokal], [{ id: 8, short_filename: "anderes.svg" }]), []);
});

test("Asset-URLs im Rich Text (Bild-src, Datei-Link) zeigen nach dem Umschreiben auf den Ziel-Space", () => {
	const story = JSON.stringify({
		text: { content: [{ attrs: { src: lokal.filename } }, { attrs: { href: lokal.filename } }] },
	});
	const ziel = "https://a.storyblok.com/f/42/abc/logo.svg";
	const ergebnis = assetUrlsUmschreiben(story, [
		{ old_id: 1, new_id: 1, old_filename: lokal.filename, new_filename: ziel },
	]);
	assert.equal(ergebnis.includes("/f/0/"), false);
	assert.equal(ergebnis.split(ziel).length - 1, 2);
});
