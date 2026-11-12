/**
 * MODAL SCREENS — Recipe Book, Monster Guide, Calendar and Settings.
 */
import { DB } from '../db.js';
import { game, emit } from '../state.js';
import { h } from '../utils.js';
import { openModal, confirmDialog } from './fx.js';
import { monsterSVG } from './sprites.js';
import { speciesHint } from '../customers.js';
import { dateInfo, nightEvents, inspectionKnown, upcoming, NIGHTS_PER_MONTH, NIGHTS_PER_YEAR } from '../calendar.js';
import { fillBowl } from '../shift.js';
import { saveSettings } from '../save.js';
import { sfx } from '../audio.js';

const chip = (t) => h('span', { class: 'chip trait', style: { '--tc': DB.traits[t].color } }, DB.traits[t].icon, ' ', DB.traits[t].name);

function tabs(defs, start = 0) {
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const body = h('div', { class: 'tab-body' });
  const show = (i) => {
    [...bar.children].forEach((b, j) => { b.classList.toggle('active', i === j); b.setAttribute('aria-selected', i === j); });
    body.innerHTML = '';
    body.append(defs[i].render());
  };
  defs.forEach((d, i) => bar.append(h('button', { class: 'tab', role: 'tab', onclick: () => { sfx('click'); show(i); } }, d.label)));
  show(start);
  return h('div', {}, bar, body);
}

// ---------- Recipe Book ----------
function comboRow(entry, { onUse } = {}) {
  const st = DB.stations[entry.station];
  return h('div', { class: 'recipe-row' },
    h('div', { class: 'recipe-ings' }, entry.ingredients.map((i) => h('span', { title: DB.ingredients[i]?.name }, DB.ingredients[i]?.emoji || '?')), h('span', { class: 'recipe-at' }, '→'), h('span', { title: st.name }, st.icon)),
    h('div', { class: 'recipe-main' },
      h('div', { class: 'recipe-name' }, entry.recipeId ? '⭐ ' : '', entry.name),
      h('div', { class: 'recipe-traits' }, entry.traits.map((t) => h('span', { class: 'trait-icon', title: DB.traits[t].name }, DB.traits[t].icon))),
      entry.fans?.length ? h('small', { class: 'muted' }, 'Loved by: ', entry.fans.map((f) => DB.monsters[f]?.name).join(', ')) : null),
    onUse ? h('button', { class: 'btn small green', onclick: () => onUse(entry) }, 'Use') : null);
}

function signatureTab() {
  const s = game.state;
  const visible = DB.recipeList.filter((r) => !r.secret || s.revealedSecrets.includes(r.id) || s.namedFound.includes(r.id));
  const found = DB.recipeList.filter((r) => s.namedFound.includes(r.id)).length;
  return h('div', {},
    h('p', { class: 'muted' }, `Signature recipes are special combinations with their own name and a coin bonus. Found ${found} / ${DB.recipeList.length}.`),
    h('div', { class: 'recipe-grid' }, visible.map((r) => {
      const got = s.namedFound.includes(r.id);
      const revealed = got || (r.secret && s.revealedSecrets.includes(r.id));
      return h('div', { class: `sig-card${got ? ' found' : ''}` },
        h('div', { class: 'sig-ings' }, revealed ? r.ingredients.map((i) => DB.ingredients[i].emoji).join(' + ') : r.ingredients.map(() => '❓').join(' + '), ' ', revealed ? DB.stations[r.station].icon : '❓'),
        h('div', { class: 'sig-name' }, got || revealed ? r.name : '???'),
        got ? h('small', { class: 'muted' }, `+${r.bonus}🪙 bonus`) : h('small', { class: 'muted' }, revealed ? 'Revealed! Cook it to add it.' : `Hint: involves the ${DB.stations[r.station].name}`));
    })));
}

function combosTab(onUse) {
  const entries = Object.values(game.state.recipeBook).sort((a, b) => b.delighted - a.delighted);
  if (!entries.length) return h('p', { class: 'muted' }, 'No working recipes yet. Delight a monster and the combination will be saved here!');
  return h('div', { class: 'recipe-list' }, entries.map((e) => comboRow(e, { onUse })));
}

