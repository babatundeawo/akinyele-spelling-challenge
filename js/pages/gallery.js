/* Gallery: lightbox on top of the pre-rendered photo grid (native <dialog> handles focus + Esc). */
import { $, $$ } from '../lib.js';

const buttons = $$('.g-item');
if (buttons.length) {
  const dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-label', 'Photo viewer');
  const icon = (n) => `<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  dlg.innerHTML = `
    <button type="button" class="icon-btn lb-close" aria-label="Close photo viewer">${icon('close')}</button>
    <button type="button" class="icon-btn lb-prev" aria-label="Previous photo">${icon('prev')}</button>
    <figure class="lb-stage"><img alt="" width="900" height="600"><figcaption class="lb-cap"></figcaption></figure>
    <button type="button" class="icon-btn lb-next" aria-label="Next photo">${icon('next')}</button>`;
  document.body.append(dlg);
  const img = $('img', dlg), cap = $('.lb-cap', dlg);
  let i = 0, opener = null;

  const show = (n) => {
    i = (n + buttons.length) % buttons.length;
    const src = $('img', buttons[i]);
    img.src = src.dataset.full || src.src;
    img.alt = src.alt; img.width = src.width; img.height = src.height;
    cap.textContent = `${src.alt} (${i + 1} of ${buttons.length})`;
  };
  buttons.forEach((b, n) => b.addEventListener('click', () => { opener = b; show(n); dlg.showModal(); document.documentElement.style.overflow = 'hidden'; }));
  $('.lb-close', dlg).addEventListener('click', () => dlg.close());
  $('.lb-prev', dlg).addEventListener('click', () => show(i - 1));
  $('.lb-next', dlg).addEventListener('click', () => show(i + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { document.documentElement.style.overflow = ''; opener?.focus(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
}
