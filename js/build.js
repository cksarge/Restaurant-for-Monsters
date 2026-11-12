/**
 * BUILD MODE — an overhead grid view of the restaurant.
 *
 * Controls (mouse AND touch, via Pointer Events):
 *   • Tap an item in the catalog, then tap a tile to place it.
 *   • Tap a placed item to select it → Rotate / Move / Sell.
 *   • Or drag a placed item straight to a new tile.
 */
import { DB, itemDef } from './db.js';
import { game, addCoins, emit } from './state.js';
import { h, $, uid } from './utils.js';
import { roomsList, footprint, canPlace, seatSummary, crowding, CROWDED } from './layout.js';
import { renderRoom, tileStyle } from './ui/room.js';
import { furnitureSVG, decorSVG } from './ui/sprites.js';
import { spookiness, buyUpgrade, upgradeAvailable } from './economy.js';
import { saveGame } from './save.js';
import { toast, confirmDialog } from './ui/fx.js';
import { sfx } from './audio.js';

const ui = {
  roomId: 'main',
  tab: 'furniture',
  mode: null,        // { type: 'place', id } | { type: 'move', uid }
  selected: null,    // placed uid
  hover: null,       // { x, y }
};
let handlers = {};

export function openBuild(opts) {
  handlers = opts || handlers;
  ui.mode = null; ui.selected = null;
  if (!game.state.rooms[ui.roomId]) ui.roomId = 'main';
  renderBuild();
}

function commit(msg) {
  saveGame();
  emit('layout');
  if (msg) toast(msg);
  renderBuild();
}

// ---------- Actions ----------
function placeNew(id, x, y) {
  const s = game.state;
  const def = itemDef(id);
  if (!canPlace(s, ui.roomId, x, y, def.w || 1, def.h || 1)) { sfx('error'); return false; }
  if (s.coins < def.cost) { sfx('error'); toast({ icon: '🪙', text: 'Not enough coins!' }); return false; }
  addCoins(-def.cost);
  const p = { uid: uid('p'), id, room: ui.roomId, x, y, rot: 0 };
  s.placed.push(p);
  ui.mode = null;
  ui.selected = p.uid;
  sfx('pop');
  commit();
  return true;
}

function moveTo(puid, x, y) {
  const s = game.state;
  const p = s.placed.find((q) => q.uid === puid);
  if (!p) return false;
  const f = footprint(p);
  if (!canPlace(s, ui.roomId, x, y, f.w, f.h, p.uid)) { sfx('error'); return false; }
  p.x = x; p.y = y; p.room = ui.roomId;
  ui.mode = null;
  sfx('pop');
  commit();
  return true;
}

function rotate(puid) {
  const s = game.state;
  const p = s.placed.find((q) => q.uid === puid);
  const next = { ...p, rot: (p.rot + 1) % 4 };
  const f = footprint(next);
  if (!canPlace(s, p.room, p.x, p.y, f.w, f.h, p.uid)) { sfx('error'); toast({ icon: '↻', text: 'No room to rotate here. Move it first!' }); return; }
  p.rot = next.rot;
  sfx('click');
  commit();
}

async function sell(puid) {
  const s = game.state;
  const p = s.placed.find((q) => q.uid === puid);
  const def = itemDef(p.id);
  const refund = Math.floor(def.cost / 2);
  if (!(await confirmDialog(`Sell ${def.name}?`, `You'll get ${refund}🪙 back. (You can always buy it again.)`, 'Sell'))) return;
  s.placed = s.placed.filter((q) => q.uid !== puid);
  addCoins(refund);
  ui.selected = null;
  sfx('coin');
  commit();
}

