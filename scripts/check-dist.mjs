// Lässt den Build scheitern, wenn der Output „storyblok“ (Code, URLs) oder data-blok-Attribute enthält (ADR-0002, ADR-0009).
// Bewusst grob; bei Fehlalarmen auf Storyblok-Domains einengen.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dist = process.argv[2] ?? "dist";
const treffer = readdirSync(dist, { recursive: true, withFileTypes: true })
	.filter((e) => e.isFile())
	.map((e) => join(e.parentPath, e.name))
	.filter((datei) => /storyblok|data-blok/i.test(readFileSync(datei, "latin1")));

if (treffer.length) {
	console.error(`check-dist: „storyblok“ bzw. data-blok gefunden in:\n  ${treffer.join("\n  ")}`);
	process.exit(1);
}
console.log(`check-dist: ${dist} ist frei von Storyblok.`);
