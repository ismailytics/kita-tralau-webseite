// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import { readdirSync, readFileSync } from "node:fs";
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";

const stories = import.meta.glob<{ full_slug: string; slug: string; uuid: string; content: { component?: string } }>("/storyblok/stories/*.json", {
	eager: true,
	import: "default",
});
const dateien = import.meta.glob<ImageMetadata>("/storyblok/assets/*.{jpg,jpeg,png,webp,avif,gif,svg}", {
	eager: true,
	import: "default",
});

export async function story<T>(slug: string): Promise<T> {
	const gefunden = Object.values(stories).find((s) => s.full_slug === slug);
	if (!gefunden) throw new Error(`Beispielinhalte: Story „${slug}“ fehlt in storyblok/stories/.`);
	return gefunden.content as T;
}

export async function alleStories<T>(komponente: string): Promise<{ uuid: string; slug: string; content: T }[]> {
	return Object.values(stories)
		.filter((s) => s.content.component === komponente)
		.map((s) => ({ uuid: s.uuid, slug: s.slug, content: s.content as T }));
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(dateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}

export async function datei(asset: StoryblokAsset): Promise<Uint8Array> {
	const name = readdirSync("storyblok/assets").find((n) => n.includes(`_${asset.id}.`) && !n.endsWith(".json"));
	if (!name) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return readFileSync(`storyblok/assets/${name}`);
}

/** Inhalte aller Stories eines Inhaltstyps (z. B. alle Termine). */
export async function alle<T>(inhaltstyp: string): Promise<T[]> {
	return (await alleStories<T>(inhaltstyp)).map((s) => s.content);
}
