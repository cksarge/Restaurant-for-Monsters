/**
 * Small shared helpers: randomness, DOM building and formatting.
 */

// ---------- Randomness ----------
export const rand = () => Math.random();
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick from items using weightFn(item) → number ≥ 0. Returns null if all weights are 0. */
export function weightedPick(items, weightFn) {
  const weights = items.map((it) => Math.max(0, weightFn(it)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Seeded RNG (mulberry32). Used for the yearly event schedule so it's the same
 * every time a save is loaded.
 */
export function seededRng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple string hash → int (used to give unnamed dishes stable names). */
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

let uidCounter = 0;
export const uid = (prefix = 'u') => `${prefix}${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

// ---------- DOM ----------
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Tiny element builder.
 *   h('button', { class: 'btn', onclick: fn }, 'Text', childEl)
 * Props starting with "on" become event listeners; `html` sets innerHTML;
 * `style` may be an object; `data-*` and other attributes are set directly.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      // CSS custom properties (--foo) must go through setProperty
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
        else el.style[sk] = sv;
      }
    }
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    if (c instanceof Node) el.append(c);
    else appendText(el, String(c));
  }
  return el;
}

/**
 * Append text, swapping every 🪙 for a little gold CSS coin (the emoji is
 * silver on some devices, which doesn't match the coin counter).
 */
function appendText(el, text) {
  if (!text.includes('🪙')) { el.append(document.createTextNode(text)); return; }
  text.split('🪙').forEach((part, i) => {
    if (i > 0) el.append(Object.assign(document.createElement('i'), { className: 'coin-inline', title: 'coins' }));
    if (part) el.append(document.createTextNode(part));
  });
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Formatting ----------
/** In-game clock: minutes since the 6:00 PM opening → "9:30 PM". */
export function formatClock(minutes) {
  const total = (18 * 60 + Math.floor(minutes)) % (24 * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
}

export const plural = (n, word, pluralWord = word + 's') => `${n} ${n === 1 ? word : pluralWord}`;

/** Star string for a 0–5 reputation, e.g. ★★★☆☆ */
export function starString(rep) {
  const full = Math.floor(rep);
  const half = rep - full >= 0.5;
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
