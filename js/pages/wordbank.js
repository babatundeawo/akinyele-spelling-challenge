/* Word bank: search, category filter and tap-to-reveal cards. */
import { $, $$, esc, loadJSON } from '../lib.js';

const grid = $('#wordGrid'), search = $('#wordSearch'), more = $('#wordMore'), meta = $('#wordMeta');
const LABEL = { A: 'General', B: 'Intermediate', C: 'Occupation' };
const PAGE = 12;
let words = [], cat = 'all', query = '', shown = PAGE;

const filtered = () => {
  const q = query.trim().toLowerCase();
  return words.filter((w) => (cat === 'all' || w.category === cat) &&
    (!q || w.word.toLowerCase().includes(q) || (w.meaning || '').toLowerCase().includes(q)));
};

function render() {
  const list = filtered();
  meta.textContent = `Showing ${Math.min(shown, list.length)} of ${list.length} words`;
  if (!list.length) {
    grid.innerHTML = `<p class="empty">No words match \u201C${esc(query)}\u201D. Try another search or category.</p>`;
    more.hidden = true; return;
  }
  grid.innerHTML = list.slice(0, shown).map((w) => `
    <button type="button" class="word" aria-expanded="false">
      <span class="tag">Category ${w.category} \u00B7 ${LABEL[w.category]}</span>
      <span class="w">${esc(w.word)}</span>
      ${w.ipa ? `<span class="ipa">${esc(w.ipa)}</span>` : ''}
      <span class="back">${esc(w.meaning)}${w.example ? `<em>\u201C${esc(w.example)}\u201D</em>` : ''}</span>
      <span class="hint">Tap to see the meaning</span>
    </button>`).join('');
  more.hidden = list.length <= shown;
}

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.word');
  if (card) card.setAttribute('aria-expanded', String(card.getAttribute('aria-expanded') !== 'true'));
});
$$('#wordFilters .chip').forEach((b) => b.addEventListener('click', () => {
  $$('#wordFilters .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  cat = b.dataset.cat; shown = PAGE; render();
}));
search.addEventListener('input', () => { query = search.value; shown = PAGE; render(); });
more.addEventListener('click', () => { shown += PAGE; render(); grid.querySelectorAll('.word')[shown - PAGE]?.focus(); });

try {
  words = await loadJSON('data/words.json');
  search.disabled = false; render();
} catch {
  meta.textContent = '';
  grid.innerHTML = '<p class="error-box" role="alert">The word list could not be loaded. Please check your connection and refresh the page.</p>';
}
