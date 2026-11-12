/**
 * FX — toasts, floating text, flying coins, confetti and modals.
 * All purely visual; game logic never depends on these finishing.
 */
import { h, $ } from '../utils.js';
import { game } from '../state.js';
import { blockingOverlay, everyFrame } from './popups.js';

const animMs = (ms) => ms * (game.settings.animSpeed ? 1 / game.settings.animSpeed : 0.01);

// ---------- Toasts ----------
// Toasts that arrive while a modal or the inspector is open wait their turn,
// so they never pop up on top of another window.
const pendingToasts = [];
everyFrame(() => {
  if (pendingToasts.length && !blockingOverlay()) showToast(pendingToasts.shift());
});

export function toast(t) {
  if (blockingOverlay()) { pendingToasts.push(t); return; }
  showToast(t);
}

function showToast({ icon = '✨', text, big = false, ms = 3800 }) {
  const root = $('#toast-root');
  if (!root) return;
  const el = h('div', { class: `toast${big ? ' big' : ''}`, role: 'status' }, h('span', { class: 'toast-icon' }, icon), h('span', {}, text));
  root.append(el);
  while (root.children.length > 4) root.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), animMs(320)); }, big ? ms + 1200 : ms);
}

// ---------- Floating text (e.g. "+12") above an element ----------
export function floatText(anchorEl, text, cls = '') {
  if (!anchorEl) return;
  const r = anchorEl.getBoundingClientRect();
  const el = h('div', { class: `float-text ${cls}`, style: { left: `${r.left + r.width / 2}px`, top: `${r.top}px` } }, text);
  $('#fx-root').append(el);
  setTimeout(() => el.remove(), animMs(1400));
}

// ---------- Coins flying to the HUD counter ----------
export function flyCoins(fromEl, count = 5, target = '#hud-coins') {
  const to = $(target);
  if (!fromEl || !to || !game.settings.animSpeed) return;
  const a = fromEl.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const n = Math.min(10, Math.max(1, count));
  for (let i = 0; i < n; i++) {
    const coin = h('div', { class: 'fly-coin', style: { left: `${a.left + a.width / 2}px`, top: `${a.top + a.height / 3}px` } });
    $('#fx-root').append(coin);
    const jitterX = (Math.random() - 0.5) * 50;
    // Two-step: pop up first, then swoop to the counter
    setTimeout(() => {
      coin.style.transform = `translate(${jitterX}px, ${-30 - Math.random() * 30}px) scale(1.1)`;
      setTimeout(() => {
        coin.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 3}px) scale(0.6)`;
        coin.style.opacity = '0.4';
      }, animMs(180));
    }, i * animMs(60));
    setTimeout(() => {
      coin.remove();
      if (i === n - 1) { to.classList.remove('hud-bump'); void to.offsetWidth; to.classList.add('hud-bump'); }
    }, i * animMs(60) + animMs(1000));
  }
}

// ---------- Confetti burst ----------
export function confetti(x = window.innerWidth / 2, y = window.innerHeight / 3, n = 40) {
  // Never sprinkle confetti over an open window
  if (!game.settings.animSpeed || blockingOverlay()) return;
  const colors = ['#ffcf7a', '#7ed957', '#a77bff', '#ff6b7a', '#7ad9ff', '#ffd23f'];
  for (let i = 0; i < n; i++) {
    const el = h('div', { class: 'confetti', style: { left: `${x}px`, top: `${y}px`, background: colors[i % colors.length] } });
    $('#fx-root').append(el);
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 180;
    el.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: animMs(1200 + Math.random() * 600), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => el.remove();
  }
}

// ---------- Modals ----------
let modalStack = [];

/**
 * Open a modal. `content` is an element (or a function returning one).
 * Returns a close() function.
 */
export function openModal({ title, content, wide = false, onClose, closable = true, className = '' }) {
  const root = $('#modal-root');
  const close = () => {
    backdrop.remove();
    modalStack = modalStack.filter((m) => m !== backdrop);
    onClose?.();
  };
  const card = h('div', { class: `modal-card card ${wide ? 'wide' : ''} ${className}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Dialog' },
    title ? h('div', { class: 'modal-head' }, h('h2', {}, title), closable ? h('button', { class: 'btn icon ghost', 'aria-label': 'Close', onclick: close }, '✕') : null) : null,
    h('div', { class: 'modal-body scroll' }, typeof content === 'function' ? content(close) : content));
  const backdrop = h('div', { class: 'modal-backdrop', onclick: (e) => { if (e.target === backdrop && closable) close(); } }, card);
  root.append(backdrop);
  modalStack.push(backdrop);
  return close;
}

export const modalOpen = () => modalStack.length > 0;

export function closeTopModal() {
  const top = modalStack[modalStack.length - 1];
  top?.querySelector('.modal-head .btn')?.click();
}

/** Promise-based in-game confirm dialog (never uses the browser's blocking confirm()). */
export function confirmDialog(title, text, okLabel = 'Yes', cancelLabel = 'Cancel') {
  return new Promise((resolve) => {
    let settled = false;
    const close = openModal({
      title,
      onClose: () => { if (!settled) resolve(false); },
      content: h('div', {}, h('p', {}, text), h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '12px' } },
        h('button', { class: 'btn ghost', onclick: () => { settled = true; resolve(false); close(); } }, cancelLabel),
        h('button', { class: 'btn primary', onclick: () => { settled = true; resolve(true); close(); } }, okLabel))),
    });
  });
}
