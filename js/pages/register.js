/* Register: filters the pre-rendered table by name/school. Without JavaScript the full list is still shown. */
import { $, $$ } from '../lib.js';

const rows = $$('#contestantBody tr');
const search = $('#contestantSearch'), school = $('#schoolFilter'), meta = $('#directoryMeta'), empty = $('#directoryEmpty');
const norm = (s) => s.toLowerCase();

function apply() {
  const q = norm(search.value.trim()), s = school.value;
  let n = 0;
  rows.forEach((tr) => {
    const name = tr.children[1].textContent, sch = tr.children[2].textContent;
    const hit = (s === 'all' || sch === s) && (!q || norm(name).includes(q) || norm(sch).includes(q));
    tr.hidden = !hit; if (hit) n++;
  });
  meta.textContent = `Showing ${n} of ${rows.length} contestants`;
  empty.hidden = n > 0;
}
search.addEventListener('input', apply);
school.addEventListener('change', apply);
