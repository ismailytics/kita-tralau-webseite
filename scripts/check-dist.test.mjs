import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const pruefe = (dateien) => {
	const dist = mkdtempSync(join(tmpdir(), "dist-"));
	for (const [name, inhalt] of Object.entries(dateien)) {
		mkdirSync(join(dist, name, ".."), { recursive: true });
		writeFileSync(join(dist, name), inhalt);
	}
	try {
		execFileSync("node", ["scripts/check-dist.mjs", dist], { stdio: "pipe" });
		return 0;
	} catch (e) {
		return e.status;
	}
};

test("sauberer Build besteht", () => {
	assert.equal(pruefe({ "index.html": "<h1>Kita</h1>", "_astro/a.js": "x()" }), 0);
});

test("„Storyblok“ irgendwo im Build lässt scheitern", () => {
	assert.equal(pruefe({ "index.html": "<h1>Kita</h1>", "_astro/a.js": "fetch('https://a.StoryBlok.com/x')" }), 1);
});

test("data-blok-Attribute lassen scheitern", () => {
	assert.equal(pruefe({ "seite/index.html": '<div data-blok-c="{}">x</div>' }), 1);
});
