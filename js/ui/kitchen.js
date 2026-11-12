/**
 * KITCHEN (during a shift) — order tickets, the riddle, finished dishes,
 * cooking stations, the mixing bowl and the pantry.
 */
import { DB } from '../db.js';
import { game, on } from '../state.js';
import { h, $ } from '../utils.js';
import { parseRiddle } from '../riddles.js';
import { monsterSVG, stationSVG, dishSVG } from './sprites.js';
import { customerArt } from '../customers.js';
import { addToBowl, removeFromBowl, clearBowl, cook, serve, trashDish, selectCustomer, stationStatus, tickleDragon } from '../shift.js';
import { openRecipePicker } from './modals.js';
import { floatText, toast } from './fx.js';

export const traitChip = (t, { known = true } = {}) => {
  const tr = DB.traits[t];
  return h('span', { class: 'chip trait', style: { '--tc': tr.color }, title: tr.name }, tr.icon, known ? ` ${tr.name}` : '');
};
export const traitIcon = (t) => h('span', { class: 'trait-icon', title: DB.traits[t].name, style: { '--tc': DB.traits[t].color } }, DB.traits[t].icon);

/** The riddle, with phrases you've already decoded marked with their trait. */
export function riddleEl(text) {
  const book = game.state.phrasebook;
  return h('p', { class: 'riddle' }, ...parseRiddle(text).map((part) => {
    if (!part.trait) return part.text;
    const known = book[part.text.toLowerCase()];
    return known
      ? h('span', { class: 'phrase known', title: `Decoded: ${DB.traits[known].name}`, style: { '--tc': DB.traits[known].color } }, part.text, h('sup', {}, DB.traits[known].icon))
      : h('span', { class: 'phrase' }, part.text);
  }));
}

let pane;

export function renderKitchen() {
  pane = $('#kitchen-pane');
  const sh = game.shift;
  if (!sh) return;
  pane.innerHTML = '';
  pane.append(
    h('div', { class: 'tickets scroll', id: 'tickets' }),
    h('div', { class: 'order-panel card', id: 'order-panel' }),
    h('div', { class: 'counter-row' }, h('h3', {}, 'Counter'), h('div', { class: 'counter scroll', id: 'counter' })),
    h('div', { class: 'stations', id: 'stations' }),
    h('div', { class: 'bowl-row', id: 'bowl' }),
    h('div', { class: 'pantry-head row' }, h('h3', {}, 'Pantry'), h('span', { class: 'spacer' }),
      h('button', { class: 'btn small', onclick: () => openRecipePicker() }, '📖 Recipe Book')),
    h('div', { class: 'pantry scroll', id: 'pantry' }),
  );
  renderTickets(); renderOrder(); renderCounter(); renderStations(); renderBowl(); renderPantry();
}

function renderTickets() {
  const el = $('#tickets');
  if (!el) return;
  const sh = game.shift;
  const seated = sh.customers.filter((c) => c.state === 'seated');
  el.innerHTML = '';
  if (!seated.length) { el.append(h('div', { class: 'ticket empty' }, 'No orders yet… 🕯️')); return; }
  for (const c of seated) {
    el.append(h('button', {
      class: `ticket${sh.selected === c.uid ? ' selected' : ''}${c.regularId ? ' regular' : ''}${c.isCritic ? ' critic' : ''}`,
      'data-uid': c.uid, onclick: () => selectCustomer(c.uid),
    },
    h('div', { class: 'ticket-face', html: monsterSVG(customerArt(c)) }),
    h('div', { class: 'ticket-name' }, c.name),
    h('div', { class: 'bar' }, h('i'))));
  }
  updateTicketBars();
}

