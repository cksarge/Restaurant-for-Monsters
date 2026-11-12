/**
 * SCREENS — title, intro letter, night report, Monster Food Awards and
 * the How to Play guide.
 */
import { DB } from '../db.js';
import { game } from '../state.js';
import { h, $ } from '../utils.js';
import { monsterSVG } from './sprites.js';
import { openModal, confetti } from './fx.js';
import { reviewEl } from './hub.js';
import { spookiness } from '../economy.js';
import { yearOf } from '../calendar.js';
import { sfx } from '../audio.js';

// ---------- Title ----------
export function renderTitle({ hasSave, onNew, onContinue, onSettings, onHelp }) {
  const el = $('#screen-title');
  el.innerHTML = '';
  const cast = [
    ['vampire', 'neutral', 't1'], ['kraken', 'delighted', 't2'], ['slime', 'neutral', 't3'],
    ['werewolf', 'delighted', 't4'], ['mummy', 'neutral', 't5'], ['ghost', 'neutral', 't6'],
  ];
  el.append(
    h('div', { class: 'title-sky' },
      h('div', { class: 'title-moon' }),
      ...Array.from({ length: 14 }, (_, i) => h('i', { class: 'title-star sparkle', style: { '--i': i, left: `${(i * 37) % 100}%`, top: `${(i * 23) % 45}%` } }))),
    h('div', { class: 'title-fog' }),
    h('div', { class: 'title-content' },
      h('div', { class: 'title-logo' },
        h('div', { class: 'logo-small' }, 'Great-Aunt Mildred\'s'),
        h('h1', {}, 'Restaurant', h('br'), h('span', { class: 'logo-for' }, 'for'), ' Monsters'),
        h('div', { class: 'logo-tag' }, 'Fine dining for the dearly un-departed')),
      h('div', { class: 'title-buttons' },
        hasSave ? h('button', { class: 'btn primary big', onclick: onContinue }, '🕯️ Continue') : null,
        h('button', { class: `btn big ${hasSave ? '' : 'primary'}`, onclick: onNew }, '🍽️ New Game'),
        h('div', { class: 'row', style: { justifyContent: 'center' } },
          h('button', { class: 'btn', onclick: onHelp }, '❓ How to Play'),
          h('button', { class: 'btn', onclick: onSettings }, '⚙️ Settings')))),
    h('div', { class: 'title-cast' }, cast.map(([id, mood, cls]) => h('div', { class: `title-mon ${cls}`, html: monsterSVG(DB.monsters[id].art, { mood }) }))),
    h('div', { class: 'title-foot muted' }, 'A cozy-spooky cooking game · Progress saves in this browser'),
  );
}

// ---------- Intro letter ----------
export function showLetter(onDone) {
  openModal({
    title: '✉️ A Letter Arrives…', closable: false, className: 'letter-modal',
    content: (close) => h('div', { class: 'letter' },
      h('p', {}, 'My dearest nibling,'),
      h('p', {}, 'If you\'re reading this, I\'ve finally retired to that big kitchen in the sky (well — the one in the attic; I\'m a ghost now, don\'t fuss). I\'m leaving you my little diner.'),
      h('p', {}, 'A few things you should know. The customers are… unusual. Vampires. Swamp creatures. A very polite kraken. They order in riddles, because monsters can\'t say "soup" without it sounding like a threat.'),
      h('p', {}, 'Nobody knows what monsters eat, dear. You\'ll have to experiment. Taste everything. Write it all down. And whatever you do, don\'t put two cursed things in the same pot.'),
      h('p', { class: 'letter-sign' }, 'With love and a little ectoplasm,', h('br'), h('b', {}, 'Great-Aunt Mildred'), ' 👻'),
      h('p', { class: 'muted small' }, 'P.S. The health inspector is a HUMAN. Act normal.'),
      h('button', { class: 'btn primary big', onclick: () => { close(); sfx('door'); onDone(); } }, '🔑 Unlock the doors')),
  });
}

