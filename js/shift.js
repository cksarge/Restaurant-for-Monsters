/**
 * THE SHIFT — one in-game night at the restaurant.
 *
 * The clock is in in-game minutes from 6:00 PM (0) to 2:00 AM (480).
 * Real time only matters as "how many in-game minutes passed this frame",
 * scaled by the Pace setting. Nothing here reads the real-world date.
 *
 * UI modules listen to events emitted here (see emit(...) calls) and call the
 * exported actions (cook, serve, addToBowl…) when the player does things.
 */
import { DB } from './db.js';
import { game, emit, addCoins, addRep } from './state.js';
import { clamp, chance, pick, randInt, rand } from './utils.js';
import { nightEvents, moonEffects, seasonalOn, yearOf } from './calendar.js';
import { comboKey, makeDish, findBackfire, evaluateDish, kitchenIngredients } from './cooking.js';
import { spookiness, modifiers, nightlyWages, checkGoals, applyReward, refreshUnlocks } from './economy.js';
import { allSeats } from './layout.js';
import { riddlePhrases } from './riddles.js';
import {
  pickSpecies, pickRegular, createCustomer, findSeat, seatedPatience, anySeatFits,
  computePayout, reactionLine, repDelta,
} from './customers.js';
import { saveGame } from './save.js';
import { sfx } from './audio.js';

export const SHIFT_LENGTH = 480;          // 6 PM → 2 AM
const MINUTES_PER_SECOND = 2;             // at Pace 1: a night lasts ~4 real minutes
const EAT_MINUTES = 24;
const QUEUE_PATIENCE = 70;
const MAX_QUEUE = 6;

let rafId = null;
let lastTs = 0;

