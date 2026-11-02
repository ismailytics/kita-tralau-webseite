// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import { VORSCHAU } from "../variante";

const stories = import.meta.glob<{ id: number; full_slug: string; content: { _uid: string; component: string } }>("/storyblok/stories/*.json", {
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
	if (!VORSCHAU) return gefunden.content as T;
	// Wie die Draft-API: `_editable` kennzeichnet den Blok für Klick-zum-Bearbeiten.
	const { _uid: uid, component: name } = gefunden.content;
	const editable = JSON.stringify({ name, space: "0", uid, id: String(gefunden.id) });
	return { ...gefunden.content, _editable: `<!--#storyblok#${editable}-->` } as T;
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(dateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}
