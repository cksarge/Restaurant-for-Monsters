/**
 * COOKING & RECIPES
 *
 * A dish's traits = all its ingredients' traits + the station's `adds`
 * − the station's `removes`. Monsters are judged on whether the dish has the
 * traits their riddle asked for.
 */
import { DB } from './db.js';
import { game } from './state.js';
import { hashStr, uid } from './utils.js';

/** Stable key for an ingredient combination at a station (order-independent). */
export const comboKey = (ings, station) => `${[...ings].sort().join('+')}@${station}`;

/** Compute the traits a combination produces. */
export function dishTraits(ings, stationId, { dragonfire = false } = {}) {
  const st = DB.stations[stationId];
  const set = new Set();
  for (const id of ings) for (const t of DB.ingredients[id]?.traits || []) set.add(t);
  for (const t of st.removes) set.delete(t);
  for (const t of st.adds) set.add(t);
  if (dragonfire) { set.add('spicy'); set.add('smoky'); }
  // Keep a consistent display order (the order in data/traits.js)
  return DB.traitList.map((t) => t.id).filter((t) => set.has(t));
}

/** A signature recipe matching this exact combination, if any. */
export function findRecipe(ings, stationId) {
  const key = [...ings].sort().join('+');
  return DB.recipeList.find((r) => r.station === stationId && [...r.ingredients].sort().join('+') === key) || null;
}

/** First backfire whose conditions this combination meets, if any. */
export function findBackfire(ings, stationId) {
  for (const bf of DB.backfires) {
    if (bf.when.station && bf.when.station !== stationId) continue;
    const ok = Object.entries(bf.when.counts || {}).every(([trait, n]) =>
      ings.filter((id) => DB.ingredients[id]?.traits.includes(trait)).length >= n);
    if (ok) return bf;
  }
  return null;
}

const FORMS = {
  cauldron: ['Stew', 'Soup', 'Broth', 'Chowder', 'Bisque', 'Potage'],
  grill: ['Skewers', 'Steak', 'Toast', 'Burger', 'Kebab', 'Flambé'],
  freezer: ['Pops', 'Sorbet', 'Slushie', 'Parfait', 'Sundae', 'Freeze'],
  lightning: ['Zaplet', 'Soufflé', 'Surprise', 'Crackle', 'Fritter', 'Jolt'],
};
const ADJ = {
  crunchy: 'Crunchy', slimy: 'Slimy', squishy: 'Squishy', cursed: 'Cursed', cold: 'Frosty', spicy: 'Fiery', sweet: 'Sweet',
  sparkly: 'Sparkly', gloomy: 'Gloomy', glowy: 'Glowing', loud: 'Screaming', spooky: 'Haunted', stinky: 'Stinky', salty: 'Briny',
  ancient: 'Ancient', soupy: 'Sloshy', smoky: 'Smoky', zappy: 'Electric',
};

/** Name a dish: signature recipes keep their name, others get a stable silly one. */
export function dishName(ings, stationId, traits, recipe) {
  if (recipe) return recipe.name;
  const h = hashStr(comboKey(ings, stationId));
  const main = DB.ingredients[ings[h % ings.length]];
  const flavour = traits.filter((t) => !DB.stations[stationId].adds.includes(t));
  const adj = flavour.length ? ADJ[flavour[h % flavour.length]] : 'Mystery';
  const form = FORMS[stationId][h % FORMS[stationId].length];
  const noun = main.name.replace(/^(Sour|Screaming|Cursed|Bottled|Midnight|Sea Salt) /, '');
  return `${adj} ${noun} ${form}`;
}

/** Create a finished dish object. */
export function makeDish(ings, stationId, opts = {}) {
  const traits = dishTraits(ings, stationId, opts);
  const recipe = findRecipe(ings, stationId);
  const cost = ings.reduce((sum, id) => sum + (DB.ingredients[id]?.cost || 0), 0);
  return {
    uid: uid('d'),
    ingredients: [...ings],
    station: stationId,
    traits,
    recipeId: recipe?.id || null,
    name: dishName(ings, stationId, traits, recipe),
    value: Math.round(7 + cost * 1.7 + (recipe?.bonus || 0) + traits.length),
    dragonfire: !!opts.dragonfire,
  };
}

