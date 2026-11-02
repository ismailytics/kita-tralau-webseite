// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";

const stories = import.meta.glob<{ full_slug: string; content: unknown }>("/storyblok/stories/*.json", {
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

/** Inhalte aller Stories eines Inhaltstyps (z. B. alle Termine). */
export async function alle<T>(inhaltstyp: string): Promise<T[]> {
	return Object.values(stories)
		.map((s) => s.content as { component?: string })
		.filter((c) => c?.component === inhaltstyp) as T[];
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(dateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}
