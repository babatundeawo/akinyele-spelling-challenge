/* Practice page: free-practice trainer + 10-round Spelling Bee vs a simulated rival. */
import { $, $$, loadJSON, maskWord, createDeck, canSpeak, speak, store, buzz } from '../lib.js';

const CAT_NAMES = { A: 'Everyday words', B: 'Intermediate words', C: 'Occupations' };
const LEVELS = {
  easy: { cat: 'A', accuracy: 0.7 }, medium: { cat: 'B', accuracy: 0.5 }, hard: { cat: 'C', accuracy: 0.35 },
};
const RIVALS = ['Tayo', 'Ngozi', 'Kemi', 'Chidi', 'Amaka', 'Segun', 'Bisi', 'Emeka'];
const ROUNDS = 10;
const same = (a, b) => a.trim().toLowerCase() === b.toLowerCase();
const showClue = (els, word, label) => {
  els.cat.textContent = label;
  els.meaning.textContent = word.meaning;
  els.example.textContent = word.example ? `\u201C${maskWord(word.example, word.word)}\u201D` : '';
  els.ipa.textContent = word.ipa || '';
};

let words;
try { words = await loadJSON('data/words.json'); }
catch {
  $('#clueMeaning').textContent = 'The word list could not be loaded. Please check your connection and refresh.';
  throw new Error('words unavailable');
}

/* ---- free practice ---- */
(() => {
  const input = $('#trainerInput'), check = $('#trainerCheck'), skip = $('#trainerSkip'), fb = $('#trainerFeedback'), scoreEl = $('#trainerScore'), speakBtn = $('#trainerSpeak');
  const clue = { cat: $('#clueCat'), meaning: $('#clueMeaning'), example: $('#clueExample'), ipa: $('#clueIpa') };
  const decks = {};
  let cat = 'A', current, right = 0, tries = 0, busy = false, streak = 0, best = Number(store.get('asc-best-streak') || 0);
  const deck = () => (decks[cat] ||= createDeck(words.filter((w) => w.category === cat)));

  function next(focus) {
    busy = false;
    current = deck().next();
    input.value = ''; fb.textContent = ''; fb.className = 'feedback';
    showClue(clue, current, `Category ${cat} \u00B7 ${CAT_NAMES[cat]}`);
    if (focus) input.focus();
  }
  function submit() {
    if (busy || !input.value.trim()) return;
    busy = true; tries++;
    const ok = same(input.value, current.word);
    if (ok) { right++; streak++; if (streak > best) { best = streak; store.set('asc-best-streak', String(best)); } } else streak = 0;
    buzz(ok ? 25 : [60, 40, 60]);
    fb.textContent = ok ? `Correct! It is \u201C${current.word}\u201D.` : `Not quite. The word was \u201C${current.word}\u201D.`;
    fb.className = `feedback ${ok ? 'correct' : 'wrong'}`;
    scoreEl.textContent = `Score: ${right} / ${tries} \u00B7 Streak: ${streak} \u00B7 Best streak: ${best}`;
    setTimeout(() => next(true), 1500);
  }
  $$('#trainerCats .chip').forEach((b) => b.addEventListener('click', () => {
    $$('#trainerCats .chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    cat = b.dataset.cat; next(false);
  }));
  check.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  skip.addEventListener('click', () => next(true));
  if (canSpeak()) { speakBtn.classList.add('ready'); speakBtn.addEventListener('click', () => speak(current.word)); }
  [input, check, skip].forEach((el) => { el.disabled = false; });
  if (best) scoreEl.textContent = `Score: 0 / 0 \u00B7 Best streak: ${best}`;
  next(false);
})();

/* ---- spelling bee ---- */
(() => {
  const levels = $('#beeLevels'), game = $('#beeGame'), result = $('#beeResult');
  const input = $('#beeInput'), submitBtn = $('#beeSubmit'), feed = $('#beeFeed'), speakBtn = $('#beeSpeak');
  const clue = { cat: $('#beeCat'), meaning: $('#beeMeaning'), example: $('#beeExample'), ipa: $('#beeIpa') };
  let level, levelKey, list, round, you, rival, rivalName, current, waiting;

  const line = (text, cls) => {
    const li = document.createElement('li');
    li.className = cls; li.textContent = text;
    feed.prepend(li);
    while (feed.children.length > 4) feed.lastChild.remove();
  };
  function start(key) {
    level = LEVELS[key]; levelKey = key;
    list = createDeck(words.filter((w) => w.category === level.cat)).draw(ROUNDS);
    round = you = rival = 0; feed.replaceChildren();
    rivalName = RIVALS[Math.floor(Math.random() * RIVALS.length)];
    $('#beeRivalName').textContent = rivalName; $('#beeYou').textContent = '0'; $('#beeRival').textContent = '0';
    levels.hidden = true; result.hidden = true; game.hidden = false;
    next();
  }
  function next() {
    if (round >= ROUNDS) return finish();
    current = list[round++]; waiting = true;
    $('#beeRound').textContent = `Round ${round} / ${ROUNDS}`;
    showClue(clue, current, `Category ${level.cat} \u00B7 ${CAT_NAMES[level.cat]}`);
    input.value = ''; input.disabled = submitBtn.disabled = false; input.focus();
  }
  function submit() {
    if (!waiting || !input.value.trim()) return;
    waiting = false; input.disabled = submitBtn.disabled = true;
    const right = same(input.value, current.word);
    buzz(right ? 25 : [60, 40, 60]);
    if (right) { you++; $('#beeYou').textContent = String(you); line(`You spelled \u201C${current.word}\u201D correctly.`, 'ok'); }
    else line(`Not quite. It was \u201C${current.word}\u201D.`, 'no');
    setTimeout(() => {
      const got = Math.random() < level.accuracy;
      if (got) { rival++; $('#beeRival').textContent = String(rival); }
      line(got ? `${rivalName} also got it right.` : `${rivalName} misspelled it.`, got ? 'ok' : 'no');
      setTimeout(next, 1300);
    }, 700);
  }
  function finish() {
    game.hidden = true; result.hidden = false;
    $('#beeFinal').textContent = `You ${you} / ${ROUNDS}  \u00B7  ${rivalName} ${rival} / ${ROUNDS}`;
    const [title, sub] = you > rival
      ? [`You beat ${rivalName}!`, 'You out-spelled a fellow contestant. Try a harder difficulty to keep the challenge going.']
      : you < rival ? [`${rivalName} wins this round`, 'You were edged out this time. Have another go; the words are freshly shuffled every game.']
      : [`It is a tie with ${rivalName}`, `Dead even after ${ROUNDS} words. One more game to break the tie?`];
    const bestKey = `asc-bee-best-${levelKey}`, prev = Number(store.get(bestKey) || 0);
    const record = you > prev;
    if (record) store.set(bestKey, String(you));
    const bestLine = record ? ` New personal best: ${you} / ${ROUNDS}!` : prev ? ` Your best on this level is ${prev} / ${ROUNDS}.` : '';
    $('#beeResultTitle').textContent = title; $('#beeResultSub').textContent = sub + bestLine;
    $('#beeResultTitle').tabIndex = -1; $('#beeResultTitle').focus();
  }
  $$('.bee-level', levels).forEach((b) => { b.disabled = false; b.addEventListener('click', () => start(b.dataset.diff)); });
  submitBtn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  $('#beeAgain').addEventListener('click', () => { result.hidden = true; levels.hidden = false; });
  if (canSpeak()) { speakBtn.classList.add('ready'); speakBtn.addEventListener('click', () => current && speak(current.word)); }
})();
