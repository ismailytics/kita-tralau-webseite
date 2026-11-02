import type { APIRoute, GetStaticPaths } from "astro";
import { dateien } from "@/inhaltsquelle";

// Downloads und aus Rich Text verlinkte Dateien: beim Build geladen, same-origin ausgeliefert (ADR-0003).
export const getStaticPaths = (async () =>
	(await dateien()).map(({ pfad, inhalt }) => ({
		params: { pfad: pfad.replace(/^\/dateien\//, "") },
		props: { inhalt },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(await props.inhalt());
