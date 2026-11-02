// Inhaltsquelle: das einzige Modul, über das Seiten und Komponenten an Inhalte kommen.
// Liefert fertige Daten in Begriffen des Glossars; dahinter Storyblok oder die Beispielinhalte im Repo.
import type { ImageMetadata } from "astro";
import type {
	AktuellesSeite as AktuellesSeiteStory,
	Album as AlbumStory,
	Beitrag as BeitragStory,
	Download as DownloadStory,
	DownloadKategorie as DownloadKategorieStory,
	DownloadsSeite as DownloadsSeiteStory,
	Faq as FaqStory,
	Galerie as GalerieStory,
	GlobaleAngaben as GlobaleAngabenStory,
	Kontakt as KontaktStory,
	Startseite as StartseiteStory,
	Tagesablauf as TagesablaufStory,
	Rechtstext as RechtstextStory,
	Termin as TerminStory,
	UeberUns as UeberUnsStory,
	Vorstand as VorstandStory,
} from "../../storyblok/types/storyblok-components";
import { type Kalendertag, kalendertag } from "../lib/datum";
import { einmal } from "../lib/einmal";
import { VORSCHAU } from "../variante";
import { bild, quelle } from "./quelle";
import { dateiPfad, type RichText, richText, verlinkteDateien } from "./rich-text";

export type { RichText, RichTextKnoten } from "./rich-text";

/** Ein Bild, das beim Build über astro:assets same-origin ausgeliefert wird (ADR-0003). */
export interface Bild {
	src: ImageMetadata | string;
	alt: string;
}

/** HTML-Attribute für Klick-zum-Bearbeiten im Visual Editor; außerhalb der Vorschau leer. */
export type Bearbeiten = Record<string, string>;

export interface GlobaleAngaben {
	bearbeiten: Bearbeiten;
	name: string;
	logo: Bild;
	footerText: string;
	kontakt: { strasse: string; ort: string; telefon?: string; email?: string };
	oeffnungszeiten: string[];
}

export interface Startseite {
	bearbeiten: Bearbeiten;
	hero: { titel: string; text: string; bild: Bild };
	konzept: { titel: string; text: string };
	kontaktCta: { titel: string; text: string; button: string };
}

export interface Beitrag {
	bearbeiten: Bearbeiten;
	slug: string;
	titel: string;
	datum: Kalendertag;
	teaserbild: Bild;
	kurztext: string;
	text: RichText;
}

/** Überschrift und Intro einer Listenseite (Galerie, Aktuelles, Downloads). */
export interface Listenseite {
	bearbeiten: Bearbeiten;
	titel: string;
	intro: string;
}

export interface Album {
	bearbeiten: Bearbeiten;
	slug: string;
	titel: string;
	/** Datum des Anlasses. */
	datum: Kalendertag;
	fotos: Bild[];
}

/** Ein Termin, optional mit Enddatum. */
export interface Termin {
	bearbeiten: Bearbeiten;
	titel: string;
	datum: Kalendertag;
	uhrzeit?: string;
	enddatum?: Kalendertag;
	kurztext?: string;
}

export interface Kontakt {
	bearbeiten: Bearbeiten;
	intro: { titel: string; text: string };
	kitaportal: { titel: string; text: string; url: string; linkText: string };
	karte: { bild: Bild; quelle: string; url: string; linkText: string };
}

