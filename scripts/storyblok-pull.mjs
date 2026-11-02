// Zieht Komponenten, Datasources, Stories und Assets aus dem Storyblok-Space nach storyblok/ und erzeugt Typen (ADR-0008).
// Braucht STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID (Region EU).
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { storyblokZugang } from "./storyblok-zugang.mjs";

const { space, cli: storyblok } = storyblokZugang();
const tmp = mkdtempSync(join(tmpdir(), "storyblok-pull-"));
const cli = (...args) => storyblok("--no-ui-enabled", "-p", tmp, ...args);

cli("components", "pull", "--sf");
cli("datasources", "pull", "--sf");
cli("stories", "pull");
cli("assets", "pull");
cli("types", "generate", "--strict");

// Felder, die nur Rauschen sind oder Personen bzw. Vorschau-Hashes enthalten.
const STORY_NOISE = ["preview_token", "last_author", "last_author_id", "user_ids", "space_role_ids", "created_at", "updated_at", "published_at", "first_published_at"];

for (const dir of ["components", "datasources", "stories", "assets", "types"]) {
	const src = join(tmp, dir, space);
	const dest = join("storyblok", dir);
	rmSync(dest, { recursive: true, force: true });
	if (!existsSync(src)) continue;
	cpSync(src, dest, { recursive: true });
	for (const file of readdirSync(dest)) {
		if (file === "manifest.jsonl") {
			rmSync(join(dest, file));
			continue;
		}
		if (!/\.(json|ts)$/.test(file)) continue;
		const path = join(dest, file);
		// Die Space-ID gehört nicht ins Repo; 0 steht für „Quell-Space“.
		let text = readFileSync(path, "utf8").replaceAll(space, "0");
		if (dir === "stories") {
			const story = JSON.parse(text);
			for (const key of STORY_NOISE) delete story[key];
			text = `${JSON.stringify(story, null, 2)}\n`;
		}
		writeFileSync(path, text);
	}
}
// Basistypen (StoryblokAsset usw.), die storyblok/types/*.d.ts als ../storyblok.d.ts importieren.
cpSync(join(tmp, "types", "storyblok.d.ts"), join("storyblok", "storyblok.d.ts"));
rmSync(tmp, { recursive: true, force: true });
console.log("Storyblok-Inhalte nach storyblok/ gezogen.");
