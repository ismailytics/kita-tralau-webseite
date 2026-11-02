// Site-Pfade („/kontakt“) unter dem Basis-Pfad ausgeben; der ist nur auf GitHub Pages gesetzt, beim Hoster „/“.
const basis = import.meta.env.BASE_URL.replace(/\/$/, "");

export const pfad = (href: string): string => (href.startsWith("/") && !href.startsWith("//") ? basis + href : href);

/** Aktueller Seitenpfad ohne Basis und ohne Schrägstrich am Ende, zum Vergleich mit Menü-Pfaden. */
export const seitenpfad = (pathname: string): string => pathname.slice(basis.length).replace(/(.)\/$/, "$1") || "/";