// ---------- Starting a night ----------
export function startShift() {
  const s = game.state;
  const night = s.night;
  const ev = nightEvents(s, night);
  const ctx = buildContext(night);

  game.shift = {
    night, ctx, events: ev,
    clock: 0,
    length: SHIFT_LENGTH,
    paused: false,
    holds: new Set(),           // reasons the game is frozen: 'menu', 'inspector', 'modal'
    tutorialHold: false,        // freezes the clock & patience but lets cooking continue
    spawnQueue: buildSpawnSchedule(ctx, ev),
    customers: [],
    seats: allSeats(s),
    occupied: {},               // seatKey → customer uid
    dirty: {},                  // seatKey → minutes it has been dirty
    counter: [],                // finished dishes waiting to be served
    cooking: {},                // stationId → { dish, remaining, total }
    broken: {},                 // stationId → minutes until it works again
    bowl: [],                   // ingredient ids chosen for the next dish
    selected: null,             // uid of the customer whose order is selected
    dragonfire: false,          // grill charged with dragon sneeze
    tickles: 0,
    ghost: false,               // tiny angry ghost eating tips
    inspectionAt: ev.inspection ? randInt(100, 200) : null,
    inspectionDone: false,
    closing: false,
    ended: false,
    announced: new Set(),
    summary: {
      night, served: 0, delighted: 0, unimpressed: 0, confused: 0, onfire: 0, walkouts: 0, turnedAway: 0,
      coins: 0, tips: 0, ghostAte: 0, rep0: s.rep, notes: [], story: [], backfires: [], newRecipes: [],
      critic: null, inspection: null, goals: [], trinkets: [],
    },
  };

  // Gift-free nights start with a little flavour
  if (ev.seasonal) game.shift.summary.notes.push(`${ev.seasonal.icon} ${ev.seasonal.name} is on tonight!`);
  emit('shift:start', game.shift);
  lastTs = performance.now();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

/** Everything about tonight that customers and orders depend on. */
export function buildContext(night) {
  const s = game.state;
  return {
    night,
    phase: night % 8,
    moon: moonEffects(night),
    event: seasonalOn(night),
    spook: spookiness(s),
    decor: new Set(s.placed.map((p) => p.id)),
    stations: s.stations.slice(),
    stockIngredients: kitchenIngredients({ inStockOnly: true }),
    allIngredients: s.unlockedIngredients.filter((id) => DB.ingredients[id] && (!DB.ingredients[id].event || (s.pantry[id] || 0) > 0)),
    mods: modifiers(s),
  };
}

/** Decide who arrives when tonight. */
function buildSpawnSchedule(ctx, ev) {
  const s = game.state;
  const list = [];

  // The very first night is a gentle, scripted tutorial night
  if (ctx.night === 0 && !s.tutorialDone) {
    list.push({ t: 4, regular: 'tentacles' });
    [['slime', 80], ['ghost', 150], ['skeleton', 230], ['vampire', 300]].forEach(([species, t]) => list.push({ t, species }));
    return list;
  }

  const seats = allSeats(s).length;
  const count = clamp(Math.round(4 + s.rep * 1.6 + Math.min(seats, 18) * 0.25 + randInt(0, 2)), 4, 24);
  for (let i = 0; i < count; i++) {
    // The first two guests arrive right after opening so the night starts lively;
    // the rest bunch up mid-evening (average of two randoms = a gentle dinner rush).
    const t = i < 2 ? 3 + i * 14 + rand() * 8 : 25 + ((rand() + rand()) / 2) * 390;
    list.push({ t, species: pickSpecies(ctx) });
  }

  // A regular with a story beat (night 0 is Sir Tentacles' tutorial)
  const reg = pickRegular(ctx);
  if (reg && chance(0.6)) list.push({ t: randInt(30, 280), regular: reg.id });

  if (ev.critic) list.push({ t: randInt(60, 300), critic: true });

  if (ev.bus) {
    const t0 = randInt(120, 300);
    const R = DB.rushes.bus;
    const n = randInt(R.size[0], R.size[1]);
    for (let i = 0; i < n; i++) list.push({ t: t0 + i * 2, species: pick(R.species), group: 'bus' });
  }
  if (ctx.moon.rush) {
    const R = DB.rushes[ctx.moon.rush];
    const t0 = randInt(190, 260);
    const n = randInt(R.size[0], R.size[1]);
    for (let i = 0; i < n; i++) list.push({ t: t0 + i * 2, species: pick(R.species), group: ctx.moon.rush });
  }
  return list.sort((a, b) => a.t - b.t);
}

// ---------- Main loop ----------
function loop(ts) {
  const sh = game.shift;
  if (!sh || sh.ended) return;
  const realDt = Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;
  const frozen = sh.paused || sh.holds.size > 0;
  if (!frozen) update(realDt * MINUTES_PER_SECOND * game.settings.pace);
  emit('shift:tick', sh);
  rafId = requestAnimationFrame(loop);
}

function update(dm) {
  const sh = game.shift;
  const timeFlows = !sh.tutorialHold;

  if (timeFlows) sh.clock += dm;

  // 1. Arrivals
  while (!sh.closing && sh.spawnQueue.length && sh.spawnQueue[0].t <= sh.clock) spawn(sh.spawnQueue.shift());

  // 2. Seat people from the waiting line
  for (const c of sh.customers) {
    if (c.state !== 'queue') continue;
    if (!c.noFit && !anySeatFits(c.species, sh.seats)) {
      c.noFit = true;
      emit('customer:say', { c, text: DB.genericLines.noSeat[0] + (c.species === 'troll' ? ' TROLL NEED BIG TABLE.' : '') });
      if (c.species === 'troll') emit('toast', { icon: '🪵', text: 'Trolls need a Reinforced Giant Table (Build Mode).' });
      else emit('toast', { icon: '🪑', text: `${c.name}s need a bigger seat, like a booth.` });
    }
    if (c.noFit) { c.queueTime += dm; if (c.queueTime > 12) leave(c, 'noseat'); continue; }
    const seat = findSeat(c, sh.seats, sh.occupied, sh.dirty);
    if (seat) seatCustomer(c, seat);
    else if (timeFlows) {
      c.queueTime += dm;
      const limit = QUEUE_PATIENCE * sh.ctx.mods.queuePatience * sh.ctx.moon.patienceMult;
      if (c.queueTime > limit) leave(c, 'walkout');
    }
  }

  // 3. Seated customers lose patience; eaters finish
  for (const c of sh.customers) {
    if (c.state === 'seated' && timeFlows) {
      c.patience -= dm;
      if (c.patience <= 0) leave(c, 'walkout');
    } else if (c.state === 'eating') {
      c.eatTimer -= dm;
      if (c.eatTimer <= 0) leave(c, 'done');
    }
  }

  // 4. Dirty tables (Morty cleans them eventually)
  const autoClean = sh.ctx.mods.autoClean;
  for (const key of Object.keys(sh.dirty)) {
    sh.dirty[key] += dm;
    if (autoClean && sh.dirty[key] >= autoClean) { delete sh.dirty[key]; emit('seat:clean', key); }
  }

  // 5. Cooking & broken stations
  for (const [st, job] of Object.entries(sh.cooking)) {
    if (job.remaining > 0) job.remaining -= dm;
    if (job.remaining <= 0 && sh.counter.length < sh.ctx.mods.counterSlots) {
      delete sh.cooking[st];
      sh.counter.push(job.dish);
      sfx('ding');
      emit('dish:ready', job.dish);
    }
  }
  for (const st of Object.keys(sh.broken)) {
    sh.broken[st] -= dm;
    if (sh.broken[st] <= 0) { delete sh.broken[st]; emit('kitchen'); emit('toast', { icon: '🔧', text: `The ${DB.stations[st].name} works again!` }); }
  }

  // 6. Health inspector
  if (sh.inspectionAt !== null && !sh.inspectionDone && sh.clock >= sh.inspectionAt) {
    sh.inspectionDone = true;
    emit('inspection:start', sh.events.inspection);
  }

  // 7. Closing time
  if (!sh.closing && sh.clock >= sh.length) {
    sh.closing = true;
    sh.spawnQueue = [];
    emit('toast', { icon: '🕑', text: 'Closing time! Finish serving whoever is left.' });
  }
  sh.customers = sh.customers.filter((c) => c.state !== 'gone');
  if (sh.closing && sh.customers.length === 0) endShift();
}

// ---------- Customer lifecycle ----------
function spawn(entry) {
  const sh = game.shift;
  const s = game.state;
  const waiting = sh.customers.filter((c) => c.state === 'queue').length;
  if (waiting >= MAX_QUEUE && !entry.regular && !entry.critic) {
    sh.summary.turnedAway++;
    return;
  }

  if (entry.group && !sh.announced.has(entry.group)) {
    sh.announced.add(entry.group);
    const R = DB.rushes[entry.group];
    sfx(entry.group === 'bus' ? 'honk' : 'howl');
    emit('toast', { icon: R.icon, text: R.text, big: true });
  }

  let c;
  if (entry.regular) {
    const reg = DB.regulars[entry.regular];
    c = createCustomer(reg.species, sh.ctx, { regular: reg });
    const prog = (s.regulars[reg.id] ||= { chapter: 0, visits: 0, done: false });
    prog.visits++;
    if (c.gift) for (const [id, n] of Object.entries(c.gift)) {
      s.pantry[id] = (s.pantry[id] || 0) + n;
      if (!s.unlockedIngredients.includes(id)) s.unlockedIngredients.push(id);
      emit('toast', { icon: DB.ingredients[id].emoji, text: `${reg.name} slipped you ${n} ${DB.ingredients[id].name}. "Don't ask."` });
      sh.ctx.stockIngredients = kitchenIngredients();
      emit('pantry');
    }
    if (c.unlockOnArrive) for (const id of c.unlockOnArrive) if (!s.revealedSecrets.includes(id)) s.revealedSecrets.push(id);
  } else if (entry.critic) {
    c = createCustomer('critic', sh.ctx);
  } else {
    c = createCustomer(entry.species, sh.ctx, { group: entry.group });
  }

  // Bestiary: first sighting
  const b = (s.bestiary[c.species] ||= { met: 0, delighted: 0 });
  if (b.met === 0) emit('toast', { icon: '📖', text: `New monster in your Guide: ${DB.monsters[c.species].name}!` });
  b.met++;

  sh.customers.push(c);
  sfx('door');
  emit('customer:new', c);
}

function seatCustomer(c, seat) {
  const sh = game.shift;
  c.state = 'seated';
  c.seat = seat;
  sh.occupied[seat.key] = c.uid;
  c.maxPatience = c.patience = seatedPatience(c, seat, sh.ctx);
  if (c.isCritic) c.maxPatience = c.patience = 75;
  // Witchy sous-chef Hazel reveals one wanted trait
  if (sh.ctx.mods.hintTrait) c.hint = pick(c.order.traits);
  emit('customer:seated', c);
  emit('customer:say', { c, text: c.arriveLine });
  if (c.cramped) setTimeout(() => emit('customer:say', { c, text: 'It\'s SO cramped in here! Grumble.' }), 2400);
  if (!sh.selected) selectCustomer(c.uid, { silent: true });
}

function leave(c, why) {
  const sh = game.shift;
  const s = game.state;
  if (c.seat) {
    delete sh.occupied[c.seat.key];
    if (why === 'done') sh.dirty[c.seat.key] = 0;
  }
  if (why === 'walkout') {
    sh.summary.walkouts++;
    s.stats.walkouts++;
    addRep(c.isCritic ? 0 : repDelta('walkout'));
    if (c.isCritic) sh.summary.critic = { reaction: 'walkout', dirty: Object.keys(sh.dirty).length };
    emit('customer:say', { c, text: reactionLine(c, 'walkout') });
    sfx('sad');
  }
  c.state = 'gone';
  if (sh.selected === c.uid) sh.selected = null;
  emit('customer:leave', { c, why });
}

// ---------- Player actions ----------
export function selectCustomer(uid, { silent = false } = {}) {
  const sh = game.shift;
  if (!sh) return;
  sh.selected = uid;
  emit('order:selected', uid);
  if (!silent) { sfx('click'); emit('order:tapped', uid); }
}

export function addToBowl(id) {
  const sh = game.shift;
  const s = game.state;
  const used = sh.bowl.filter((x) => x === id).length;
  if (sh.bowl.length >= 3) { emit('toast', { icon: '🥣', text: 'The bowl fits 3 ingredients. Tap one to take it out.' }); sfx('error'); return false; }
  if ((s.pantry[id] || 0) <= used) { emit('toast', { icon: '🛒', text: `Out of ${DB.ingredients[id].name}! Buy more at the Market between shifts.` }); sfx('error'); return false; }
  sh.bowl.push(id);
  sfx('add');
  emit('bowl', sh.bowl);
  emit('ingredient:added', id);
  return true;
}

export function removeFromBowl(index) {
  const sh = game.shift;
  sh.bowl.splice(index, 1);
  sfx('click');
  emit('bowl', sh.bowl);
}

export function clearBowl() {
  game.shift.bowl = [];
  emit('bowl', []);
}

/** Fill the bowl from a Recipe Book entry. */
export function fillBowl(ings) {
  const sh = game.shift;
  sh.bowl = [];
  for (const id of ings) if (!addToBowl(id)) break;
  emit('bowl', sh.bowl);
}

export function stationStatus(st) {
  const sh = game.shift;
  if (!game.state.stations.includes(st)) return 'locked';
  if (sh?.broken[st]) return 'broken';
  if (sh?.cooking[st]) return sh.cooking[st].remaining > 0 ? 'cooking' : 'waiting';
  return 'idle';
}

/** Start cooking whatever is in the bowl at a station. */
export function cook(st) {
  const sh = game.shift;
  const s = game.state;
  const status = stationStatus(st);
  if (status !== 'idle') {
    emit('toast', { icon: '⏳', text: status === 'broken' ? `The ${DB.stations[st].name} is out of order for a bit.` : status === 'locked' ? `Buy the ${DB.stations[st].name} in Upgrades.` : 'That station is busy!' });
    sfx('error');
    return false;
  }
  if (!sh.bowl.length) { emit('toast', { icon: '🥣', text: 'Add ingredients from the pantry first!' }); sfx('error'); return false; }

  const ings = sh.bowl.slice();
  for (const id of ings) s.pantry[id] = Math.max(0, (s.pantry[id] || 0) - 1);
  const newlyKnown = ings.filter((id) => !s.knownIngredients[id]);
  for (const id of ings) s.knownIngredients[id] = true;

  const useDragonfire = st === 'grill' && sh.dragonfire;
  if (useDragonfire) sh.dragonfire = false;
  const dish = makeDish(ings, st, { dragonfire: useDragonfire });

  // Helper quirks
  if (s.helpers.includes('witch-souschef') && chance(0.1) && !dish.traits.includes('cursed')) {
    dish.traits.push('cursed');
    emit('toast', { icon: '🧙', text: 'Hazel cackles and hexes the dish. It is now Cursed. "Hee hee! Oops."' });
  }
  if (s.helpers.includes('bolt-cook') && chance(0.1) && !dish.traits.includes('zappy')) {
    dish.traits.push('zappy');
    emit('toast', { icon: '⚡', text: 'Bolt got excited and zapped the dish. It is now Zappy. "BOLT HELP!"' });
  }

  // Signature recipe discovery
  if (dish.recipeId && !s.namedFound.includes(dish.recipeId)) {
    s.namedFound.push(dish.recipeId);
    s.stats.namedFound = s.namedFound.length;
    sh.summary.newRecipes.push(dish.name);
    emit('recipe:discovered', dish);
  }

  // Backfires!
  const bf = findBackfire(ings, st);
  if (bf) applyBackfire(bf);

  const mods = sh.ctx.mods;
  const total = DB.stations[st].time * (mods.cookMult[st] || 1) * mods.cookSpeed;
  sh.cooking[st] = { dish, remaining: total, total };
  s.stats.dishesCooked++;
  sh.bowl = [];
  sh.ctx.stockIngredients = kitchenIngredients();
  sfx(st === 'cauldron' ? 'bubble' : st === 'grill' ? 'sizzle' : st === 'freezer' ? 'freeze' : 'zap');
  emit('cook:start', { st, dish, newlyKnown, dragonfire: useDragonfire });
  emit('bowl', sh.bowl);
  emit('pantry');
  return true;
}

function applyBackfire(bf) {
  const sh = game.shift;
  const s = game.state;
  s.stats.backfires++;
  sh.summary.backfires.push(bf.name);
  const seated = sh.customers.filter((c) => c.state === 'seated');
  const e = bf.effect;
  if (e === 'ghostTips') { sh.ghost = true; sfx('ghost'); }
  else if (e === 'patienceDown') { seated.forEach((c) => { c.patience = Math.max(1, c.patience - c.maxPatience * 0.25); }); sfx('boom'); }
  else if (e === 'patienceUp') { seated.forEach((c) => { c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * 0.3); }); sfx('happy'); }
  else if (e === 'stinkCloud') {
    seated.forEach((c) => {
      const fan = c.species === 'swamp-creature' || c.species === 'troll';
      c.patience = fan ? Math.min(c.maxPatience, c.patience + c.maxPatience * 0.2) : Math.max(1, c.patience - c.maxPatience * 0.15);
    });
    sfx('whoosh');
  } else if (e.breakStation) { sh.broken[e.breakStation] = e.minutes; sfx('boom'); }
  else if (e.coins) { addCoins(e.coins); sfx('sad'); }
  else if (e.clock) { sh.clock = Math.max(0, sh.clock + e.clock); sfx('whoosh'); }
  emit('backfire', bf);
}

