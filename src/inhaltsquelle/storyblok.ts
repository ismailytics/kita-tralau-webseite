// Storyblok: veröffentlichte Inhalte (in der Vorschau Entwürfe) über die Content Delivery API, nur zur Build-Zeit.
import type { StoryblokAsset } from "../../storyblok/storyblok";
import { einmal } from "../lib/einmal";
import { VORSCHAU } from "../variante";
import { abrufen, dateiInhalt, versioniert } from "./abruf";

type Story<T> = { uuid: string; slug: string; full_slug: string; position: number; content: T };

const version = VORSCHAU ? "draft" : "published";

// api.storyblok.com ist der Endpunkt der Region EU.
async function cdn<A>(pfad: string, params: Record<string, string> = {}): Promise<A> {
	const token = process.env.STORYBLOK_TOKEN;
	if (!token) throw new Error("Inhaltsquelle Storyblok: STORYBLOK_TOKEN fehlt.");
	const suche = new URLSearchParams({ ...params, version, token });
	return (await abrufen(`https://api.storyblok.com/v2/cdn/${pfad}?${suche}`, pfad)).json();
}

export async function story<T>(slug: string): Promise<T> {
	return (await cdn<{ story: Story<T> }>(`stories/${slug}`)).story.content;
}

// shortcut: nur die ersten 100 Stories eines Typs, bei mehr paginieren.
export async function storiesDesTyps<T>(inhaltstyp: string): Promise<Pick<Story<T>, "uuid" | "slug" | "position" | "content">[]> {
	const { stories } = await cdn<{ stories: Story<T>[] }>("stories", { content_type: inhaltstyp, per_page: "100" });
	return stories.map(({ uuid, slug, position, content }) => ({ uuid, slug, position, content }));
}

export async function fullSlug(uuid: string): Promise<string> {
	return (await cdn<{ story: Story<unknown> }>(`stories/${uuid}`, { find_by: "uuid" })).story.full_slug;
}

// Remote-URL der Storyblok-Asset-Domain mit Inhalts-Hash; astro:assets lädt sie beim Build herunter (image.domains).
// shortcut: jedes Bild wird zum Hashen einmal extra geladen, bei sehr vielen Bildern ETag statt Inhalt hashen.
const bildVersion = einmal(versioniert);
export const bildDatei = (asset: StoryblokAsset): Promise<string> => bildVersion(asset.filename);

// Dateien werden beim Build geladen und same-origin ausgeliefert, wie Bilder (ADR-0003).
export const datei = dateiInhalt;
