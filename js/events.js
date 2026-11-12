/**
 * SPECIAL EVENTS — the health inspector minigame.
 * (Seasonal events, rushes and the critic are scheduled in calendar.js and
 * handled inside shift.js; this file owns the inspection.)
 *
 * MINIGAME: a human inspector scans the dining room, one column of tables at
 * a time. Monstrous things keep popping up ("Fangs showing!"). Tap them to
 * disguise them before the inspector's gaze lands on that column. Three
 * suspicious sightings and you fail. Last until the timer runs out to pass.
 * The 👀 above a column warns where the inspector will look next.
 */
import { DB } from './db.js';
import { game, addCoins, addRep } from './state.js';
import { h, pick, randInt } from './utils.js';
import { monsterSVG } from './ui/sprites.js';
import { sfx } from './audio.js';
import { toast } from './ui/fx.js';

const COLS = 3;
const ROWS = 2;

export function runInspection() {
  return new Promise((resolve) => {
    const I = DB.inspector;
    const sh = game.shift;
    sh.holds.add('inspector');

    const slots = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, col: i % COLS, item: null, el: null }));
    let time = 0;
    let strikes = 0;
    let gaze = 1;
    let nextGaze = randInt(0, 2);
    let gazeTimer = 2.6;
    let spawnTimer = 0.8;
    let done = false;
    let started = false;

    const strikeEl = h('div', { class: 'insp-strikes' });
    const timerBar = h('div', { class: 'bar insp-timer' }, h('i'));
    const sayEl = h('div', { class: 'insp-say' }, '“Good evening. Just a routine inspection.”');
    const scene = h('div', { class: 'insp-scene' });
    const peekEls = [];
    for (let c = 0; c < COLS; c++) peekEls.push(h('div', { class: 'insp-peek', style: { left: `${(c + 0.5) * (100 / COLS)}%` } }, '👀'));
    const gazeEl = h('div', { class: 'insp-gaze' });
    const inspector = h('div', { class: 'insp-person', html: monsterSVG(I.art) });

    for (const slot of slots) {
      slot.el = h('button', { class: 'insp-slot', 'aria-label': 'Table', onclick: () => fix(slot) },
        h('div', { class: 'insp-table' }), h('div', { class: 'insp-thing' }, ''), h('div', { class: 'insp-label' }, ''));
      scene.append(slot.el);
    }
    scene.append(...peekEls, gazeEl);

    const intro = h('div', { class: 'insp-intro' },
      h('h2', {}, '🚨 Health Inspection!'),
      h('p', {}, `${I.name} has arrived with a clipboard. Keep everything looking totally, boringly NORMAL.`),
      h('p', {}, h('b', {}, 'Tap anything monstrous'), ' to disguise it before the inspector looks that way. Watch the 👀 — it shows where they\'ll look next!'),
      h('button', { class: 'btn primary big', onclick: () => { intro.remove(); started = true; sfx('click'); } }, 'Act natural!'));

    const overlay = h('div', { class: 'inspector-overlay' },
      h('div', { class: 'insp-card card' },
        h('div', { class: 'insp-head row' }, h('h3', {}, '📋 Keep it Normal!'), h('span', { class: 'spacer' }), strikeEl),
        timerBar, scene,
        h('div', { class: 'insp-bottom' }, inspector, sayEl)),
      intro);
    document.body.append(overlay);
    renderStrikes();
    placeGaze();

    function renderStrikes() {
      strikeEl.textContent = '❌'.repeat(strikes) + '⬜'.repeat(I.strikesToFail - strikes);
    }
    function placeGaze() {
      gazeEl.style.left = `${(gaze + 0.5) * (100 / COLS)}%`;
      peekEls.forEach((p, i) => p.classList.toggle('on', i === nextGaze && gazeTimer < 1.1));
    }
    function spawn() {
      const free = slots.filter((s) => !s.item && s.col !== gaze);
      if (!free.length) return;
      const slot = pick(free);
      slot.item = pick(I.suspicious);
      slot.el.classList.add('sus');
      slot.el.querySelector('.insp-thing').textContent = slot.item.emoji;
      slot.el.querySelector('.insp-label').textContent = slot.item.label;
      sfx('pop');
    }
    function fix(slot) {
      if (!slot.item || done || !started) return;
      const fixEmoji = slot.item.fix;
      slot.item = null;
      slot.el.classList.remove('sus');
      slot.el.classList.add('fixed');
      slot.el.querySelector('.insp-thing').textContent = fixEmoji;
      slot.el.querySelector('.insp-label').textContent = 'Totally normal!';
      sfx('clean');
      setTimeout(() => { slot.el.classList.remove('fixed'); if (!slot.item) { slot.el.querySelector('.insp-thing').textContent = ''; slot.el.querySelector('.insp-label').textContent = ''; } }, 700);
    }
    function look() {
      // The gaze lands on a column: anything unfixed there is spotted!
      gazeEl.classList.remove('sweep'); void gazeEl.offsetWidth; gazeEl.classList.add('sweep');
      for (const slot of slots.filter((s) => s.col === gaze && s.item)) {
        strikes++;
        sfx('error');
        sayEl.textContent = `“${slot.item.label.replace('!', '?')}” *scribbles furiously*`;
        toast({ icon: '😅', text: `You: "${slot.item.excuse}"` });
        slot.item = null;
        slot.el.classList.remove('sus');
        slot.el.classList.add('spotted');
        setTimeout(() => { slot.el.classList.remove('spotted'); slot.el.querySelector('.insp-thing').textContent = ''; slot.el.querySelector('.insp-label').textContent = ''; }, 900);
        renderStrikes();
      }
      if (!slots.some((s) => s.col === gaze && s.el.classList.contains('spotted'))) sayEl.textContent = `“${pick(I.inspectorLines)}”`;
    }

    let last = performance.now();
    function frame(ts) {
      const dt = Math.min(0.1, (ts - last) / 1000) * game.settings.pace;
      last = ts;
      if (started && !done) {
        time += dt;
        spawnTimer -= dt;
        gazeTimer -= dt;
        // Things get busier as the inspection goes on
        if (spawnTimer <= 0) { spawn(); spawnTimer = Math.max(0.9, 2.1 - time * 0.04) + Math.random() * 0.6; }
        if (gazeTimer <= 0) {
          gaze = nextGaze;
          do { nextGaze = randInt(0, COLS - 1); } while (nextGaze === gaze);
          gazeTimer = Math.max(1.6, 2.8 - time * 0.03) + Math.random() * 0.6;
          look();
        }
        placeGaze();
        timerBar.firstChild.style.width = `${Math.max(0, 1 - time / I.duration) * 100}%`;
        if (strikes >= I.strikesToFail) finish(false);
        else if (time >= I.duration) finish(true);
      }
      if (!done) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function finish(passed) {
      done = true;
      const s = game.state;
      const reward = passed ? I.passReward : I.failPenalty;
      if (passed) { addCoins(reward.coins); addRep(reward.rep); s.stats.inspectionsPassed++; sfx('fanfare'); }
      else { addCoins(-reward.coins); addRep(-reward.rep); s.stats.inspectionsFailed++; sfx('sad'); }
      sh.summary.inspection = { passed };
      const result = h('div', { class: 'insp-intro' },
        h('div', { class: 'insp-result-face', html: monsterSVG(I.art, { mood: passed ? 'delighted' : 'angry' }) }),
        h('h2', {}, passed ? '✅ Inspection Passed!' : '❌ Inspection Failed!'),
        h('p', {}, passed
          ? `“What a perfectly ordinary establishment. Very… beige. Five stars for normality.” +${reward.coins}🪙, reputation up!`
          : `“I counted ${strikes} irregularities, including what appeared to be a TENTACLE.” −${reward.coins}🪙, reputation down.`),
        h('button', { class: 'btn primary big', onclick: () => { overlay.remove(); sh.holds.delete('inspector'); resolve(passed); } }, 'Back to work!'));
      overlay.append(result);
    }
  });
}