function phrasebookTab() {
  const book = Object.entries(game.state.phrasebook);
  if (!book.length) return h('p', { class: 'muted' }, 'Serve monsters to start decoding their riddles. Every phrase you decode gets a little icon in future orders!');
  const byTrait = {};
  for (const [phrase, t] of book) (byTrait[t] ||= []).push(phrase);
  return h('div', { class: 'phrasebook' },
    h('p', { class: 'muted' }, `${book.length} phrases decoded. Known phrases are underlined in orders.`),
    ...DB.traitList.filter((t) => byTrait[t.id]).map((t) => h('div', { class: 'phrase-group' }, chip(t.id), h('div', { class: 'phrase-list' }, byTrait[t.id].map((p) => h('span', { class: 'phrase-item' }, `“${p}”`))))));
}

function ingredientsTab() {
  const s = game.state;
  return h('div', { class: 'ing-dex' }, DB.ingredientList.filter((i) => s.unlockedIngredients.includes(i.id)).map((i) => h('div', { class: 'ing-dex-row' },
    h('span', { class: 'ing-emoji' }, i.emoji),
    h('div', {}, h('b', {}, i.name), h('div', {}, s.knownIngredients[i.id] ? i.traits.map(chip) : h('span', { class: 'muted' }, 'Traits unknown — cook with it to find out!')), h('small', { class: 'muted' }, i.desc)))));
}

export function openRecipeBook(start = 0) {
  openModal({
    title: '📖 Recipe Book', wide: true,
    content: tabs([
      { label: 'My Recipes', render: () => combosTab() },
      { label: 'Signature Dishes', render: signatureTab },
      { label: 'Phrasebook', render: phrasebookTab },
      { label: 'Ingredients', render: ingredientsTab },
    ], start),
  });
}

/** During a shift: pick a saved recipe to fill the bowl. Filter by trait. */
export function openRecipePicker() {
  const s = game.state;
  const entries = Object.values(s.recipeBook);
  let filter = new Set();
  const list = h('div', { class: 'recipe-list' });
  let close;
  const render = () => {
    list.innerHTML = '';
    const shown = entries.filter((e) => [...filter].every((t) => e.traits.includes(t)));
    if (!entries.length) list.append(h('p', { class: 'muted' }, 'No saved recipes yet — delight a monster to save one!'));
    else if (!shown.length) list.append(h('p', { class: 'muted' }, 'No saved recipe has all of those traits. Time to experiment!'));
    shown.forEach((e) => list.append(comboRow(e, { onUse: (en) => { fillBowl(en.ingredients); close(); emit('toast', { icon: DB.stations[en.station].icon, text: `Bowl filled! Now tap the ${DB.stations[en.station].name}.` }); } })));
  };
  const chips = h('div', { class: 'filter-chips' }, DB.traitList.map((t) => {
    const b = h('button', { class: 'chip trait filter', style: { '--tc': t.color }, onclick: () => { filter.has(t.id) ? filter.delete(t.id) : filter.add(t.id); b.classList.toggle('on'); render(); } }, t.icon, ' ', t.name);
    return b;
  }));
  render();
  close = openModal({ title: '📖 Quick Recipes', wide: true, content: h('div', {}, h('p', { class: 'muted' }, 'Filter by the traits you think they want:'), chips, list) });
}

