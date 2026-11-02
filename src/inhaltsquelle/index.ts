// Inhaltsquelle: das einzige Modul, über das Seiten und Komponenten an Inhalte kommen.
// Liefert fertige Daten in Begriffen des Glossars; dahinter Storyblok oder die Beispielinhalte im Repo.
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import type { GlobaleAngaben as GlobaleAngabenStory, Startseite as StartseiteStory } from "../../storyblok/types/storyblok-components";
import type { Kontakt as KontaktStory } from "../../storyblok/types/storyblok-components";
import * as beispiel from "./beispiel";
import * as storyblok from "./storyblok";

/** Ein Bild, das beim Build über astro:assets same-origin ausgeliefert wird (ADR-0003). */
export interface Bild {
	src: ImageMetadata | string;
	alt: string;
}

export interface GlobaleAngaben {
	name: string;
	logo: Bild;
	footerText: string;
	kontakt: { strasse: string; ort: string; telefon?: string; email?: string };
	oeffnungszeiten: string[];
}

export interface Startseite {
	hero: { titel: string; text: string; bild: Bild };
	konzept: { titel: string; text: string };
	kontaktCta: { titel: string; text: string; button: string };
}

export interface Kontakt {
	intro: { titel: string; text: string };
	kitaportal: { titel: string; text: string; url: string; linkText: string };
	karte: { bild: Bild; quelle: string; url: string; linkText: string };
}

// Auswahl per Umgebungsvariable; ohne Angabe die Beispielinhalte, damit Build und Tests ohne Storyblok-Zugang laufen.
const quelle = process.env.INHALTSQUELLE === "storyblok" ? storyblok : beispiel;

function bild(asset: StoryblokAsset): Bild {
	if (!asset?.filename) throw new Error("Inhaltsquelle: Bild fehlt.");
	if (!asset.alt?.trim()) throw new Error(`Inhaltsquelle: Bild ohne Alt-Text (${asset.filename.split("/").pop()}).`);
	return { src: quelle.bildDatei(asset), alt: asset.alt };
}

const zeilen = (text = "") => text.split("\n").map((z) => z.trim()).filter(Boolean);

let globale: Promise<GlobaleAngaben> | undefined;

/** Globale Angaben; einmal pro Build geladen, weil Header und Footer sie auf jeder Seite brauchen. */
export function globaleAngaben(): Promise<GlobaleAngaben> {
	globale ??= quelle.story<GlobaleAngabenStory>("globale-angaben").then((s) => ({
		name: s.name,
		logo: bild(s.logo),
		footerText: s.footer_text ?? "",
		kontakt: { strasse: s.strasse, ort: s.ort, telefon: s.telefon || undefined, email: s.email || undefined },
		oeffnungszeiten: zeilen(s.oeffnungszeiten),
	}));
	return globale;
}

export async function startseite(): Promise<Startseite> {
	const s = await quelle.story<StartseiteStory>("startseite");
	return {
		hero: { titel: s.hero_titel, text: s.hero_text ?? "", bild: bild(s.hero_bild) },
		konzept: { titel: s.konzept_titel, text: s.konzept_text },
		kontaktCta: { titel: s.kontakt_titel, text: s.kontakt_text ?? "", button: s.kontakt_button },
	};
}

export async function kontakt(): Promise<Kontakt> {
	const s = await quelle.story<KontaktStory>("kontakt");
	return {
		intro: { titel: s.intro_titel, text: s.intro_text ?? "" },
		kitaportal: { titel: s.kitaportal_titel, text: s.kitaportal_text, url: s.kitaportal_url, linkText: s.kitaportal_link_text },
		karte: { bild: bild(s.karte_bild), quelle: s.karte_quelle, url: s.karte_url, linkText: s.karte_link_text },
	};
}
