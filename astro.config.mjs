// @ts-check
import { defineConfig } from "astro/config";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
import { htaccess } from "./scripts/htaccess.mjs";

// Variante „Vorschau“ (ADR-0009): Entwürfe, Storyblok-Bridge, noindex; eigener Ausgabeordner neben dist/.
const vorschau = process.env.VARIANTE === "vorschau";
const buildId = String(Date.now());

export default defineConfig({
	output: "static",
	// Absolute URLs des Teilen-Bildes (OG/Twitter). Die Domain des Vereins steht noch nicht fest.
	site: process.env.SITE_URL ?? "https://kita-tralau.example",
	outDir: vorschau ? "dist-vorschau" : "dist",
	// Remote-Bilder nur von der Storyblok-Asset-Domain; sie werden beim Build heruntergeladen (ADR-0003).
	// SVG-Rasterung für Favicon und Teilen-Bild aus einem SVG-Logo; SVGs kommen nur aus dem Space der Redaktion.
	image: { domains: ["a.storyblok.com"], dangerouslyProcessSVG: true },
	// Die Vorschau lädt die Bridge von app.storyblok.com, die Stylesheets einfügt; Hash-CSP würde das blockieren.
	security: vorschau ? {} : {
		csp: {
			// Meta-Tag mit Hashes für Skripte und Styles; alles andere nur same-origin (ADR-0002).
			directives: [
				"default-src 'self'",
				"img-src 'self'",
				"font-src 'self'",
				"connect-src 'self'",
				"form-action 'self'",
				"base-uri 'self'",
				"object-src 'none'",
			],
		},
	},
	integrations: [
		{
			name: "variante",
			hooks: {
				"astro:build:done": ({ dir }) => {
					writeFileSync(new URL(".htaccess", dir), htaccess(vorschau));
					if (vorschau) writeFileSync(new URL("build-id.txt", dir), buildId);
				},
			},
		},
	],
	vite: {
		define: { __BUILD_ID__: JSON.stringify(buildId) },
		plugins: [tailwindcss(), Icons({ compiler: "astro" })],
	},
});
