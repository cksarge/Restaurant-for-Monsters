/**
 * GAME STATE
 *
 * `game.state` is everything that gets saved (coins, pantry, layout, stats…).
 * `game.shift` is the live, unsaved state of the current night (customers,
 * cooking timers…). It's rebuilt from scratch every time a shift starts.
 *
 * A tiny event bus (on/emit) lets modules react to each other without
 * importing each other in circles — e.g. the tutorial listens for 'served'.
 */
import { DB } from './db.js';

export const SAVE_VERSION = 1;

export const game = {
  state: null,     // saved progress
  shift: null,     // live night (not saved)
  settings: {      // saved separately so they survive "New Game"
    sound: true,
    volume: 0.7,
    animSpeed: 1,  // 0.5 = slow & smooth, 1 = normal, 1.5 = snappy, 0 = reduced motion
    pace: 1,       // how fast in-game time passes during a shift
  },
  ui: { view: 'title' },
};

// ---------- Event bus ----------
const listeners = {};
export function on(evt, fn) {
  (listeners[evt] ||= []).push(fn);
  return () => { listeners[evt] = listeners[evt].filter((f) => f !== fn); };
}
export function emit(evt, data) {
  for (const fn of listeners[evt] || []) {
    try { fn(data); } catch (err) { console.error(`[bus] ${evt} handler failed`, err); }
  }
}

// ---------- New game ----------
export function newGameState() {
  const startIngredients = DB.ingredientList.filter((i) => i.start).map((i) => i.id);
  const startItems = [...DB.furnitureList, ...DB.decorList].filter((i) => i.start).map((i) => i.id);

  return {
    version: SAVE_VERSION,
    seed: Math.floor(Math.random() * 1e9),
    night: 0,                 // index of the NEXT night to be played (0 = first night)
    coins: 80,
    rep: 1.0,                 // 0–5 stars

    // Look & feel
    restaurantName: "Mildred's Diner",
    sign: 'wood',
    theme: 'diner',
    ownedThemes: ['diner'],
    wallpaper: 'peeling',
    floor: 'checker',
    light: '#ffcf7a',

    // Kitchen
    pantry: Object.fromEntries(startIngredients.map((id) => [id, 6])),
    unlockedIngredients: startIngredients,
    knownIngredients: {},     // id → true once you've cooked with it (reveals its traits)
    stations: DB.stationList.filter((s) => s.start).map((s) => s.id),
    upgrades: [],

    // Staff
    helpers: [],
    unlockedHelpers: DB.helperList.filter((h) => !h.reward).map((h) => h.id),

    // Restaurant layout (Build Mode)
    rooms: { main: { w: 6, h: 5 } },
    unlockedItems: startItems,
    placed: [
      { uid: 'p1', id: 'diner-table', room: 'main', x: 1, y: 1, rot: 0 },
      { uid: 'p2', id: 'diner-table', room: 'main', x: 3, y: 1, rot: 0 },
      { uid: 'p3', id: 'booth', room: 'main', x: 2, y: 3, rot: 0 },
      { uid: 'p4', id: 'round-table', room: 'main', x: 5, y: 3, rot: 0 },
      { uid: 'p5', id: 'jack-o-lantern', room: 'main', x: 5, y: 0, rot: 0 },
      { uid: 'p6', id: 'candelabra', room: 'main', x: 0, y: 0, rot: 0 },
    ],

    // Knowledge
    recipeBook: {},           // comboKey → { ingredients, station, traits, name, recipeId, served, delighted }
    namedFound: [],           // signature recipe ids discovered
    revealedSecrets: [],      // secret recipe ids revealed by storylines
    phrasebook: {},           // "riddle phrase" → trait id
    bestiary: {},             // species id → { met, delighted, likesKnown: [] }
    regulars: {},             // regular id → { chapter, visits, done }
    goalsDone: [],

    stats: {
      served: 0, delighted: 0, unimpressed: 0, confused: 0, onfire: 0, walkouts: 0,
      coinsEarned: 0, tipsEarned: 0, dishesCooked: 0, backfires: 0, namedFound: 0,
      inspectionsPassed: 0, inspectionsFailed: 0, storiesDone: 0, bestNight: 0, nightsPlayed: 0,
    },

    // Calendar
    schedule: null,           // generated per year by calendar.js → ensureSchedule()
    eventProgress: {},        // `${eventId}-${year}` → { count, done }
    reviews: [],              // critic reviews

    lastSummary: null,
    awardsYears: [],          // years whose Monster Food Awards have been held
    tutorialDone: false,
  };
}

/**
 * Upgrade older saves to the current shape. Fills in any missing fields from a
 * fresh state so adding new features never breaks old saves.
 */
export function migrateState(saved) {
  const fresh = newGameState();
  const merged = { ...fresh, ...saved };
  merged.stats = { ...fresh.stats, ...(saved.stats || {}) };
  merged.version = SAVE_VERSION;
  return merged;
}

// ---------- Common mutations ----------
export function addCoins(amount) {
  const s = game.state;
  s.coins = Math.max(0, Math.round(s.coins + amount));
  emit('coins', s.coins);
}

export function addRep(delta) {
  const s = game.state;
  s.rep = Math.max(0, Math.min(5, s.rep + delta));
  emit('rep', s.rep);
}
