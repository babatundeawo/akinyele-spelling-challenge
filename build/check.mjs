/* Quality checks on the built site (dist/). Errors fail the run; warnings are only reported. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const errors = [], warnings = [];

for (const file of readdirSync(DIST).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(DIST, file), 'utf8');
  const need = (ok, msg) => { if (!ok) errors.push(`${file}: ${msg}`); };
  need(/<html lang="/.test(html), 'missing lang attribute');
  need(/<title>[^<]{5,}<\/title>/.test(html), 'missing or empty <title>');
  need(/<meta name="description" content="[^"]{40,}"/.test(html), 'missing or very short meta description');
  need(/<link rel="canonical" href="https?:\/\//.test(html), 'missing canonical URL');
  need((html.match(/<h1[ >]/g) || []).length === 1, 'page must have exactly one <h1>');
  need(!/\sstyle="/.test(html.replace(/<svg[^>]*class="vh"[^>]*>/, '')), 'inline style attribute (blocked by the Content Security Policy)');
  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    if (!/\salt="/.test(img)) errors.push(`${file}: <img> without alt: ${img.slice(0, 80)}`);
    if (!/\swidth="/.test(img) || !/\sheight="/.test(img)) warnings.push(`${file}: <img> without width/height (can cause layout shift)`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) errors.push(`${file}: duplicate ids ${[...new Set(dup)].join(', ')}`);
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) errors.push(`${file}: external link missing rel="noopener noreferrer"`);
  const t = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  if (t.length > 70) warnings.push(`${file}: title is ${t.length} characters (over 70 may be truncated in search results)`);
}

const jsFiles = [];
(function walk(d) { for (const f of readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(join(d, f.name)) : f.name.endsWith('.js') && jsFiles.push(join(d, f.name)); })(join(ROOT, 'js'));
for (const f of [...jsFiles, join(ROOT, 'build/build.mjs')]) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { errors.push(`syntax error in ${f.replace(ROOT, '')}: ${e.stderr?.toString().split('\n')[0]}`); }
}


/* ---------- installable-app checks ---------- */
import { existsSync } from 'node:fs';
try {
  const man = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'));
  for (const k of ['id', 'name', 'short_name', 'start_url', 'scope', 'lang', 'theme_color', 'background_color']) if (!man[k]) errors.push(`manifest: missing "${k}"`);
  if (man.display !== 'standalone') errors.push('manifest: display must be "standalone"');
  const icons = man.icons || [];
  if (!icons.some((i) => i.sizes === '192x192') || !icons.some((i) => i.sizes === '512x512')) errors.push('manifest: needs 192 and 512 icons');
  if (!icons.some((i) => i.purpose === 'maskable')) errors.push('manifest: needs a maskable icon');
  for (const i of [...icons, ...(man.screenshots || []), ...(man.shortcuts || []).flatMap((s) => s.icons || [])]) if (!existsSync(join(DIST, i.src))) errors.push(`manifest: missing file ${i.src}`);
  for (const s of man.shortcuts || []) if (!existsSync(join(DIST, s.url))) errors.push(`manifest: shortcut target missing ${s.url}`);
} catch (e) { errors.push(`manifest.webmanifest unreadable: ${e.message}`); }
try {
  const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
  if (!sw.includes('"offline.html"')) errors.push('sw.js: offline.html is not precached');
  const list = JSON.parse(sw.match(/const PRECACHE = (\[.*\]);/)[1]);
  for (const p of list) if (!existsSync(join(DIST, p))) errors.push(`sw.js: precache entry missing on disk: ${p}`);
} catch (e) { errors.push(`sw.js check failed: ${e.message}`); }

warnings.forEach((w) => console.warn('warning:', w));
if (errors.length) { console.error('Checks failed:\n - ' + errors.join('\n - ')); process.exit(1); }
console.log(`Checks passed (${warnings.length} warning${warnings.length === 1 ? '' : 's'}).`);
