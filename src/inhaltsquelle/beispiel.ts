// Beispielinhalte: die per Pull-Skript ins Repo gezogenen Stories und Assets (storyblok/).
import { readFileSync } from "node:fs";
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import { VORSCHAU } from "../variante";

type Story = { id: number; uuid: string; slug: string; full_slug: string; position: number; content: { component?: string } };
const storyDateien = Object.values(
	import.meta.glob<Story>("/storyblok/stories/*.json", { eager: true, import: "default" }),
);
const bildDateien = import.meta.glob<ImageMetadata>("/storyblok/assets/*.{jpg,jpeg,png,webp,avif,gif,svg}", {
	eager: true,
	import: "default",
});
const assets = Object.entries(
	import.meta.glob<{ id: number; filename: string }>("/storyblok/assets/*.json", { eager: true, import: "default" }),
);

export async function story<T>(slug: string): Promise<T> {
	const gefunden = storyDateien.find((s) => s.full_slug === slug);
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

export async function storiesDesTyps<T>(inhaltstyp: string): Promise<{ uuid: string; slug: string; position: number; content: T }[]> {
	return storyDateien
		.filter((s) => s.content.component === inhaltstyp)
		.map((s) => ({ uuid: s.uuid, slug: s.slug, position: s.position, content: inhalt(s) as T }));
}

export async function fullSlug(uuid: string): Promise<string> {
	const gefunden = storyDateien.find((s) => s.uuid === uuid);
	if (!gefunden) throw new Error(`Beispielinhalte: verlinkte Story ${uuid} fehlt in storyblok/stories/.`);
	return gefunden.full_slug;
}

// Das CLI legt Assets als <name>_<id>.<endung> ab.
export function bildDatei(asset: StoryblokAsset): ImageMetadata {
	const datei = Object.entries(bildDateien).find(([pfad]) => pfad.includes(`_${asset.id}.`));
	if (!datei) throw new Error(`Beispielinhalte: Asset ${asset.id} fehlt in storyblok/assets/.`);
	return datei[1];
}

// Asset-Links im Rich Text tragen nur die URL, deshalb Suche über die Asset-JSONs neben den Dateien.
export async function datei(url: string): Promise<Uint8Array> {
	const json = assets.find(([, a]) => a.filename === url)?.[0];
	if (!json) throw new Error(`Beispielinhalte: Asset ${url.split("/").pop()} fehlt in storyblok/assets/.`);
	const endung = url.split(".").pop();
	return readFileSync(json.slice(1).replace(/\.json$/, `.${endung}`));
}
