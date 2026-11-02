// Legt jede Download-Datei beim Build unter /downloads/dateien/<asset-id>/<dateiname> ab.
import type { APIRoute, GetStaticPaths } from "astro";
import { downloadDateien } from "@/inhaltsquelle";

export const getStaticPaths = (async () =>
	(await downloadDateien()).map(({ pfad, inhalt }) => ({
		params: { pfad: pfad.replace("/downloads/dateien/", "") },
		props: { inhalt },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(await props.inhalt());