// ---------- Rendering ----------
export function renderBuild() {
  const s = game.state;
  const view = $('#view-build');
  view.innerHTML = '';
  const rooms = roomsList();
  const room = rooms.find((r) => r.id === ui.roomId) || rooms[0];
  ui.roomId = room.id;
  const seats = seatSummary();
  const crowd = crowding(s, room.id);

  const top = h('div', { class: 'build-top card' },
    h('h2', {}, '🛠️ Build Mode'),
    h('div', { class: 'row' },
      h('span', { class: 'chip big-chip' }, `👻 Spookiness ${spookiness(s)}`),
      h('span', { class: 'chip big-chip' }, `🪑 ${seats.total} seats`),
      h('span', { class: 'chip big-chip', title: 'Booth-sized seats for big monsters' }, `🐺 ${seats.big} big`),
      h('span', { class: 'chip big-chip', title: 'Giant seats for trolls' }, `🪨 ${seats.giant} giant`),
      h('span', { class: `chip big-chip${crowd > CROWDED ? ' warn' : ''}`, title: 'Over 60% full makes big monsters grumpy' }, `${crowd > CROWDED ? '😤' : '🙂'} ${Math.round(crowd * 100)}% full`)),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn primary', onclick: () => handlers.onDone?.() }, '✓ Done'));

  const roomTabs = rooms.length > 1 ? h('div', { class: 'tabs room-tabs' }, rooms.map((r) =>
    h('button', { class: `tab${r.id === room.id ? ' active' : ''}`, onclick: () => { ui.roomId = r.id; ui.selected = null; renderBuild(); } }, r.name))) : null;

  const { el: roomEl, floorEl } = renderRoom(room, { mode: 'build' });
  wireFloor(room, floorEl);

  const stage = h('div', { class: 'build-stage' }, roomTabs, h('div', { class: 'build-room-wrap' }, roomEl), modeBar());
  const panel = h('div', { class: 'build-panel card' }, catalogTabs(), h('div', { class: 'build-catalog scroll' }, catalog()));
  view.append(top, h('div', { class: 'build-layout' }, stage, panel));
}

/** Tile overlay, selection, ghost preview and drag-to-move on the floor. */
function wireFloor(room, floorEl) {
  const s = game.state;
  floorEl.classList.add('build-floor');
  // Grid lines
  floorEl.append(h('div', { class: 'grid-lines', style: { backgroundSize: `${100 / room.w}% ${100 / room.h}%` } }));

  // Placed items are selectable & draggable
  floorEl.querySelectorAll('.furn, .decor').forEach((el) => {
    const puid = el.dataset.uid;
    if (puid === ui.selected) el.classList.add('selected');
    el.addEventListener('pointerdown', (e) => startDrag(e, puid, room, floorEl));
  });

  const ghost = h('div', { class: 'ghost-preview hidden' });
  floorEl.append(ghost);

  const tileAt = (e) => {
    const r = floorEl.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * room.w), y: Math.floor(((e.clientY - r.top) / r.height) * room.h) };
  };
  const preview = (t) => {
    const size = previewSize();
    if (!size || !t) { ghost.classList.add('hidden'); return; }
    const ok = canPlace(s, room.id, t.x, t.y, size.w, size.h, ui.mode?.uid);
    Object.assign(ghost.style, tileStyle(room, t.x, t.y, size.w, size.h));
    ghost.className = `ghost-preview ${ok ? 'ok' : 'bad'}`;
    ghost.innerHTML = size.html;
  };
  floorEl.addEventListener('pointermove', (e) => { if (ui.mode) preview(tileAt(e)); });
  floorEl.addEventListener('pointerleave', () => ghost.classList.add('hidden'));
  floorEl.addEventListener('click', (e) => {
    if (e.target.closest('.furn, .decor') && !ui.mode) return;
    const t = tileAt(e);
    if (ui.mode?.type === 'place') { if (!placeNew(ui.mode.id, t.x, t.y)) preview(t); }
    else if (ui.mode?.type === 'move') { if (!moveTo(ui.mode.uid, t.x, t.y)) preview(t); }
    else if (ui.selected) { ui.selected = null; renderBuild(); }
  });
}

function previewSize() {
  if (!ui.mode) return null;
  if (ui.mode.type === 'place') {
    const def = itemDef(ui.mode.id);
    return { w: def.w || 1, h: def.h || 1, html: DB.furniture[def.id] ? furnitureSVG(def, def.w, def.h) : decorSVG(def) };
  }
  const p = game.state.placed.find((q) => q.uid === ui.mode.uid);
  const f = footprint(p);
  const def = itemDef(p.id);
  return { ...f, html: DB.furniture[def.id] ? furnitureSVG(def, f.w, f.h) : decorSVG(def) };
}

/** Pointer drag: press on an item and drag it to a new tile. A short tap just selects it. */
function startDrag(e, puid, room, floorEl) {
  if (ui.mode) return;
  e.preventDefault();
  const el = e.currentTarget;
  const startX = e.clientX, startY = e.clientY;
  let dragging = false;
  const p = game.state.placed.find((q) => q.uid === puid);
  const f = footprint(p);
  const ghost = floorEl.querySelector('.ghost-preview');
  const r = floorEl.getBoundingClientRect();
  const cellW = r.width / room.w, cellH = r.height / room.h;
  let target = null;

  const move = (ev) => {
    const dx = ev.clientX - startX, dy = ev.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) < 8) return;
    dragging = true;
    floorEl.querySelectorAll(`[data-uid="${puid}"]`).forEach((x) => x.classList.add('dragging'));
    target = { x: Math.round(p.x + dx / cellW), y: Math.round(p.y + dy / cellH) };
    const ok = canPlace(game.state, room.id, target.x, target.y, f.w, f.h, puid);
    Object.assign(ghost.style, tileStyle(room, target.x, target.y, f.w, f.h));
    ghost.className = `ghost-preview ${ok ? 'ok' : 'bad'}`;
    const def = itemDef(p.id);
    ghost.innerHTML = DB.furniture[def.id] ? furnitureSVG(def, f.w, f.h) : decorSVG(def);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    if (!dragging) { ui.selected = ui.selected === puid ? null : puid; sfx('click'); renderBuild(); return; }
    if (!target || !moveTo(puid, target.x, target.y)) { toast({ icon: '🚫', text: 'Can\'t put it there.' }); renderBuild(); }
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  void el;
}

