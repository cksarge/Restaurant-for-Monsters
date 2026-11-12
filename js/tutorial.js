/**
 * TUTORIAL — a short guided first night with Sir Tentacles.
 * Each step points at something and waits for the player to do it.
 * The in-game clock and patience are frozen until the first dish is served.
 */
import { game, on } from './state.js';
import { h, $ } from './utils.js';
import { blockingOverlay } from './ui/popups.js';

const STEPS = [
  { text: 'Welcome to your first night! Monsters will wander in and sit at your tables. Here comes one now…', waitFor: 'customer:seated', target: null, button: false },
  { text: 'That\'s Sir Tentacles! Tap him (or his ticket) to read his order.', waitFor: 'order:tapped', target: '.cust.waiting', pane: 'dining' },
  { text: 'Monsters order in riddles. "Soup" means SOUPY — the Cauldron makes everything soupy. "But sad" means GLOOMY. Bog Water looks pretty gloomy… tap it!', waitFor: 'ingredient:added', target: '[data-ing="bog-water"]', pane: 'kitchen' },
  { text: 'Now tap the Cauldron to cook it. (You can add up to 3 ingredients per dish.)', waitFor: 'cook:start', target: '[data-st="cauldron"]', pane: 'kitchen' },
  { text: 'Bubble, bubble… finished dishes land on the Counter.', waitFor: 'dish:ready', target: '[data-st="cauldron"]', pane: 'kitchen' },
  { text: 'Tap "Serve" to give the dish to Sir Tentacles!', waitFor: 'served', target: '.serve-btn', pane: 'kitchen' },
  { text: 'Splendid! Now you know Bog Water\'s traits, and the phrases you decoded will show hint icons in future orders. Combos that delight monsters are saved in your 📖 Recipe Book. Keep the customers happy until 2 AM!', waitFor: null, target: null, button: 'Let\'s cook! 🍳' },
];

let step = -1;
let bubble = null;
let ring = null;
let raf = null;
let showPane = () => {};

export function startTutorial(paneSwitcher) {
  showPane = paneSwitcher || showPane;
  step = -1;
  bubble = h('div', { class: 'coach-bubble', role: 'status' });
  ring = h('div', { class: 'coach-ring hidden' });
  $('#coach-root').append(ring, bubble);
  next();
  const loop = () => { position(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
}

function next() {
  step++;
  const st = STEPS[step];
  if (!st) return end();
  // Freeze the clock once the first customer has sat down, so there's no rush while learning
  if (game.shift) game.shift.tutorialHold = step >= 1;
  if (st.pane) showPane(st.pane);
  bubble.innerHTML = '';
  bubble.append(h('div', { class: 'coach-mildred' }, '👻'), h('p', {}, st.text));
  if (st.button) bubble.append(h('button', { class: 'btn primary', onclick: () => next() }, st.button));
  bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  if (st.waitFor) {
    const off = on(st.waitFor, () => { off(); setTimeout(next, st.waitFor === 'served' ? 1600 : 250); });
  }
}

function end() {
  cancelAnimationFrame(raf);
  bubble?.remove(); ring?.remove();
  bubble = ring = null;
  if (game.shift) game.shift.tutorialHold = false;
}

/** Keep the ring & bubble next to the target as things move. */
function position() {
  const st = STEPS[step];
  if (!st || !bubble) return;
  // Step aside while a window (settings, recipe book…) is open
  const covered = blockingOverlay();
  bubble.classList.toggle('hidden', covered);
  if (covered) { ring.classList.add('hidden'); return; }
  const target = st.target ? document.querySelector(st.target) : null;
  const r = target?.getBoundingClientRect();
  if (!r || r.width === 0) {
    ring.classList.add('hidden');
    bubble.style.left = '50%'; bubble.style.top = '18%'; bubble.style.transform = 'translateX(-50%)';
    return;
  }
  ring.classList.remove('hidden');
  Object.assign(ring.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
  const bw = Math.min(340, window.innerWidth - 24);
  const below = r.bottom + 16 + 140 < window.innerHeight;
  const left = Math.max(12, Math.min(window.innerWidth - bw - 12, r.left + r.width / 2 - bw / 2));
  Object.assign(bubble.style, { left: `${left}px`, top: below ? `${r.bottom + 14}px` : `${Math.max(8, r.top - 14)}px`, transform: below ? 'none' : 'translateY(-100%)', width: `${bw}px` });
}

export const tutorialActive = () => !!bubble;
