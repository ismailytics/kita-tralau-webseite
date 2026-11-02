// Storyblok behält beim Ersetzen eines Bildes die URL. astro:assets bildet den Dateinamen im Output aus der Quell-URL,
// also hängt der Inhalts-Hash an: neuer Inhalt → neue URL → neuer Dateiname, der Cache von /_astro/ greift nicht (ADR-0003).
import { createHash } from "node:crypto";

export async function versioniert(url: string): Promise<string> {
	const antwort = await fetch(url);
	if (!antwort.ok) throw new Error(`Inhaltsquelle: Bild ${url.split("/").pop()} → HTTP ${antwort.status}.`);
	const hash = createHash("sha256").update(new Uint8Array(await antwort.arrayBuffer())).digest("hex").slice(0, 12);
	return `${url}?v=${hash}`;
}
