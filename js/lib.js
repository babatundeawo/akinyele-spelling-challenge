/* Small shared helpers used by the page modules. */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

/** localStorage that never throws (private windows, blocked storage). */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};

/** Short vibration on phones that support it; skipped when the visitor prefers reduced motion. */
export const buzz = (ms) => {
  if (navigator.vibrate && !matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate(ms);
};

/** Fetches JSON and throws on any failure so callers can show a friendly error state. */
export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

/** Hides `word` (and short suffix forms such as plurals) inside an example sentence. */
export function maskWord(text, word) {
  if (!text || !word) return text || '';
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${safe}[a-z]{0,3}\\b`, 'gi'), '\u2022\u2022\u2022\u2022\u2022');
}

const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** Shuffle-bag: deals every word once before any repeats, never the same word twice in a row. */
export function createDeck(pool) {
  let deck = [], last = null;
  return {
    next() {
      if (!deck.length) {
        deck = shuffle(pool);
        if (deck.length > 1 && last && deck[deck.length - 1].word === last.word) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
      }
      last = deck.pop();
      return last;
    },
    draw: (n) => shuffle(pool).slice(0, n),
  };
}

/** Speaks a word in British English where the browser supports it. */
export const canSpeak = () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
export function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB'; u.rate = 0.85;
  speechSynthesis.speak(u);
}