function renderOrder() {
  const el = $('#order-panel');
  if (!el) return;
  const sh = game.shift;
  const c = sh.customers.find((x) => x.uid === sh.selected && x.state === 'seated');
  el.innerHTML = '';
  if (!c) {
    el.append(h('p', { class: 'muted center' }, 'Tap a hungry monster (or a ticket) to read their order.'));
    return;
  }
  const m = DB.monsters[c.species];
  el.append(
    h('div', { class: 'order-top' },
      h('div', { class: 'order-face', html: monsterSVG(customerArt(c)) }),
      h('div', { class: 'order-info' },
        h('div', { class: 'order-name' }, c.name, c.regularId ? h('span', { class: 'chip' }, '⭐ Regular') : null, c.isCritic ? h('span', { class: 'chip critic-chip' }, '🧐 FOOD CRITIC') : null, c.comfy ? h('span', { class: 'chip' }, '😌 Comfy') : null, c.cramped ? h('span', { class: 'chip' }, '😤 Cramped') : null),
        riddleEl(c.order.text),
        h('div', { class: 'bar', id: 'order-bar' }, h('i')))),
  );
  if (c.hint) el.append(h('p', { class: 'hint' }, '🧙 Hazel senses they want: ', traitChip(c.hint)));
  if (c.order.special === 'dragonfire') {
    el.append(h('div', { class: 'dragon-box' },
      h('p', {}, sh.dragonfire ? '🔥 The grill is blazing with dragonfire! Cook their dish on the GRILL.' : '🐉 They want it cooked with their own fiery sneeze. Tickle their nose!'),
      sh.dragonfire ? null : h('button', { class: 'btn primary', id: 'tickle-btn', onclick: () => tickleDragon() }, `🪶 Tickle! (${sh.tickles}/6)`)));
  }
  if (m.fire?.length && game.state.bestiary[c.species]?.sawFire) el.append(h('p', { class: 'hint warn' }, `⚠️ Careful: ${m.fire.map((t) => DB.traits[t].name).join(', ')} sets them on fire.`));
}

function renderCounter() {
  const el = $('#counter');
  if (!el) return;
  const sh = game.shift;
  el.innerHTML = '';
  const slots = sh.ctx.mods.counterSlots;
  const target = sh.customers.find((x) => x.uid === sh.selected && x.state === 'seated');
  for (const d of sh.counter) {
    el.append(h('div', { class: 'dish-card new', 'data-uid': d.uid },
      h('div', { class: 'dish-art' }, h('div', { html: dishSVG(d.station) }), h('div', { class: 'dish-ings' }, d.ingredients.map((i) => DB.ingredients[i].emoji).join(''))),
      h('div', { class: 'dish-name' }, d.recipeId ? '⭐ ' : '', d.name),
      h('div', { class: 'dish-traits' }, d.traits.map((t) => traitIcon(t))),
      h('div', { class: 'row dish-actions' },
        h('button', { class: 'btn green small serve-btn', disabled: !target, onclick: (e) => { serve(d.uid); e.stopPropagation(); } }, target ? `Serve to ${target.name.split(' ')[0]}` : 'Pick an order'),
        h('button', { class: 'btn small icon ghost', title: 'Throw away', 'aria-label': 'Throw away', onclick: () => trashDish(d.uid) }, '🗑️'))));
  }
  for (let i = sh.counter.length; i < slots; i++) el.append(h('div', { class: 'dish-card empty' }, h('span', {}, '🍽️')));
}

function renderStations() {
  const el = $('#stations');
  if (!el) return;
  el.innerHTML = '';
  for (const st of DB.stationList) {
    const status = stationStatus(st.id);
    const up = DB.upgrades[st.id];
    el.append(h('button', {
      class: `station ${status}${st.id === 'grill' && game.shift.dragonfire ? ' dragonfire' : ''}`, 'data-st': st.id,
      title: st.desc, onclick: () => cook(st.id),
    },
    h('div', { class: 'station-art', html: stationSVG(st.id) }),
    h('div', { class: 'station-name' }, st.name),
    h('div', { class: 'station-status' }, status === 'locked' ? `🔒 ${up ? `${up.cost}🪙 in Upgrades` : ''}` : status === 'broken' ? '🔧 Out of order' : status === 'cooking' ? 'Cooking…' : status === 'waiting' ? 'Counter full!' : `+${DB.traits[st.adds[0]].icon} ${st.removes.length ? `−${st.removes.map((t) => DB.traits[t].icon).join('')}` : ''}`),
    h('div', { class: 'bar' }, h('i'))));
  }
  updateStationBars();
}

function renderBowl() {
  const el = $('#bowl');
  if (!el) return;
  const sh = game.shift;
  const s = game.state;
  el.innerHTML = '';
  const slots = [0, 1, 2].map((i) => {
    const id = sh.bowl[i];
    const ing = id && DB.ingredients[id];
    return h('button', { class: `bowl-slot${ing ? ' filled' : ''}`, disabled: !ing, title: ing ? `Remove ${ing.name}` : 'Empty', onclick: () => removeFromBowl(i) }, ing ? ing.emoji : '+');
  });
  // Preview: traits you already know these ingredients have
  const known = new Set();
  let unknown = false;
  for (const id of sh.bowl) {
    if (s.knownIngredients[id]) DB.ingredients[id].traits.forEach((t) => known.add(t));
    else unknown = true;
  }
  el.append(
    h('div', { class: 'bowl' }, h('span', { class: 'bowl-label' }, '🥣 Bowl'), ...slots),
    h('div', { class: 'bowl-preview' }, sh.bowl.length ? [...known].map((t) => traitIcon(t)) : h('span', { class: 'muted' }, 'Pick up to 3 ingredients, then tap a station'), unknown ? h('span', { class: 'chip' }, '❓ ???') : null),
    sh.bowl.length ? h('button', { class: 'btn small ghost', onclick: () => clearBowl() }, 'Clear') : null,
  );
}

