import type { StoryblokAsset } from "../../storyblok/storyblok";
import * as beispiel from "./beispiel";
import type { Bild } from "./index";
import * as storyblok from "./storyblok";

// Auswahl per Umgebungsvariable; ohne Angabe die Beispielinhalte, damit Build und Tests ohne Storyblok-Zugang laufen.
export const quelle = process.env.INHALTSQUELLE === "storyblok" ? storyblok : beispiel;

export async function bild(asset: StoryblokAsset): Promise<Bild> {
	const { id, filename, alt } = asset ?? {};
	if (!filename) throw new Error("Inhaltsquelle: Bild fehlt.");
	if (!alt?.trim()) throw new Error(`Inhaltsquelle: Bild ohne Alt-Text (${filename.split("/").pop()}).`);
	return { src: await quelle.bildDatei({ id, filename }), alt };
}
