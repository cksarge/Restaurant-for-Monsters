/**
 * CUSTOMERS — who visits, what they order, where they sit and how they pay.
 */
import { DB } from './db.js';
import { game } from './state.js';
import { pick, chance, shuffle, weightedPick, uid, randInt } from './utils.js';
import { riddleTraits, monsterOrder } from './riddles.js';
import { canMake } from './cooking.js';
import { crowding, CROWDED } from './layout.js';

// ---------- Who can visit tonight? ----------
/**
 * Weighted chance of each species visiting, given tonight's context:
 * reputation, Spookiness, moon phase, seasonal event, theme and decorations.
 */
export function speciesWeight(m, ctx) {
  const s = game.state;
  if (m.critic) return 0;
  if (m.event) return ctx.event?.monsters.includes(m.id) ? m.weight : 0;
  if (s.rep < (m.minRep || 0) || ctx.spook < (m.minSpook || 0)) return 0;
  if (m.moonOnly && !m.moonOnly.includes(ctx.phase)) return 0;
  let w = m.weight;
  w *= ctx.moon.spawn[m.id] || 1;
  if (ctx.event?.monsters.includes(m.id)) w *= 2; // e.g. yetis during Frost Fright
  if (m.themes?.love?.includes(s.theme)) w *= 1.8;
  if (m.themes?.hate?.includes(s.theme)) w *= 0.35;
  const loved = (m.lovesDecor || []).filter((d) => ctx.decor.has(d)).length;
  w *= 1 + Math.min(loved, 3) * 0.35;
  return w;
}

export function pickSpecies(ctx) {
  return weightedPick(DB.monsterList, (m) => speciesWeight(m, ctx))?.id || 'ghost';
}

/** Is this species unlockable at all yet? (Used for Monster Guide hints.) */
export function speciesHint(m) {
  if (m.critic) return 'Visits unannounced. Writes for The Nightly Howl.';
  if (m.event) return `Only visits during ${DB.seasonal[m.event]?.name || 'a seasonal event'}.`;
  const bits = [];
  if (m.minRep) bits.push(`${m.minRep}★ reputation`);
  if (m.minSpook) bits.push(`${m.minSpook} Spookiness`);
  if (m.moonOnly) bits.push(`${m.moonOnly.map((p) => DB.moons[p].name).join(' or ')}`);
  return bits.length ? `Visits with ${bits.join(', ')}.` : 'Visits any night.';
}

// ---------- Orders ----------
/** How many traits an order asks for, ramping up with progress. */
function traitCount(ctx) {
  const s = game.state;
  if (ctx.night < 2) return chance(0.5) ? 1 : 2;
  if (s.rep < 2) return chance(0.8) ? 2 : 1;
  if (s.rep < 3.5) return chance(0.3) ? 3 : 2;
  return chance(0.5) ? 3 : 2;
}

/**
 * Build an order a monster could plausibly make — and that the player can
 * actually cook with what's in the pantry (or at least what's unlocked).
 */
export function buildOrder(monster, ctx, { count } = {}) {
  const feasible = (traits) => canMake(traits, ctx.stockIngredients, ctx.stations) || canMake(traits, ctx.allIngredients, ctx.stations);

  // Half the time, use one of the monster's handwritten riddles
  const hand = shuffle((monster.orders || []).filter((o) => !o.moon || o.moon.includes(ctx.phase)));
  if (hand.length && chance(0.55)) {
    for (const o of hand) {
      const traits = riddleTraits(o.riddle);
      if (feasible(traits)) return { text: o.riddle, traits };
    }
  }

  // Otherwise generate one from what they like (moon-dependent for werewolves)
  const pool = monster.moonLikes?.[ctx.phase] || monster.likes;
  let n = count || traitCount(ctx);
  for (let attempt = 0; attempt < 40; attempt++) {
    if (attempt === 20) n = Math.max(1, n - 1);
    const traits = shuffle(pool).slice(0, n);
    // Occasionally ask for a station trait (soupy/smoky/cold/zappy) to teach stations
    if (n < 3 && chance(0.25)) {
      const st = pick(ctx.stations);
      const t = DB.stations[st].adds[0];
      if (!traits.includes(t)) traits.push(t);
    }
    if (feasible(traits)) return { text: monsterOrder(monster, traits), traits };
  }
  // Last resort: any single liked trait that works
  for (const t of shuffle(pool)) if (feasible([t])) return { text: monsterOrder(monster, [t]), traits: [t] };
  return { text: monsterOrder(monster, ['soupy']), traits: ['soupy'] };
}

