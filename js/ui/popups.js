/**
 * POPUP LAYOUT MANAGER — guarantees popups never overlap each other.
 *
 * Every frame it collects all visible popups (toasts, the tutorial coach,
 * speech & reaction bubbles, floating "+coins" text, order flags, dirty-table
 * markers…), sorts them by priority, and places them one by one:
 *   • 'fixed' popups can't move — if they'd overlap something more important
 *     they're hidden until there's room again.
 *   • 'up' / 'down' popups slide out of the way using the CSS `translate`
 *     property (separate from `transform`, so their animations keep working).
 *     If sliding would push them off-screen, they're hidden instead.
 *
 * To make a new kind of popup participate, add its selector to RULES.
 */
const RULES = [
  // selector                          priority  mode     scale origin (for entrance animations)
  ['.modal-card',                      120,      'fixed', 'center'],
  ['.insp-card, .insp-intro',          120,      'fixed', 'center'],
  ['.pause-card',                      115,      'fixed', 'center'],
  ['.coach-bubble',                    100,      'fixed', 'center'],
  ['.toast',                            90,      'down',  'center'],
  ['.bubble.reaction',                  60,      'up',    'bottom'],
  ['.bubble.speech',                    50,      'up',    'bottom'],
  ['.float-text',                       40,      'up',    'center'],
  ['.dirty',                            25,      'fixed', 'center'],
  ['.cust.waiting .order-flag',         20,      'fixed', 'center'],
];

const GAP = 6;

const overlaps = (a, b) => a.left < b.right + GAP && b.left < a.right + GAP && a.top < b.bottom + GAP && b.top < a.bottom + GAP;

/** Current translate Y (including mid-transition values). */
function currentShift(el) {
  const t = getComputedStyle(el).translate;
  if (!t || t === 'none') return 0;
  const parts = t.split(' ');
  return parseFloat(parts[1] || '0') || 0;
}

function collect() {
  const items = [];
  let order = 0;
  for (const [sel, pri, mode, origin] of RULES) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const shift = mode === 'fixed' ? 0 : currentShift(el);
      // Use the popup's FULL size (offsetWidth/Height ignore scale), so a popup
      // that is still growing in can never grow into a neighbour.
      const w = el.offsetWidth || r.width;
      const hgt = el.offsetHeight || r.height;
      const cx = (r.left + r.right) / 2;
      let top;
      if (origin === 'bottom') top = r.bottom - shift - hgt;
      else top = (r.top + r.bottom) / 2 - shift - hgt / 2;
      items.push({ el, pri, mode, order: order++, rect: { left: cx - w / 2, right: cx + w / 2, top, bottom: top + hgt } });
    }
  }
  // Full windows (modals, inspector, pause) are all priority 115+. Among them the
  // NEWEST one wins (e.g. a confirm dialog opened from Settings), so sort those
  // by document position, latest first. Everything else keeps rule/DOM order.
  return items.sort((a, b) => {
    if (a.pri >= 115 && b.pri >= 115 && a.el !== b.el) {
      return a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
    }
    return b.pri - a.pri || a.order - b.order;
  });
}

function layout() {
  const items = collect();
  if (!items.length) return;
  const placed = [];
  for (const it of items) {
    const rect = { ...it.rect };
    let dy = 0;
    let hidden = false;

    if (it.mode === 'fixed') {
      hidden = placed.some((p) => overlaps(rect, p));
    } else {
      // Slide away from whatever we hit, repeatedly, until clear
      for (let i = 0; i < 16; i++) {
        const hit = placed.find((p) => overlaps(rect, p));
        if (!hit) break;
        const move = it.mode === 'up' ? (hit.top - GAP) - rect.bottom : (hit.bottom + GAP) - rect.top;
        rect.top += move; rect.bottom += move; dy += move;
      }
      if (placed.some((p) => overlaps(rect, p)) || rect.top < 0 || rect.bottom > window.innerHeight) hidden = true;
    }

    it.el.classList.toggle('popup-hidden', hidden);
    if (it.mode !== 'fixed') {
      const want = hidden ? 0 : Math.round(dy);
      if (+(it.el.dataset.nudge || 0) !== want) {
        it.el.dataset.nudge = want;
        it.el.style.translate = want ? `0 ${want}px` : '';
      }
    }
    if (!hidden) placed.push(rect);
  }
}

/** Is a full-screen overlay (modal, inspector) covering the game right now? */
export function blockingOverlay() {
  return !!document.querySelector('.modal-backdrop, .inspector-overlay');
}

let running = false;
let onFrame = [];
export function startPopupManager() {
  if (running) return;
  running = true;
  const tick = () => {
    try {
      for (const fn of onFrame) fn();
      layout();
    } catch (err) { console.error('[popups]', err); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  // Also lay out the instant a popup is added, before the browser paints it,
  // so a new popup is never visible in an overlapping spot (even for one frame).
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; try { layout(); } catch (err) { console.error('[popups]', err); } });
  }).observe(document.body, { childList: true, subtree: true });
}

/** Run a callback every frame before layout (used to flush waiting toasts). */
export const everyFrame = (fn) => { onFrame.push(fn); };
