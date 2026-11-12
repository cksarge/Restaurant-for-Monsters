/**
 * ECONOMY & PROGRESSION — shop, upgrades, staff, spookiness, unlocks, goals.
 */
import { DB, itemDef } from './db.js';
import { game, addCoins, addRep, emit } from './state.js';
import { seasonalOn } from './calendar.js';

// ---------- Spookiness ----------
export function spookiness(state = game.state) {
  let total = DB.themes[state.theme]?.spook || 0;
  for (const p of state.placed) total += itemDef(p.id)?.spook || 0;
  for (const id of state.helpers) total += DB.helpers[id]?.effects?.spook || 0;
  state._spookCache = total;
  return total;
}

/** Combined numeric modifiers from upgrades, helpers and decorations. */
export function modifiers(state = game.state) {
  const m = { queuePatience: 1, patienceMult: 1, tipMult: 1, cookMult: {}, cookSpeed: 1, counterSlots: 3, autoClean: 0, hintTrait: false, decorPatience: 0, decorTip: 0 };
  for (const id of state.upgrades) {
    const e = DB.upgrades[id]?.effects || {};
    if (e.queuePatience) m.queuePatience *= e.queuePatience;
    if (e.tipMult) m.tipMult *= e.tipMult;
    if (e.counterSlots) m.counterSlots = Math.max(m.counterSlots, e.counterSlots);
    for (const [st, k] of Object.entries(e.cookMult || {})) m.cookMult[st] = (m.cookMult[st] || 1) * k;
  }
  for (const id of state.helpers) {
    const e = DB.helpers[id]?.effects || {};
    if (e.queuePatience) m.queuePatience *= e.queuePatience;
    if (e.patienceMult) m.patienceMult *= e.patienceMult;
    if (e.tipMult) m.tipMult *= e.tipMult;
    if (e.cookSpeed) m.cookSpeed *= e.cookSpeed;
    if (e.autoClean) m.autoClean = e.autoClean;
    if (e.hintTrait) m.hintTrait = true;
  }
  for (const p of state.placed) {
    const d = DB.decor[p.id];
    if (!d) continue;
    m.decorPatience += d.patienceBonus || 0;
    m.decorTip += d.tipBonus || 0;
  }
  return m;
}

// ---------- Unlocks ----------
/**
 * Called at the start of each day: anything whose reputation requirement is
 * now met becomes available, and seasonal event items get unlocked when their
 * event is running.
 */
export function refreshUnlocks(state = game.state) {
  const news = [];
  for (const ing of DB.ingredientList) {
    if (ing.rep !== undefined && state.rep >= ing.rep && !state.unlockedIngredients.includes(ing.id)) {
      state.unlockedIngredients.push(ing.id);
      news.push(`${ing.emoji} ${ing.name} is now sold at the Market!`);
    }
  }
  for (const item of [...DB.furnitureList, ...DB.decorList]) {
    if (item.rep !== undefined && state.rep >= item.rep && !state.unlockedItems.includes(item.id)) {
      state.unlockedItems.push(item.id);
      news.push(`🛠️ ${item.name} is now available in Build Mode!`);
    }
  }
  const ev = seasonalOn(state.night);
  if (ev) {
    for (const id of [...ev.furniture, ...ev.decorations]) {
      if (!state.unlockedItems.includes(id)) {
        state.unlockedItems.push(id);
        news.push(`${ev.icon} Seasonal item unlocked: ${itemDef(id).name}`);
      }
    }
  }
  return news;
}

/** Ingredients shown in the Market right now. */
export function marketIngredients(state = game.state) {
  const ev = seasonalOn(state.night);
  return DB.ingredientList.filter((ing) => {
    if (ing.event) return ev?.id === ing.event;
    return state.unlockedIngredients.includes(ing.id);
  });
}

/** Ingredients that are still locked (shown greyed-out as a teaser). */
export function lockedIngredients(state = game.state) {
  return DB.ingredientList.filter((ing) => !ing.event && !state.unlockedIngredients.includes(ing.id));
}

export function unlockIngredient(id, state = game.state) {
  if (!state.unlockedIngredients.includes(id)) state.unlockedIngredients.push(id);
}
export function unlockItem(id, state = game.state) {
  if (!state.unlockedItems.includes(id)) state.unlockedItems.push(id);
}

// ---------- Buying ----------
export function buyIngredient(id, qty = 1) {
  const s = game.state;
  const ing = DB.ingredients[id];
  const cost = ing.cost * qty;
  if (s.coins < cost) return false;
  addCoins(-cost);
  s.pantry[id] = (s.pantry[id] || 0) + qty;
  if (ing.event) unlockIngredient(id);
  emit('pantry');
  return true;
}

export function upgradeAvailable(up, state = game.state) {
  return !state.upgrades.includes(up.id) && state.rep >= (up.minRep || 0) && (!up.requires || state.upgrades.includes(up.requires));
}

export function buyUpgrade(id) {
  const s = game.state;
  const up = DB.upgrades[id];
  if (!up || s.upgrades.includes(id) || s.coins < up.cost) return false;
  addCoins(-up.cost);
  s.upgrades.push(id);
  if (up.type === 'station' && !s.stations.includes(id)) s.stations.push(id);
  const room = up.effects?.room;
  if (room) s.rooms[room.id] = { w: room.w, h: room.h };
  emit('upgrade', id);
  return true;
}

export function hireHelper(id) {
  const s = game.state;
  const hp = DB.helpers[id];
  if (!hp || s.helpers.includes(id) || s.helpers.length >= DB.maxHelpers || s.coins < hp.hire) return false;
  addCoins(-hp.hire);
  s.helpers.push(id);
  return true;
}

export function fireHelper(id) {
  const s = game.state;
  s.helpers = s.helpers.filter((h) => h !== id);
}

export const nightlyWages = (state = game.state) => state.helpers.reduce((sum, id) => sum + (DB.helpers[id]?.wage || 0), 0);

// ---------- Rewards ----------
/** Apply a reward bundle (used by goals, storylines and events). Returns a list of messages. */
export function applyReward(reward = {}, state = game.state) {
  const msgs = [];
  if (reward.coins) { addCoins(reward.coins); msgs.push(`+${reward.coins} 🪙`); }
  if (reward.rep) { addRep(reward.rep); msgs.push(`+${reward.rep.toFixed(2)} ⭐`); }
  for (const id of reward.unlockIngredients || []) {
    unlockIngredient(id, state);
    state.pantry[id] = (state.pantry[id] || 0) + 3;
  }
  for (const id of reward.unlockItems || []) unlockItem(id, state);
  for (const id of reward.unlockHelpers || []) if (!state.unlockedHelpers.includes(id)) state.unlockedHelpers.push(id);
  for (const id of reward.unlockRecipes || []) if (!state.revealedSecrets.includes(id)) state.revealedSecrets.push(id);
  if (reward.text) msgs.push(reward.text);
  return msgs;
}

/** Check all goals; returns the ones completed just now. */
export function checkGoals(state = game.state) {
  spookiness(state);
  const done = [];
  for (const g of DB.goals) {
    if (state.goalsDone.includes(g.id)) continue;
    if (g.check(state)) {
      state.goalsDone.push(g.id);
      const msgs = applyReward(g.reward, state);
      done.push({ goal: g, msgs });
    }
  }
  return done;
}
