// Lokale Vorschau für den Visual Editor (ADR-0009): baut dist-vorschau/ aus den Entwürfen im Space, liefert es per HTTPS
// auf https://localhost:4443/ aus und baut neu, sobald sich ein Entwurf ändert. Ersetzt lokal den späteren Webhook.
// Braucht STORYBLOK_TOKEN (Preview-Token) und ein Zertifikat aus `pnpm vorschau:zertifikat`.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import https from "node:https";
import { extname, join, resolve } from "node:path";

const PORT = 4443;
const ROOT = resolve("dist-vorschau");
const ZERTIFIKAT = ".vorschau";
const TYPEN = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript",
	".css": "text/css",
	".txt": "text/plain",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".webp": "image/webp",
	".avif": "image/avif",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
};

const token = process.env.STORYBLOK_TOKEN;
if (!token) throw new Error("STORYBLOK_TOKEN fehlt (Preview-Token des Space).");
if (!existsSync(join(ZERTIFIKAT, "cert.pem"))) throw new Error("Zertifikat fehlt: einmal `pnpm vorschau:zertifikat` ausführen.");

const bauen = () => {
	const start = Date.now();
	execFileSync("pnpm", ["exec", "astro", "build"], {
		env: { ...process.env, VARIANTE: "vorschau", INHALTSQUELLE: "storyblok" },
		stdio: ["ignore", "ignore", "inherit"],
	});
	console.log(`[${new Date().toLocaleTimeString("de-DE")}] Vorschau gebaut in ${((Date.now() - start) / 1000).toFixed(1)} s`);
};

// Fingerabdruck aller Entwürfe; cv umgeht den CDN-Cache.
// shortcut: nur die ersten 100 Stories, Änderungen an weiteren lösen keinen Neubau aus; bei mehr Stories paginieren.
const entwuerfe = async () => {
	const url = `https://api.storyblok.com/v2/cdn/stories?version=draft&per_page=100&token=${token}&cv=${Date.now()}`;
	const antwort = await fetch(url);
	if (!antwort.ok) throw new Error(`Storyblok → HTTP ${antwort.status}`);
	return createHash("sha1").update(await antwort.text()).digest("hex");
};

let stand = await entwuerfe();
bauen();

https
	.createServer({ key: readFileSync(join(ZERTIFIKAT, "key.pem")), cert: readFileSync(join(ZERTIFIKAT, "cert.pem")) }, (req, res) => {
		let datei = join(ROOT, decodeURIComponent(new URL(req.url, "https://localhost").pathname));
		if (!datei.startsWith(ROOT)) return res.writeHead(403).end();
		if (existsSync(datei) && statSync(datei).isDirectory()) datei = join(datei, "index.html");
		// Unbekannte Pfade (z. B. die Story „globale-angaben“ im Editor) zeigen die Startseite.
		if (!existsSync(datei)) datei = join(ROOT, "index.html");
		if (!existsSync(datei)) return res.writeHead(503).end("Vorschau wird gebaut …");
		res.writeHead(200, { "content-type": TYPEN[extname(datei)] ?? "application/octet-stream", "cache-control": "no-store" });
		res.end(readFileSync(datei));
	})
	.listen(PORT, "localhost", () => console.log(`Vorschau: https://localhost:${PORT}/`));

let baut = false;
setInterval(async () => {
	if (baut) return;
	baut = true;
	try {
		const neu = await entwuerfe();
		if (neu !== stand) {
			stand = neu;
			bauen();
		}
	} catch (e) {
		console.error(`Vorschau: ${e.message}`);
	} finally {
		baut = false;
	}
}, 2000);