// ---------- Regulars ----------
/** A regular whose next story chapter can happen tonight, or null. */
export function pickRegular(ctx, { force } = {}) {
  const s = game.state;
  const candidates = DB.regularList.filter((r) => {
    const prog = s.regulars[r.id] || { chapter: 0 };
    const ch = r.chapters[prog.chapter];
    if (!ch || prog.done) return false;
    if (force) return r.id === force;
    if (ch.minNight > ctx.night || (ch.minRep && s.rep < ch.minRep)) return false;
    if (ch.moon && !ch.moon.includes(ctx.phase)) return false;
    if (s.rep < (DB.monsters[r.species].minRep || 0)) return false;
    // Only show up if the chapter's order is cookable (gifted ingredients count)
    const ings = [...ctx.allIngredients, ...Object.keys(ch.gift || {})];
    return canMake(riddleTraits(ch.order.riddle), ings, ctx.stations);
  });
  return candidates.length ? pick(candidates) : null;
}

// ---------- Creating customers ----------
/** Art for a customer: a regular's outfit overrides their species' extras. */
export function customerArt(c) {
  const base = DB.monsters[c.species].art;
  const reg = c.regularId ? DB.regulars[c.regularId] : null;
  return reg?.art ? { ...base, ...reg.art } : base;
}

export function createCustomer(speciesId, ctx, opts = {}) {
  const m = DB.monsters[speciesId];
  const c = {
    uid: uid('c'),
    species: speciesId,
    name: m.name,
    regularId: null,
    chapter: null,
    isCritic: !!m.critic,
    group: opts.group || null,
    state: 'queue',
    queueTime: 0,
    patience: 0,
    maxPatience: 0,
    seat: null,
    eatTimer: 0,
    order: null,
    animDelay: -Math.random() * 3,
  };

  if (opts.regular) {
    const reg = opts.regular;
    const prog = game.state.regulars[reg.id] || { chapter: 0 };
    const ch = reg.chapters[prog.chapter];
    c.regularId = reg.id;
    c.name = reg.name;
    c.chapter = prog.chapter;
    // Storyline orders: if a required decoration is missing, they just ask for it and order normally
    if (ch.requireDecor && !ctx.decor.has(ch.requireDecor)) {
      c.arriveLine = ch.needDecorText;
      c.order = buildOrder(m, ctx);
      c.chapter = null;
    } else {
      c.arriveLine = ch.arrive;
      c.order = { text: ch.order.riddle, traits: riddleTraits(ch.order.riddle), requireIngredient: ch.requireIngredient, forbidIngredient: ch.forbidIngredient };
      c.gift = ch.gift || null;
      c.unlockOnArrive = ch.unlockOnArrive || null;
    }
  } else if (m.critic) {
    const pool = m.likes;
    let order = null;
    for (let i = 0; i < 30 && !order; i++) {
      const traits = shuffle(pool).slice(0, game.state.rep >= 2 ? 3 : 2);
      if (canMake(traits, ctx.allIngredients, ctx.stations)) order = { text: monsterOrder(m, traits), traits };
    }
    c.order = order || buildOrder(m, ctx, { count: 2 });
    c.name = DB.critic.name;
  } else {
    c.order = buildOrder(m, ctx);
    // Dragons sometimes insist on being cooked with their own breath
    if (m.special === 'dragonfire' && ctx.stations.includes('grill') && chance(0.4)) {
      c.order.special = 'dragonfire';
      c.order.text += ' And cook it with MY breath! On the grill! *sniffles*';
    }
  }
  if (!c.arriveLine) c.arriveLine = pick(m.lines?.arrive || DB.genericLines.arrive);
  return c;
}

// ---------- Seating ----------
const SIZE_ORDER = ['small', 'medium', 'big', 'giant'];

/** Is there ANY seat in the restaurant that fits this monster? */
export const anySeatFits = (species, seats) => seats.some((s) => s.fits.includes(DB.monsters[species].size));

/**
 * Pick the best free, clean seat for a customer. Prefers furniture they find
 * comfy, then outdoor seats for outdoor-lovers, then the snuggest fit.
 */
export function findSeat(c, seats, occupied, dirty) {
  const m = DB.monsters[c.species];
  const free = seats.filter((s) => s.fits.includes(m.size) && !occupied[s.key] && !dirty[s.key]);
  if (!free.length) return null;
  const score = (s) => ((m.comfort || []).includes(s.def.id) || (s.def.comfort || []).includes(m.id) ? 10 : 0)
    + (m.outdoorLover && s.outdoor ? 4 : 0)
    - SIZE_ORDER.indexOf(s.fits[s.fits.length - 1]) // don't waste big seats on small monsters
    + Math.random();
  return free.sort((a, b) => score(b) - score(a))[0];
}