// ---------- End-of-night report ----------
export function showNightReport(sum, onDone) {
  const rep = sum.repDelta || 0;
  const best = sum.delighted >= Math.max(3, sum.served * 0.7) && sum.walkouts <= 1;
  sfx(best ? 'fanfare' : 'ding');
  openModal({
    title: `🌅 Closing Time — Night ${sum.night + 1}`, closable: false, wide: true,
    content: (close) => h('div', { class: 'night-report' },
      h('div', { class: 'report-hero' },
        h('div', { class: 'report-mon', html: monsterSVG(DB.monsters[best ? 'kraken' : sum.walkouts > 2 ? 'mummy' : 'ghost'].art, { mood: best ? 'delighted' : sum.walkouts > 2 ? 'unimpressed' : 'neutral' }) }),
        h('div', {},
          h('h3', {}, best ? 'What a night!' : sum.served === 0 ? 'A quiet night…' : sum.walkouts > sum.delighted ? 'A rough night. Tomorrow\'s another one!' : 'Not bad at all!'),
          h('div', { class: 'report-big' }, h('span', {}, '🪙 ', h('b', {}, sum.coins + sum.tips)), h('span', {}, rep >= 0 ? '⭐ +' : '⭐ ', h('b', { class: rep >= 0 ? 'good' : 'bad' }, rep.toFixed(2)))))),
      h('div', { class: 'report-stats' },
        ...[['🍽️', sum.served, 'served'], ['😍', sum.delighted, 'delighted'], ['😐', sum.unimpressed, 'meh'], ['😵‍💫', sum.confused, 'confused'], ['🔥', sum.onfire, 'on fire'], ['🚪', sum.walkouts, 'walked out']]
          .map(([i, n, l]) => h('div', { class: 'stat' }, h('span', { class: 'stat-icon' }, i), h('b', {}, n), h('small', {}, l)))),
      h('p', {}, `Dishes ${sum.coins}🪙 · Tips ${sum.tips}🪙${sum.wages ? ` · Wages −${sum.wages}🪙` : ''}${sum.turnedAway ? ` · ${sum.turnedAway} turned away (no seats!)` : ''}`),
      sum.critic ? reviewEl(sum.critic) : null,
      sum.inspection ? h('p', { class: sum.inspection.passed ? 'good' : 'bad' }, sum.inspection.passed ? '📋 Passed the health inspection!' : '📋 Failed the health inspection…') : null,
      sum.newRecipes?.length ? h('p', {}, '⭐ New signature dishes: ', h('b', {}, sum.newRecipes.join(', '))) : null,
      sum.story?.length ? h('ul', { class: 'story-list' }, sum.story.map((t) => h('li', {}, '💜 ', t))) : null,
      sum.goals?.length ? h('p', {}, '🏅 Goals: ', sum.goals.join(', ')) : null,
      ...(sum.notes || []).map((n) => h('p', { class: 'muted' }, n)),
      ...(sum.unlocks || []).map((n) => h('p', { class: 'unlock-note' }, n)),
      h('div', { class: 'row', style: { justifyContent: 'flex-end' } }, h('button', { class: 'btn primary big', onclick: () => { close(); onDone(); } }, 'Continue ☀️'))),
  });
}

// ---------- Monster Food Awards ----------
export function computeAwards(state = game.state) {
  const recipes = state.namedFound.length;
  const spook = spookiness(state);
  const quality = Math.min(10, state.placed.length * 0.5 + state.ownedThemes.length + Object.keys(state.rooms).length * 1.5);
  const delightRate = state.stats.served ? state.stats.delighted / state.stats.served : 0;
  const score = state.rep * 12 + Math.min(1, recipes / DB.recipeList.length) * 20 + Math.min(1, spook / 60) * 10 + quality;
  const tier = score >= 75 ? 'gold' : score >= 52 ? 'silver' : score >= 32 ? 'bronze' : 'participant';
  return { score: Math.round(score), tier, recipes, spook, quality, delightRate };
}

const TIERS = {
  gold: { trophy: '🏆', title: 'The Golden Cauldron', text: 'The crowd goes WILD. The banshee sings. The kraken weeps into eight handkerchiefs. You are the finest restaurant in all the monster world — Great-Aunt Mildred\'s portrait winks at you.' },
  silver: { trophy: '🥈', title: 'The Silver Ladle', text: 'A thunderous round of applause (and one howl). The judges praise your bold flavours and cozy, creepy charm. Next year, the Golden Cauldron?' },
  bronze: { trophy: '🥉', title: 'The Bronze Spork', text: 'A respectable showing! The judges loved "most of it" and only one of them caught fire. The monster world is starting to notice you.' },
  participant: { trophy: '🎗️', title: 'Most Enthusiastic Participant', text: 'The judges are… intrigued. One of them is still chewing. Everyone agrees you have heart — and next year, maybe a few more recipes.' },
};

