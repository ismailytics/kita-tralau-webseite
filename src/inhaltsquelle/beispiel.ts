// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import { VORSCHAU } from "../variante";

type Story = { id: number; full_slug: string; content: unknown };
const stories = import.meta.glob<Story>("/storyblok/stories/*.json", {
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
	return inhalt(gefunden) as T;
}

// In der Vorschau wie die Draft-API: `_editable` an jedem Blok, auch verschachtelten, für Klick-zum-Bearbeiten.
function inhalt(story: Story): unknown {
	if (!VORSCHAU) return story.content;
	const markieren = (wert: unknown): unknown => {
		if (Array.isArray(wert)) return wert.map(markieren);
		if (!wert || typeof wert !== "object") return wert;
		const blok = Object.fromEntries(Object.entries(wert).map(([k, v]) => [k, markieren(v)]));
		if (!blok._uid || !blok.component) return blok;
		const editable = JSON.stringify({ name: blok.component, space: "0", uid: blok._uid, id: String(story.id) });
		return { ...blok, _editable: `<!--#storyblok#${editable}-->` };
	};
	return markieren(story.content);
}

/** Inhalte aller Stories eines Inhaltstyps (z. B. alle Termine). */
export async function alle<T>(inhaltstyp: string): Promise<T[]> {
	return Object.values(stories)
		.map((s) => inhalt(s) as { component?: string })
		.filter((c) => c?.component === inhaltstyp) as T[];
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(dateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}
