/** Ein Datum ohne Uhrzeit als „JJJJ-MM-TT“ (Beitrag, Album, Termin). */
export type Kalendertag = string;

/** Storyblok-Datumsfeld „JJJJ-MM-TT HH:mm“ → Kalendertag; leeres Feld → undefined. */
export const kalendertag = (wert?: string): Kalendertag | undefined => wert?.slice(0, 10) || undefined;

// UTC, damit der Kalendertag unabhängig von der Zeitzone des Builds derselbe bleibt.
const lang = new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "UTC" });
const mitWochentag = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const alsDate = (tag: Kalendertag) => new Date(`${tag}T00:00:00Z`);

/** „2026-06-27“ → „27. Juni 2026“ */
export const datumLang = (tag: Kalendertag) => lang.format(alsDate(tag));

/** Termin mit Wochentag, mit Enddatum als Zeitraum: „Sa., 27. Juni 2026“, „Mi., 23. – Do., 31. Dez. 2026“. */
export const terminDatum = (von: Kalendertag, bis?: Kalendertag) =>
	bis ? mitWochentag.formatRange(alsDate(von), alsDate(bis)) : mitWochentag.format(alsDate(von));
