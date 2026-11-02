// Storyblok: veröffentlichte Inhalte über die Content Delivery API (Region EU), nur zur Build-Zeit.
import type { StoryblokAsset } from "../../storyblok/storyblok";

export async function story<T>(slug: string): Promise<T> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?version=published&token=${token}`);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Story „${slug}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).story.content as T;
}

// Remote-URL der Storyblok-Asset-Domain; astro:assets lädt sie beim Build herunter (image.domains).
export const bildDatei = (asset: StoryblokAsset): string => asset.filename;

// shortcut: nur die ersten 100 Stories eines Typs, bei mehr paginieren.
export async function alleStories<T>(komponente: string): Promise<{ uuid: string; content: T }[]> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(
		`https://api.storyblok.com/v2/cdn/stories?content_type=${komponente}&per_page=100&version=published&token=${token}`,
	);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Stories „${komponente}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).stories.map((s: { uuid: string; content: T }) => ({ uuid: s.uuid, content: s.content }));
}

// Dateien werden beim Build geladen und same-origin ausgeliefert, wie Bilder (ADR-0003).
export async function datei(asset: StoryblokAsset): Promise<Uint8Array> {
	const antwort = await fetch(asset.filename);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Datei ${asset.filename.split("/").pop()} → HTTP ${antwort.status}.`);
	return new Uint8Array(await antwort.arrayBuffer());
}
