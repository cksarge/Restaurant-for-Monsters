/**
 * HUD — the top bar: coins, reputation, Spookiness, date, moon and clock.
 */
import { game, on } from '../state.js';
import { h, $, formatClock, starString } from '../utils.js';
import { dateInfo } from '../calendar.js';
import { spookiness } from '../economy.js';
import { sfx } from '../audio.js';
import { saveSettings } from '../save.js';

let handlers = {};

/** Stars with empty ones dimmed, e.g. ★★½☆☆ */
const starHtml = (rep) => {
  const str = starString(rep);
  return [...str].map((ch) => `<i class="${ch === '☆' ? 'off' : ch === '⯪' ? 'half' : 'on'}">${ch === '⯪' ? '★' : ch}</i>`).join('');
};

export function renderHud(opts) {
  handlers = opts || handlers;
  const s = game.state;
  const sh = game.shift;
  const night = sh ? sh.night : s.night;
  const d = dateInfo(night);
  const hud = $('#hud');
  hud.innerHTML = '';
  hud.append(...[
    h('div', { class: 'hud-stats' },
      h('div', { class: 'hud-stat coins', id: 'hud-coins', title: 'Coins' }, h('span', { class: 'coin-icon' }), h('b', { id: 'hud-coins-val' }, s.coins)),
      h('div', { class: 'hud-stat rep', id: 'hud-rep', title: `Reputation: ${s.rep.toFixed(2)} / 5` }, h('span', { class: 'stars', html: starHtml(s.rep) })),
      h('div', { class: 'hud-stat spook', id: 'hud-spook', title: 'Spookiness — some monsters only visit spooky places' }, '👻 ', h('b', {}, spookiness(s)))),
    h('button', { class: 'hud-date', title: 'Open the calendar', onclick: () => handlers.onCalendar?.() },
      h('span', { class: 'hud-moon', title: d.moon.name }, d.moon.icon),
      h('span', { class: 'hud-date-text' }, h('b', {}, d.dayName), h('small', {}, `${d.month.name} ${d.nightOfMonth + 1} · Yr ${d.year + 1}`))),
    sh ? h('div', { class: 'hud-clock', id: 'hud-clock', title: 'In-game time. Doors close at 2:00 AM.' }, '🕰️ ', h('b', { id: 'hud-clock-val' }, formatClock(sh.clock))) : null,
    h('div', { class: 'hud-buttons' },
      sh ? h('button', { class: 'btn icon', id: 'hud-pause', title: 'Pause', 'aria-label': 'Pause', onclick: () => handlers.onPause?.() }, sh.paused ? '▶️' : '⏸️') : null,
      h('button', { class: 'btn icon', title: 'Recipe Book', 'aria-label': 'Recipe Book', onclick: () => handlers.onBook?.() }, '📖'),
      h('button', { class: 'btn icon', title: 'Monster Guide', 'aria-label': 'Monster Guide', onclick: () => handlers.onGuide?.() }, '👾'),
      h('button', { class: 'btn icon', id: 'hud-mute', title: 'Sound on/off', 'aria-label': 'Toggle sound', onclick: () => { game.settings.sound = !game.settings.sound; saveSettings(); sfx('click'); renderHud(); } }, game.settings.sound ? '🔊' : '🔇'),
      h('button', { class: 'btn icon', title: 'Settings', 'aria-label': 'Settings', onclick: () => handlers.onSettings?.() }, '⚙️')),
  ].filter(Boolean));
}

export function updateHudClock() {
  const sh = game.shift;
  const el = $('#hud-clock-val');
  if (!sh || !el) return;
  el.textContent = formatClock(sh.clock);
  $('#hud-clock').classList.toggle('closing', sh.closing || sh.clock > sh.length - 40);
}

export function initHudEvents() {
  on('coins', (v) => { const el = $('#hud-coins-val'); if (el) el.textContent = v; });
  on('rep', (v) => {
    const el = $('#hud-rep');
    if (!el) return;
    el.querySelector('.stars').innerHTML = starHtml(v);
    el.title = `Reputation: ${v.toFixed(2)} / 5`;
  });
  on('pause', () => renderHud());
}
