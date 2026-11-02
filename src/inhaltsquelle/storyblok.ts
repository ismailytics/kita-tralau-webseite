// Storyblok: veröffentlichte Inhalte über die Content Delivery API (Region EU), nur zur Build-Zeit.
import type { StoryblokAsset } from "../../storyblok/storyblok";

export async function story<T>(slug: string): Promise<T> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?version=published&token=${token}`);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Story „${slug}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).story.content as T;
}

/** Alle Stories eines Ordners (ohne den Ordner selbst). */
export async function stories<T>(ordner: string): Promise<{ slug: string; content: T }[]> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	// shortcut: höchstens 100 Stories je Ordner, bei mehr paginieren.
	const antwort = await fetch(
		`https://api.storyblok.com/v2/cdn/stories?starts_with=${ordner}/&per_page=100&version=published&token=${token}`,
	);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Ordner „${ordner}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).stories.map((s: { slug: string; content: T }) => ({ slug: s.slug, content: s.content }));
}

// Remote-URL der Storyblok-Asset-Domain; astro:assets lädt sie beim Build herunter (image.domains).
export const bildDatei = (asset: StoryblokAsset): string => asset.filename;
