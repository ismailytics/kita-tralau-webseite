// Schiebt Datasources, Komponenten, Assets und Stories aus storyblok/ in einen Ziel-Space (ADR-0008).
// Braucht STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID des Ziel-Space (Region EU).
// --dry-run: nichts schreiben. --nur-schemas: nur Datasources und Komponenten, Inhalte der Redaktion bleiben unberührt.
// Upsert: Komponenten und Stories werden aktualisiert, vorhandene Assets bleiben, nichts wird gelöscht. Löschungen macht man im Ziel-Space von Hand.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { storyblokZugang } from "./storyblok-zugang.mjs";

// Ordnet lokale Assets vorhandenen im Ziel-Space zu (gleiche ID, sonst gleicher Dateiname), als Einträge fürs CLI-Manifest.
export const assetZuordnung = (lokal, ziel) =>
	lokal.flatMap((asset) => {
		const treffer = ziel.find((z) => z.id === asset.id) ?? ziel.find((z) => z.short_filename === asset.short_filename);
		return treffer ? [{ old_id: asset.id, new_id: treffer.id, old_filename: asset.filename, new_filename: treffer.filename }] : [];
	});

const zielAssets = async (space, pat) => {
	const assets = [];
	for (let page = 1; ; page++) {
		const url = `https://mapi.storyblok.com/v1/spaces/${space}/assets?per_page=100&page=${page}`;
		let res = await fetch(url, { headers: { Authorization: pat } });
		// Rate-Limit der Management-API: kurz warten und erneut versuchen.
		for (let versuch = 1; res.status === 429 && versuch <= 5; versuch++) {
			await new Promise((r) => setTimeout(r, versuch * 1000));
			res = await fetch(url, { headers: { Authorization: pat } });
		}
		if (!res.ok) throw new Error(`Assets des Ziel-Space nicht lesbar: ${res.status} ${res.statusText}`);
		const seite = (await res.json()).assets;
		assets.push(...seite);
		if (seite.length < 100) return assets;
	}
};

if (import.meta.main) {
	const { pat, space, cli: storyblok } = storyblokZugang(" (Ziel-Space)");
	const dryRun = process.argv.includes("--dry-run");
	const nurSchemas = process.argv.includes("--nur-schemas");

	// Das CLI erwartet <dir>/<typ>/<from>/; „beispiel“ ist der Quellname (im Repo steht statt der Space-ID 0).
	const tmp = mkdtempSync(join(tmpdir(), "storyblok-push-"));
	const quelle = (dir) => join(tmp, dir, "beispiel");
	const vorhanden = ["datasources", "components", "assets", "stories"].filter((dir) => existsSync(join("storyblok", dir)));
	for (const dir of vorhanden) cpSync(join("storyblok", dir), quelle(dir), { recursive: true });

	const cli = (...args) => storyblok(tmp, ...args, "--from", "beispiel");

	try {
		for (const typ of ["datasources", "components"].filter((dir) => vorhanden.includes(dir))) {
			// components/datasources push kennen keinen Dry-Run.
			if (dryRun) console.log(`[dry-run] ${typ}: ${readdirSync(quelle(typ)).join(", ")}`);
			else cli(typ, "push", "--sf");
		}
		if (!nurSchemas) {
			if (vorhanden.includes("assets")) {
				const dateien = readdirSync(quelle("assets"));
				const lokal = dateien.filter((d) => d.endsWith(".json")).map((d) => JSON.parse(readFileSync(join(quelle("assets"), d), "utf8")));
				const zuordnung = assetZuordnung(lokal, await zielAssets(space, pat));
				// Das Manifest leitet die Asset-Verweise der Stories auf die vorhandenen Assets um.
				writeFileSync(join(quelle("assets"), "manifest.jsonl"), zuordnung.map((e) => `${JSON.stringify(e)}\n`).join(""));
				// Vorhandene Assets nicht erneut pushen: CLI 4.26 legt beim „Ersetzen“ ein neues Asset an, jeder Lauf gäbe Duplikate.
				// Dadurch bleiben dort Bild und Alt-Text der Redaktion erhalten.
				const vorhandeneIds = new Set(zuordnung.map((e) => String(e.old_id)));
				for (const d of dateien) if (vorhandeneIds.has(d.match(/_(\d+)\.\w+$/)?.[1])) rmSync(join(quelle("assets"), d));
				console.log(`Assets: ${zuordnung.length} schon im Ziel-Space, ${lokal.length - zuordnung.length} neu.`);
				if (zuordnung.length < lokal.length) cli("assets", "push", "--target", "space", ...(dryRun ? ["--dry-run"] : []));
			}
			if (vorhanden.includes("stories")) {
				// Storyblok gibt Ordnern Platzhalter-Inhalt des Standard-Inhaltstyps; der scheitert an der Schema-Validierung.
				for (const d of readdirSync(quelle("stories")).filter((d) => d.endsWith(".json"))) {
					const pfad = join(quelle("stories"), d);
					const story = JSON.parse(readFileSync(pfad, "utf8"));
					if (story.is_folder) writeFileSync(pfad, JSON.stringify({ ...story, content: undefined }));
				}
				cli("stories", "push", "--publish", ...(dryRun ? ["--dry-run"] : []));
			}
		}
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
	console.log(`Storyblok-Push in Space ${space} ${dryRun ? "simuliert" : "fertig"}.`);
}