function renderPantry() {
  const el = $('#pantry');
  if (!el) return;
  const s = game.state;
  el.innerHTML = '';
  const ids = s.unlockedIngredients.filter((id) => DB.ingredients[id] && ((s.pantry[id] || 0) > 0 || !DB.ingredients[id].event));
  for (const id of ids) {
    const ing = DB.ingredients[id];
    const qty = s.pantry[id] || 0;
    const known = s.knownIngredients[id];
    el.append(h('button', {
      class: `ing${qty ? '' : ' empty'}`, 'data-ing': id, disabled: !qty, title: `${ing.name}: ${ing.desc}`,
      onclick: (e) => { if (addToBowl(id)) floatText(e.currentTarget, ing.emoji, 'ing-pop'); },
    },
    h('span', { class: 'ing-emoji' }, ing.emoji),
    h('span', { class: 'ing-name' }, ing.name),
    h('span', { class: 'ing-traits' }, known ? ing.traits.map((t) => traitIcon(t)) : h('span', { class: 'unknown' }, '???')),
    h('span', { class: 'ing-qty' }, `×${qty}`)));
  }
}

// ---------- Per-frame updates ----------
function setBar(bar, frac) {
  if (!bar) return;
  const f = Math.max(0, Math.min(1, frac));
  bar.firstChild.style.width = `${f * 100}%`;
  bar.classList.toggle('warn', f < 0.5 && f >= 0.25);
  bar.classList.toggle('danger', f < 0.25);
}

function updateTicketBars() {
  const sh = game.shift;
  if (!sh) return;
  for (const c of sh.customers) {
    if (c.state !== 'seated') continue;
    setBar(document.querySelector(`.ticket[data-uid="${c.uid}"] .bar`), c.patience / c.maxPatience);
    if (c.uid === sh.selected) setBar($('#order-bar'), c.patience / c.maxPatience);
  }
}

function updateStationBars() {
  const sh = game.shift;
  if (!sh) return;
  for (const st of DB.stationList) {
    const job = sh.cooking[st.id];
    const bar = document.querySelector(`.station[data-st="${st.id}"] .bar`);
    if (!bar) continue;
    bar.firstChild.style.width = job ? `${(1 - Math.max(0, job.remaining) / job.total) * 100}%` : '0%';
  }
}

export function updateKitchen() {
  updateTicketBars();
  updateStationBars();
}

export function initKitchenEvents() {
  const ifShift = (fn) => () => { if (game.shift && pane) fn(); };
  on('bowl', ifShift(() => renderBowl()));
  on('pantry', ifShift(() => { renderPantry(); renderBowl(); }));
  on('counter', ifShift(() => { renderCounter(); renderTickets(); renderOrder(); }));
  on('order:selected', ifShift(() => { renderTickets(); renderOrder(); renderCounter(); }));
  on('customer:seated', ifShift(() => { renderTickets(); renderOrder(); renderCounter(); }));
  on('customer:leave', ifShift(() => { renderTickets(); renderOrder(); renderCounter(); }));
  on('cook:start', ifShift(() => renderStations()));
  on('dish:ready', ifShift(() => { renderStations(); renderCounter(); }));
  on('kitchen', ifShift(() => renderStations()));
  on('backfire', ifShift(() => renderStations()));
  on('dragon:tickle', ifShift(() => {
    const btn = $('#tickle-btn');
    if (btn && !game.shift.dragonfire) { btn.textContent = `🪶 Tickle! (${game.shift.tickles}/6)`; btn.classList.remove('wiggle'); void btn.offsetWidth; btn.classList.add('wiggle'); }
    else { renderOrder(); renderStations(); }
  }));
  on('cook:start', ({ newlyKnown }) => {
    if (newlyKnown?.length) toast({ icon: '🔍', text: `Taste-tested! You now know the traits of ${newlyKnown.map((id) => DB.ingredients[id].name).join(' & ')}.` });
  });
}
