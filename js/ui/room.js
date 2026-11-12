/**
 * ROOM RENDERER — draws a room (wall, floor, furniture, decorations, door,
 * lighting) for both the dining room and Build Mode.
 */
import { DB, itemDef } from '../db.js';
import { game } from '../state.js';
import { h } from '../utils.js';
import { footprint } from '../layout.js';
import { furnitureSVG, decorSVG } from './sprites.js';
import { dateInfo } from '../calendar.js';

const pct = (v, total) => `${(v / total) * 100}%`;

/** Position style for something at tile (x, y) of size (w, h) in a room. */
export function tileStyle(room, x, y, w = 1, h = 1) {
  return { left: pct(x, room.w), top: pct(y, room.h), width: pct(w, room.w), height: pct(h, room.h) };
}

/** Build the DOM for one placed item. Returns [backEl, frontEl] (backEl may be null). */
export function placedEls(room, p) {
  const def = itemDef(p.id);
  const f = footprint(p);
  const style = tileStyle(room, p.x, p.y, f.w, f.h);
  const flip = p.rot >= 2 ? ' flipped' : '';
  if (DB.furniture[p.id]) {
    const back = h('div', { class: `furn furn-back${flip}`, 'data-uid': p.uid, style: { ...style, zIndex: p.y * 10 + 1 }, html: furnitureSVG(def, f.w, f.h, 'back') });
    const front = h('div', { class: `furn furn-front${flip}`, 'data-uid': p.uid, style: { ...style, zIndex: p.y * 10 + 3 }, html: furnitureSVG(def, f.w, f.h, 'front') });
    return [back, front];
  }
  const el = h('div', { class: `decor anim-${def.anim || 'none'}${flip}`, 'data-uid': p.uid, style: { ...style, zIndex: p.y * 10 + 3 }, html: decorSVG(def) });
  return [null, el];
}

/**
 * Render a full room.
 * opts.mode: 'dining' | 'build'
 */
export function renderRoom(room, opts = {}) {
  const s = game.state;
  const wall = DB.wallpapers[s.wallpaper]?.css || DB.wallpaperList[0].css;
  const floorId = room.floor || s.floor;
  const floor = DB.floors[floorId]?.css || DB.floorList[0].css;

  const floorEl = h('div', { class: 'room-floor', style: { aspectRatio: `${room.w} / ${room.h}`, background: floor } });

  // Door (main room only)
  if (room.door) {
    floorEl.append(h('div', { class: 'door', style: { ...tileStyle(room, room.door[0], room.door[1]), zIndex: room.door[1] * 10 }, title: 'Front door' },
      h('div', { class: 'door-mat' }), h('span', { class: 'door-label' }, 'DOOR')));
  }

  for (const p of s.placed.filter((x) => x.room === room.id)) {
    const [back, front] = placedEls(room, p);
    if (back) floorEl.append(back);
    floorEl.append(front);
  }

  // Wall strip with a window showing tonight's moon
  const night = game.shift?.night ?? s.night;
  const d = dateInfo(night);
  const wallEl = h('div', { class: `room-wall ${room.outdoor ? 'outdoor' : ''}`, style: room.outdoor ? {} : { background: wall } },
    room.outdoor
      ? h('div', { class: 'patio-sky' }, h('span', { class: 'sky-moon' }, d.moon.icon), h('div', { class: 'fence' }))
      : h('div', { class: 'window' }, h('span', { class: 'sky-moon' }, d.moon.icon), h('i', { class: 'star', style: { '--i': 0 } }), h('i', { class: 'star', style: { '--i': 1 } })),
    !room.outdoor && room.id === 'main' && opts.mode === 'dining' ? wallCalendar(d, opts.onCalendar) : null,
    room.id === 'back' && !room.outdoor ? h('div', { class: 'window w2' }, h('span', { class: 'sky-moon' }, '✨')) : null,
  );

  const el = h('div', { class: `room room-${room.id} mode-${opts.mode || 'dining'}`, 'data-room': room.id, style: { '--w': room.w, '--h': room.h } },
    h('div', { class: 'room-title' }, room.name),
    wallEl,
    floorEl,
    h('div', { class: 'room-light', style: { '--light': s.light } }),
  );

  // Keep --cell in sync with the rendered size (floor patterns use it)
  const ro = new ResizeObserver(() => {
    const cell = floorEl.clientWidth / room.w;
    el.style.setProperty('--cell', `${cell}px`);
    el.style.setProperty('--cell2', `${cell * 2}px`);
  });
  ro.observe(floorEl);
  return { el, floorEl };
}

/** The little calendar hanging on the restaurant wall. */
function wallCalendar(d, onClick) {
  return h('button', { class: 'wall-calendar', title: 'Open the calendar', onclick: onClick },
    h('span', { class: 'wc-month' }, d.month.name),
    h('span', { class: 'wc-day' }, d.nightOfMonth + 1),
    h('span', { class: 'wc-moon' }, d.moon.icon));
}

/** The sign out front, in the chosen style. */
export function signEl() {
  const s = game.state;
  return h('div', { class: `restaurant-sign sign-${s.sign}` },
    h('span', { class: 'sign-chain l' }), h('span', { class: 'sign-chain r' }),
    h('span', { class: 'sign-text' }, s.restaurantName || "Mildred's Diner"),
    h('span', { class: 'sign-sub' }, 'Fine Dining for Monsters'));
}
