/**
 * SPRITES — every monster, piece of furniture, decoration and cooking station
 * is drawn here as layered inline SVG. No image files needed.
 *
 * Monsters are built from a small "art recipe" in data/monsters.js:
 *   { body, color, belly, eyes, eyeColor, mouth, extras: [...], accent, scale }
 *
 * The SVG is split into named groups so CSS can animate them separately
 * (see css/animations.css):
 *   .spr-body   breathing / squash-and-stretch
 *   .spr-eyes   blinking
 *   .spr-arms   waving when delighted
 *   .spr-fire   flame overlay when comically on fire
 *
 * To add a new accessory, add a function to EXTRAS below and use its name in
 * a monster's `extras` list.
 */

let idSeq = 0;

// ---------- Colour helpers ----------
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** Lighten (amt > 0) or darken (amt < 0) a hex colour by a percentage. */
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.round(Math.max(0, Math.min(255, amt >= 0 ? c + (255 - c) * (amt / 100) : c * (1 + amt / 100))));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// ---------- Body shapes ----------
// Each returns the outline path/shape plus "anchors" used to place the face and accessories.
const BODIES = {
  tall: () => ({ d: 'M30,58 Q30,28 60,28 Q90,28 90,58 L90,118 Q90,130 78,130 L42,130 Q30,130 30,118 Z', cx: 60, top: 28, faceY: 62, halfW: 30, bottom: 130, arms: [32, 88, 92] }),
  round: () => ({ d: 'M60,42 C88,42 104,62 104,88 C104,114 86,130 60,130 C34,130 16,114 16,88 C16,62 32,42 60,42 Z', cx: 60, top: 42, faceY: 80, halfW: 42, bottom: 130, arms: [18, 102, 98] }),
  blob: () => ({ d: 'M14,130 C8,100 20,50 60,48 C100,50 112,100 106,130 Q60,136 14,130 Z', cx: 60, top: 48, faceY: 84, halfW: 44, bottom: 130, arms: null }),
  ghost: () => ({ d: 'M28,124 L28,60 Q28,22 60,22 Q92,22 92,60 L92,124 Q86,116 80,124 Q74,132 68,124 Q62,116 56,124 Q50,132 44,124 Q38,116 34,124 Q31,128 28,124 Z', cx: 60, top: 22, faceY: 58, halfW: 32, bottom: 126, arms: [30, 90, 82] }),
  wide: () => ({ d: 'M14,78 Q14,40 60,40 Q106,40 106,78 L106,116 Q106,130 92,130 L28,130 Q14,130 14,116 Z', cx: 60, top: 40, faceY: 74, halfW: 46, bottom: 130, arms: [16, 104, 104] }),
  tentacle: () => ({ d: 'M60,22 C86,22 100,40 100,60 C100,82 86,96 60,96 C34,96 20,82 20,60 C20,40 34,22 60,22 Z', cx: 60, top: 22, faceY: 58, halfW: 40, bottom: 96, arms: null }),
  skeleton: () => ({ d: 'M60,22 C78,22 88,34 88,50 C88,62 82,70 76,74 L76,80 L44,80 L44,74 C38,70 32,62 32,50 C32,34 42,22 60,22 Z', cx: 60, top: 22, faceY: 50, halfW: 28, bottom: 80, arms: null }),
  human: () => ({ d: 'M60,28 C74,28 84,38 84,52 C84,66 74,76 60,76 C46,76 36,66 36,52 C36,38 46,28 60,28 Z', cx: 60, top: 28, faceY: 54, halfW: 24, bottom: 76, arms: null }),
  small: () => ({ d: 'M60,62 C82,62 94,78 94,98 C94,118 80,130 60,130 C40,130 26,118 26,98 C26,78 38,62 60,62 Z', cx: 60, top: 62, faceY: 96, halfW: 34, bottom: 130, arms: [28, 92, 112] }),
};

