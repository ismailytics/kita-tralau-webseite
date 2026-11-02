import assert from "node:assert/strict";
import { test } from "node:test";
import { htaccess } from "./htaccess.mjs";

test("Prod: niemand darf einbetten, indexierbar", () => {
	const h = htaccess(false);
	assert.match(h, /frame-ancestors 'none'/);
	assert.doesNotMatch(h, /X-Robots-Tag|storyblok/i);
});

test("Vorschau: nur der Visual Editor darf einbetten, noindex", () => {
	const h = htaccess(true);
	assert.match(h, /frame-ancestors https:\/\/app\.storyblok\.com"/);
	assert.match(h, /X-Robots-Tag "noindex, nofollow"/);
});

test("beide: HTML revalidieren, gehashte Assets dauerhaft cachen", () => {
	for (const h of [htaccess(false), htaccess(true)]) {
		assert.match(h, /Cache-Control "no-cache"/);
		assert.match(h, /_astro.*\n.*max-age=31536000, immutable/);
	}
});