/** Toolbar under the room: what's selected / what mode you're in. */
function modeBar() {
  const s = game.state;
  if (ui.mode?.type === 'place') {
    const def = itemDef(ui.mode.id);
    return h('div', { class: 'mode-bar' }, h('span', {}, `Tap a tile to place: `, h('b', {}, def.name), ` (${def.cost}🪙)`), h('button', { class: 'btn small ghost', onclick: () => { ui.mode = null; renderBuild(); } }, 'Cancel'));
  }
  if (ui.mode?.type === 'move') return h('div', { class: 'mode-bar' }, h('span', {}, 'Tap a tile to move it there.'), h('button', { class: 'btn small ghost', onclick: () => { ui.mode = null; renderBuild(); } }, 'Cancel'));
  const p = s.placed.find((q) => q.uid === ui.selected);
  if (!p) return h('div', { class: 'mode-bar muted' }, 'Pick something from the catalog, or tap/drag furniture in the room.');
  const def = itemDef(p.id);
  const isFurn = !!DB.furniture[p.id];
  return h('div', { class: 'mode-bar selected-bar' },
    h('div', { class: 'sel-info' }, h('b', {}, def.name),
      h('small', { class: 'muted' }, isFurn ? `${def.seats} seats · fits ${def.fits.join('/')}` : `+${def.spook} Spookiness`, def.comfort?.length ? ` · comfy for ${def.comfort.map((c) => DB.monsters[c]?.name).join(', ')}` : '', def.loves?.length ? ` · loved by ${def.loves.map((c) => DB.monsters[c]?.name).join(', ')}` : '')),
    h('div', { class: 'row' },
      h('button', { class: 'btn small', onclick: () => rotate(p.uid) }, '↻ Rotate'),
      h('button', { class: 'btn small', onclick: () => { ui.mode = { type: 'move', uid: p.uid }; renderBuild(); } }, '✥ Move'),
      h('button', { class: 'btn small danger', onclick: () => sell(p.uid) }, `💰 Sell (${Math.floor(def.cost / 2)})`)));
}

function catalogTabs() {
  return h('div', { class: 'tabs' }, [['furniture', '🪑 Furniture'], ['decor', '🎃 Decor'], ['style', '🎨 Style'], ['themes', '🏰 Themes'], ['expand', '🔨 Expand']].map(([id, label]) =>
    h('button', { class: `tab${ui.tab === id ? ' active' : ''}`, onclick: () => { ui.tab = id; sfx('click'); renderBuild(); } }, label)));
}

function catalog() {
  const s = game.state;
  switch (ui.tab) {
    case 'furniture':
    case 'decor': {
      const list = ui.tab === 'furniture' ? DB.furnitureList : DB.decorList;
      return h('div', { class: 'catalog-grid' }, list.map((def) => {
        const unlocked = s.unlockedItems.includes(def.id);
        const lockText = def.rep !== undefined ? `Unlocks at ${def.rep}★` : def.event ? `${DB.seasonal[def.event].name} only` : 'Unlock via goals & stories';
        return h('button', {
          class: `cat-item${unlocked ? '' : ' locked'}${ui.mode?.id === def.id ? ' active' : ''}`, disabled: !unlocked, title: def.desc,
          onclick: () => { if (s.coins < def.cost) { toast({ icon: '🪙', text: 'Not enough coins!' }); sfx('error'); return; } ui.mode = { type: 'place', id: def.id }; ui.selected = null; sfx('click'); renderBuild(); },
        },
        h('div', { class: 'cat-art', html: DB.furniture[def.id] ? furnitureSVG(def, def.w, def.h) : decorSVG(def) }),
        h('b', {}, def.name),
        h('small', {}, unlocked ? `${def.cost}🪙 · ${DB.furniture[def.id] ? `${def.seats} seat${def.seats > 1 ? 's' : ''} · ${def.w}×${def.h}` : `+${def.spook}👻`}` : `🔒 ${lockText}`),
        unlocked ? h('small', { class: 'muted cat-desc' }, def.desc) : null);
      }));
    }
    case 'style': return styleTab();
    case 'themes': return themesTab();
    case 'expand': return expandTab();
    default: return h('div');
  }
}

