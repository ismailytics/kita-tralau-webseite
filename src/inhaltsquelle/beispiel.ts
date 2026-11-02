// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import { readdir, readFile } from "node:fs/promises";
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";

const stories = import.meta.glob<{ uuid: string; slug: string; full_slug: string; content: unknown }>("/storyblok/stories/*.json", {
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

export async function storiesIn<T>(ordner: string): Promise<{ slug: string; content: T }[]> {
	return Object.values(stories)
		.filter((s) => s.full_slug.startsWith(`${ordner}/`))
		.map((s) => ({ slug: s.slug, content: s.content as T }));
}

export async function fullSlug(uuid: string): Promise<string> {
	const gefunden = Object.values(stories).find((s) => s.uuid === uuid);
	if (!gefunden) throw new Error(`Beispielinhalte: verlinkte Story ${uuid} fehlt in storyblok/stories/.`);
	return gefunden.full_slug;
}

const assets = import.meta.glob<{ id: number; filename: string }>("/storyblok/assets/*.json", {
	eager: true,
	import: "default",
});

/** Inhalt einer Asset-Datei, gefunden über ihre Storyblok-URL. */
export async function datei(url: string): Promise<Uint8Array> {
	const asset = Object.values(assets).find((a) => a.filename === url);
	const name = asset && (await readdir("storyblok/assets")).find((n) => n.includes(`_${asset.id}.`) && !n.endsWith(".json"));
	if (!name) throw new Error(`Beispielinhalte: Datei ${url.split("/").pop()} fehlt in storyblok/assets/.`);
	return readFile(`storyblok/assets/${name}`);
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(dateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}
