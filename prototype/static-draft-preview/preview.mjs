// PROTOTYP: HTTPS-Server für dist-preview + Watcher, der bei Draft-Änderung neu baut und die Zeiten loggt.
import https from 'node:https';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = 'dist-preview';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

https.createServer({ key: readFileSync('key.pem'), cert: readFileSync('cert.pem') }, (req, res) => {
  if (!req.url.startsWith('/build.txt')) console.log(`[req] ${req.url.slice(0, 120)} · referer ${req.headers.referer ?? '-'} · sec-fetch-dest ${req.headers['sec-fetch-dest'] ?? '-'}`);
  let p = join(ROOT, decodeURIComponent(new URL(req.url, 'https://x').pathname));
  if (!existsSync(p) || statSync(p).isDirectory()) p = existsSync(join(p, 'index.html')) ? join(p, 'index.html') : join(ROOT, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  res.end(readFileSync(p));
}).listen(4443, () => console.log('Vorschau: https://localhost:4443/'));

// Ersetzt den späteren Storyblok-Webhook: Draft-Story pollen, bei Änderung neu bauen.
const url = () => `https://api.storyblok.com/v2/cdn/stories/home?version=draft&token=${process.env.STORYBLOK_TOKEN}&cv=${Date.now()}`;
let last, building = false;
setInterval(async () => {
  if (building) return;
  const story = (await (await fetch(url())).json()).story;
  const sig = JSON.stringify(story.content);
  if (last && sig !== last) {
    building = true;
    const t0 = Date.now();
    console.log(`[${new Date().toLocaleTimeString('de-DE')}] Änderung erkannt (Story updated_at ${story.updated_at}) → baue …`);
    execSync('pnpm -s build:preview', { stdio: 'ignore' });
    console.log(`   Build fertig nach ${((Date.now() - t0) / 1000).toFixed(1)} s; Seite lädt sich binnen ~1,5 s neu.`);
    building = false;
  }
  last = sig;
}, 2000);
