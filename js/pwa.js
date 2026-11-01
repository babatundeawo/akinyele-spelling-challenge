/* App features: offline support, update message, install prompt (Android/desktop) and Add to Home Screen guide (iOS),
   share button, back-to-top. Everything degrades silently where a browser lacks the feature. */
import { $, $$, store } from './lib.js';

const DISMISS_KEY = 'asc-install-dismissed';
const VISITS_KEY = 'asc-visits';
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function init(toast) {
  setupBackToTop();
  setupShare();
  setupInstall(toast);
  setupOffline(toast);
  setupServiceWorker();
}

function setupBackToTop() {
  const btn = $('#toTop');
  if (!btn) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { btn.hidden = scrollY < 700; ticking = false; });
  }, { passive: true });
  btn.addEventListener('click', () => { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); $('#main')?.focus({ preventScroll: true }); });
}

function setupShare() {
  if (!navigator.share) return;
  $$('[data-share]').forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener('click', () => {
      navigator.share({ title: document.title, text: 'Akinyele Spelling Challenge 2026', url: location.href.split('#')[0] }).catch(() => {});
    });
  });
}

function setupOffline(toast) {
  addEventListener('offline', () => toast('You are offline. Pages you have opened before still work.'));
  addEventListener('online', () => toast('Back online.'));
}

function setupInstall(toast) {
  if (standalone()) return;
  const buttons = $$('[data-install]');
  let deferred = null;

  const bar = document.createElement('div');
  bar.className = 'install-bar';
  bar.hidden = true;
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Install the app');
  bar.innerHTML = '<span>Install this site as an app for quick, offline access.</span>' +
    '<button type="button" class="btn btn-primary" data-bar="yes">Install</button>' +
    '<button type="button" class="btn btn-ghost" data-bar="no">Not now</button>';
  document.body.append(bar);

  const dismissed = () => { const t = Number(store.get(DISMISS_KEY)); return t && Date.now() - t < 14 * 864e5; };
  const hideBar = () => { bar.hidden = true; };
  const visits = Number(store.get(VISITS_KEY) || 0) + 1;
  store.set(VISITS_KEY, String(visits));

  const showGuide = () => {
    const dlg = document.createElement('dialog');
    dlg.className = 'guide';
    dlg.setAttribute('aria-labelledby', 'guideTitle');
    dlg.innerHTML = '<h2 id="guideTitle">Add to Home Screen</h2>' +
      '<p>On iPhone and iPad, install from Safari:</p>' +
      '<ol><li>Tap the <b>Share</b> button <svg class="i" aria-hidden="true"><use href="#i-share"/></svg> in the Safari toolbar.</li>' +
      '<li>Scroll down and tap <b>Add to Home Screen</b> <svg class="i" aria-hidden="true"><use href="#i-plus"/></svg>.</li>' +
      '<li>Tap <b>Add</b>. The app now sits on your Home Screen.</li></ol>' +
      '<p class="guide-note">If you do not see the option, open this page in Safari first (not inside another app).</p>' +
      '<button type="button" class="btn btn-primary">Got it</button>';
    document.body.append(dlg);
    const close = () => dlg.close();
    $('button', dlg).addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal();
  };

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice.catch(() => ({}));
      deferred = null;
      if (outcome === 'accepted') toast('Installing the app…');
      buttons.forEach((b) => { b.hidden = true; });
      hideBar();
    } else if (isIOS()) showGuide();
  };

  buttons.forEach((b) => b.addEventListener('click', install));
  $('[data-bar="yes"]', bar).addEventListener('click', install);
  $('[data-bar="no"]', bar).addEventListener('click', () => { store.set(DISMISS_KEY, String(Date.now())); hideBar(); });

  const maybeShowBar = () => {
    if (dismissed() || visits < 2) return;
    setTimeout(() => { if (!standalone() && !dismissed()) bar.hidden = false; }, 15000);
  };

  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    buttons.forEach((b) => { b.hidden = false; });
    maybeShowBar();
  });
  addEventListener('appinstalled', () => {
    deferred = null; hideBar();
    buttons.forEach((b) => { b.hidden = true; });
    toast('App installed. Open it from your Home Screen.');
  });

  if (isIOS()) { buttons.forEach((b) => { b.hidden = false; }); maybeShowBar(); }
}

function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const bar = $('#updateBar'), btn = $('#updateBtn');
  const offer = (worker) => {
    if (!bar || !btn) return;
    bar.hidden = false;
    btn.onclick = () => { btn.disabled = true; worker.postMessage('SKIP_WAITING'); };
  };
  let reloading = false;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true; location.reload();
  });
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI), { scope: new URL('./', document.baseURI).pathname }).then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => { /* offline support is a bonus; the site works without it */ });
}