/** Patience (in-game minutes) once seated, after all the modifiers. */
export function seatedPatience(c, seat, ctx) {
  const m = DB.monsters[c.species];
  const mods = ctx.mods;
  let p = m.patience * ctx.moon.patienceMult * mods.patienceMult * (1 + mods.decorPatience);
  const comfy = (m.comfort || []).includes(seat.def.id) || (seat.def.comfort || []).includes(m.id);
  if (comfy) p *= 1.25;
  if (m.outdoorLover && seat.outdoor) p *= 1.2;
  if ((m.lovesDecor || []).some((d) => ctx.decor.has(d))) p *= 1.1;
  if (m.themes?.love?.includes(game.state.theme)) p *= 1.1;
  if (m.themes?.hate?.includes(game.state.theme)) p *= 0.85;
  // Overcrowding makes big monsters grumpy
  c.cramped = (m.size === 'big' || m.size === 'giant') && crowding(game.state, seat.room) > CROWDED;
  if (c.cramped) p *= 0.7;
  // Rattles the skeleton musician is too loud for some
  if (game.state.helpers.includes('skeleton-musician') && (m.id === 'mummy' || m.id === 'shadow')) p *= 0.85;
  c.comfy = comfy;
  return Math.round(p);
}

// ---------- Paying ----------
const TRINKETS = ['a shiny pebble', 'a cursed doubloon', 'a lucky toenail', 'a stolen button', 'a golden scarab', 'a tiny crown', 'a dragon scale', 'a pearl the size of a grape', 'an IOU written in blood (it\'s ketchup)'];
const REACTION_PAY = { delighted: 1, unimpressed: 0.6, confused: 0.25, onfire: 0.15 };

/** Coins + tip for a served dish. */
export function computePayout(c, dish, result, ctx) {
  const m = DB.monsters[c.species];
  let pay = dish.value * REACTION_PAY[result.reaction];
  // Moon bonuses for certain traits (e.g. glowy on a full moon)
  let traitMult = 1;
  for (const [t, k] of Object.entries(ctx.moon.traitPay)) if (dish.traits.includes(t)) traitMult = Math.max(traitMult, k);
  pay *= traitMult;

  let tip = 0;
  let trinket = null;
  if (result.reaction === 'delighted' || result.reaction === 'unimpressed') {
    const base = dish.value;
    switch (m.tip) {
      case 'generous': tip = base * (0.35 + Math.random() * 0.2); break;
      case 'polite': tip = base * 0.22; break;
      case 'stingy': tip = base * (0.03 + Math.random() * 0.07); break;
      case 'chaotic': tip = base * Math.random() * 0.8; break;
      case 'exact': tip = base * 0.15; break;
      case 'trinket': tip = base * (0.25 + Math.random() * 0.3); trinket = pick(TRINKETS); break;
      default: tip = base * 0.15;
    }
    tip *= ctx.mods.tipMult * ctx.moon.tipMult * (1 + ctx.mods.decorTip) * (1 + game.state.rep * 0.05);
    const seatBonus = c.seat ? m.tipBonus?.[c.seat.def.id] : 0;
    if (seatBonus) tip *= seatBonus;
    if (c.comfy) tip *= 1.2;
    if (result.reaction === 'unimpressed') tip *= 0.3;
  }
  if (game.state.helpers.includes('goblin-waiter')) pay *= 0.92; // Snick's fries
  return { pay: Math.round(pay), tip: Math.round(tip), trinket };
}

// ---------- Lines ----------
export function reactionLine(c, reaction) {
  const m = DB.monsters[c.species];
  const list = m.lines?.[reaction] || DB.genericLines[reaction] || ['...'];
  return pick(list);
}

/** Reputation change for each outcome; gains shrink as you get famous. */
export function repDelta(reaction, isCritic = false) {
  const rep = game.state.rep;
  const gain = (x) => x * (1 - rep / 6.5);
  const table = { delighted: gain(0.035), unimpressed: 0.004, confused: -0.03, onfire: -0.02, walkout: -0.05 };
  return (table[reaction] || 0) * (isCritic ? 0 : 1);
}

export const randomGroupSize = ([a, b]) => randInt(a, b);
