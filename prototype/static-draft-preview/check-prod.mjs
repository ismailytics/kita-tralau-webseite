// PROTOTYP: Prod-Build laden und jede Anfrage an eine fremde Domain auflisten; dist nach "storyblok" durchsuchen.
import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';

const server = http.createServer((req, res) => {
  const p = join('dist-prod', req.url === '/' ? 'index.html' : req.url);
  res.end(existsSync(p) ? readFileSync(p) : '');
}).listen(4444);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const foreign = [];
page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4444')) foreign.push(r.url()); });
await page.goto('http://localhost:4444/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await browser.close(); server.close();

let grep = '';
try { grep = execSync('grep -rIil storyblok dist-prod', { encoding: 'utf8' }); } catch {}
console.log('Fremde Requests:', foreign.length ? foreign : 'keine');
console.log('Dateien in dist-prod mit "storyblok":', grep.trim() || 'keine');
process.exit(foreign.length || grep.trim() ? 1 : 0);