function styleTab() {
  const s = game.state;
  const swatches = (list, key) => h('div', { class: 'swatches' }, list.map((it) =>
    h('button', { class: `swatch${s[key] === it.id ? ' on' : ''}`, title: it.name, style: { background: it.css, '--cell': '24px', '--cell2': '48px' }, onclick: () => { s[key] = it.id; sfx('click'); commit(); } }, h('span', {}, it.name))));
  return h('div', { class: 'style-tab' },
    h('h4', {}, 'Restaurant name'),
    h('input', { type: 'text', maxlength: 28, value: s.restaurantName, 'aria-label': 'Restaurant name', onchange: (e) => { s.restaurantName = e.target.value.trim() || "Mildred's Diner"; commit({ icon: '🪧', text: 'New sign painted!' }); } }),
    h('h4', {}, 'Sign out front'),
    h('div', { class: 'row' }, DB.signStyles.map((st) => h('button', { class: `btn small${s.sign === st.id ? ' primary' : ''}`, onclick: () => { s.sign = st.id; commit(); } }, st.name))),
    h('h4', {}, 'Wallpaper'), swatches(DB.wallpaperList, 'wallpaper'),
    h('h4', {}, 'Flooring'), swatches(DB.floorList, 'floor'),
    h('h4', {}, 'Lighting colour'),
    h('div', { class: 'row' }, DB.lights.map((c) => h('button', { class: `light-swatch${s.light === c ? ' on' : ''}`, style: { background: c }, 'aria-label': `Light ${c}`, onclick: () => { s.light = c; commit(); } }))));
}

function themesTab() {
  const s = game.state;
  return h('div', { class: 'theme-list' }, DB.themeList.map((t) => {
    const owned = s.ownedThemes.includes(t.id);
    const active = s.theme === t.id;
    const fans = DB.monsterList.filter((m) => m.themes?.love?.includes(t.id)).map((m) => m.name);
    const haters = DB.monsterList.filter((m) => m.themes?.hate?.includes(t.id)).map((m) => m.name);
    return h('div', { class: `theme-card${active ? ' active' : ''}` },
      h('div', { class: 'theme-preview', style: { background: DB.wallpapers[t.wallpaper].css } }, h('div', { class: 'theme-floor', style: { background: DB.floors[t.floor].css, '--cell': '20px', '--cell2': '40px' } }), h('div', { class: 'theme-light', style: { background: `radial-gradient(circle at 50% 30%, ${t.light}66, transparent 70%)` } })),
      h('div', { class: 'theme-info' }, h('b', {}, t.name), h('small', { class: 'muted' }, t.desc),
        h('small', {}, `+${t.spook}👻`, fans.length ? ` · 💚 ${fans.join(', ')}` : '', haters.length ? ` · 💔 ${haters.join(', ')}` : '')),
      active ? h('span', { class: 'chip good' }, '✓ Active')
        : owned ? h('button', { class: 'btn small green', onclick: () => applyTheme(t) }, 'Apply')
          : h('button', { class: 'btn small primary', disabled: s.rep < t.minRep || s.coins < t.cost, onclick: () => buyTheme(t) }, s.rep < t.minRep ? `Needs ${t.minRep}★` : `${t.cost}🪙`));
  }));
}

function applyTheme(t) {
  const s = game.state;
  s.theme = t.id; s.wallpaper = t.wallpaper; s.floor = t.floor; s.light = t.light;
  sfx('fanfare');
  commit({ icon: '🏰', text: `Your restaurant is now a ${t.name}!` });
}
function buyTheme(t) {
  const s = game.state;
  if (s.coins < t.cost) return;
  addCoins(-t.cost);
  s.ownedThemes.push(t.id);
  applyTheme(t);
}

function expandTab() {
  const s = game.state;
  return h('div', { class: 'upgrade-list' }, DB.upgradeList.filter((u) => u.type === 'expansion').map((up) => {
    const owned = s.upgrades.includes(up.id);
    const avail = upgradeAvailable(up);
    return h('div', { class: `upgrade${owned ? ' owned' : ''}` }, h('span', { class: 'up-icon' }, up.icon),
      h('div', { class: 'up-info' }, h('b', {}, up.name), h('small', { class: 'muted' }, up.desc)),
      owned ? h('span', { class: 'chip good' }, '✓ Done') : h('button', {
        class: 'btn small primary', disabled: !avail || s.coins < up.cost,
        onclick: () => { if (buyUpgrade(up.id)) { sfx('fanfare'); ui.roomId = up.effects.room.id; commit({ icon: up.icon, text: `${up.name} — more room for monsters!` }); } },
      }, s.rep < up.minRep ? `Needs ${up.minRep}★` : `${up.cost}🪙`));
  }));
}
