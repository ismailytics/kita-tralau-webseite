// Storyblok-Rich-Text → RichText der Inhaltsquelle: Bilder über astro:assets, Links auf eigene Pfade (ADR-0003).
import type { StoryblokAsset } from "../../storyblok/storyblok";
import type { Bild } from "./index";
import { bild, quelle } from "./quelle";

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

// ProseMirror-JSON, nur mit den Attributen, die hier gebraucht werden; die generierten Typen kennen jede Knotenart einzeln.
type SbAttrs = { level?: number; id?: number; src?: string; alt?: string; linktype?: string; href?: string; uuid?: string; anchor?: string; target?: string };
type SbKnoten = { type: string; text?: string; attrs?: SbAttrs; marks?: SbKnoten[]; content?: SbKnoten[] };

const dateien = new Map<string, string>();

/** Same-origin-Pfad einer Asset-Datei (z. B. PDF); der Build legt sie dort ab. */
export function dateiPfad(url: string): string {
	// https://a.storyblok.com/f/<space>/<hash>/<name> → /dateien/<hash>/<name>
	const pfad = `/dateien/${new URL(url).pathname.split("/").slice(-2).join("/")}`;
	dateien.set(pfad, url);
	return pfad;
}

/** Alle bisher per dateiPfad() verlinkten Dateien. */
export const verlinkteDateien = () => [...dateien].map(([pfad, url]) => ({ pfad, inhalt: () => quelle.datei(url) }));

async function linkZiel(a: SbAttrs): Promise<{ href: string; extern?: boolean }> {
	const anker = a.anchor ? `#${a.anchor}` : "";
	switch (a.linktype) {
		case "story": {
			const slug = await quelle.fullSlug(a.uuid ?? "");
			return { href: (slug === "startseite" ? "/" : `/${slug}`) + anker };
		}
		case "asset":
			return { href: dateiPfad(a.href ?? "") };
		case "email":
			return { href: `mailto:${a.href}` };
		default:
			return { href: (a.href ?? "") + anker, extern: a.target === "_blank" };
	}
}

async function knoten(liste: SbKnoten[] = []): Promise<RichText> {
	return Promise.all(
		liste.map(async ({ type, text, attrs, marks, content }) => ({
			type,
			text,
			level: attrs?.level,
			bild: type === "image" ? await bild({ id: attrs?.id, filename: attrs?.src, alt: attrs?.alt } as StoryblokAsset) : undefined,
			marks: marks && (await Promise.all(marks.map(async (m) => ({ type: m.type, ...(m.type === "link" ? await linkZiel(m.attrs ?? {}) : {}) })))),
			content: content && (await knoten(content)),
		})),
	);
}

export const richText = (feld?: { content?: unknown }): Promise<RichText> => knoten(feld?.content as SbKnoten[] | undefined);