// ---------- Feasibility (so orders are always solvable) ----------
const traitBit = Object.fromEntries(DB.traitList.map((t, i) => [t.id, 1 << i]));
export const traitsMask = (traits) => traits.reduce((m, t) => m | (traitBit[t] || 0), 0);

let cacheKey = '';
let cacheMasks = [];

/**
 * Every trait-set (as bitmasks) that can be cooked from these ingredients and
 * stations using 1–3 ingredients. Cached until the inputs change.
 */
export function achievableMasks(ingIds, stations) {
  const key = ingIds.slice().sort().join(',') + '|' + stations.join(',');
  if (key === cacheKey) return cacheMasks;
  const masks = new Set();
  const n = ingIds.length;
  for (const st of stations) {
    for (let a = 0; a < n; a++) {
      masks.add(traitsMask(dishTraits([ingIds[a]], st)));
      for (let b = a + 1; b < n; b++) {
        masks.add(traitsMask(dishTraits([ingIds[a], ingIds[b]], st)));
        for (let c = b + 1; c < n; c++) masks.add(traitsMask(dishTraits([ingIds[a], ingIds[b], ingIds[c]], st)));
      }
    }
  }
  cacheKey = key;
  cacheMasks = [...masks];
  return cacheMasks;
}

/** Can some dish cover all these traits? */
export function canMake(traits, ingIds, stations) {
  const want = traitsMask(traits);
  return achievableMasks(ingIds, stations).some((m) => (m & want) === want);
}

/** Ingredients the player could cook with right now (in stock), or everything unlocked. */
export function kitchenIngredients({ inStockOnly = true } = {}) {
  const s = game.state;
  return s.unlockedIngredients.filter((id) => DB.ingredients[id] && (!inStockOnly || (s.pantry[id] || 0) > 0));
}

// ---------- Judging ----------
const LEVELS = ['confused', 'unimpressed', 'delighted'];
const downgrade = (r) => (r === 'delighted' ? 'unimpressed' : 'confused');

/**
 * How does this customer feel about this dish?
 * Returns { reaction, matched, missing, extra, note }
 */
export function evaluateDish(dish, customer) {
  const monster = DB.monsters[customer.species];
  const want = customer.order.traits;
  const has = new Set(dish.traits);
  const matched = want.filter((t) => has.has(t));
  const missing = want.filter((t) => !has.has(t));
  let note = null;

  // Comically on fire takes priority over everything
  if ((monster.fire || []).some((t) => has.has(t))) return { reaction: 'onfire', matched, missing, note: 'fire' };

  const ratio = want.length ? matched.length / want.length : 1;
  let reaction = ratio >= 1 ? 'delighted' : ratio >= 0.5 ? 'unimpressed' : 'confused';

  if ((monster.dislikes || []).some((t) => has.has(t) && !want.includes(t))) { reaction = downgrade(reaction); note = 'dislike'; }
  const hated = (monster.hatesIngredients || []).find((id) => dish.ingredients.includes(id));
  const forbidden = customer.order.forbidIngredient && dish.ingredients.includes(customer.order.forbidIngredient);
  if ((hated && !customer.order.requireIngredient) || forbidden) { reaction = 'confused'; note = hated || customer.order.forbidIngredient; }
  if (customer.order.requireIngredient && !dish.ingredients.includes(customer.order.requireIngredient) && reaction === 'delighted') { reaction = 'unimpressed'; note = 'missingIngredient'; }
  if (customer.order.special === 'dragonfire' && !dish.dragonfire && reaction === 'delighted') { reaction = 'unimpressed'; note = 'noDragonfire'; }

  return { reaction, matched, missing, note, level: LEVELS.indexOf(reaction) };
}