// ---------- Monster Guide ----------
export function openMonsterGuide() {
  const s = game.state;
  const met = DB.monsterList.filter((m) => s.bestiary[m.id]).length;
  const grid = h('div', { class: 'guide-grid' });
  const detail = h('div', { class: 'guide-detail card' }, h('p', { class: 'muted' }, 'Tap a monster to read about them.'));

  const showDetail = (m) => {
    const b = s.bestiary[m.id];
    detail.innerHTML = '';
    if (!b) {
      detail.append(h('div', { class: 'guide-portrait silhouette', html: monsterSVG(m.art) }), h('h3', {}, '???'), h('p', { class: 'muted' }, speciesHint(m)));
      return;
    }
    // Favourite flavours reveal themselves as you delight them
    const likesKnown = Math.min(m.likes.length, Math.floor(b.delighted / 2) + (b.delighted > 0 ? 1 : 0));
    const regs = DB.regularList.filter((r) => r.species === m.id && s.regulars[r.id]);
    detail.append(
      h('div', { class: 'guide-portrait', html: monsterSVG(m.art, { mood: 'delighted' }) }),
      h('h3', {}, m.name),
      h('p', {}, m.blurb),
      h('div', { class: 'guide-stats' },
        h('span', { class: 'chip' }, `👀 Met ×${b.met}`), h('span', { class: 'chip' }, `😍 Delighted ×${b.delighted}`),
        h('span', { class: 'chip' }, `📏 ${m.size}`), h('span', { class: 'chip' }, `💰 ${m.tip} tipper`)),
      h('p', {}, h('b', {}, 'Favourite flavours: '), likesKnown ? m.likes.slice(0, likesKnown).map(chip) : h('span', { class: 'muted' }, 'Delight them to find out!'),
        likesKnown < m.likes.length && likesKnown > 0 ? h('span', { class: 'muted' }, ' …and more') : null),
      b.delighted >= 3 && m.dislikes.length ? h('p', {}, h('b', {}, 'Dislikes: '), m.dislikes.map(chip)) : null,
      b.sawFire && m.fire.length ? h('p', {}, h('b', {}, '🔥 Catches fire from: '), m.fire.map(chip)) : null,
      (m.comfort || []).length && b.delighted >= 2 ? h('p', {}, h('b', {}, 'Comfiest seat: '), m.comfort.map((id) => DB.furniture[id]?.name).filter(Boolean).join(', ')) : null,
      (m.lovesDecor || []).length && b.delighted >= 4 ? h('p', {}, h('b', {}, 'Loves: '), m.lovesDecor.map((id) => DB.decor[id]?.name).filter(Boolean).join(', ')) : null,
      ...regs.map((r) => h('div', { class: 'regular-card' }, h('b', {}, `⭐ ${r.name}`), h('p', { class: 'muted' }, r.tagline),
        h('div', { class: 'bar' }, h('i', { style: { width: `${(s.regulars[r.id].chapter / r.chapters.length) * 100}%` } })),
        h('small', {}, s.regulars[r.id].done ? 'Story complete! 💜' : `Chapter ${s.regulars[r.id].chapter + 1} of ${r.chapters.length}`))),
    );
  };

  for (const m of DB.monsterList) {
    const b = s.bestiary[m.id];
    grid.append(h('button', { class: `guide-cell${b ? '' : ' unknown'}`, onclick: () => { sfx('click'); showDetail(m); } },
      h('div', { class: 'guide-mini', html: monsterSVG(m.art) }), h('span', {}, b ? m.name : '???')));
  }
  openModal({ title: `👾 Monster Guide (${met}/${DB.monsterList.length})`, wide: true, content: h('div', { class: 'guide' }, grid, detail) });
}

