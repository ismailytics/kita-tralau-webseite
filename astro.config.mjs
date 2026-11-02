// @ts-check
import { defineConfig } from "astro/config";
import Icons from "unplugin-icons/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	output: "static",
	// Remote-Bilder nur von der Storyblok-Asset-Domain; sie werden beim Build heruntergeladen (ADR-0003).
	image: { domains: ["a.storyblok.com"] },
	security: {
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
	vite: {
		plugins: [tailwindcss(), Icons({ compiler: "astro" })],
	},
});
