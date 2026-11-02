import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { abrufen, versioniert } from "../src/inhaltsquelle/abruf.ts";

// astro:assets bildet den Dateinamen im Output aus der Quell-URL; ändert sie sich, ändert sich der Dateiname.
test("ersetztes Bild bei gleicher Quell-URL bekommt eine andere URL, gleiches Bild dieselbe", async (t) => {
	let inhalt = "bild-alt";
	const server = createServer((_, res) => res.end(inhalt)).listen(0);
	t.after(() => server.close());
	const url = `http://localhost:${server.address().port}/f/0/abc/foto.jpg`;

	const vorher = await versioniert(url);
	assert.equal(await versioniert(url), vorher);
	assert.ok(vorher.startsWith(`${url}?v=`));

	inhalt = "bild-neu";
	assert.notEqual(await versioniert(url), vorher);
});

test("nicht ladbares Bild bricht den Build ab", async (t) => {
	const server = createServer((_, res) => res.writeHead(404).end()).listen(0);
	t.after(() => server.close());
	await assert.rejects(versioniert(`http://localhost:${server.address().port}/f/0/abc/weg.jpg`), /weg\.jpg → HTTP 404/);
});

test("Rate-Limit (HTTP 429) wird nach kurzer Pause wiederholt", async (t) => {
	let anfragen = 0;
	const server = createServer((_, res) => (++anfragen < 3 ? res.writeHead(429).end() : res.end("ok"))).listen(0);
	t.after(() => server.close());
	const antwort = await abrufen(`http://localhost:${server.address().port}/v2/cdn/stories`, "Stories");
	assert.equal(await antwort.text(), "ok");
	assert.equal(anfragen, 3);
});
