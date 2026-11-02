// Inhaltsquelle: das einzige Modul, über das Seiten und Komponenten an Inhalte kommen.
// Liefert fertige Daten in Begriffen des Glossars; dahinter Storyblok oder die Beispielinhalte im Repo.
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import type {
	Beitrag as BeitragStory,
	GlobaleAngaben as GlobaleAngabenStory,
	Startseite as StartseiteStory,
} from "../../storyblok/types/storyblok-components";
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

export interface Beitrag {
	slug: string;
	titel: string;
	datum: Date;
	teaserbild: Bild;
	kurztext: string;
	text: RichText;
}

/** Fließtext mit aufgelösten Bildern und Links; zeigt nie auf Storyblok (ADR-0003). */
export type RichText = RichTextKnoten[];
export interface RichTextKnoten {
	type: string;
	text?: string;
	level?: number;
	bild?: Bild;
	marks?: { type: string; href?: string; extern?: boolean }[];
	content?: RichTextKnoten[];
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

let alleBeitraege: Promise<Beitrag[]> | undefined;

/** Aktuelles: alle Beiträge, neueste zuerst; einmal pro Build geladen (Liste, Detailseiten, Dateien). */
export function beitraege(): Promise<Beitrag[]> {
	alleBeitraege ??= ladeBeitraege();
	return alleBeitraege;
}

async function ladeBeitraege(): Promise<Beitrag[]> {
	const stories = await quelle.storiesIn<BeitragStory>("aktuelles");
	const liste = await Promise.all(
		stories
			.filter((s) => s.content.component === "beitrag")
			.map(async ({ slug, content: c }) => ({
				slug,
				titel: c.titel,
				// Storyblok liefert „YYYY-MM-DD HH:mm“ in UTC.
				datum: new Date(`${c.datum.replace(" ", "T")}Z`),
				teaserbild: bild(c.teaserbild),
				kurztext: c.kurztext,
				text: await richText(c.text?.content as SbKnoten[]),
			})),
	);
	return liste.sort((a, b) => b.datum.getTime() - a.datum.getTime());
}

// Storyblok-Rich-Text (ProseMirror-JSON), lose typisiert: die generierten Typen kennen jede Knotenart einzeln.
type SbKnoten = { type: string; text?: string; attrs?: Record<string, any>; marks?: SbKnoten[]; content?: SbKnoten[] };

/** Asset-Dateien, auf die Inhalte verlinken: eigener Pfad → Storyblok-URL. */
const dateiLinks = new Map<string, string>();

/** Alle verlinkten Asset-Dateien; der Build legt sie unter ihrem eigenen Pfad ab. */
export async function dateien(): Promise<{ pfad: string; inhalt: () => Promise<Uint8Array> }[]> {
	await beitraege();
	return [...dateiLinks].map(([pfad, url]) => ({ pfad, inhalt: () => quelle.datei(url) }));
}

async function linkZiel(a: Record<string, any>): Promise<{ href: string; extern?: boolean }> {
	const anker = a.anchor ? `#${a.anchor}` : "";
	switch (a.linktype) {
		case "story": {
			const slug = await quelle.fullSlug(a.uuid);
			return { href: (slug === "startseite" ? "/" : `/${slug}`) + anker };
		}
		case "asset": {
			// https://a.storyblok.com/f/<space>/<hash>/<name> → /dateien/<hash>/<name>
			const pfad = `/dateien/${new URL(a.href).pathname.split("/").slice(-2).join("/")}`;
			dateiLinks.set(pfad, a.href);
			return { href: pfad };
		}
		case "email":
			return { href: `mailto:${a.href}` };
		default:
			return { href: a.href + anker, extern: a.target === "_blank" };
	}
}

async function richText(knoten: SbKnoten[] = []): Promise<RichText> {
	return Promise.all(
		knoten.map(async ({ type, text, attrs, marks, content }) => ({
			type,
			text,
			level: attrs?.level,
			bild: type === "image" ? bild({ id: attrs?.id, filename: attrs?.src, alt: attrs?.alt } as StoryblokAsset) : undefined,
			marks: marks && (await Promise.all(marks.map(async (m) => ({ type: m.type, ...(m.type === "link" ? await linkZiel(m.attrs ?? {}) : {}) })))),
			content: content && (await richText(content)),
		})),
	);
}