export function trashDish(uid) {
  const sh = game.shift;
  sh.counter = sh.counter.filter((d) => d.uid !== uid);
  sfx('whoosh');
  emit('counter');
}

/** Give a finished dish to a seated customer. */
export function serve(dishUid, customerUid = game.shift.selected) {
  const sh = game.shift;
  const s = game.state;
  const dish = sh.counter.find((d) => d.uid === dishUid);
  const c = sh.customers.find((x) => x.uid === customerUid);
  if (!dish) return false;
  if (!c || c.state !== 'seated') {
    emit('toast', { icon: '👆', text: 'Pick a hungry monster first — tap them or their order ticket.' });
    sfx('error');
    return false;
  }
  sh.counter = sh.counter.filter((d) => d.uid !== dishUid);

  const result = evaluateDish(dish, c);
  const payout = computePayout(c, dish, result, sh.ctx);
  let { pay, tip } = payout;

  // The tiny angry ghost eats the tips
  let ghostAte = 0;
  if (sh.ghost && tip > 0) { ghostAte = tip; tip = 0; sh.summary.ghostAte += ghostAte; }

  addCoins(pay + tip);
  sh.summary.coins += pay;
  sh.summary.tips += tip;
  s.stats.coinsEarned += pay + tip;
  s.stats.tipsEarned += tip;
  if (payout.trinket && tip) sh.summary.trinkets.push(payout.trinket);

  // Stats
  s.stats.served++;
  sh.summary.served++;
  s.stats[result.reaction]++;
  sh.summary[result.reaction]++;
  if (result.reaction === 'onfire') s.bestiary[c.species].sawFire = true;
  addRep(repDelta(result.reaction, c.isCritic));

  // Learning: the Phrasebook decodes this order's riddle phrases
  const learned = [];
  for (const { phrase, trait } of riddlePhrases(c.order.text)) {
    if (!s.phrasebook[phrase]) { s.phrasebook[phrase] = trait; learned.push(phrase); }
  }

  // Recipe Book: delighting someone saves the combination
  const key = comboKey(dish.ingredients, dish.station);
  const entry = s.recipeBook[key];
  if (result.reaction === 'delighted') {
    if (!entry) emit('toast', { icon: '📖', text: `New recipe saved: ${dish.name}!` });
    s.recipeBook[key] = {
      ingredients: [...dish.ingredients].sort(), station: dish.station, traits: dish.traits.filter((t) => t !== 'cursed' || dish.ingredients.some((i) => DB.ingredients[i].traits.includes('cursed'))),
      name: dish.name, recipeId: dish.recipeId, delighted: (entry?.delighted || 0) + 1, fans: [...new Set([...(entry?.fans || []), c.species])],
    };
    s.bestiary[c.species].delighted++;
  }

  // Seasonal event bonus goal
  const ev = sh.ctx.event;
  if (ev && result.reaction === 'delighted' && dish.traits.includes(ev.goal.trait)) {
    const k = `${ev.id}-${yearOf(sh.night)}`;
    const prog = (s.eventProgress[k] ||= { count: 0, done: false });
    prog.count++;
    if (!prog.done && prog.count >= ev.goal.count) {
      prog.done = true;
      const msgs = applyReward(ev.goal.reward);
      sh.summary.notes.push(`${ev.icon} Event goal complete! ${msgs.join(' ')}`);
      emit('toast', { icon: ev.icon, text: `${ev.name} goal complete! ${msgs.join(' ')}`, big: true });
    }
  }

  // Storyline progress
  let storyText = null;
  if (c.regularId && c.chapter !== null) {
    const reg = DB.regulars[c.regularId];
    const prog = s.regulars[reg.id];
    const ch = reg.chapters[c.chapter];
    if (result.reaction === 'delighted') {
      storyText = ch.success;
      const msgs = applyReward(ch.reward);
      prog.chapter++;
      if (prog.chapter >= reg.chapters.length) { prog.done = true; s.stats.storiesDone++; }
      sh.summary.story.push(`${reg.name}: ${ch.reward?.text || 'The story continues…'}`);
      emit('story', { reg, ch, msgs });
    } else {
      storyText = ch.fail;
    }
  }

  if (c.isCritic) sh.summary.critic = { reaction: result.reaction, dirty: Object.keys(sh.dirty).length };

  // Reaction!
  c.state = result.reaction === 'onfire' ? 'gone-soon' : 'eating';
  c.eatTimer = EAT_MINUTES;
  c.reaction = result.reaction;
  const line = storyText || specialLine(c, result) || reactionLine(c, result.reaction);
  sfx(result.reaction === 'delighted' ? 'happy' : result.reaction === 'onfire' ? 'fire' : result.reaction === 'unimpressed' ? 'meh' : 'sad');
  setTimeout(() => sfx('coin'), 350);

  emit('served', { c, dish, result, pay, tip, ghostAte, trinket: payout.trinket, line, learned });

  if (result.reaction === 'onfire') {
    // They run off flailing; the seat isn't dirty because they never sat back down
    setTimeout(() => {
      if (c.state === 'gone-soon') {
        delete sh.occupied[c.seat.key];
        c.state = 'gone';
        emit('customer:leave', { c, why: 'fire' });
      }
    }, 1600);
  }
  if (sh.selected === c.uid) {
    const next = sh.customers.find((x) => x.state === 'seated' && x.uid !== c.uid);
    sh.selected = next ? next.uid : null;
    emit('order:selected', sh.selected);
  }

  for (const g of checkGoals()) {
    sh.summary.goals.push(g.goal.name);
    emit('goal', g);
  }
  emit('counter');
  return true;
}

