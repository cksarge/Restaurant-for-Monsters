/**
 * DINING ROOM (during a shift) — rooms, seated monsters, the waiting line,
 * speech bubbles, reactions and dirty tables.
 */
import { DB } from '../db.js';
import { game, on } from '../state.js';
import { h, $, escapeHtml } from '../utils.js';
import { roomsList } from '../layout.js';
import { renderRoom, signEl } from './room.js';
import { monsterSVG } from './sprites.js';
import { customerArt } from '../customers.js';
import { selectCustomer, cleanSeat, shooGhost } from '../shift.js';
import { plainText } from '../riddles.js';
import { flyCoins, floatText } from './fx.js';

const SIZE_SCALE = { small: 0.85, medium: 1, big: 1.15, giant: 1.35 };

let floors = {};        // roomId → floor element
let custEls = {};       // customer uid → element
let dirtyEls = {};      // seat key → element
let queueEl = null;
let ghostEl = null;

export function renderDining(onCalendar) {
  const pane = $('#dining-pane');
  pane.innerHTML = '';
  floors = {}; custEls = {}; dirtyEls = {};
  const rooms = roomsList();
  const roomsWrap = h('div', { class: 'rooms-wrap scroll' });
  for (const room of rooms) {
    const { el, floorEl } = renderRoom(room, { mode: 'dining', onCalendar });
    floors[room.id] = floorEl;
    roomsWrap.append(el);
  }
  queueEl = h('div', { class: 'queue-line' }, h('span', { class: 'queue-label' }, 'Waiting'));
  ghostEl = null;
  pane.append(h('div', { class: 'dining-head' }, signEl()), roomsWrap, queueEl);
}

/** Where a seated monster is drawn: feet at the seat anchor. */
function placeCustomer(el, c) {
  const room = roomsList().find((r) => r.id === c.seat.room);
  const m = DB.monsters[c.species];
  const scale = SIZE_SCALE[m.size] || 1;
  const w = Math.min(0.98, Math.max(0.74, c.seat.width * 1.1)) * scale;
  Object.assign(el.style, {
    left: `${(c.seat.x / room.w) * 100}%`,
    top: `${(c.seat.y / room.h) * 100}%`,
    width: `${(w / room.w) * 100}%`,
    zIndex: c.seat.z * 10 + 2,
  });
}

function custElement(c) {
  const art = customerArt(c);
  const el = h('div', {
    class: `cust entering${c.isCritic ? ' critic' : ''}${c.regularId ? ' regular' : ''}`,
    'data-uid': c.uid, 'data-body': art.body,
    style: { '--d': `${c.animDelay}s`, '--d2': `${c.animDelay * 1.7}s` },
    role: 'button', tabindex: '0', 'aria-label': `${c.name}. Tap to see their order.`,
    onclick: () => selectCustomer(c.uid),
    onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') selectCustomer(c.uid); },
  },
  h('div', { class: 'cust-sprite', html: monsterSVG(art) }),
  // The flag stacks icon, patience bar and (for regulars/critics) a name tag, so they never overlap
  h('div', { class: 'order-flag' },
    h('span', { class: 'flag-icon' }, c.order.special === 'dragonfire' ? '🔥' : c.regularId ? '⭐' : c.isCritic ? '🧐' : '❗'),
    h('div', { class: 'bar' }, h('i')),
    c.regularId || c.isCritic ? h('div', { class: 'name-tag' }, c.name.split(' ').slice(-1)[0]) : null));
  el.addEventListener('animationend', (e) => { if (e.animationName === 'walkIn') el.classList.remove('entering'); });
  return el;
}

/** Swap a monster's face for a reaction (re-draws the SVG with a mood). */
function setMood(el, c, mood) {
  const spr = el.querySelector('.cust-sprite');
  if (spr) spr.innerHTML = monsterSVG(customerArt(c), { mood });
}

export function sayBubble(c, text, { kind = 'speech', ms = 3600 } = {}) {
  const el = custEls[c.uid] || queueEl?.querySelector(`[data-uid="${c.uid}"]`);
  if (!el || !text) return;
  el.querySelectorAll('.bubble').forEach((x) => x.remove()); // one bubble per monster
  const b = h('div', { class: `bubble ${kind}` }, plainText(text));
  el.append(b);
  setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 320); }, ms);
}