// ---------- Accessories ----------
// Each extra may provide `back` (drawn behind the body), `front` (on top),
// or `clip` (drawn on top but clipped to the body shape).
// Arguments: a = anchors, c = colours { base, dark, belly, accent, eye, uid }
const EXTRAS = {
  cape: {
    back: (a, c) => `<path d="M${a.cx - 34},${a.top + 26} L${a.cx - 46},134 Q${a.cx},140 ${a.cx + 46},134 L${a.cx + 34},${a.top + 26} Z" fill="${shade(c.accent, -35)}" stroke="${shade(c.accent, -60)}" stroke-width="3" stroke-linejoin="round"/>`,
    front: (a, c) => `<path d="M${a.cx - 28},${a.faceY + 26} L${a.cx - 42},${a.top - 4} L${a.cx - 12},${a.faceY + 30} Z M${a.cx + 28},${a.faceY + 26} L${a.cx + 42},${a.top - 4} L${a.cx + 12},${a.faceY + 30} Z" fill="${c.accent}" stroke="${shade(c.accent, -45)}" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  wings: {
    back: (a, c) => {
      const L = a.cx - a.halfW + 6, R = a.cx + a.halfW - 6, y = a.faceY;
      const wing = (x, s) => `M${x},${y + 8} L${x + s * 34},${y - 26} L${x + s * 28},${y - 2} L${x + s * 40},${y + 8} L${x + s * 24},${y + 16} L${x + s * 32},${y + 30} L${x},${y + 34} Z`;
      return `<g fill="${c.accent}" stroke="${shade(c.accent, -45)}" stroke-width="2.5" stroke-linejoin="round"><path d="${wing(L, -1)}"/><path d="${wing(R, 1)}"/></g>`;
    },
  },
  'moth-wings': {
    back: (a, c) => `<g stroke="${shade(c.accent, -40)}" stroke-width="2.5"><ellipse cx="${a.cx - 36}" cy="${a.faceY + 4}" rx="26" ry="34" fill="${c.accent}" transform="rotate(-20 ${a.cx - 36} ${a.faceY + 4})"/><ellipse cx="${a.cx + 36}" cy="${a.faceY + 4}" rx="26" ry="34" fill="${c.accent}" transform="rotate(20 ${a.cx + 36} ${a.faceY + 4})"/></g><circle cx="${a.cx - 38}" cy="${a.faceY}" r="7" fill="${shade(c.accent, 40)}"/><circle cx="${a.cx + 38}" cy="${a.faceY}" r="7" fill="${shade(c.accent, 40)}"/>`,
  },
  tail: {
    back: (a, c) => `<path d="M${a.cx + 20},${a.bottom - 8} Q${a.cx + 52},${a.bottom} ${a.cx + 48},${a.bottom - 40}" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/><path d="M${a.cx + 40},${a.bottom - 44} L${a.cx + 49},${a.bottom - 58} L${a.cx + 56},${a.bottom - 42} Z" fill="${c.base}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  'hair-long': {
    back: (a, c) => `<path d="M${a.cx - a.halfW - 4},${a.faceY - 4} Q${a.cx - a.halfW - 10},${a.faceY + 50} ${a.cx - a.halfW + 2},${a.faceY + 58} L${a.cx + a.halfW - 2},${a.faceY + 58} Q${a.cx + a.halfW + 10},${a.faceY + 50} ${a.cx + a.halfW + 4},${a.faceY - 4} Q${a.cx},${a.top - 16} ${a.cx - a.halfW - 4},${a.faceY - 4} Z" fill="${c.hair}" stroke="${shade(c.hair, -40)}" stroke-width="2.5"/>`,
    front: (a, c) => `<path d="M${a.cx - a.halfW + 2},${a.faceY - 6} Q${a.cx - 6},${a.top - 6} ${a.cx + a.halfW - 2},${a.faceY - 6} Q${a.cx + 10},${a.top + 6} ${a.cx},${a.faceY - 14} Q${a.cx - 12},${a.top + 6} ${a.cx - a.halfW + 2},${a.faceY - 6} Z" fill="${c.hair}" stroke="${shade(c.hair, -40)}" stroke-width="2"/>`,
  },
  'hair-slick': {
    front: (a) => `<path d="M${a.cx - 30},${a.top + 20} Q${a.cx - 31},${a.top - 6} ${a.cx},${a.top - 4} Q${a.cx + 31},${a.top - 6} ${a.cx + 30},${a.top + 20} L${a.cx + 20},${a.top + 12} L${a.cx},${a.top + 24} L${a.cx - 20},${a.top + 12} Z" fill="#2b2235" stroke="#140f1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M${a.cx - 18},${a.top + 2} Q${a.cx - 6},${a.top - 3} ${a.cx + 4},${a.top + 1}" stroke="#5a4a70" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  },
  'hair-flat': {
    front: (a) => `<path d="M${a.cx - a.halfW - 1},${a.top + 16} L${a.cx - a.halfW - 1},${a.top + 4} Q${a.cx},${a.top - 10} ${a.cx + a.halfW + 1},${a.top + 4} L${a.cx + a.halfW + 1},${a.top + 16} L${a.cx + 18},${a.top + 9} L${a.cx + 8},${a.top + 15} L${a.cx - 2},${a.top + 8} L${a.cx - 12},${a.top + 15} L${a.cx - 22},${a.top + 8} Z" fill="#2d2d33" stroke="#151518" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  'hair-tuft': {
    front: (a) => `<path d="M${a.cx - 6},${a.top + 3} Q${a.cx - 14},${a.top - 14} ${a.cx - 4},${a.top - 18} M${a.cx},${a.top + 2} Q${a.cx + 2},${a.top - 18} ${a.cx + 10},${a.top - 16} M${a.cx + 5},${a.top + 3} Q${a.cx + 16},${a.top - 8} ${a.cx + 18},${a.top - 4}" stroke="#4a3a24" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  },
  'ears-wolf': {
    front: (a, c) => {
      const ear = (x, s) => `<path d="M${x},${a.top + 14} L${x + s * -2},${a.top - 18} L${x + s * 22},${a.top + 4} Z" fill="${c.base}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${x + s * 3},${a.top + 9} L${x + s * 2},${a.top - 8} L${x + s * 15},${a.top + 4} Z" fill="#f2a7b8"/>`;
      return ear(a.cx - a.halfW + 8, 1) + ear(a.cx + a.halfW - 8, -1);
    },
  },
  'ears-pointy': {
    front: (a, c) => `<path d="M${a.cx - a.halfW + 2},${a.faceY - 6} L${a.cx - a.halfW - 22},${a.faceY - 18} L${a.cx - a.halfW + 4},${a.faceY + 8} Z M${a.cx + a.halfW - 2},${a.faceY - 6} L${a.cx + a.halfW + 22},${a.faceY - 18} L${a.cx + a.halfW - 4},${a.faceY + 8} Z" fill="${c.base}" stroke="${c.dark}" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  fins: {
    front: (a, c) => `<path d="M${a.cx - a.halfW + 4},${a.faceY - 10} Q${a.cx - a.halfW - 20},${a.faceY - 20} ${a.cx - a.halfW - 14},${a.faceY + 10} Q${a.cx - a.halfW - 4},${a.faceY + 4} ${a.cx - a.halfW + 6},${a.faceY + 8} Z M${a.cx + a.halfW - 4},${a.faceY - 10} Q${a.cx + a.halfW + 20},${a.faceY - 20} ${a.cx + a.halfW + 14},${a.faceY + 10} Q${a.cx + a.halfW + 4},${a.faceY + 4} ${a.cx + a.halfW - 6},${a.faceY + 8} Z" fill="${c.accent}" stroke="${shade(c.accent, -40)}" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  snout: {
    front: (a, c) => `<ellipse cx="${a.cx}" cy="${a.faceY + 15}" rx="17" ry="11" fill="${c.belly}" stroke="${c.dark}" stroke-width="2.5"/><ellipse cx="${a.cx}" cy="${a.faceY + 10}" rx="6" ry="4" fill="#2a1d1a"/><ellipse cx="${a.cx - 2}" cy="${a.faceY + 9}" rx="2" ry="1.2" fill="#fff" opacity=".7"/>`,
  },
  fur: {
    front: (a, c) => `<path d="M${a.cx - a.halfW + 2},${a.faceY + 4} l-8,4 l7,3 l-8,5 l9,2 M${a.cx + a.halfW - 2},${a.faceY + 4} l8,4 l-7,3 l8,5 l-9,2" stroke="${c.dark}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
  },
  fluff: {
    front: (a, c) => {
      let s = '';
      for (let i = -3; i <= 3; i++) s += `<circle cx="${a.cx + i * 13}" cy="${a.top + 4 + Math.abs(i) * 3}" r="9" fill="${c.base}" stroke="${c.dark}" stroke-width="2"/>`;
      return s;
    },
  },
  bandages: {
    clip: (a, c) => {
      let s = '';
      for (let y = a.top + 8, i = 0; y < a.bottom; y += 13, i++) {
        s += `<path d="M${a.cx - 50},${y + (i % 2 ? 4 : -2)} L${a.cx + 50},${y + (i % 2 ? -3 : 5)}" stroke="${shade(c.base, -14)}" stroke-width="3" opacity=".8"/>`;
      }
      return s;
    },
    front: (a, c) => `<path d="M${a.cx + a.halfW - 4},${a.faceY + 30} q10,6 6,18 q-2,6 4,10" stroke="${shade(c.base, -10)}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  },
  stitches: {
    front: (a) => `<path d="M${a.cx - 18},${a.top + 12} L${a.cx + 14},${a.top + 10}" stroke="#2a2a2a" stroke-width="2"/><path d="M${a.cx - 14},${a.top + 7} l0,9 M${a.cx - 6},${a.top + 6} l0,9 M${a.cx + 2},${a.top + 6} l0,9 M${a.cx + 10},${a.top + 5} l0,9" stroke="#2a2a2a" stroke-width="2" stroke-linecap="round"/>`,
  },
  bolts: {
    back: (a) => `<g stroke="#3c4048" stroke-width="2.5"><rect x="${a.cx - a.halfW - 12}" y="${a.faceY + 20}" width="16" height="10" rx="3" fill="#9aa3ad"/><rect x="${a.cx + a.halfW - 4}" y="${a.faceY + 20}" width="16" height="10" rx="3" fill="#9aa3ad"/></g>`,
  },
  horns: {
    front: (a) => {
      const horn = (x, s) => `<path d="M${x},${a.top + 8} Q${x - s * 14},${a.top - 10} ${x - s * 4},${a.top - 24} Q${x + s * 2},${a.top - 8} ${x + s * 10},${a.top + 4} Z" fill="#f3e6c4" stroke="#8a7a54" stroke-width="2.5" stroke-linejoin="round"/>`;
      return horn(a.cx - 14, 1) + horn(a.cx + 14, -1);
    },
  },
  'horns-small': {
    front: (a) => `<path d="M${a.cx - 18},${a.top + 6} L${a.cx - 22},${a.top - 9} L${a.cx - 10},${a.top + 2} Z M${a.cx + 18},${a.top + 6} L${a.cx + 22},${a.top - 9} L${a.cx + 10},${a.top + 2} Z" fill="#e8dcc0" stroke="#7d6e52" stroke-width="2" stroke-linejoin="round"/>`,
  },
  spikes: {
    front: (a, c) => {
      let s = '';
      for (let i = -2; i <= 2; i++) s += `<path d="M${a.cx + i * 14 - 6},${a.top + 4 + Math.abs(i) * 4} L${a.cx + i * 14},${a.top - 8 + Math.abs(i) * 4} L${a.cx + i * 14 + 6},${a.top + 4 + Math.abs(i) * 4} Z" fill="${c.accent}" stroke="${shade(c.accent, -40)}" stroke-width="2" stroke-linejoin="round"/>`;
      return s;
    },
  },
  'hat-witch': {
    front: (a, c) => `<ellipse cx="${a.cx}" cy="${a.top + 4}" rx="40" ry="8" fill="${c.accent}" stroke="${shade(c.accent, -50)}" stroke-width="2.5"/><path d="M${a.cx - 22},${a.top + 3} Q${a.cx - 8},${a.top - 26} ${a.cx + 22},${a.top - 50} Q${a.cx + 8},${a.top - 20} ${a.cx + 22},${a.top + 3} Z" fill="${c.accent}" stroke="${shade(c.accent, -50)}" stroke-width="2.5" stroke-linejoin="round"/><path d="M${a.cx - 19},${a.top - 4} Q${a.cx},${a.top - 1} ${a.cx + 20},${a.top - 4} L${a.cx + 20},${a.top + 1} Q${a.cx},${a.top + 4} ${a.cx - 20},${a.top + 1} Z" fill="#ffd23f"/>`,
  },
  'top-hat': {
    front: (a) => `<ellipse cx="${a.cx}" cy="${a.top + 3}" rx="26" ry="6" fill="#2b2140" stroke="#120d1c" stroke-width="2.5"/><path d="M${a.cx - 16},${a.top + 2} L${a.cx - 17},${a.top - 28} Q${a.cx},${a.top - 32} ${a.cx + 17},${a.top - 28} L${a.cx + 16},${a.top + 2} Z" fill="#2b2140" stroke="#120d1c" stroke-width="2.5" stroke-linejoin="round"/><rect x="${a.cx - 16}" y="${a.top - 7}" width="32" height="6" fill="#c0392b"/><path d="M${a.cx - 12},${a.top - 24} L${a.cx - 12},${a.top - 10}" stroke="#4a3d66" stroke-width="3" stroke-linecap="round"/>`,
  },
  'chef-hat': {
    front: (a) => `<path d="M${a.cx - 18},${a.top + 6} L${a.cx - 18},${a.top - 8} Q${a.cx - 30},${a.top - 16} ${a.cx - 20},${a.top - 28} Q${a.cx - 12},${a.top - 38} ${a.cx},${a.top - 30} Q${a.cx + 12},${a.top - 38} ${a.cx + 20},${a.top - 28} Q${a.cx + 30},${a.top - 16} ${a.cx + 18},${a.top - 8} L${a.cx + 18},${a.top + 6} Z" fill="#fff" stroke="#b9b2c4" stroke-width="2.5" stroke-linejoin="round"/>`,
  },
  beret: {
    front: (a, c) => `<ellipse cx="${a.cx + 4}" cy="${a.top + 2}" rx="${a.halfW - 2}" ry="9" fill="${c.accent}" stroke="${shade(c.accent, -45)}" stroke-width="2.5" transform="rotate(-10 ${a.cx} ${a.top})"/><circle cx="${a.cx + 6}" cy="${a.top - 8}" r="3" fill="${shade(c.accent, -20)}"/>`,
  },
  nemes: {
    back: (a) => `<path d="M${a.cx - a.halfW - 6},${a.top + 18} L${a.cx - a.halfW - 10},${a.faceY + 40} L${a.cx + a.halfW + 10},${a.faceY + 40} L${a.cx + a.halfW + 6},${a.top + 18} Z" fill="#2b5ea8" stroke="#163363" stroke-width="2.5"/>`,
    front: (a) => `<path d="M${a.cx - a.halfW - 4},${a.top + 22} Q${a.cx},${a.top - 14} ${a.cx + a.halfW + 4},${a.top + 22} L${a.cx + a.halfW - 2},${a.top + 26} Q${a.cx},${a.top + 4} ${a.cx - a.halfW + 2},${a.top + 26} Z" fill="#d4a73a" stroke="#8a6a1c" stroke-width="2.5"/><path d="M${a.cx - 20},${a.top + 6} L${a.cx - 22},${a.top + 18} M${a.cx - 8},${a.top + 1} L${a.cx - 9},${a.top + 12} M${a.cx + 8},${a.top + 1} L${a.cx + 9},${a.top + 12} M${a.cx + 20},${a.top + 6} L${a.cx + 22},${a.top + 18}" stroke="#2b5ea8" stroke-width="4"/><circle cx="${a.cx}" cy="${a.top + 4}" r="4" fill="#3fd0c9" stroke="#8a6a1c" stroke-width="1.5"/>`,
  },
  snakes: {
    front: (a) => {
      let s = '';
      const cols = ['#5fb85a', '#7cc66b', '#4a9a45', '#6bbd5e', '#58aa50'];
      for (let i = -2; i <= 2; i++) {
        const x = a.cx + i * 11, y = a.top + 6 + Math.abs(i) * 4;
        s += `<path d="M${x},${y} q${-6 + i},-8 ${i * 2},-14 q${6 + i},-6 ${i * 3 + 2},-12" stroke="${cols[i + 2]}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="${x + i * 5 + 2}" cy="${y - 26}" r="4.5" fill="${cols[i + 2]}" stroke="#2d5a2a" stroke-width="1.5"/><circle cx="${x + i * 5 + 3.5}" cy="${y - 27}" r="1.2" fill="#111"/>`;
      }
      return s;
    },
  },
  antennae: {
    front: (a, c) => `<path d="M${a.cx - 8},${a.top + 4} Q${a.cx - 16},${a.top - 14} ${a.cx - 24},${a.top - 20} M${a.cx + 8},${a.top + 4} Q${a.cx + 16},${a.top - 14} ${a.cx + 24},${a.top - 20}" stroke="${c.dark}" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="${a.cx - 24}" cy="${a.top - 20}" r="5" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/><circle cx="${a.cx + 24}" cy="${a.top - 20}" r="5" fill="${c.accent}" stroke="${c.dark}" stroke-width="2"/>`,
  },
  leaves: {
    front: (a) => `<path d="M${a.cx},${a.top + 4} Q${a.cx - 20},${a.top - 6} ${a.cx - 22},${a.top - 18} Q${a.cx - 6},${a.top - 14} ${a.cx},${a.top + 4} Z M${a.cx},${a.top + 4} Q${a.cx + 20},${a.top - 6} ${a.cx + 22},${a.top - 18} Q${a.cx + 6},${a.top - 14} ${a.cx},${a.top + 4} Z" fill="#6cc04a" stroke="#2f6a22" stroke-width="2" stroke-linejoin="round"/><circle cx="${a.cx}" cy="${a.top - 2}" r="5" fill="#f6b3e6" stroke="#b5589c" stroke-width="1.5"/>`,
  },
  drips: {
    front: (a, c) => `<g fill="${c.base}" stroke="${c.dark}" stroke-width="2"><path d="M${a.cx - 30},${a.bottom - 4} q3,12 6,0"/><path d="M${a.cx + 18},${a.bottom - 3} q4,14 8,0"/><path d="M${a.cx - 4},${a.bottom - 2} q2,8 5,0"/></g>`,
  },
  moss: {
    clip: (a) => `<g fill="#3d7a35" opacity=".55"><ellipse cx="${a.cx - 28}" cy="${a.top + 10}" rx="16" ry="9"/><ellipse cx="${a.cx + 30}" cy="${a.top + 22}" rx="12" ry="8"/><ellipse cx="${a.cx + 22}" cy="${a.bottom - 14}" rx="18" ry="8"/></g>`,
  },
  warts: {
    front: (a, c) => `<g fill="${shade(c.base, -20)}"><circle cx="${a.cx - 24}" cy="${a.faceY - 10}" r="3"/><circle cx="${a.cx + 26}" cy="${a.faceY + 22}" r="3.5"/><circle cx="${a.cx + 16}" cy="${a.top + 10}" r="2.5"/></g>`,
  },
  pumpkin: {
    clip: (a, c) => `<g stroke="${shade(c.base, -25)}" stroke-width="3" fill="none" opacity=".7"><path d="M${a.cx},${a.top} L${a.cx},${a.bottom}"/><path d="M${a.cx - 20},${a.top + 4} Q${a.cx - 30},${a.faceY + 6} ${a.cx - 20},${a.bottom - 2}"/><path d="M${a.cx + 20},${a.top + 4} Q${a.cx + 30},${a.faceY + 6} ${a.cx + 20},${a.bottom - 2}"/></g>`,
    front: (a) => `<path d="M${a.cx - 3},${a.top + 3} Q${a.cx - 5},${a.top - 10} ${a.cx + 4},${a.top - 14}" stroke="#4a6b2a" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${a.cx + 3},${a.top - 8} Q${a.cx + 18},${a.top - 18} ${a.cx + 24},${a.top - 6} Q${a.cx + 12},${a.top - 4} ${a.cx + 3},${a.top - 8} Z" fill="#6a8f3d" stroke="#3a5a1c" stroke-width="1.5"/>`,
  },
  frost: {
    front: (a) => `<path d="M${a.cx - 20},${a.top + 6} L${a.cx - 16},${a.top - 12} L${a.cx - 10},${a.top + 4} L${a.cx - 4},${a.top - 18} L${a.cx + 2},${a.top + 2} L${a.cx + 9},${a.top - 14} L${a.cx + 14},${a.top + 4} L${a.cx + 20},${a.top - 8} L${a.cx + 22},${a.top + 6} Z" fill="#e8faff" stroke="#5aa9d6" stroke-width="2" stroke-linejoin="round"/>`,
  },
  scarf: {
    front: (a, c) => `<path d="M${a.cx - a.halfW + 4},${a.faceY + 24} Q${a.cx},${a.faceY + 34} ${a.cx + a.halfW - 4},${a.faceY + 24} L${a.cx + a.halfW - 4},${a.faceY + 33} Q${a.cx},${a.faceY + 43} ${a.cx - a.halfW + 4},${a.faceY + 33} Z" fill="${c.accent}" stroke="${shade(c.accent, -40)}" stroke-width="2"/><path d="M${a.cx + 12},${a.faceY + 34} l4,22 l10,-2 l-4,-21 Z" fill="${c.accent}" stroke="${shade(c.accent, -40)}" stroke-width="2" stroke-linejoin="round"/>`,
  },
  bowtie: {
    front: (a, c) => {
      // Skeletons wear it on the neck bone, below the skull
      const y = a.bottom === 80 ? 84 : Math.min(a.faceY + 34, a.bottom - 6);
      return `<path d="M${a.cx},${y} L${a.cx - 12},${y - 7} L${a.cx - 12},${y + 7} Z M${a.cx},${y} L${a.cx + 12},${y - 7} L${a.cx + 12},${y + 7} Z" fill="${c.accent}" stroke="${shade(c.accent, -45)}" stroke-width="2" stroke-linejoin="round"/><circle cx="${a.cx}" cy="${y}" r="3.5" fill="${shade(c.accent, -20)}"/>`;
    },
  },
  tie: {
    front: (a, c) => `<path d="M${a.cx - 4},${a.bottom + 2} L${a.cx + 4},${a.bottom + 2} L${a.cx + 6},${a.bottom + 30} L${a.cx},${a.bottom + 38} L${a.cx - 6},${a.bottom + 30} Z" fill="${c.accent}" stroke="${shade(c.accent, -40)}" stroke-width="1.5"/>`,
  },
  apron: {
    front: (a, c) => `<path d="M${a.cx - 18},${Math.min(a.faceY + 30, a.bottom - 30)} L${a.cx + 18},${Math.min(a.faceY + 30, a.bottom - 30)} L${a.cx + 24},${a.bottom - 2} L${a.cx - 24},${a.bottom - 2} Z" fill="${c.accent}" stroke="#a9a29a" stroke-width="2" stroke-linejoin="round"/>`,
  },
  pearls: {
    front: (a) => {
      let s = '';
      for (let i = -4; i <= 4; i++) s += `<circle cx="${a.cx + i * 6}" cy="${a.faceY + 30 + Math.abs(i) * -1.2 + 4}" r="3" fill="#fffbea" stroke="#c9bfa0" stroke-width="1"/>`;
      return s;
    },
  },
  monocle: {
    front: (a) => `<circle cx="${a.cx + 13}" cy="${a.faceY - 2}" r="12" fill="rgba(200,230,255,.18)" stroke="#d4a73a" stroke-width="2.5"/><path d="M${a.cx + 24},${a.faceY + 4} Q${a.cx + 30},${a.faceY + 20} ${a.cx + 22},${a.faceY + 32}" stroke="#d4a73a" stroke-width="1.5" fill="none"/>`,
  },
  glasses: {
    front: (a) => `<g fill="rgba(220,240,255,.25)" stroke="#2a2a33" stroke-width="2.5"><circle cx="${a.cx - 11}" cy="${a.faceY - 2}" r="9"/><circle cx="${a.cx + 11}" cy="${a.faceY - 2}" r="9"/></g><path d="M${a.cx - 2},${a.faceY - 3} L${a.cx + 2},${a.faceY - 3}" stroke="#2a2a33" stroke-width="2.5"/>`,
  },
  sunglasses: {
    front: (a) => `<path d="M${a.cx - 24},${a.faceY - 9} L${a.cx - 2},${a.faceY - 9} Q${a.cx - 3},${a.faceY + 6} ${a.cx - 13},${a.faceY + 6} Q${a.cx - 24},${a.faceY + 6} ${a.cx - 24},${a.faceY - 9} Z M${a.cx + 24},${a.faceY - 9} L${a.cx + 2},${a.faceY - 9} Q${a.cx + 3},${a.faceY + 6} ${a.cx + 13},${a.faceY + 6} Q${a.cx + 24},${a.faceY + 6} ${a.cx + 24},${a.faceY - 9} Z" fill="#14121a" stroke="#000" stroke-width="2"/><path d="M${a.cx - 2},${a.faceY - 8} L${a.cx + 2},${a.faceY - 8}" stroke="#000" stroke-width="2.5"/><path d="M${a.cx - 20},${a.faceY - 6} l6,0" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`,
  },
  clipboard: {
    front: (a) => `<g transform="rotate(-12 ${a.cx + 34} ${a.bottom + 20})"><rect x="${a.cx + 22}" y="${a.bottom + 2}" width="26" height="34" rx="3" fill="#a0703f" stroke="#5e3f1e" stroke-width="2"/><rect x="${a.cx + 25}" y="${a.bottom + 8}" width="20" height="25" fill="#fff"/><path d="M${a.cx + 28},${a.bottom + 14} h14 M${a.cx + 28},${a.bottom + 20} h12 M${a.cx + 28},${a.bottom + 26} h14" stroke="#9aa" stroke-width="1.5"/><rect x="${a.cx + 30}" y="${a.bottom}" width="10" height="5" rx="1.5" fill="#bbb" stroke="#666" stroke-width="1"/></g>`,
  },
  'chest-lid': {
    front: (a, c) => `<path d="M${a.cx - a.halfW},${a.faceY - 14} L${a.cx + a.halfW},${a.faceY - 14}" stroke="${shade(c.base, -40)}" stroke-width="4"/><rect x="${a.cx - 7}" y="${a.faceY - 20}" width="14" height="14" rx="2" fill="${c.accent}" stroke="${shade(c.accent, -45)}" stroke-width="2"/><path d="M${a.cx - 30},${a.top + 2} L${a.cx - 30},${a.bottom} M${a.cx + 30},${a.top + 2} L${a.cx + 30},${a.bottom}" stroke="${c.accent}" stroke-width="5" opacity=".9"/>`,
  },
  cracks: {
    clip: (a) => `<path d="M${a.cx - 30},${a.top + 6} l8,10 l-4,8 l9,9 M${a.cx + 28},${a.faceY + 24} l-6,8 l5,7" stroke="#5d6470" stroke-width="2" fill="none" stroke-linejoin="round"/>`,
  },
  wisps: {
    back: (a, c) => `<g fill="${c.accent}" opacity=".45"><circle cx="${a.cx - 40}" cy="${a.faceY + 40}" r="5"/><circle cx="${a.cx + 42}" cy="${a.faceY + 30}" r="4"/><circle cx="${a.cx + 36}" cy="${a.faceY - 20}" r="3"/></g>`,
  },
  shine: {
    front: (a) => `<ellipse cx="${a.cx - a.halfW * 0.45}" cy="${a.top + 18}" rx="8" ry="5" fill="#fff" opacity=".75" transform="rotate(-30 ${a.cx - a.halfW * 0.45} ${a.top + 18})"/>`,
  },
  blush: { front: () => '' }, // handled by the face (stronger blush)
};