// Wie storyblokEditable aus @storyblok/js, ohne Storyblok-Code in den Prod-Build zu holen.
function bearbeiten(blok: { _editable?: string }): Bearbeiten {
	if (!VORSCHAU || !blok._editable) return {};
	const c = JSON.parse(blok._editable.replace(/^<!--#storyblok#/, "").replace(/-->$/, ""));
	return { "data-blok-c": JSON.stringify(c), "data-blok-uid": `${c.id}-${c.uid}` };
}

const zeilen = (text = "") => text.split("\n").map((z) => z.trim()).filter(Boolean);
const abbrechen = (meldung: string): never => {
	throw new Error(meldung);
};

// Alle Funktionen laden über einmal(): Header, Footer, Teilen-Bild und Dateien brauchen dieselben Inhalte auf vielen Seiten.

export const globaleAngaben = einmal(async (): Promise<GlobaleAngaben> => {
	const s = await quelle.story<GlobaleAngabenStory>("globale-angaben");
	return {
		bearbeiten: bearbeiten(s),
		name: s.name,
		logo: await bild(s.logo),
		footerText: s.footer_text ?? "",
		kontakt: { strasse: s.strasse, ort: s.ort, telefon: s.telefon || undefined, email: s.email || undefined },
		oeffnungszeiten: zeilen(s.oeffnungszeiten),
	};
});

export const startseite = einmal(async (): Promise<Startseite> => {
	const s = await quelle.story<StartseiteStory>("startseite");
	return {
		bearbeiten: bearbeiten(s),
		hero: { titel: s.hero_titel, text: s.hero_text ?? "", bild: await bild(s.hero_bild) },
		konzept: { titel: s.konzept_titel, text: s.konzept_text },
		kontaktCta: { titel: s.kontakt_titel, text: s.kontakt_text ?? "", button: s.kontakt_button },
	};
});

/** Aktuelles: alle Beiträge, neueste zuerst. */
export const beitraege = einmal(async (): Promise<Beitrag[]> => {
	const stories = await quelle.storiesDesTyps<BeitragStory>("beitrag");
	const liste = await Promise.all(
		stories.map(async ({ slug, content: c }) => ({
			bearbeiten: bearbeiten(c),
			slug,
			titel: c.titel,
			datum: kalendertag(c.datum) ?? abbrechen(`Inhaltsquelle: Beitrag „${c.titel}“ ohne Datum.`),
			teaserbild: await bild(c.teaserbild),
			kurztext: c.kurztext,
			text: await richText(c.text),
		})),
	);
	return liste.sort((a, b) => b.datum.localeCompare(a.datum));
});

// Aktuelles und Downloads sind Ordner; ihre Seite ist jeweils die Startseite des Ordners (full_slug „<ordner>/“).
export const listenseite = einmal(async (slug: "galerie" | "aktuelles/" | "downloads/"): Promise<Listenseite> => {
	const s = await quelle.story<GalerieStory | AktuellesSeiteStory | DownloadsSeiteStory>(slug);
	return { bearbeiten: bearbeiten(s), titel: s.titel, intro: s.intro ?? "" };
});

/** Alle Alben, neueste zuerst. */
export const alben = einmal(async (): Promise<Album[]> => {
	const liste = await Promise.all(
		(await quelle.storiesDesTyps<AlbumStory>("album")).map(async ({ slug, content: s }) => ({
			bearbeiten: bearbeiten(s),
			slug,
			titel: s.titel,
			datum: kalendertag(s.datum) ?? abbrechen(`Inhaltsquelle: Album „${s.titel}“ ohne Datum.`),
			fotos: await Promise.all(s.fotos.map(bild)),
		})),
	);
	return liste.sort((a, b) => b.datum.localeCompare(a.datum));
});

export interface Vorstandsmitglied {
	bearbeiten: Bearbeiten;
	name: string;
	rolle: string;
	foto?: Bild;
	email?: string;
}

export interface Vorstand {
	bearbeiten: Bearbeiten;
	titel: string;
	intro: string;
	mitglieder: Vorstandsmitglied[];
	beitritt: { titel: string; text: string };
}

export const vorstand = einmal(async (): Promise<Vorstand> => {
	const s = await quelle.story<VorstandStory>("vorstand");
	return {
		bearbeiten: bearbeiten(s),
		titel: s.titel,
		intro: s.intro ?? "",
		mitglieder: await Promise.all(
			(s.mitglieder ?? []).map(async (m) => ({
				bearbeiten: bearbeiten(m),
				name: m.name,
				rolle: m.rolle,
				// Ein leeres Asset-Feld kommt als Objekt ohne filename.
				foto: m.foto?.filename ? await bild(m.foto) : undefined,
				email: m.email?.trim() || undefined,
			})),
		),
		beitritt: { titel: s.beitritt_titel, text: s.beitritt_text },
	};
});

export interface Zeitblock {
	bearbeiten: Bearbeiten;
	uhrzeit: string;
	beschreibung: string;
}

export interface Tagesablauf {
	bearbeiten: Bearbeiten;
	titel: string;
	intro: string;
	zeitbloecke: Zeitblock[];
}

export const tagesablauf = einmal(async (): Promise<Tagesablauf> => {
	const s = await quelle.story<TagesablaufStory>("tagesablauf");
	return {
		bearbeiten: bearbeiten(s),
		titel: s.titel,
		intro: s.intro ?? "",
		zeitbloecke: (s.zeitbloecke ?? []).map((z) => ({ bearbeiten: bearbeiten(z), uhrzeit: z.uhrzeit, beschreibung: z.beschreibung })),
	};
});

export interface Faq {
	bearbeiten: Bearbeiten;
	titel: string;
	intro: string;
	fragen: { bearbeiten: Bearbeiten; frage: string; antwort: string }[];
}

export const faq = einmal(async (): Promise<Faq> => {
	const s = await quelle.story<FaqStory>("faq");
	return {
		bearbeiten: bearbeiten(s),
		titel: s.titel,
		intro: s.intro ?? "",
		fragen: (s.fragen ?? []).map((f) => ({ bearbeiten: bearbeiten(f), frage: f.frage, antwort: f.antwort })),
	};
});

/** Alle Termine nach Datum aufsteigend; vergangene bleiben stehen, bis die Redaktion sie löscht. */
export const termine = einmal(async (): Promise<Termin[]> =>
	(await quelle.storiesDesTyps<TerminStory>("termin"))
		.map(({ content: t }) => ({
			bearbeiten: bearbeiten(t),
			titel: t.titel,
			datum: kalendertag(t.datum) ?? abbrechen(`Inhaltsquelle: Termin „${t.titel}“ ohne Datum.`),
			uhrzeit: t.uhrzeit || undefined,
			enddatum: kalendertag(t.enddatum),
			kurztext: t.kurztext || undefined,
		}))
		.sort((a, b) => a.datum.localeCompare(b.datum)),
);

/** Ein Download; `datei` ist der same-origin Pfad, unter dem die Datei beim Build abgelegt wird. */
export interface Download {
	bearbeiten: Bearbeiten;
	titel: string;
	datei: string;
}

export interface DownloadKategorie {
	bearbeiten: Bearbeiten;
	titel: string;
	downloads: Download[];
}

/** Download-Kategorien in der Reihenfolge im Ordner, Downloads darin nach Titel; leere Kategorien entfallen. */
export const downloadKategorien = einmal(async (): Promise<DownloadKategorie[]> => {
	const [kategorien, downloads] = await Promise.all([
		quelle.storiesDesTyps<DownloadKategorieStory>("download_kategorie"),
		quelle.storiesDesTyps<DownloadStory>("download"),
	]);
	const mitDatei = downloads.map(({ content: d }) => ({
		bearbeiten: bearbeiten(d),
		titel: d.titel,
		kategorie: d.kategorie,
		datei: dateiPfad(d.datei?.filename || abbrechen(`Inhaltsquelle: Download „${d.titel}“ ohne Datei.`)),
	}));
	return kategorien
		.toSorted((a, b) => a.position - b.position)
		.map((k) => ({
			bearbeiten: bearbeiten(k.content),
			titel: k.content.titel,
			downloads: mitDatei
				.filter((d) => d.kategorie === k.uuid)
				.toSorted((a, b) => a.titel.localeCompare(b.titel, "de"))
				.map(({ bearbeiten, titel, datei }) => ({ bearbeiten, titel, datei })),
		}))
		.filter((k) => k.downloads.length);
});

export const kontakt = einmal(async (): Promise<Kontakt> => {
	const s = await quelle.story<KontaktStory>("kontakt");
	return {
		bearbeiten: bearbeiten(s),
		intro: { titel: s.intro_titel, text: s.intro_text ?? "" },
		kitaportal: { titel: s.kitaportal_titel, text: s.kitaportal_text, url: s.kitaportal_url, linkText: s.kitaportal_link_text },
		karte: { bild: await bild(s.karte_bild), quelle: s.karte_quelle, url: s.karte_url, linkText: s.karte_link_text },
	};
});

export interface UeberUns {
	bearbeiten: Bearbeiten;
	titel: string;
	intro: string;
	text: RichText;
	bilder: Bild[];
}

export const ueberUns = einmal(async (): Promise<UeberUns> => {
	const s = await quelle.story<UeberUnsStory>("ueber-uns");
	return {
		bearbeiten: bearbeiten(s),
		titel: s.titel,
		intro: s.intro ?? "",
		text: await richText(s.text),
		bilder: await Promise.all((s.bilder ?? []).map(bild)),
	};
});

/** Impressum oder Datenschutzerklärung. */
export interface Rechtstext {
	bearbeiten: Bearbeiten;
	titel: string;
	text: RichText;
}

export const rechtstext = einmal(async (slug: "impressum" | "datenschutz"): Promise<Rechtstext> => {
	const s = await quelle.story<RechtstextStory>(slug);
	return { bearbeiten: bearbeiten(s), titel: s.titel, text: await richText(s.text) };
});

/** Alle verlinkten Dateien (Downloads, PDFs im Rich Text) mit ihrem Pfad; der Build legt sie same-origin ab (ADR-0003). */
export async function dateien(): Promise<{ pfad: string; inhalt: () => Promise<Uint8Array> }[]> {
	// shortcut: sammelt nur Dateien der hier geladenen Inhalte; ein neuer Inhaltstyp mit Rich Text oder Datei muss hier dazu,
	// sonst fehlt seine Datei im Build (404). Bei vielen Typen die Dateien beim Rendern der Seiten sammeln.
	await Promise.all([beitraege(), ueberUns(), rechtstext("impressum"), rechtstext("datenschutz"), downloadKategorien()]);
	return verlinkteDateien();
}
