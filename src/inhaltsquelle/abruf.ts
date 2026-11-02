// Laden von Storyblok (CDN-API und Asset-Domain) zur Build-Zeit. Keine relativen Imports: scripts/abruf.test.mjs lädt die Datei direkt in Node.
import { createHash } from "node:crypto";

/** fetch mit kurzem Backoff bei HTTP 429 (Rate-Limit); jeder andere Fehler bricht den Build ab. */
export async function abrufen(url: string, was: string): Promise<Response> {
	for (let versuch = 1; ; versuch++) {
		const antwort = await fetch(url);
		if (antwort.ok) return antwort;
		if (antwort.status !== 429 || versuch > 4)
			throw new Error(`Inhaltsquelle Storyblok: ${was} → HTTP ${antwort.status}.`);
		await new Promise((weiter) => setTimeout(weiter, versuch * 500));
	}
}

/** Bytes einer Asset-Datei, für die same-origin-Kopie im Build (ADR-0003). */
export async function dateiInhalt(url: string): Promise<Uint8Array> {
	return new Uint8Array(await (await abrufen(url, `Datei ${url.split("/").pop()}`)).arrayBuffer());
}

// Storyblok behält beim Ersetzen eines Bildes die URL. astro:assets bildet den Dateinamen im Output aus der Quell-URL,
// also hängt der Inhalts-Hash an: neuer Inhalt → neue URL → neuer Dateiname, der Cache von /_astro/ greift nicht (ADR-0003).
export async function versioniert(url: string): Promise<string> {
	const hash = createHash("sha256")
		.update(await dateiInhalt(url))
		.digest("hex")
		.slice(0, 12);
	return `${url}?v=${hash}`;
}