// ---------- Faces ----------
function eyesSvg(art, a, mood, ids) {
  const n = art.eyes || 2;
  const xs = n === 1 ? [a.cx] : n === 2 ? [a.cx - 13, a.cx + 13] : [a.cx - 18, a.cx, a.cx + 18];
  const r = n === 1 ? 12 : n === 2 ? 9 : 7.5;
  const y = a.faceY - 2;
  const iris = art.eyeColor || '#333';
  const style = art.body === 'skeleton' ? 'socket' : (art.body === 'ghost' || art.eyeStyle === 'dot') ? 'dot' : art.glowFace ? 'glow' : 'normal';

  return xs.map((x, i) => {
    const ey = n === 3 && i === 1 ? y - 6 : y;
    // Happy closed "^ ^" eyes when delighted
    if (mood === 'delighted' && style !== 'glow') {
      return `<path d="M${x - r * 0.8},${ey + 2} Q${x},${ey - r * 0.9} ${x + r * 0.8},${ey + 2}" stroke="${style === 'socket' ? iris : '#1d1626'}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    }
    if (style === 'glow') {
      return `<path d="M${x - 8},${ey + 5} L${x},${ey - 8} L${x + 8},${ey + 5} Z" fill="${iris}" stroke="#7a3a00" stroke-width="2" stroke-linejoin="round" filter="url(#glow${ids})"/>`;
    }
    if (style === 'socket') {
      return `<ellipse cx="${x}" cy="${ey}" rx="${r + 1}" ry="${r + 2}" fill="#1d1626"/><circle cx="${x}" cy="${ey + 1}" r="${mood === 'onfire' ? 2 : 3.2}" fill="${iris}" filter="url(#glow${ids})"/>`;
    }
    if (style === 'dot') {
      const ry = mood === 'onfire' ? r : mood === 'unimpressed' ? r * 0.35 : r * 0.85;
      return `<ellipse cx="${x}" cy="${ey}" rx="${r * 0.6}" ry="${ry}" fill="${iris}"/><circle cx="${x - 2}" cy="${ey - ry * 0.4}" r="2" fill="#fff" opacity=".9"/>`;
    }
    const pupilR = mood === 'onfire' ? r * 0.25 : r * 0.55;
    const look = mood === 'confused' ? (i === 0 ? -2 : 2) : 1.5;
    let eye = `<circle cx="${x}" cy="${ey}" r="${r}" fill="#fff" stroke="#1d1626" stroke-width="2.4"/>`
      + `<circle cx="${x + look * 0.6}" cy="${ey + 1}" r="${pupilR}" fill="${iris}"/>`
      + `<circle cx="${x + look * 0.6}" cy="${ey + 1}" r="${pupilR * 0.5}" fill="#120c18"/>`
      + `<circle cx="${x - r * 0.3}" cy="${ey - r * 0.35}" r="${r * 0.22}" fill="#fff"/>`;
    // Half-closed lids for unimpressed
    if (mood === 'unimpressed') eye += `<path d="M${x - r - 1},${ey} A${r + 1},${r + 1} 0 0 1 ${x + r + 1},${ey} Z" fill="${art.color}" stroke="#1d1626" stroke-width="2.4"/>`;
    // Confused: one eyebrow up
    if (mood === 'confused' && i === xs.length - 1) eye += `<path d="M${x - 8},${ey - r - 8} Q${x},${ey - r - 13} ${x + 8},${ey - r - 6}" stroke="#1d1626" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (mood === 'angry') eye += `<path d="M${x - r},${ey - r - 4} L${x + r},${ey - r + (i === 0 ? 3 : -3) * (x < a.cx ? -1 : 1)}" stroke="#1d1626" stroke-width="3" stroke-linecap="round"/>`;
    return eye;
  }).join('');
}

function mouthSvg(art, a, mood, ids) {
  const hasSnout = (art.extras || []).includes('snout');
  const y = a.faceY + (hasSnout ? 26 : 18);
  const x = a.cx;
  const ink = '#1d1626';
  if (art.mouth === 'none' && mood !== 'onfire') return '';
  if (art.glowFace) {
    return `<path d="M${x - 16},${y - 4} L${x - 10},${y + 4} L${x - 5},${y - 1} L${x},${y + 6} L${x + 5},${y - 1} L${x + 10},${y + 4} L${x + 16},${y - 4} Q${x},${y + 14} ${x - 16},${y - 4} Z" fill="${art.eyeColor}" stroke="#7a3a00" stroke-width="2" filter="url(#glow${ids})"/>`;
  }
  switch (mood) {
    case 'delighted': {
      let s = `<path d="M${x - 12},${y - 3} Q${x},${y - 1} ${x + 12},${y - 3} Q${x + 10},${y + 13} ${x},${y + 13} Q${x - 10},${y + 13} ${x - 12},${y - 3} Z" fill="#5a1a2a" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="${x}" cy="${y + 9}" rx="6" ry="3.5" fill="#ff7a8a"/>`;
      if (art.mouth === 'fangs') s += `<path d="M${x - 8},${y - 2} l2,5 l2,-5 M${x + 4},${y - 2} l2,5 l2,-5" fill="#fff" stroke="${ink}" stroke-width="1.2"/>`;
      return s;
    }
    case 'unimpressed':
      return `<path d="M${x - 9},${y + 2} L${x + 9},${y + 1}" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    case 'confused':
      return `<path d="M${x - 10},${y + 2} q4,-5 7,0 q4,5 7,0 q3,-4 6,-1" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'onfire':
      return `<ellipse cx="${x}" cy="${y + 4}" rx="8" ry="10" fill="#5a1a2a" stroke="${ink}" stroke-width="2.4"/>`;
    case 'angry':
      return `<path d="M${x - 10},${y + 6} Q${x},${y - 3} ${x + 10},${y + 6}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    default: break;
  }
  switch (art.mouth) {
    case 'fangs':
      return `<path d="M${x - 11},${y} Q${x},${y + 8} ${x + 11},${y}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M${x - 7},${y + 2.5} l2.5,6 l2.5,-5 Z M${x + 2},${y + 3.5} l2.5,5 l2.5,-6 Z" fill="#fff" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/>`;
    case 'tusks':
      return `<path d="M${x - 14},${y + 2} Q${x},${y + 9} ${x + 14},${y + 2}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/><path d="M${x - 12},${y + 4} l-1,-10 l6,8 Z M${x + 12},${y + 4} l1,-10 l-6,8 Z" fill="#fff8e0" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/>`;
    case 'flat':
      return `<path d="M${x - 9},${y + 2} Q${x},${y + 4} ${x + 9},${y + 2}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
    case 'o':
      return `<ellipse cx="${x}" cy="${y + 3}" rx="5" ry="6.5" fill="#3a2a40" stroke="${ink}" stroke-width="2"/>`;
    case 'grin':
      return `<path d="M${x - 14},${y - 1} Q${x},${y + 14} ${x + 14},${y - 1} Z" fill="#fff" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 7},${y + 1} l0,6 M${x},${y + 2} l0,7 M${x + 7},${y + 1} l0,6" stroke="${ink}" stroke-width="1.3"/>`;
    case 'teeth':
      return `<path d="M${x - 12},${y} L${x + 12},${y} Q${x + 10},${y + 11} ${x},${y + 11} Q${x - 10},${y + 11} ${x - 12},${y} Z" fill="#4a1a26" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x - 10},${y} l2.5,4 l2.5,-4 l2.5,4 l2.5,-4 l2.5,4 l2.5,-4 l2.5,4 l2.5,-4" fill="#fff" stroke="${ink}" stroke-width="1"/>`;
    case 'smile':
    default:
      return `<path d="M${x - 10},${y} Q${x},${y + 9} ${x + 10},${y}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  }
}

// ---------- Monster ----------
/**
 * How far down the sprite's box the top of the head sits (0–1). The SVG has
 * headroom for hats, so flags and speech bubbles use this to hug the head.
 */
export function headFraction(art) {
  const top = (BODIES[art.body] || BODIES.round)().top;
  const scale = art.scale || 1;
  const scaledTop = 136 - (136 - top) * scale; // bodies scale around the feet (y = 136)
  return Math.max(0, (scaledTop + 30 - 6) / 172); // viewBox starts at y = -30 and is 172 tall
}

/**
 * Build a monster SVG string.
 * @param art   art recipe from data/monsters.js (can be merged with a regular's extras)
 * @param opts  { mood: 'neutral'|'delighted'|'unimpressed'|'confused'|'onfire'|'angry', cls }
 */
export function monsterSVG(art, opts = {}) {
  const mood = opts.mood || 'neutral';
  const ids = `m${++idSeq}`;
  const bodyKind = BODIES[art.body] ? art.body : 'round';
  const a = BODIES[bodyKind]();
  const base = art.color || '#9b8bd4';
  const c = {
    base, dark: shade(base, -48), belly: art.belly || shade(base, 30), accent: art.accent || shade(base, -30),
    eye: art.eyeColor || '#333', hair: art.hair || shade(art.accent || base, -15),
  };
  const extras = art.extras || [];
  const layer = (k) => extras.map((e) => EXTRAS[e]?.[k]?.(a, c) || '').join('');

  // Extra body parts for certain body shapes
  let under = '';
  let over = '';
  if (bodyKind === 'tentacle') {
    for (let i = 0; i < 6; i++) {
      const x = 28 + i * 12.8;
      const curl = i % 2 ? 1 : -1;
      under += `<path d="M${x},84 Q${x + curl * 6},112 ${x - curl * 6},128 Q${x - curl * 12},134 ${x - curl * 2},136" stroke="${c.dark}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${x},84 Q${x + curl * 6},112 ${x - curl * 6},128 Q${x - curl * 12},134 ${x - curl * 2},136" stroke="${base}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
      over += `<circle cx="${x + curl * 2}" cy="${110}" r="2" fill="${c.belly}"/><circle cx="${x - curl * 2}" cy="${122}" r="1.8" fill="${c.belly}"/>`;
    }
  }
  if (bodyKind === 'skeleton') {
    under += `<g stroke="${c.dark}" stroke-width="2.5" fill="${base}"><rect x="56" y="78" width="8" height="48" rx="3"/>`
      + [86, 96, 106].map((y) => `<path d="M60,${y} Q42,${y - 2} 40,${y + 7} Q50,${y + 4} 60,${y + 5} Q70,${y + 4} 80,${y + 7} Q78,${y - 2} 60,${y} Z"/>`).join('')
      + `<path d="M46,124 Q60,116 74,124 L72,130 L48,130 Z"/></g>`;
  }
  if (bodyKind === 'human') {
    under += `<path d="M38,130 L42,88 Q44,76 60,76 Q76,76 78,88 L82,130 Z" fill="${c.belly}" stroke="${shade(c.belly, -45)}" stroke-width="3" stroke-linejoin="round"/><rect x="54" y="72" width="12" height="8" fill="${shade(base, -10)}"/>`;
  }

  // Little arms (wave when delighted)
  let arms = '';
  if (a.arms) {
    const [lx, rx, ay] = a.arms;
    // The animated class sits on a wrapper <g>, because CSS transform-box would
    // otherwise fight with the SVG rotate() attribute on the ellipse itself.
    arms = `<g class="spr-arms"><g class="spr-arm-l"><ellipse cx="${lx}" cy="${ay}" rx="7" ry="12" fill="${base}" stroke="${c.dark}" stroke-width="2.8" transform="rotate(20 ${lx} ${ay})"/></g><g class="spr-arm-r"><ellipse cx="${rx}" cy="${ay}" rx="7" ry="12" fill="${base}" stroke="${c.dark}" stroke-width="2.8" transform="rotate(-20 ${rx} ${ay})"/></g></g>`;
  }

  const blush = (bodyKind === 'skeleton' || art.mouth === 'none' || art.glowFace) ? ''
    : `<ellipse cx="${a.cx - 22}" cy="${a.faceY + 10}" rx="6" ry="3.5" fill="#ff7a9a" opacity="${extras.includes('blush') ? 0.6 : 0.32}"/><ellipse cx="${a.cx + 22}" cy="${a.faceY + 10}" rx="6" ry="3.5" fill="#ff7a9a" opacity="${extras.includes('blush') ? 0.6 : 0.32}"/>`;

  // Belly patch (not for skeletons/humans, whose "belly" colour is clothing)
  const belly = (bodyKind === 'skeleton' || bodyKind === 'human' || bodyKind === 'tentacle') ? ''
    : `<ellipse cx="${a.cx}" cy="${a.bottom - 14}" rx="${a.halfW * 0.62}" ry="${(a.bottom - a.faceY) * 0.42}" fill="${c.belly}" opacity=".9"/>`;

  const fire = mood === 'onfire'
    ? `<g class="spr-fire">${[-26, -8, 10, 28].map((dx, i) => `<path class="flame f${i}" d="M${a.cx + dx},${a.top + 18} q-12,-14 -2,-34 q2,12 8,10 q-2,-14 8,-22 q2,18 8,26 q6,10 -6,20 Z" fill="url(#flame${ids})"/>`).join('')}</g>`
    : '';

  const scale = art.scale || 1;
  return `<svg class="monster-svg ${opts.cls || ''}" viewBox="0 -30 120 172" data-mood="${mood}" aria-hidden="true">
  <defs>
    <radialGradient id="g${ids}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${shade(base, 32)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${shade(base, -28)}"/></radialGradient>
    <linearGradient id="flame${ids}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3b1f"/><stop offset=".5" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ffe45c"/></linearGradient>
    <clipPath id="c${ids}"><path d="${a.d}"/></clipPath>
    <filter id="glow${ids}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <ellipse class="spr-shadow" cx="60" cy="136" rx="${40 * scale}" ry="6" fill="rgba(10,0,20,.35)"/>
  <g class="spr-root" transform="translate(${60 - 60 * scale} ${136 - 136 * scale}) scale(${scale})">
    <g class="spr-body">
      ${layer('back')}
      ${under}
      <path d="${a.d}" fill="url(#g${ids})" stroke="${c.dark}" stroke-width="3.2" stroke-linejoin="round"/>
      <g clip-path="url(#c${ids})">${belly}${layer('clip')}<ellipse cx="${a.cx - a.halfW * 0.4}" cy="${a.top + 14}" rx="${a.halfW * 0.35}" ry="8" fill="#fff" opacity=".22"/></g>
      ${over}
      ${arms}
      <g class="spr-face">
        ${blush}
        <g class="spr-eyes">${eyesSvg(art, a, mood, ids)}</g>
        <g class="spr-mouth">${mouthSvg(art, a, mood, ids)}</g>
      </g>
      ${layer('front')}
      ${fire}
    </g>
  </g>
</svg>`;
}

