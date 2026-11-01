/* Site builder. Zero dependencies, runs only inside GitHub Actions.
   Source (repo root) -> dist/. Responsibilities:
   - wrap each page in the shared layout (head, header, footer)
   - pre-render lists (register, schools, gallery, word marquee) so they work without JavaScript
   - keep pupils' ages out of the published data
   - copy only the assets the site actually references
   - write sitemap.xml, robots.txt and the web manifest
   - check that every internal link and image exists */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = (process.env.SITE_URL || 'https://babatundeawo.github.io/akinyele-spelling-challenge/').replace(/\/?$/, '/');
const SITE_NAME = 'Akinyele Spelling Challenge 2026';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);
const problems = [];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

/* ---------- data ---------- */
const words = JSON.parse(read('data/words.json'));
const contestants = JSON.parse(read('data/contestants.json')).map(({ age, ...safe }) => safe); // never publish ages
const schools = JSON.parse(read('data/schools.json'));
const gallery = JSON.parse(read('data/gallery.json'));

/* ---------- pre-rendered fragments ---------- */
const fragments = {
  marquee: () => {
    const items = words.filter((w) => w.category !== 'C').slice(0, 24)
      .map((w) => `<span>${esc(w.word)}<em>${esc(w.ipa)}</em></span>`).join('');
    return items + items; // doubled for a seamless loop
  },
  contestants: () => contestants.map((c) =>
    `<tr><td data-label="No.">${c.no}</td><th scope="row" data-label="Contestant">${esc(c.name)}</th>` +
    `<td data-label="School">${esc(c.school)}</td><td data-label="Class">${esc(c.class)}</td>` +
    `<td data-label="Aspiration">${c.aspiration ? esc(c.aspiration) : '&mdash;'}</td></tr>`).join('\n'),
  schoolOptions: () => schools.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join(''),
  schools: () => schools.map((s) => `<li>${esc(s)}</li>`).join(''),
  gallery: () => gallery.map((g, i) => {
    const full = `assets/img/${g.file ?? `gallery-${g.id}.webp`}`;
    const small = g.file ? null : `assets/img/gallery-${g.id}-480.webp`;
    const src = small && existsSync(join(ROOT, small)) ? small : full;
    const srcset = src !== full ? ` srcset="${src} 480w, ${full} 900w" sizes="(min-width:1000px) 31vw, (min-width:600px) 47vw, 94vw"` : '';
    return `<li><button type="button" class="g-item" data-index="${i}" aria-label="Open photo ${i + 1} of ${gallery.length}: ${esc(g.alt)}">` +
      `<img src="${src}"${srcset} data-full="${full}" width="${g.w ?? 900}" height="${g.h ?? 600}" alt="${esc(g.alt)}" loading="lazy" decoding="async"></button></li>`;
  }).join('\n'),
  counts: () => '',
};

/* ---------- navigation ---------- */
const NAV = [['index.html', 'Home'], ['about.html', 'About'], ['format.html', 'Format'], ['results.html', 'Results'],
  ['practice.html', 'Practice'], ['wordbank.html', 'Word Bank'], ['press.html', 'Press'], ['gallery.html', 'Gallery'],
  ['contestants.html', 'Register'], ['team.html', 'Team']];

/* ---------- templating ---------- */
function parsePage(file) {
  const raw = read(file);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  m[1].split('\n').forEach((l) => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  return { meta, body: m[2] };
}
const partial = (name) => read(`partials/${name}.html`);
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : (problems.push(`unknown placeholder {{${k}}}`), '')));
const themeInit = read('partials/theme-init.js').trim();
const csp = [
  "default-src 'self'", "script-src 'self' 'sha256-" + createHash('sha256').update(themeInit).digest('base64') + "'",
  "style-src 'self'", "img-src 'self' data:", "font-src 'self'", "connect-src 'self'",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "worker-src 'self'", "manifest-src 'self'",
].join('; ');
const cssV = hash(read('css/style.css'));
const jsV = hash(readdirSync(join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => read(`js/${f}`)).join('') +
  readdirSync(join(ROOT, 'js/pages')).map((f) => read(`js/pages/${f}`)).join(''));

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const sitemap = [];

