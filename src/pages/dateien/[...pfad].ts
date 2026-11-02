// Verlinkte Asset-Dateien (z. B. PDFs aus dem Rich Text): beim Build geladen, same-origin ausgeliefert (ADR-0003).
import type { APIRoute, GetStaticPaths } from "astro";
import { richTextDateien } from "@/inhaltsquelle";

export const getStaticPaths = (async () =>
	(await richTextDateien()).map(({ pfad, inhalt }) => ({
		params: { pfad: pfad.replace(/^\/dateien\//, "") },
		props: { inhalt },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(await props.inhalt());
