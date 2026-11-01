/* Site-wide behaviour: theme, navigation, scroll progress, reveals, toast.
   Page-specific features are loaded on demand from js/pages/. */
import { $, $$ } from './lib.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* theme: the head script has already set data-theme before first paint */
const themeBtn = $('#themeToggle');
const syncThemeBtn = () => {
  const dark = root.dataset.theme === 'dark';
  themeBtn.setAttribute('aria-pressed', String(dark));
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
};
if (themeBtn) {
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('asc-theme', root.dataset.theme); } catch { /* storage unavailable: theme still applies for this visit */ }
    syncThemeBtn();
  });
}

/* sticky nav: shrink + shadow on scroll, scroll-progress bar */
const nav = $('#siteNav'), bar = $('#progress');
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav?.classList.toggle('scrolled', y > 24);
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    ticking = false;
  });
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* mobile menu */
const toggle = $('#navToggle'), links = $('#navLinks');
if (toggle && links) {
  const setOpen = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); } });
  matchMedia('(min-width:1180px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
}

/* reveal on scroll */
const reveals = $$('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => io.observe(el));
} else reveals.forEach((el) => el.classList.add('in'));

/* count-up numbers (final value is already in the HTML) */
const counters = $$('[data-count]');
if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, end = Number(el.dataset.count), t0 = performance.now(), dur = 1100;
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  counters.forEach((el) => io.observe(el));
}

/* toast + copy-to-clipboard */
let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg; el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.hidden = true; }, 300); }, 2600);
}
$$('[data-copy]').forEach((btn) => {
  if (!navigator.clipboard) return;
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); toast('Email address copied'); }
    catch { toast('Could not copy. Please select and copy the address instead.'); }
  });
});

/* app features (offline, install, share, back-to-top) */
import('./pwa.js').then((m) => m.init(toast)).catch(() => {});

/* page modules, loaded only where needed */
const modules = { practice: './pages/practice.js', wordbank: './pages/wordbank.js', register: './pages/register.js', gallery: './pages/gallery.js' };
const mod = modules[document.body.dataset.page];
if (mod) import(mod).catch(() => toast('Part of this page failed to load. Please refresh.'));
