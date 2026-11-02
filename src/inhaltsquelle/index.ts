// Inhaltsquelle: das einzige Modul, über das Seiten und Komponenten an Inhalte kommen.
// Liefert fertige Daten in Begriffen des Glossars; dahinter Storyblok oder die Beispielinhalte im Repo.
import type { ImageMetadata } from "astro";
import type { StoryblokAsset } from "../../storyblok/storyblok";
import type {
	Beitrag as BeitragStory,
	Download as DownloadStory,
	DownloadKategorie as DownloadKategorieStory,
	Faq as FaqStory,
	GlobaleAngaben as GlobaleAngabenStory,
	Startseite as StartseiteStory,
	Tagesablauf as TagesablaufStory,
	Termin as TerminStory,
	Vorstand as VorstandStory,
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

/** Ein Termin; Daten als ISO-Datum (JJJJ-MM-TT). */
export interface Termin {
	titel: string;
	datum: string;
	uhrzeit?: string;
	enddatum?: string;
	kurztext?: string;
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
	const stories = await quelle.alleStories<BeitragStory>("beitrag");
	const liste = await Promise.all(
		stories.map(async ({ slug, content: c }) => ({
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

/** Alle aus Rich Text verlinkten Asset-Dateien; der Build legt sie unter ihrem eigenen Pfad ab. */
export async function richTextDateien(): Promise<{ pfad: string; inhalt: () => Promise<Uint8Array> }[]> {
	await beitraege();
	return [...dateiLinks].map(([pfad, url]) => ({ pfad, inhalt: () => quelle.datei({ filename: url } as StoryblokAsset) }));
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

export interface Vorstandsmitglied {
	name: string;
	rolle: string;
	foto?: Bild;
	email?: string;
}

export interface Vorstand {
	titel: string;
	intro: string;
	mitglieder: Vorstandsmitglied[];
	beitritt: { titel: string; text: string };
}

export async function vorstand(): Promise<Vorstand> {
	const s = await quelle.story<VorstandStory>("vorstand");
	return {
		titel: s.titel,
		intro: s.intro ?? "",
		mitglieder: (s.mitglieder ?? []).map((m) => ({
			name: m.name,
			rolle: m.rolle,
			// Ein leeres Asset-Feld kommt als Objekt ohne filename.
			foto: m.foto?.filename ? bild(m.foto) : undefined,
			email: m.email?.trim() || undefined,
		})),
		beitritt: { titel: s.beitritt_titel, text: s.beitritt_text },
	};
}

export interface Zeitblock {
	uhrzeit: string;
	beschreibung: string;
}

export interface Tagesablauf {
	titel: string;
	intro: string;
	zeitbloecke: Zeitblock[];
}

export async function tagesablauf(): Promise<Tagesablauf> {
	const s = await quelle.story<TagesablaufStory>("tagesablauf");
	return {
		titel: s.titel,
		intro: s.intro ?? "",
		zeitbloecke: (s.zeitbloecke ?? []).map((z) => ({ uhrzeit: z.uhrzeit, beschreibung: z.beschreibung })),
	};
}

export interface Faq {
	titel: string;
	intro: string;
	fragen: { frage: string; antwort: string }[];
}

export async function faq(): Promise<Faq> {
	const s = await quelle.story<FaqStory>("faq");
	return {
		titel: s.titel,
		intro: s.intro ?? "",
		fragen: (s.fragen ?? []).map((f) => ({ frage: f.frage, antwort: f.antwort })),
	};
}

// Storyblok liefert Datumsfelder als „JJJJ-MM-TT HH:MM“.
const tag = (wert?: string) => wert?.slice(0, 10) || undefined;
const fehler = (meldung: string): never => {
	throw new Error(meldung);
};

/** Alle Termine nach Datum aufsteigend; vergangene bleiben stehen, bis die Redaktion sie löscht. */
export async function termine(): Promise<Termin[]> {
	const alle = await quelle.alle<TerminStory>("termin");
	return alle
		.map((t) => ({
			titel: t.titel,
			datum: tag(t.datum) ?? fehler(`Inhaltsquelle: Termin „${t.titel}“ ohne Datum.`),
			uhrzeit: t.uhrzeit || undefined,
			enddatum: tag(t.enddatum),
			kurztext: t.kurztext || undefined,
		}))
		.sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Ein Download; `datei` ist der same-origin Pfad, unter dem die Datei beim Build abgelegt wird. */
export interface Download {
	titel: string;
	datei: string;
}

export interface DownloadKategorie {
	titel: string;
	downloads: Download[];
}

async function alleDownloads() {
	return (await quelle.alleStories<DownloadStory>("download")).map(({ content: d }) => {
		if (!d.datei?.filename) throw new Error(`Inhaltsquelle: Download „${d.titel}“ ohne Datei.`);
		return {
			titel: d.titel,
			kategorie: d.kategorie as string,
			asset: d.datei,
			datei: `/downloads/dateien/${d.datei.id}/${d.datei.filename.split("/").pop()}`,
		};
	});
}

/** Download-Kategorien in der Reihenfolge der Redaktion, Downloads darin nach Titel; leere Kategorien entfallen. */
export async function downloadKategorien(): Promise<DownloadKategorie[]> {
	const [kategorien, downloads] = await Promise.all([
		quelle.alleStories<DownloadKategorieStory>("download_kategorie"),
		alleDownloads(),
	]);
	return kategorien
		.toSorted((a, b) => Number(a.content.reihenfolge) - Number(b.content.reihenfolge))
		.map((k) => ({
			titel: k.content.titel,
			downloads: downloads
				.filter((d) => d.kategorie === k.uuid)
				.toSorted((a, b) => a.titel.localeCompare(b.titel, "de"))
				.map(({ titel, datei }) => ({ titel, datei })),
		}))
		.filter((k) => k.downloads.length);
}

/** Alle Download-Dateien mit ihrem Pfad, damit der Build sie same-origin ablegt (ADR-0003). */
export async function downloadDateien(): Promise<{ pfad: string; inhalt: () => Promise<Uint8Array> }[]> {
	return (await alleDownloads()).map((d) => ({ pfad: d.datei, inhalt: () => quelle.datei(d.asset) }));
}