// ---------- Calendar ----------
export function openCalendar() {
  const s = game.state;
  let monthStart = Math.floor(s.night / NIGHTS_PER_MONTH) * NIGHTS_PER_MONTH;
  const wrap = h('div', { class: 'calendar' });

  const render = () => {
    wrap.innerHTML = '';
    const d0 = dateInfo(monthStart);
    const grid = h('div', { class: 'cal-grid' }, DB.calendar.dayNames.map((n) => h('div', { class: 'cal-dayname' }, n.slice(0, 3))));
    for (let i = 0; i < NIGHTS_PER_MONTH; i++) {
      const n = monthStart + i;
      const ev = nightEvents(s, n);
      const icons = [];
      if (ev.seasonal) icons.push(ev.seasonal.icon);
      if (ev.bus) icons.push('🚌');
      if (inspectionKnown(ev.inspection, s.night)) icons.push('📋');
      if (ev.awards) icons.push('🏆');
      if (n < s.night && s.reviews.some((r) => r.night === n + 1)) icons.push('📰');
      grid.append(h('div', { class: `cal-cell${n === s.night ? ' today' : ''}${n < s.night ? ' past' : ''}${ev.seasonal ? ' seasonal' : ''}`, title: `${ev.date.label} · ${ev.date.moon.name}${ev.seasonal ? ` · ${ev.seasonal.name}` : ''}` },
        h('span', { class: 'cal-num' }, i + 1), h('span', { class: 'cal-moon' }, ev.date.moon.icon), h('span', { class: 'cal-icons' }, icons.join(''))));
    }
    const up = upcoming(s, s.night, 14);
    const tonight = dateInfo(s.night);
    wrap.append(
      h('div', { class: 'row cal-nav' },
        h('button', { class: 'btn small', disabled: monthStart <= 0, onclick: () => { monthStart = Math.max(0, monthStart - NIGHTS_PER_MONTH); render(); } }, '◀'),
        h('h3', { class: 'spacer center' }, `${d0.month.icon} ${d0.month.name} · ${d0.month.season} · Year ${d0.year + 1}`),
        h('button', { class: 'btn small', onclick: () => { monthStart += NIGHTS_PER_MONTH; render(); } }, '▶')),
      grid,
      h('div', { class: 'cal-side' },
        h('div', { class: 'card moon-card' }, h('h3', {}, `Tonight: ${tonight.moon.icon} ${tonight.moon.name}`), h('p', {}, tonight.moon.effect),
          h('div', { class: 'moon-strip' }, DB.moons.map((m, i) => h('span', { class: i === tonight.phase ? 'on' : '', title: `${m.name}: ${m.effect}` }, m.icon)))),
        h('div', { class: 'card' }, h('h3', {}, 'Coming up'), up.length ? h('ul', { class: 'upcoming' }, up.slice(0, 8).map((u) => h('li', {}, `${u.icon} `, h('b', {}, u.night === s.night ? 'Tonight' : u.night === s.night + 1 ? 'Tomorrow' : `${dateInfo(u.night).dayName}`), ` — ${u.text}`))) : h('p', { class: 'muted' }, 'A quiet fortnight.')),
        h('div', { class: 'card' }, h('h3', {}, 'Seasonal festivals'), h('ul', { class: 'upcoming' }, DB.seasonalList.map((e) => h('li', {}, `${e.icon} `, h('b', {}, e.name), ` — ${DB.calendar.months[e.month].name} ${e.startNight + 1}–${e.startNight + e.nights}: ${e.desc}`))))),
      h('p', { class: 'muted small' }, `1 shift = 1 night · 7 nights = 1 week · 4 weeks = 1 month · 4 months = 1 year (${NIGHTS_PER_YEAR} nights). The Monster Food Awards are held on the last night of the year.`),
    );
  };
  render();
  openModal({ title: '📅 Calendar', wide: true, content: wrap });
}

// ---------- Settings ----------
export function openSettings({ onRestart, onTitle } = {}) {
  const st = game.settings;
  const apply = () => { saveSettings(); emit('settings', st); };
  const seg = (label, key, options) => h('div', { class: 'setting' }, h('label', {}, label),
    h('div', { class: 'seg' }, options.map(([v, text]) => {
      const b = h('button', { class: `btn small${st[key] === v ? ' primary' : ''}`, onclick: () => { st[key] = v; apply(); sfx('click'); [...b.parentNode.children].forEach((x) => x.classList.remove('primary')); b.classList.add('primary'); } }, text);
      return b;
    })));
  const content = h('div', { class: 'settings' },
    seg('Sound effects', 'sound', [[true, '🔊 On'], [false, '🔇 Off']]),
    h('div', { class: 'setting' }, h('label', { for: 'vol' }, 'Volume'), h('input', { id: 'vol', type: 'range', min: 0, max: 1, step: 0.05, value: st.volume, oninput: (e) => { st.volume = +e.target.value; apply(); }, onchange: () => sfx('coin') })),
    seg('Animation speed', 'animSpeed', [[0.5, '🐢 Gentle'], [1, 'Normal'], [1.5, '⚡ Snappy'], [0, 'Reduced motion']]),
    seg('Shift pace', 'pace', [[0.6, 'Relaxed'], [1, 'Normal'], [1.4, 'Hectic']]),
    h('p', { class: 'muted small' }, 'Shift pace changes how fast in-game time passes during a night. Relaxed gives you more time to read riddles.'),
    onRestart || onTitle ? h('div', { class: 'row', style: { marginTop: '16px' } },
      onTitle ? h('button', { class: 'btn', onclick: () => onTitle() }, '🏠 Title screen') : null,
      onRestart ? h('button', { class: 'btn danger', onclick: async () => { if (await confirmDialog('Restart?', 'This deletes your save and starts a brand-new game. Great-Aunt Mildred would understand.', 'Restart')) onRestart(); } }, '🔄 Restart game') : null) : null,
  );
  openModal({ title: '⚙️ Settings', content });
}
