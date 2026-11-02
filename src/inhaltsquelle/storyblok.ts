// Storyblok: veröffentlichte Inhalte über die Content Delivery API (Region EU), nur zur Build-Zeit.
import type { StoryblokAsset } from "../../storyblok/storyblok";

export async function story<T>(slug: string): Promise<T> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?version=published&token=${token}`);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Story „${slug}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).story.content as T;
}

// shortcut: nur die erste Seite (100 Stories), Paginierung nachrüsten, wenn ein Ordner mehr hat.
export async function storiesIn<T>(ordner: string): Promise<{ slug: string; content: T }[]> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(
		`https://api.storyblok.com/v2/cdn/stories?starts_with=${ordner}/&per_page=100&version=published&token=${token}`,
	);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Ordner „${ordner}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).stories;
}

// Remote-URL der Storyblok-Asset-Domain; astro:assets lädt sie beim Build herunter (image.domains).
export const bildDatei = (asset: StoryblokAsset): string => asset.filename;

export async function fullSlug(uuid: string): Promise<string> {
	const token = process.env.STORYBLOK_TOKEN;
	const antwort = await fetch(`https://api.storyblok.com/v2/cdn/stories/${uuid}?find_by=uuid&version=published&token=${token}`);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: verlinkte Story ${uuid} → HTTP ${antwort.status}.`);
	return (await antwort.json()).story.full_slug;
}

/** Inhalt einer Asset-Datei; wird beim Build geladen und same-origin ausgeliefert (ADR-0003). */
export async function datei(url: string): Promise<Uint8Array> {
	const antwort = await fetch(url);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Datei ${url.split("/").pop()} → HTTP ${antwort.status}.`);
	return new Uint8Array(await antwort.arrayBuffer());
}
