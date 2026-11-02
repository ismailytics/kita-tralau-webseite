/** "2026-06-27" → "27. Juni 2026" */
export const datumLang = (datum: string) =>
	new Date(datum).toLocaleDateString("de-DE", { dateStyle: "long", timeZone: "UTC" });