/** Monster-specific funny reactions for special cases. */
function specialLine(c, result) {
  if (result.note === 'squid-ink') return 'Is this... cousin Gerald?! Oh dear. Oh dear oh dear. I\'m not angry. Just... so sorry for Gerald.';
  if (result.note === 'garlic' && c.species === 'vampire') return 'GARLIC?! In MY dinner?! *hisses* How DARE— ...actually, it smells kind of... no. NO. Take it away!';
  if (result.note === 'noDragonfire') return 'Tasty, but I SAID to use MY fire! *sulky smoke ring*';
  if (result.note === 'missingIngredient') return 'Good… but not quite the flavour I was hoping for.';
  if (c.species === 'mummy' && result.reaction === 'delighted') return pick(['Splendid! Only SLIGHTLY too spicy.', 'Mmm. Very nearly not spicy. Lovely.']);
  return null;
}

export function cleanSeat(key) {
  const sh = game.shift;
  if (!sh.dirty[key] && sh.dirty[key] !== 0) return;
  delete sh.dirty[key];
  sfx('clean');
  emit('seat:clean', key);
}

/** Tickle the dragon's nose: six tickles and they sneeze fire onto the grill. */
export function tickleDragon() {
  const sh = game.shift;
  if (sh.dragonfire) return;
  sh.tickles++;
  sfx('pop');
  if (sh.tickles >= 6) {
    sh.tickles = 0;
    sh.dragonfire = true;
    sfx('sneeze');
    setTimeout(() => sfx('fire'), 300);
    emit('toast', { icon: '🐉', text: 'AH-AH-ACHOOOO! The grill is blazing with dragonfire! Cook their dish on the grill now.', big: true });
  }
  emit('dragon:tickle', sh.tickles);
}

