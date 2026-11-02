// Storyblok: veröffentlichte Inhalte (in der Vorschau Entwürfe) über die Content Delivery API (Region EU), nur zur Build-Zeit.
import type { StoryblokAsset } from "../../storyblok/storyblok";
import { VORSCHAU } from "../variante";

const version = VORSCHAU ? "draft" : "published";

export async function story<T>(slug: string): Promise<T> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(`https://api.storyblok.com/v2/cdn/stories/${slug}?version=${version}&token=${token}`);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Story „${slug}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).story.content as T;
}

// shortcut: nur die erste Seite mit 100 Stories, bei mehr Inhalten eines Typs paginieren.
export async function alle<T>(inhaltstyp: string): Promise<T[]> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const antwort = await fetch(
		`https://api.storyblok.com/v2/cdn/stories?content_type=${inhaltstyp}&per_page=100&version=${version}&token=${token}`,
	);
	if (!antwort.ok) throw new Error(`Inhaltsquelle Storyblok: Inhaltstyp „${inhaltstyp}“ → HTTP ${antwort.status}.`);
	return (await antwort.json()).stories.map((s: { content: T }) => s.content);
}

// Remote-URL der Storyblok-Asset-Domain; astro:assets lädt sie beim Build herunter (image.domains).
export const bildDatei = (asset: StoryblokAsset): string => asset.filename;