// ---------- Per-frame update ----------
export function updateDining(sh) {
  if (!queueEl) return;
  for (const c of sh.customers) {
    if (c.state === 'queue') {
      let q = queueEl.querySelector(`[data-uid="${c.uid}"]`);
      if (!q) {
        q = h('div', { class: 'queue-mon', 'data-uid': c.uid, title: c.name },
          h('div', { class: 'cust-sprite', html: monsterSVG(customerArt(c)) }), h('div', { class: 'bar' }, h('i')));
        queueEl.append(q);
      }
      const limit = 70 * sh.ctx.mods.queuePatience * sh.ctx.moon.patienceMult;
      setBar(q.querySelector('.bar'), 1 - c.queueTime / limit);
    } else if ((c.state === 'seated' || c.state === 'eating') && c.seat) {
      queueEl.querySelector(`[data-uid="${c.uid}"]`)?.remove();
      let el = custEls[c.uid];
      if (!el) {
        el = custEls[c.uid] = custElement(c);
        placeCustomer(el, c);
        floors[c.seat.room]?.append(el);
      }
      el.classList.toggle('selected', sh.selected === c.uid);
      el.classList.toggle('waiting', c.state === 'seated');
      if (c.state === 'seated') {
        const frac = c.patience / c.maxPatience;
        setBar(el.querySelector('.order-flag .bar'), frac);
        el.classList.toggle('impatient', frac < 0.3);
      }
    }
  }

  // Dirty tables
  for (const key of Object.keys(sh.dirty)) {
    if (dirtyEls[key]) continue;
    const seat = sh.seats.find((s) => s.key === key);
    if (!seat) continue;
    const room = roomsList().find((r) => r.id === seat.room);
    const el = h('button', {
      class: 'dirty', title: 'Dirty table — tap to clean',
      style: { left: `${(seat.x / room.w) * 100}%`, top: `${((seat.y - 0.1) / room.h) * 100}%`, zIndex: seat.z * 10 + 4 },
      onclick: (e) => { e.stopPropagation(); cleanSeat(key); },
    }, '🍽️', h('span', { class: 'crumbs' }, '✨'));
    dirtyEls[key] = el;
    floors[seat.room]?.append(el);
  }

  // Tiny angry ghost
  if (sh.ghost && !ghostEl) {
    ghostEl = h('button', { class: 'tip-ghost', title: 'A tiny angry ghost eating your tips! (Poke it?)', onclick: () => shooGhost(), html: monsterSVG({ body: 'ghost', color: '#ffe0e8', eyes: 2, eyeColor: '#c0392b', mouth: 'teeth', extras: [] }, { mood: 'angry' }) });
    $('#dining-pane').append(ghostEl);
  }
}

function setBar(bar, frac) {
  if (!bar) return;
  const f = Math.max(0, Math.min(1, frac));
  bar.firstChild.style.width = `${f * 100}%`;
  bar.classList.toggle('warn', f < 0.5 && f >= 0.25);
  bar.classList.toggle('danger', f < 0.25);
}

// ---------- Event reactions ----------
export function initDiningEvents() {
  on('customer:say', ({ c, text }) => sayBubble(c, text));

  on('served', ({ c, result, pay, tip, ghostAte, line, trinket }) => {
    const el = custEls[c.uid];
    if (!el) return;
    setMood(el, c, result.reaction);
    el.classList.remove('waiting', 'impatient');
    el.querySelector('.order-flag')?.remove();
    const emoji = { delighted: '😍', unimpressed: '😐', confused: '😵‍💫', onfire: '🔥' }[result.reaction];
    const b = h('div', { class: `bubble reaction r-${result.reaction}` }, h('span', { class: 'r-emoji' }, emoji), h('span', { html: escapeHtml(plainText(line)) }));
    el.querySelectorAll('.bubble').forEach((x) => x.remove()); // one bubble per monster
    el.append(b);
    setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 320); }, 4200);
    if (pay + tip > 0) {
      flyCoins(el, Math.ceil((pay + tip) / 4));
      floatText(el, `+${pay + tip}🪙${tip ? ` (tip ${tip})` : ''}`, 'coins');
    }
    if (ghostAte) setTimeout(() => floatText(ghostEl || el, `👻 −${ghostAte} tip!`, 'bad'), 500);
    if (trinket && tip) setTimeout(() => floatText(el, `Tipped ${trinket}!`, 'trinket'), 900);
    if (result.reaction === 'onfire') el.classList.add('fire-run');
    // After the reaction, settle into a contented eating face
    else setTimeout(() => { if (custEls[c.uid]) setMood(el, c, result.reaction === 'delighted' ? 'delighted' : 'neutral'); }, 2600);
  });

  on('customer:leave', ({ c, why }) => {
    const el = custEls[c.uid];
    const q = queueEl?.querySelector(`[data-uid="${c.uid}"]`);
    if (q) { q.classList.add('leaving-q'); setTimeout(() => q.remove(), 500); }
    if (!el) return;
    delete custEls[c.uid];
    if (why === 'walkout') setMood(el, c, 'angry');
    if (why === 'fire') { setTimeout(() => el.remove(), 200); return; }
    setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 950); }, why === 'walkout' ? 1400 : 0);
  });

  on('seat:clean', (key) => {
    const el = dirtyEls[key];
    if (!el) return;
    delete dirtyEls[key];
    el.classList.add('cleaned');
    setTimeout(() => el.remove(), 400);
  });

  on('ghost:poke', (text) => {
    if (!ghostEl) return;
    ghostEl.querySelectorAll('.bubble').forEach((x) => x.remove());
    const b = h('div', { class: 'bubble speech' }, text);
    ghostEl.append(b);
    setTimeout(() => b.remove(), 1800);
  });
  on('ghost:gone', () => { ghostEl?.remove(); ghostEl = null; });
}
