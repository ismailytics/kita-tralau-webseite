// Build-Variante (ADR-0009): VARIANTE=vorschau baut Entwürfe mit Storyblok-Bridge für die Redaktion, sonst die öffentliche Site.
export const VORSCHAU = process.env.VARIANTE === "vorschau";

declare const __BUILD_ID__: string;
/** Kennung dieses Builds; die Vorschau vergleicht sie mit /build-id.txt und lädt bei neuem Build neu. */
export const BUILD_ID = __BUILD_ID__;