// ---------- Furniture ----------
/**
 * Furniture is drawn in two layers so monsters can sit "behind" the table:
 *   part 'back'  → chairs / bench backs (behind the monster)
 *   part 'front' → the table itself (in front of the monster's lower half)
 * w and h are the footprint in tiles AFTER rotation.
 */
export function furnitureSVG(def, w, h, part = 'both') {
  const art = def.art || {};
  const W = w * 100, H = h * 100;
  const ids = `f${++idSeq}`;
  const top = art.top || '#8b5a2b', edge = art.edge || shade(top, -35), seat = art.seat || '#7b2d8b';
  const ink = shade(edge, -40);
  let back = '', front = '';

  const seats = def.seats || 0;
  const horizontal = w >= h;

  // --- Back layer: seats ---
  if (art.bench) {
    // A long upholstered bench back along the top edge
    back += `<rect x="${W * 0.06}" y="${H * 0.04}" width="${W * 0.88}" height="${H * 0.42}" rx="16" fill="${seat}" stroke="${shade(seat, -45)}" stroke-width="4"/>`;
    for (let i = 1; i < Math.max(2, seats + 1); i++) back += `<path d="M${(W * i) / Math.max(2, seats + 1)},${H * 0.1} L${(W * i) / Math.max(2, seats + 1)},${H * 0.4}" stroke="${shade(seat, -25)}" stroke-width="3" stroke-linecap="round"/>`;
    back += `<rect x="${W * 0.1}" y="${H * 0.08}" width="${W * 0.8}" height="${H * 0.08}" rx="6" fill="#fff" opacity=".15"/>`;
  } else if (art.shape === 'bar') {
    for (let i = 0; i < seats; i++) {
      const x = (W * (i + 0.5)) / seats;
      back += `<rect x="${x - 3}" y="${H * 0.3}" width="6" height="${H * 0.3}" fill="${edge}"/><ellipse cx="${x}" cy="${H * 0.28}" rx="18" ry="9" fill="${seat}" stroke="${shade(seat, -40)}" stroke-width="3"/>`;
    }
  } else if (seats > 0) {
    // Individual chairs peeking out behind the table
    for (let i = 0; i < seats; i++) {
      const x = horizontal ? (W * (i + 0.5)) / seats : W / 2;
      const y = horizontal ? H * 0.06 : (H * i) / seats + H * 0.02;
      back += `<rect x="${x - 22}" y="${y}" width="44" height="40" rx="12" fill="${seat}" stroke="${shade(seat, -45)}" stroke-width="4"/><rect x="${x - 15}" y="${y + 6}" width="30" height="6" rx="3" fill="#fff" opacity=".18"/>`;
    }
  }

  // --- Front layer: the table ---
  const ty = H * (art.bench || art.shape === 'bar' ? 0.42 : 0.4);
  const th = H - ty - 8;
  const shadow = `<ellipse cx="${W / 2}" cy="${H - 6}" rx="${W * 0.44}" ry="9" fill="rgba(0,0,0,.28)"/>`;
  front += shadow;
  switch (art.shape) {
    case 'round':
    case 'lily': {
      const rx = Math.min(W, H) * 0.42, ry = th * 0.36, cy = ty + th * 0.36;
      front += `<rect x="${W / 2 - 7}" y="${cy}" width="14" height="${H - cy - 10}" fill="${edge}" stroke="${ink}" stroke-width="3"/>`;
      front += `<ellipse cx="${W / 2}" cy="${cy + 9}" rx="${rx}" ry="${ry}" fill="${edge}" stroke="${ink}" stroke-width="4"/>`;
      front += `<ellipse cx="${W / 2}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#t${ids})" stroke="${ink}" stroke-width="4"/>`;
      if (art.shape === 'lily') front += `<path d="M${W / 2},${cy} L${W / 2 + rx},${cy - 6} L${W / 2 + rx},${cy + 6} Z" fill="${shade(top, -30)}"/><circle cx="${W / 2 - rx * 0.4}" cy="${cy - 4}" r="9" fill="${seat}" stroke="${shade(seat, -40)}" stroke-width="2"/>`;
      if (art.pattern === 'ice') front += `<path d="M${W / 2 - rx * 0.6},${cy - 4} l14,-6 M${W / 2 + rx * 0.2},${cy + 4} l18,-7" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
      if (art.pattern === 'pumpkin') front += `<path d="M${W / 2 - rx * 0.5},${cy - ry * 0.8} Q${W / 2 - rx * 0.6},${cy} ${W / 2 - rx * 0.5},${cy + ry * 0.8} M${W / 2 + rx * 0.5},${cy - ry * 0.8} Q${W / 2 + rx * 0.6},${cy} ${W / 2 + rx * 0.5},${cy + ry * 0.8}" stroke="${edge}" stroke-width="3" fill="none" opacity=".6"/>`;
      if (art.candle) front += candle(W / 2 + rx * 0.35, cy - 2);
      break;
    }
    case 'coffin':
    case 'sarcophagus': {
      const x0 = W * 0.06, x1 = W * 0.94, y0 = ty + 4, y1 = ty + th * 0.6;
      const p = `M${x0 + 30},${y0} L${x1 - 60},${y0} L${x1},${(y0 + y1) / 2} L${x1 - 60},${y1} L${x0 + 30},${y1} L${x0},${(y0 + y1) / 2} Z`;
      front += `<g transform="translate(0 12)"><path d="${p}" fill="${edge}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/></g>`;
      front += `<path d="${p}" fill="url(#t${ids})" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>`;
      if (art.shape === 'coffin') front += `<path d="M${W * 0.45},${y0 + 10} L${W * 0.45},${y1 - 10} M${W * 0.4},${(y0 + y1) / 2 - 6} L${W * 0.5},${(y0 + y1) / 2 - 6}" stroke="#c9a227" stroke-width="5" stroke-linecap="round"/>`;
      else front += `<path d="M${x0 + 40},${(y0 + y1) / 2} L${x1 - 70},${(y0 + y1) / 2}" stroke="#2b5ea8" stroke-width="8"/><circle cx="${W / 2}" cy="${(y0 + y1) / 2}" r="9" fill="#3fd0c9" stroke="#8a6a1c" stroke-width="3"/>`;
      break;
    }
    case 'bar':
    case 'rect':
    default: {
      const x0 = W * 0.06, x1 = W * 0.94, y0 = ty, depth = th * 0.55;
      front += `<rect x="${x0 + 10}" y="${y0 + depth}" width="12" height="${H - y0 - depth - 10}" fill="${edge}" stroke="${ink}" stroke-width="3"/><rect x="${x1 - 22}" y="${y0 + depth}" width="12" height="${H - y0 - depth - 10}" fill="${edge}" stroke="${ink}" stroke-width="3"/>`;
      front += `<rect x="${x0}" y="${y0 + 10}" width="${x1 - x0}" height="${depth}" rx="10" fill="${edge}" stroke="${ink}" stroke-width="4"/>`;
      front += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${depth}" rx="10" fill="url(#t${ids})" stroke="${ink}" stroke-width="4"/>`;
      if (art.pattern === 'planks') for (let x = x0 + 30; x < x1 - 10; x += 30) front += `<path d="M${x},${y0 + 4} L${x},${y0 + depth - 4}" stroke="${shade(top, -25)}" stroke-width="2"/>`;
      if (art.pattern === 'check') for (let x = x0, i = 0; x < x1 - 10; x += 22, i++) for (let y = y0, j = 0; y < y0 + depth - 6; y += 16, j++) if ((i + j) % 2) front += `<rect x="${x + 2}" y="${y + 2}" width="20" height="14" fill="#fff" opacity=".75"/>`;
      if (art.pattern === 'moss') front += `<g fill="#7cbf5a" opacity=".8"><ellipse cx="${x0 + 30}" cy="${y0 + 6}" rx="22" ry="7"/><ellipse cx="${x1 - 40}" cy="${y0 + depth - 6}" rx="26" ry="7"/></g><circle cx="${W * 0.6}" cy="${y0 + depth / 2}" r="10" fill="#5fb85a" stroke="#2f6a22" stroke-width="2"/>`;
      if (art.pattern === 'bolts') front += [x0 + 14, x1 - 14].map((x) => [y0 + 10, y0 + depth - 10].map((y) => `<circle cx="${x}" cy="${y}" r="5" fill="#c0c4cc" stroke="#555" stroke-width="2"/>`).join('')).join('') + `<path d="M${x0},${y0 + depth / 2} L${x1},${y0 + depth / 2}" stroke="#777" stroke-width="6" opacity=".7"/>`;
      if (art.pattern === 'waves') front += `<path d="M${x0 + 16},${y0 + depth / 2} q12,-10 24,0 t24,0 t24,0 t24,0 t24,0 t24,0" stroke="#bfe9ff" stroke-width="3" fill="none" opacity=".8"/><circle cx="${x1 - 30}" cy="${y0 + 12}" r="6" fill="#ff8f7a" stroke="#a84a3a" stroke-width="2"/>`;
      if (art.shape === 'bar') for (let i = 0; i < 4; i++) front += `<ellipse cx="${x0 + 30 + i * ((x1 - x0 - 60) / 3)}" cy="${y0 + depth / 2}" rx="9" ry="4" fill="#fff" opacity=".35"/>`;
      break;
    }
  }

  const defs = `<defs><linearGradient id="t${ids}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(top, 18)}"/><stop offset="1" stop-color="${top}"/></linearGradient></defs>`;
  const body = part === 'back' ? back : part === 'front' ? front : back + front;
  return `<svg class="furn-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${defs}${body}</svg>`;
}

function candle(x, y) {
  return `<rect x="${x - 4}" y="${y - 22}" width="8" height="20" rx="2" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="2"/><path class="candle-flame" d="M${x},${y - 34} q-6,8 0,12 q6,-4 0,-12 Z" fill="#ffcf4a" stroke="#ff8a1f" stroke-width="1.5"/><circle cx="${x}" cy="${y - 26}" r="10" fill="#ffcf4a" opacity=".2"/>`;
}

// ---------- Decorations ----------
const DECOR_ART = {
  pumpkin: () => `<ellipse cx="50" cy="90" rx="34" ry="6" fill="rgba(0,0,0,.3)"/><path d="M50,30 C78,30 88,48 88,64 C88,82 72,90 50,90 C28,90 12,82 12,64 C12,48 22,30 50,30 Z" fill="#ff9234" stroke="#8f4310" stroke-width="3.5"/><path d="M50,30 L50,90 M34,32 Q24,60 34,89 M66,32 Q76,60 66,89" stroke="#c4621a" stroke-width="3" fill="none"/><path d="M48,31 Q46,18 56,14" stroke="#4a6b2a" stroke-width="6" fill="none" stroke-linecap="round"/><g class="glow-part" fill="#ffe14d" stroke="#7a3a00" stroke-width="2"><path d="M28,56 L36,44 L42,58 Z"/><path d="M72,56 L64,44 L58,58 Z"/><path d="M26,68 L34,74 L40,68 L46,76 L54,76 L60,68 L66,74 L74,68 Q70,86 50,86 Q30,86 26,68 Z"/></g>`,
  candelabra: () => `<ellipse cx="50" cy="94" rx="22" ry="5" fill="rgba(0,0,0,.3)"/><path d="M50,90 L50,50 M26,58 Q26,70 50,70 Q74,70 74,58" stroke="#c9a227" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M38,92 L62,92 L56,84 L44,84 Z" fill="#c9a227" stroke="#7a5f12" stroke-width="2"/>${[26, 50, 74].map((x) => `<rect x="${x - 4}" y="${x === 50 ? 28 : 38}" width="8" height="${x === 50 ? 22 : 20}" rx="2" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="1.5"/><path class="candle-flame" d="M${x},${x === 50 ? 14 : 24} q-6,8 0,13 q6,-5 0,-13 Z" fill="#ffcf4a" stroke="#ff8a1f" stroke-width="1.5"/><circle class="glow-part" cx="${x}" cy="${x === 50 ? 22 : 32}" r="11" fill="#ffcf4a" opacity=".22"/>`).join('')}`,
  chandelier: () => `<path d="M50,0 L50,26" stroke="#555" stroke-width="3"/><path d="M14,40 Q50,58 86,40" stroke="#7a6a5a" stroke-width="5" fill="none"/><path d="M50,26 L14,40 M50,26 L86,40 M50,26 L50,48" stroke="#7a6a5a" stroke-width="3"/>${[14, 50, 86].map((x) => `<path class="candle-flame" d="M${x},${x === 50 ? 36 : 28} q-5,6 0,10 q5,-4 0,-10 Z" fill="#ffcf4a"/>`).join('')}<g stroke="#e8e8f0" stroke-width="1.2" fill="none" opacity=".75"><path d="M14,40 Q18,60 10,78 M86,40 Q82,62 92,80 M30,48 L22,70 M70,48 L78,68"/><path d="M10,60 Q20,62 26,56 M80,58 Q86,64 94,62"/></g><circle cx="22" cy="70" r="3" fill="#2a2030"/><path d="M22,70 L22,78" stroke="#e8e8f0" stroke-width=".8"/>`,
  plant: () => `<ellipse cx="50" cy="94" rx="24" ry="5" fill="rgba(0,0,0,.3)"/><path d="M30,70 L70,70 L64,94 L36,94 Z" fill="#b5532f" stroke="#6a2a14" stroke-width="3"/><path d="M50,70 Q46,48 52,36" stroke="#3a7a2a" stroke-width="6" fill="none"/><path d="M48,58 Q30,54 26,40 Q40,42 48,58 Z M52,52 Q70,46 76,32 Q62,36 52,52 Z" fill="#5fb85a" stroke="#2f6a22" stroke-width="2"/><path d="M34,30 Q52,6 70,30 Q60,40 52,34 Q44,40 34,30 Z" fill="#c43d5a" stroke="#6a1a2a" stroke-width="3"/><path d="M40,30 l3,5 l3,-5 l3,5 l3,-5 l3,5 l3,-5 l3,5" stroke="#fff" stroke-width="2" fill="none"/><circle cx="46" cy="22" r="3" fill="#fff"/><circle cx="58" cy="22" r="3" fill="#fff"/><circle cx="46" cy="22" r="1.4" fill="#111"/><circle cx="58" cy="22" r="1.4" fill="#111"/>`,
  gravestone: () => `<ellipse cx="50" cy="93" rx="32" ry="5" fill="rgba(0,0,0,.3)"/><path d="M24,92 L24,40 Q24,14 50,14 Q76,14 76,40 L76,92 Z" fill="#8f93a3" stroke="#45485a" stroke-width="3.5"/><path d="M28,90 L28,42 Q28,22 44,18" stroke="#b5b9c7" stroke-width="3" fill="none"/><text x="50" y="50" font-size="15" font-family="Georgia, serif" text-anchor="middle" fill="#45485a" font-weight="bold">RIP</text><path d="M36,62 L64,62 M38,70 L62,70" stroke="#5c6070" stroke-width="2.5"/><path d="M22,92 Q30,84 36,92 Q46,86 54,92 Q64,84 78,92" fill="#4f8a3d"/>`,
  portrait: () => `<rect x="14" y="8" width="72" height="84" rx="4" fill="#c9a227" stroke="#6b520c" stroke-width="3.5"/><rect x="22" y="16" width="56" height="68" fill="#2e2338"/><path d="M30,84 Q30,56 50,54 Q70,56 70,84 Z" fill="#4a2a5a"/><circle cx="50" cy="42" r="15" fill="#d9c7a8"/><path d="M35,40 Q36,22 50,24 Q64,22 65,40 Q58,30 50,32 Q42,30 35,40 Z" fill="#3a2a1a"/><g class="portrait-eyes"><circle cx="44" cy="42" r="3.6" fill="#fff"/><circle cx="56" cy="42" r="3.6" fill="#fff"/><circle class="pupil" cx="44" cy="42" r="1.8" fill="#111"/><circle class="pupil" cx="56" cy="42" r="1.8" fill="#111"/></g><path d="M45,50 Q50,52 55,50" stroke="#6a3a2a" stroke-width="1.5" fill="none"/>`,
  mildred: () => `<rect x="14" y="8" width="72" height="84" rx="4" fill="#d4a73a" stroke="#6b520c" stroke-width="3.5"/><rect x="22" y="16" width="56" height="68" fill="#3a2d4a"/><path d="M28,84 Q30,58 50,56 Q70,58 72,84 Z" fill="#7b2d8b"/><circle cx="50" cy="42" r="15" fill="#f0d9c0"/><path d="M33,44 Q30,20 50,22 Q70,20 67,44 Q66,30 50,30 Q34,30 33,44 Z" fill="#e8e8f0"/><circle cx="50" cy="20" r="7" fill="#e8e8f0"/><g class="portrait-eyes"><circle cx="44" cy="42" r="3.4" fill="#fff"/><circle cx="56" cy="42" r="3.4" fill="#fff"/><circle class="pupil" cx="44" cy="42" r="1.7" fill="#3a2a1a"/><circle class="pupil" cx="56" cy="42" r="1.7" fill="#3a2a1a"/></g><path d="M44,50 Q50,55 56,50" stroke="#a04a4a" stroke-width="1.8" fill="none" stroke-linecap="round"/><g fill="#fffbea"><circle cx="40" cy="62" r="2"/><circle cx="45" cy="64" r="2"/><circle cx="50" cy="65" r="2"/><circle cx="55" cy="64" r="2"/><circle cx="60" cy="62" r="2"/></g>`,
  fishtank: () => `<ellipse cx="50" cy="94" rx="40" ry="5" fill="rgba(0,0,0,.3)"/><rect x="8" y="28" width="84" height="62" rx="6" fill="rgba(110,200,255,.45)" stroke="#2a5d7a" stroke-width="3.5"/><rect x="8" y="80" width="84" height="10" fill="#d9c08a"/><path d="M20,80 Q18,64 24,54 M28,80 Q32,66 28,58" stroke="#3fae5a" stroke-width="4" fill="none" stroke-linecap="round"/><g class="fish"><path d="M48,52 q10,-8 20,0 q-10,8 -20,0 Z M68,52 l7,-6 l0,12 Z" fill="#ff8a3d" stroke="#a84a1a" stroke-width="1.5"/><circle cx="53" cy="51" r="1.5" fill="#111"/></g><g class="fish fish2"><path d="M30,66 q7,-5 14,0 q-7,5 -14,0 Z M44,66 l5,-4 l0,8 Z" fill="#ffe14d" stroke="#a88a1a" stroke-width="1.2"/></g><circle class="bubble-rise" cx="78" cy="70" r="2.5" fill="#fff" opacity=".7"/><circle class="bubble-rise b2" cx="74" cy="76" r="1.8" fill="#fff" opacity=".7"/><rect x="12" y="32" width="10" height="44" rx="3" fill="#fff" opacity=".2"/>`,
  fog: () => `<ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(0,0,0,.3)"/><rect x="26" y="62" width="48" height="30" rx="6" fill="#4a4a5a" stroke="#22222c" stroke-width="3"/><rect x="32" y="68" width="16" height="8" rx="2" fill="#ff5e5e"/><circle cx="62" cy="72" r="5" fill="#7ad9ff"/><g class="fog-puffs" fill="#e8e6f5" opacity=".8"><circle cx="30" cy="52" r="12"/><circle cx="46" cy="44" r="15"/><circle cx="64" cy="48" r="13"/><circle cx="78" cy="56" r="10"/></g>`,
  crystal: () => `<ellipse cx="50" cy="94" rx="24" ry="5" fill="rgba(0,0,0,.3)"/><path d="M32,92 L68,92 L60,76 L40,76 Z" fill="#6b3f7a" stroke="#341a40" stroke-width="3"/><circle cx="50" cy="52" r="26" fill="url(#crystalGrad)" stroke="#5a3a9a" stroke-width="3"/><defs><radialGradient id="crystalGrad" cx="40%" cy="35%"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#d6b8ff"/><stop offset="1" stop-color="#7b4bd1"/></radialGradient></defs><path class="glow-part" d="M42,52 q8,-10 16,0 q-8,10 -16,0 Z" fill="#fff" opacity=".6"/><ellipse cx="40" cy="40" rx="6" ry="4" fill="#fff" opacity=".8"/>`,
  armor: () => `<ellipse cx="50" cy="95" rx="24" ry="4" fill="rgba(0,0,0,.3)"/><path d="M36,94 L40,64 L60,64 L64,94 Z" fill="#9aa3ad" stroke="#4a5058" stroke-width="3"/><path d="M32,66 Q32,40 50,40 Q68,40 68,66 Z" fill="#b5bec8" stroke="#4a5058" stroke-width="3"/><path d="M38,26 Q38,8 50,8 Q62,8 62,26 L62,38 Q50,44 38,38 Z" fill="#c8d0d8" stroke="#4a5058" stroke-width="3"/><path d="M42,24 L58,24" stroke="#1a1d22" stroke-width="4"/><path d="M50,2 Q56,0 54,8" stroke="#c0392b" stroke-width="4" fill="none"/><path d="M72,94 L72,24 M66,30 L78,30" stroke="#6b5a3a" stroke-width="4"/><path d="M72,24 L68,14 L72,6 L76,14 Z" fill="#c8d0d8" stroke="#4a5058" stroke-width="2"/>`,
  bats: () => `<path d="M50,0 L50,20" stroke="#555" stroke-width="2"/><path d="M20,24 L80,24" stroke="#7a6a5a" stroke-width="3"/><g class="bat-group">${[20, 50, 80].map((x, i) => `<path d="M${x},24 L${x},${38 + i * 6}" stroke="#555" stroke-width="1"/><g transform="translate(${x} ${44 + i * 6})"><path d="M0,0 Q-6,-6 -14,-4 Q-10,0 -14,4 Q-6,2 0,6 Q6,2 14,4 Q10,0 14,-4 Q6,-6 0,0 Z" fill="#2a2030" stroke="#000" stroke-width="1"/><circle cx="-2" cy="0" r="1" fill="#ff5e5e"/><circle cx="2" cy="0" r="1" fill="#ff5e5e"/></g>`).join('')}</g>`,
  cauldron: () => `<ellipse cx="50" cy="94" rx="30" ry="5" fill="rgba(0,0,0,.3)"/><path d="M18,50 Q14,90 50,92 Q86,90 82,50 Z" fill="#2a2a33" stroke="#0d0d12" stroke-width="3.5"/><ellipse cx="50" cy="50" rx="33" ry="9" fill="#7ed957" stroke="#0d0d12" stroke-width="3.5"/><g class="bubbles" fill="#b6ff8a"><circle cx="40" cy="48" r="4"/><circle cx="58" cy="46" r="3"/><circle cx="50" cy="40" r="2.5"/></g>`,
  tesla: () => `<ellipse cx="50" cy="94" rx="22" ry="5" fill="rgba(0,0,0,.3)"/><path d="M38,94 L42,40 L58,40 L62,94 Z" fill="#8a6a3a" stroke="#4a3a1a" stroke-width="3"/><path d="M40,80 L60,80 M41,66 L59,66 M42,52 L58,52" stroke="#c98a3a" stroke-width="3"/><circle cx="50" cy="30" r="14" fill="#c0c8d0" stroke="#4a5058" stroke-width="3"/><path class="spark" d="M50,16 L44,4 L52,8 L48,-4 M64,28 L76,22 L70,30 L82,30 M36,28 L24,22 L30,30 L18,30" stroke="#a8e6ff" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`,
  disco: () => `<path d="M50,0 L50,14" stroke="#555" stroke-width="2"/><g class="disco-ball"><path d="M50,14 C70,14 78,30 78,44 C78,58 70,66 62,70 L62,78 L38,78 L38,70 C30,66 22,58 22,44 C22,30 30,14 50,14 Z" fill="#c8d0e0" stroke="#4a5068" stroke-width="3"/><g fill="#fff" opacity=".8"><rect x="32" y="28" width="7" height="7"/><rect x="48" y="22" width="7" height="7"/><rect x="62" y="34" width="7" height="7"/><rect x="40" y="58" width="7" height="7"/></g><g fill="#7ad9ff" opacity=".7"><rect x="40" y="36" width="7" height="7"/><rect x="58" y="50" width="7" height="7"/></g><ellipse cx="40" cy="44" rx="6" ry="8" fill="#1a1a28"/><ellipse cx="60" cy="44" rx="6" ry="8" fill="#1a1a28"/></g>`,
  bone: () => `<ellipse cx="50" cy="90" rx="38" ry="5" fill="rgba(0,0,0,.3)"/><g transform="rotate(-15 50 60)"><rect x="22" y="52" width="56" height="16" rx="6" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="3"/><circle cx="20" cy="52" r="11" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="3"/><circle cx="20" cy="68" r="11" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="3"/><circle cx="80" cy="52" r="11" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="3"/><circle cx="80" cy="68" r="11" fill="#f4ecd8" stroke="#8a7a5a" stroke-width="3"/><rect x="22" y="54" width="56" height="12" fill="#f4ecd8"/></g>`,
  wreath: () => `<circle cx="50" cy="50" r="32" fill="none" stroke="#5a7a3a" stroke-width="12"/>${Array.from({ length: 8 }, (_, i) => { const ang = (i / 8) * Math.PI * 2; return `<ellipse cx="${50 + Math.cos(ang) * 32}" cy="${50 + Math.sin(ang) * 32}" rx="8" ry="7" fill="#f4ecd8" stroke="#a89878" stroke-width="2"/>`; }).join('')}<path d="M44,80 L50,92 L56,80" fill="#c0392b" stroke="#6a1a1a" stroke-width="2"/>`,
  lilypond: () => `<ellipse cx="50" cy="66" rx="44" ry="24" fill="#3a8fb7" stroke="#1f5a78" stroke-width="3"/><ellipse cx="50" cy="62" rx="38" ry="18" fill="#5ab0d6" opacity=".6"/><path d="M30,64 m-12,0 a12,7 0 1,0 24,0 a12,7 0 1,0 -24,0 Z" fill="#5fb85a" stroke="#2f6a22" stroke-width="2"/><g class="frog"><ellipse cx="62" cy="58" rx="10" ry="7" fill="#7ed957" stroke="#2f6a22" stroke-width="2"/><circle cx="58" cy="52" r="3.5" fill="#fff" stroke="#2f6a22" stroke-width="1.5"/><circle cx="66" cy="52" r="3.5" fill="#fff" stroke="#2f6a22" stroke-width="1.5"/><circle cx="58" cy="52" r="1.5" fill="#111"/><circle cx="66" cy="52" r="1.5" fill="#111"/></g><circle cx="30" cy="62" r="5" fill="#f6b3e6"/>`,
  lanterns: () => `<path d="M0,20 Q50,36 100,20" stroke="#5a4a3a" stroke-width="2" fill="none"/>${[20, 50, 80].map((x, i) => `<g class="lantern" style="--i:${i}"><path d="M${x},${26 + (i === 1 ? 6 : 0)} L${x},${34 + (i === 1 ? 6 : 0)}" stroke="#5a4a3a" stroke-width="1.5"/><ellipse cx="${x}" cy="${50 + (i === 1 ? 6 : 0)}" rx="13" ry="16" fill="${['#ffcf7a', '#ff9ad5', '#a8e6ff'][i]}" stroke="#7a5a3a" stroke-width="2"/><ellipse class="glow-part" cx="${x}" cy="${50 + (i === 1 ? 6 : 0)}" rx="20" ry="22" fill="${['#ffcf7a', '#ff9ad5', '#a8e6ff'][i]}" opacity=".25"/></g>`).join('')}`,
  scarecrow: () => `<ellipse cx="50" cy="95" rx="20" ry="4" fill="rgba(0,0,0,.3)"/><path d="M50,94 L50,40 M20,50 L80,50" stroke="#6b4a2a" stroke-width="5"/><path d="M36,46 L64,46 L66,78 L34,78 Z" fill="#6a8fc4" stroke="#2a3f6a" stroke-width="3"/><path d="M40,56 L46,56 L46,62 L40,62 Z" fill="#d64545"/><circle cx="50" cy="32" r="13" fill="#e8c88a" stroke="#8a6a3a" stroke-width="3"/><path d="M34,24 L66,24 L58,14 L42,14 Z" fill="#8a5a2a" stroke="#4a2e14" stroke-width="2.5"/><path d="M44,32 l3,-3 M44,29 l3,3 M53,32 l3,-3 M53,29 l3,3" stroke="#2a1a0a" stroke-width="1.8"/><path d="M44,38 Q50,42 56,38" stroke="#2a1a0a" stroke-width="2" fill="none"/><path d="M20,50 l-4,6 M20,50 l-5,1 M80,50 l4,6 M80,50 l5,1" stroke="#e8c88a" stroke-width="2.5"/>`,
  snowman: () => `<ellipse cx="50" cy="94" rx="28" ry="5" fill="rgba(0,0,0,.3)"/><circle cx="50" cy="72" r="22" fill="#f4f8ff" stroke="#8bb6d9" stroke-width="3"/><circle cx="50" cy="38" r="17" fill="#f4f8ff" stroke="#8bb6d9" stroke-width="3"/><path d="M40,44 L44,50 L48,44 L52,50 L56,44 L60,50" stroke="#1d1626" stroke-width="2" fill="#fff"/><circle cx="43" cy="34" r="3.5" fill="#1d1626"/><circle cx="57" cy="34" r="3.5" fill="#1d1626"/><path d="M36,26 L32,14 M64,26 L68,14" stroke="#8bb6d9" stroke-width="4" stroke-linecap="round"/><path d="M28,66 L14,56 M72,66 L86,56" stroke="#6b4a2a" stroke-width="3"/>`,
  icicles: () => `<path d="M0,10 L100,10" stroke="#5aa9d6" stroke-width="4"/>${[8, 22, 36, 50, 64, 78, 92].map((x, i) => `<path d="M${x - 5},10 L${x},${34 + (i % 3) * 10} L${x + 5},10 Z" fill="#e8faff" stroke="#8bc8e8" stroke-width="1.5"/><circle class="twinkle" style="--i:${i}" cx="${x}" cy="14" r="3" fill="${['#ff9ad5', '#ffe14d', '#7ad9ff'][i % 3]}"/>`).join('')}`,
};

export function decorSVG(def) {
  const draw = DECOR_ART[def.art];
  if (!draw) return `<svg viewBox="0 0 100 100"><text x="50" y="66" font-size="52" text-anchor="middle">${def.emoji || '❓'}</text></svg>`;
  return `<svg class="decor-svg" viewBox="0 0 100 100" aria-hidden="true">${draw()}</svg>`;
}

// ---------- Cooking stations ----------
export function stationSVG(id) {
  switch (id) {
    case 'cauldron':
      return `<svg class="station-svg" viewBox="0 0 120 110" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="44" ry="5" fill="rgba(0,0,0,.35)"/>
        <g class="st-fire"><path d="M38,100 q-6,-14 4,-22 q0,10 6,8 q-2,-12 8,-18 q2,14 8,18 q4,-10 10,-8 q-2,10 4,14 q6,-4 6,-10 q8,10 0,18 Z" fill="#ff8a1f"/><path d="M48,100 q-2,-10 6,-14 q2,8 6,6 q2,-6 8,-6 q2,8 -2,14 Z" fill="#ffe45c"/></g>
        <path d="M16,46 Q10,96 60,98 Q110,96 104,46 Z" fill="#2c2b36" stroke="#0d0d12" stroke-width="4"/>
        <path d="M22,54 Q22,80 40,90" stroke="#4a4958" stroke-width="5" fill="none" stroke-linecap="round"/>
        <ellipse cx="60" cy="46" rx="46" ry="12" fill="#3a3946" stroke="#0d0d12" stroke-width="4"/>
        <ellipse class="st-liquid" cx="60" cy="47" rx="38" ry="8" fill="#7ed957"/>
        <g class="st-bubbles" fill="#c6ff9a"><circle cx="46" cy="46" r="5"/><circle cx="66" cy="44" r="4"/><circle cx="78" cy="48" r="3"/><circle cx="56" cy="49" r="3"/></g>
        <g class="st-steam" fill="#fff" opacity=".55"><circle cx="44" cy="26" r="7"/><circle cx="62" cy="18" r="9"/><circle cx="78" cy="28" r="6"/></g>
      </svg>`;
    case 'grill':
      return `<svg class="station-svg" viewBox="0 0 120 110" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="44" ry="5" fill="rgba(0,0,0,.35)"/>
        <path d="M28,64 L22,100 M92,64 L98,100" stroke="#2a2a33" stroke-width="6" stroke-linecap="round"/>
        <path d="M14,46 L106,46 Q104,74 60,76 Q16,74 14,46 Z" fill="#33323e" stroke="#0d0d12" stroke-width="4"/>
        <g class="st-coals"><ellipse cx="60" cy="48" rx="44" ry="10" fill="#4a1a1a"/><g fill="#ff5e2a"><circle cx="38" cy="48" r="5"/><circle cx="56" cy="50" r="6"/><circle cx="74" cy="47" r="5"/><circle cx="88" cy="49" r="4"/><circle cx="26" cy="49" r="3.5"/></g></g>
        <g class="st-fire"><path d="M30,46 q-4,-12 4,-18 q0,8 4,7 q0,-10 8,-14 q0,12 6,16 Z M62,46 q-4,-14 6,-22 q0,10 5,9 q2,-8 8,-10 q-2,14 -4,23 Z" fill="#ff9a1f"/><path d="M36,46 q0,-8 5,-10 q1,6 4,10 Z M68,46 q0,-9 6,-12 q1,7 3,12 Z" fill="#ffe45c"/></g>
        <path d="M18,44 L102,44 M22,38 L98,38" stroke="#8a8a99" stroke-width="3"/>
        <path d="M30,36 L30,46 M45,36 L45,46 M60,36 L60,46 M75,36 L75,46 M90,36 L90,46" stroke="#8a8a99" stroke-width="2.5"/>
        <g class="st-steam" fill="#cfcfd8" opacity=".5"><circle cx="40" cy="20" r="7"/><circle cx="64" cy="12" r="8"/><circle cx="84" cy="22" r="6"/></g>
      </svg>`;
    case 'freezer':
      return `<svg class="station-svg" viewBox="0 0 120 110" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="40" ry="5" fill="rgba(0,0,0,.35)"/>
        <rect x="24" y="8" width="72" height="94" rx="12" fill="#a8dcf5" stroke="#2a5d7a" stroke-width="4"/>
        <rect x="30" y="14" width="60" height="34" rx="7" fill="#c8ecff" stroke="#2a5d7a" stroke-width="3"/>
        <rect x="30" y="54" width="60" height="42" rx="7" fill="#c8ecff" stroke="#2a5d7a" stroke-width="3"/>
        <rect x="80" y="22" width="5" height="18" rx="2.5" fill="#2a5d7a"/><rect x="80" y="62" width="5" height="22" rx="2.5" fill="#2a5d7a"/>
        <path d="M24,16 L30,26 L36,14 L42,24 L48,12 L56,22 L64,10 L72,22 L80,12 L88,24 L96,14 L96,8 L24,8 Z" fill="#fff" stroke="#8bc8e8" stroke-width="2"/>
        <g fill="#2a5d7a"><circle cx="48" cy="30" r="3"/><circle cx="62" cy="30" r="3"/></g><path d="M50,38 Q55,42 60,38" stroke="#2a5d7a" stroke-width="2" fill="none"/>
        <g class="st-frost" fill="#fff"><path d="M14,70 l4,0 M16,68 l0,4" stroke="#fff" stroke-width="2"/><circle cx="104" cy="40" r="2.5"/><circle cx="12" cy="40" r="2"/><circle cx="106" cy="76" r="2"/></g>
        <g class="st-steam" fill="#e8faff" opacity=".7"><circle cx="40" cy="6" r="5"/><circle cx="60" cy="0" r="6"/><circle cx="80" cy="6" r="5"/></g>
      </svg>`;
    case 'lightning':
      return `<svg class="station-svg" viewBox="0 0 120 110" aria-hidden="true">
        <ellipse cx="60" cy="104" rx="44" ry="5" fill="rgba(0,0,0,.35)"/>
        <rect x="16" y="40" width="88" height="62" rx="10" fill="#4a3a6b" stroke="#1a1030" stroke-width="4"/>
        <rect x="26" y="52" width="56" height="40" rx="6" fill="#1a1030" stroke="#0d0818" stroke-width="3"/>
        <rect class="st-window" x="30" y="56" width="48" height="32" rx="4" fill="#3a2a6b"/>
        <circle cx="93" cy="58" r="5" fill="#ffd23f" stroke="#1a1030" stroke-width="2"/><circle cx="93" cy="76" r="5" fill="#7ed957" stroke="#1a1030" stroke-width="2"/>
        <path d="M40,40 L40,22 M80,40 L80,22" stroke="#9aa3ad" stroke-width="5"/>
        <circle cx="40" cy="18" r="8" fill="#c0c8d0" stroke="#4a5058" stroke-width="3"/><circle cx="80" cy="18" r="8" fill="#c0c8d0" stroke="#4a5058" stroke-width="3"/>
        <path class="st-arc" d="M47,17 L54,12 L58,22 L64,10 L70,20 L73,16" stroke="#bff3ff" stroke-width="3" fill="none" stroke-linejoin="round"/>
        <path class="st-zap" d="M54,62 L48,74 L56,74 L50,86 L66,70 L58,70 L64,62 Z" fill="#ffe14d" stroke="#a88a1a" stroke-width="1.5"/>
      </svg>`;
    default: return '';
  }
}

/** A plate/bowl for finished dishes, chosen by station. */
export function dishSVG(station) {
  if (station === 'cauldron') return `<svg class="dish-svg" viewBox="0 0 80 50" aria-hidden="true"><ellipse cx="40" cy="44" rx="30" ry="4" fill="rgba(0,0,0,.3)"/><path d="M8,20 Q10,44 40,44 Q70,44 72,20 Z" fill="#e8dcc0" stroke="#7a6a4a" stroke-width="2.5"/><ellipse cx="40" cy="20" rx="32" ry="7" fill="#f4ecd8" stroke="#7a6a4a" stroke-width="2.5"/><ellipse cx="40" cy="20" rx="27" ry="4.5" fill="#9ccf6a"/><g class="dish-steam" fill="#fff" opacity=".6"><circle cx="30" cy="8" r="4"/><circle cx="46" cy="4" r="5"/></g></svg>`;
  if (station === 'freezer') return `<svg class="dish-svg" viewBox="0 0 80 50" aria-hidden="true"><ellipse cx="40" cy="46" rx="22" ry="3" fill="rgba(0,0,0,.3)"/><path d="M26,44 L54,44 L48,38 L32,38 Z" fill="#c8ecff" stroke="#2a5d7a" stroke-width="2"/><path d="M38,38 L38,30 M42,38 L42,30" stroke="#2a5d7a" stroke-width="2"/><path d="M18,10 L62,10 Q60,30 40,31 Q20,30 18,10 Z" fill="#c8ecff" stroke="#2a5d7a" stroke-width="2.5"/><path d="M22,12 L58,12 Q56,24 40,25 Q24,24 22,12 Z" fill="#a8e6ff"/><path d="M26,6 l3,4 M50,4 l-2,5" stroke="#fff" stroke-width="2"/></svg>`;
  if (station === 'lightning') return `<svg class="dish-svg" viewBox="0 0 80 50" aria-hidden="true"><ellipse cx="40" cy="44" rx="32" ry="4" fill="rgba(0,0,0,.3)"/><ellipse cx="40" cy="36" rx="34" ry="9" fill="#3a2a6b" stroke="#1a1030" stroke-width="2.5"/><ellipse cx="40" cy="34" rx="26" ry="5" fill="#5a4a9b"/><path class="dish-zap" d="M14,20 L20,26 L16,28 L24,34 M66,18 L60,24 L64,26 L56,32" stroke="#ffe14d" stroke-width="2.5" fill="none"/></svg>`;
  return `<svg class="dish-svg" viewBox="0 0 80 50" aria-hidden="true"><ellipse cx="40" cy="44" rx="32" ry="4" fill="rgba(0,0,0,.3)"/><ellipse cx="40" cy="36" rx="34" ry="9" fill="#f4ecd8" stroke="#7a6a4a" stroke-width="2.5"/><ellipse cx="40" cy="34" rx="25" ry="5" fill="#e8dcc0"/><path d="M26,32 L54,32 M28,36 L52,36" stroke="#6b3518" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><g class="dish-steam" fill="#cfcfd8" opacity=".5"><circle cx="34" cy="16" r="4"/><circle cx="48" cy="12" r="5"/></g></svg>`;
}