export function shooGhost() {
  const sh = game.shift;
  emit('ghost:poke', pick(['MINE! ALL MINE!', 'Nom nom tips.', 'You can\'t shoo me! I\'m a GHOST!', '*blows raspberry*', 'Go cook something.']));
  sfx('ghost');
  if (chance(0.08)) { sh.ghost = false; emit('ghost:gone'); emit('toast', { icon: '👻', text: 'The tiny ghost got bored and floated off!' }); }
}

export function setPaused(p) {
  if (!game.shift) return;
  game.shift.paused = p;
  emit('pause', p);
}

/** After closing time, send the stragglers home politely. */
export function closeUp() {
  const sh = game.shift;
  if (!sh.closing) return;
  for (const c of sh.customers) if (c.state !== 'gone') { c.state = 'gone'; emit('customer:leave', { c, why: 'closing' }); }
  sh.customers = [];
  endShift();
}

/** The player abandons the night (from the menu). Nothing is saved. */
export function abandonShift() {
  const sh = game.shift;
  if (!sh) return;
  sh.ended = true;
  cancelAnimationFrame(rafId);
  game.shift = null;
}

// ---------- Ending the night ----------
function endShift() {
  const sh = game.shift;
  const s = game.state;
  if (sh.ended) return;
  sh.ended = true;
  cancelAnimationFrame(rafId);
  const sum = sh.summary;

  // Food critic review
  if (sum.critic) sum.critic = writeReview(sum.critic);

  // Wages and helper quirks
  const wages = nightlyWages();
  if (wages) { addCoins(-wages); sum.wages = wages; }
  if (s.helpers.includes('mimic-host')) {
    const stocked = Object.keys(s.pantry).filter((id) => s.pantry[id] > 0);
    if (stocked.length) {
      const id = pick(stocked);
      s.pantry[id]--;
      sum.notes.push(`Chesty the mimic ate a ${DB.ingredients[id].name}. Chesty is not sorry.`);
    }
  }
  if (sum.ghostAte) sum.notes.push(`👻 The tiny angry ghost ate ${sum.ghostAte} coins of tips.`);
  if (sum.trinkets.length) sum.notes.push(`Strange tips received: ${[...new Set(sum.trinkets)].slice(0, 3).join(', ')}.`);

  s.stats.bestNight = Math.max(s.stats.bestNight, sum.served);
  s.stats.nightsPlayed++;
  if (s.night === 0) s.tutorialDone = true;
  s.night++;
  sum.repDelta = s.rep - sum.rep0;
  sum.unlocks = refreshUnlocks();
  for (const g of checkGoals()) sum.goals.push(g.goal.name);
  s.lastSummary = sum;
  saveGame();
  game.shift = null;
  emit('shift:end', sum);
}

function writeReview(info) {
  const s = game.state;
  const base = { delighted: 4, unimpressed: 3, confused: 2, onfire: 2, walkout: 1 }[info.reaction] || 2;
  const spook = spookiness(s);
  let stars = base + (spook >= 25 ? 1 : spook >= 12 ? 0.5 : 0) + (s.theme !== 'diner' ? 0.5 : 0) - (info.dirty > 2 ? 0.5 : 0);
  stars = clamp(Math.round(stars), 1, 5);
  const K = DB.critic;
  const review = { night: s.night, stars, headline: pick(K.headlines[stars]), body: K.bodies[stars], reaction: info.reaction };
  const delta = (stars - 3) * 0.15;
  addRep(delta);
  review.repDelta = delta;
  s.reviews.push(review);
  return review;
}
