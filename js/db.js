/**
 * DB — one place that imports every data file and indexes it by id.
 * Game logic should read content from here, never hard-code it.
 */
import { TRAITS } from '../data/traits.js';
import { TRAIT_PHRASES, DISH_HEADS, ORDER_FRAMES } from '../data/riddles.js';
import { INGREDIENTS } from '../data/ingredients.js';
import { STATIONS, RECIPES, BACKFIRES } from '../data/recipes.js';
import { MONSTERS, GENERIC_LINES } from '../data/monsters.js';
import { REGULARS } from '../data/regulars.js';
import { FURNITURE } from '../data/furniture.js';
import { DECORATIONS } from '../data/decorations.js';
import { THEMES, WALLPAPERS, FLOORS, LIGHTS, SIGN_STYLES, ROOMS } from '../data/themes.js';
import { CALENDAR, MOON_PHASES, SEASONAL_EVENTS, RUSHES, INSPECTOR, CRITIC, RUMOR_WHO } from '../data/events.js';
import { HELPERS, MAX_HELPERS } from '../data/helpers.js';
import { UPGRADES } from '../data/upgrades.js';
import { GOALS } from '../data/goals.js';

const byId = (arr) => Object.fromEntries(arr.map((x) => [x.id, x]));

export const DB = {
  traits: byId(TRAITS), traitList: TRAITS,
  phrases: TRAIT_PHRASES, dishHeads: DISH_HEADS, orderFrames: ORDER_FRAMES,
  ingredients: byId(INGREDIENTS), ingredientList: INGREDIENTS,
  stations: byId(STATIONS), stationList: STATIONS,
  recipes: byId(RECIPES), recipeList: RECIPES,
  backfires: BACKFIRES,
  monsters: byId(MONSTERS), monsterList: MONSTERS, genericLines: GENERIC_LINES,
  regulars: byId(REGULARS), regularList: REGULARS,
  furniture: byId(FURNITURE), furnitureList: FURNITURE,
  decor: byId(DECORATIONS), decorList: DECORATIONS,
  themes: byId(THEMES), themeList: THEMES,
  wallpapers: byId(WALLPAPERS), wallpaperList: WALLPAPERS,
  floors: byId(FLOORS), floorList: FLOORS,
  lights: LIGHTS, signStyles: SIGN_STYLES,
  rooms: byId(ROOMS), roomList: ROOMS,
  calendar: CALENDAR, moons: MOON_PHASES,
  seasonal: byId(SEASONAL_EVENTS), seasonalList: SEASONAL_EVENTS,
  rushes: RUSHES, inspector: INSPECTOR, critic: CRITIC, rumorWho: RUMOR_WHO,
  helpers: byId(HELPERS), helperList: HELPERS, maxHelpers: MAX_HELPERS,
  upgrades: byId(UPGRADES), upgradeList: UPGRADES,
  goals: GOALS,
};

/** Look up a placeable item (furniture or decoration) by id. */
export function itemDef(id) {
  return DB.furniture[id] || DB.decor[id] || null;
}

/** Quick sanity check so typos in data files show up in the console. */
export function validateData() {
  const problems = [];
  for (const ing of INGREDIENTS) for (const t of ing.traits) if (!DB.traits[t]) problems.push(`Ingredient ${ing.id}: unknown trait ${t}`);
  for (const r of RECIPES) for (const i of r.ingredients) if (!DB.ingredients[i]) problems.push(`Recipe ${r.id}: unknown ingredient ${i}`);
  for (const m of MONSTERS) for (const t of [...m.likes, ...m.dislikes, ...m.fire]) if (!DB.traits[t]) problems.push(`Monster ${m.id}: unknown trait ${t}`);
  for (const reg of REGULARS) if (!DB.monsters[reg.species]) problems.push(`Regular ${reg.id}: unknown species ${reg.species}`);
  for (const t of TRAITS) if (!TRAIT_PHRASES[t.id]) problems.push(`Trait ${t.id} has no riddle phrases`);
  if (problems.length) console.warn('[Restaurant for Monsters] Data problems:\n' + problems.join('\n'));
  return problems;
}