export function showAwards(onContinue) {
  const s = game.state;
  const year = yearOf(s.night - 1);
  const a = computeAwards(s);
  const T = TIERS[a.tier];
  const el = $('#screen-awards');
  el.innerHTML = '';
  const judges = ['critic', 'vampire', 'kraken'];
  const extras = [
    a.recipes >= 15 ? ['📖', 'Inventor of the Year', `${a.recipes} signature dishes discovered`] : null,
    a.spook >= 40 ? ['👻', 'Spookiest Interior', `Spookiness ${a.spook}`] : null,
    a.delightRate >= 0.6 ? ['😍', 'Customers\' Choice', `${Math.round(a.delightRate * 100)}% of guests delighted`] : null,
    s.stats.onfire >= 5 ? ['🔥', 'Most Flammable Menu', `${s.stats.onfire} customers set (comically) ablaze`] : null,
    s.stats.storiesDone >= 3 ? ['💜', 'Heart of the Neighbourhood', `${s.stats.storiesDone} regulars\' stories completed`] : null,
  ].filter(Boolean);

  el.append(h('div', { class: 'awards' },
    h('div', { class: 'awards-curtain l' }), h('div', { class: 'awards-curtain r' }),
    h('div', { class: 'awards-inner' },
      h('div', { class: 'awards-kicker' }, `Year ${year + 1}`),
      h('h1', {}, 'The Monster Food Awards'),
      h('div', { class: 'judges' }, judges.map((id) => h('div', { class: 'judge', html: monsterSVG(DB.monsters[id].art, { mood: a.tier === 'participant' ? 'confused' : 'delighted' }) }))),
      h('p', { class: 'muted' }, `And the award for Best Restaurant goes to… ${s.restaurantName}!`),
      h('div', { class: `trophy tier-${a.tier}` }, T.trophy),
      h('h2', {}, T.title),
      h('p', {}, T.text),
      h('div', { class: 'award-breakdown' },
        h('span', { class: 'chip big-chip' }, `⭐ ${s.rep.toFixed(1)} reputation`),
        h('span', { class: 'chip big-chip' }, `📖 ${a.recipes} recipes`),
        h('span', { class: 'chip big-chip' }, `👻 ${a.spook} spookiness`),
        h('span', { class: 'chip big-chip' }, `🏅 Score ${a.score}`)),
      extras.length ? h('div', { class: 'extra-awards' }, extras.map(([i, t, d]) => h('div', { class: 'extra-award card' }, h('span', { class: 'ea-icon' }, i), h('b', {}, t), h('small', {}, d)))) : null,
      h('p', { class: 'muted' }, 'The doors stay open! Keep cooking in endless mode — new years bring new seasons, festivals and inspections.'),
      h('button', { class: 'btn primary big', onclick: onContinue }, '🌙 Continue to Year ' + (year + 2)))));
  s.awardsYears.push(year);
  setTimeout(() => { sfx('fanfare'); if (a.tier !== 'participant') { confetti(window.innerWidth / 2, window.innerHeight / 3, 90); setTimeout(() => confetti(window.innerWidth / 3, window.innerHeight / 2, 60), 700); } }, 600);
}

// ---------- How to play ----------
export function showHowToPlay() {
  openModal({
    title: '❓ How to Play', wide: true,
    content: h('div', { class: 'howto' },
      h('ol', {},
        h('li', {}, h('b', {}, 'Monsters arrive and sit down. '), 'Tap one (or their ticket in the kitchen) to read their order.'),
        h('li', {}, h('b', {}, 'Orders are riddles. '), '"Soup, but sad" means a dish that is ', h('i', {}, 'Soupy'), ' and ', h('i', {}, 'Gloomy'), '. Every phrase you decode gets a hint icon in future orders.'),
        h('li', {}, h('b', {}, 'Cook! '), 'Pick up to 3 ingredients from the pantry, then tap a station. Dishes get every trait their ingredients have, plus the station\'s trait: Cauldron → Soupy, Grill → Smoky, Freezer → Cold, Lightning Oven → Zappy.'),
        h('li', {}, h('b', {}, 'Serve before patience runs out. '), 'Delighted monsters pay and tip well. Some combinations backfire hilariously. Some traits set certain monsters on fire (they\'re fine).'),
        h('li', {}, h('b', {}, 'Between shifts, '), 'buy ingredients, upgrades and staff, decorate in Build Mode, and check the calendar for moon phases, festivals and rumoured inspections.')),
      h('p', {}, '🌕 The moon changes every night on an 8-night cycle. Full moons bring werewolf packs; new moons bring shy shadow creatures.'),
      h('p', {}, '🏆 After one in-game year (112 nights), the Monster Food Awards judge your restaurant. Then keep playing in endless mode!'),
      h('p', { class: 'muted' }, 'Tip: dirty tables (🍽️) must be tapped to clean before someone else can sit there — or hire Morty the zombie dishwasher.')),
  });
}