for (const file of pages) {
  const { meta, body } = parsePage(file);
  const is404 = file === '404.html';
  const canonical = SITE + (file === 'index.html' ? '' : file);
  const navHtml = NAV.map(([href, label]) =>
    `<a href="${href}"${href === file ? ' aria-current="page"' : ''}>${label}</a>`).join('\n');
  const ogImage = SITE + 'assets/og-image.png';
  const jsonld = meta.jsonld ? `<script type="application/ld+json">${read(`partials/${meta.jsonld}.json`).replace(/\{\{site\}\}/g, SITE).replace(/\s*\n\s*/g, ' ')}</script>` : '';
  const head = fill(partial('head'), {
    title: esc(meta.title), description: esc(meta.description), canonical, ogImage, csp, themeInit, cssV, jsonld,
    base: is404 ? `<base href="${SITE}">` : '', robots: is404 || file === 'offline.html' ? '<meta name="robots" content="noindex">' : '', site: SITE, siteName: SITE_NAME,
    ogType: file === 'index.html' ? 'website' : 'article',
  });
  const header = partial('sprite') + fill(partial('header'), { nav: navHtml });
  const footer = partial('footer');
  let content = body.replace(/<!--@(\w+)-->/g, (_, k) => (fragments[k] ? fragments[k]() : (problems.push(`${file}: unknown fragment ${k}`), '')));
  const html = fill(partial('layout'), { head, header, footer, content, page: meta.page || 'default', jsV });
  writeFileSync(join(DIST, file), html);
  if (!is404 && file !== 'offline.html') sitemap.push(file === 'index.html' ? '' : file);
}

/* ---------- static files ---------- */
for (const d of ['css', 'js']) cpSync(join(ROOT, d), join(DIST, d), { recursive: true });
mkdirSync(join(DIST, 'data'), { recursive: true });
writeFileSync(join(DIST, 'data/words.json'), JSON.stringify(words));
writeFileSync(join(DIST, 'data/contestants.json'), JSON.stringify(contestants));
writeFileSync(join(DIST, 'data/schools.json'), JSON.stringify(schools));

// Copy only the assets something references, so old unused files never reach the live site.
const textFiles = [];
(function walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p) : /\.(html|css|js|json|webmanifest)$/.test(f) && textFiles.push(readFileSync(p, 'utf8')); } })(DIST);
const corpus = textFiles.join('\n') + JSON.stringify(gallery) + read('partials/manifest.json');
const used = new Set();
(function walk(dir, rel = '') {
  for (const f of readdirSync(join(ROOT, dir))) {
    const p = join(dir, f), r = rel + f;
    if (statSync(join(ROOT, p)).isDirectory()) { walk(p, r + '/'); continue; }
    const galleryMatch = /^gallery-(\d+)(-480)?\.webp$/.exec(f);
    const referenced = corpus.includes(`${dir}/${f}`) || corpus.includes(f) || (galleryMatch && gallery.some((g) => g.id === +galleryMatch[1]));
    if (referenced) { mkdirSync(join(DIST, dir), { recursive: true }); cpSync(join(ROOT, p), join(DIST, p)); used.add(p); }
  }
})('assets');
// root-level static files
writeFileSync(join(DIST, 'manifest.webmanifest'), read('partials/manifest.json').replace(/\{\{site\}\}/g, SITE));
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemap.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
writeFileSync(join(DIST, '.nojekyll'), '');

/* ---------- service worker: precache list and version come from the built files ---------- */
const built = [];
(function walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p) : built.push(p); } })(DIST);
const rel = (p) => p.slice(DIST.length + 1).split('\\').join('/');
const precache = built.map(rel)
  .filter((p) => !/^(sw\.js|robots\.txt|sitemap\.xml|\.nojekyll|404\.html)$/.test(p) && !p.startsWith('assets/screenshots/') && !/^assets\/img\/gallery-/.test(p))
  .sort();
const swVersion = createHash('sha256').update(precache.map((p) => p + readFileSync(join(DIST, p)).length + hash(readFileSync(join(DIST, p)).toString('latin1'))).join('|')).digest('hex').slice(0, 10);
writeFileSync(join(DIST, 'sw.js'), read('build/sw.template.js').replace('__VERSION__', swVersion).replace('__PRECACHE__', JSON.stringify(precache)));

/* ---------- link check (internal only) ---------- */
for (const file of pages) {
  const html = readFileSync(join(DIST, file), 'utf8');
  for (const m of html.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
    for (const ref of m[1].split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(ref) || !ref) continue;
      const [path, hashPart] = ref.split('#');
      const target = path.split('?')[0];
      if (target && !existsSync(join(DIST, target))) problems.push(`${file}: broken reference "${ref}"`);
      else if (hashPart && target.endsWith('.html') && !readFileSync(join(DIST, target), 'utf8').includes(`id="${hashPart}"`)) problems.push(`${file}: missing anchor "${ref}"`);
    }
  }
  if (!/<h1[ >]/.test(html)) problems.push(`${file}: no <h1>`);
}
if (problems.length) { console.error('Build checks failed:\n - ' + problems.join('\n - ')); process.exit(1); }
console.log(`Built ${pages.length} pages, ${used.size} assets -> dist/`);
