/**
 * GOALS & MILESTONES — checked after every served dish and every shift.
 *
 *   check(state)  → true when the goal is complete. `state.stats` holds the counters
 *                   (see js/state.js → newGameState for the full list).
 *   progress(state) → [current, target] for the progress bar (optional)
 *   reward        { coins, rep, unlockIngredients, unlockItems, text }
 */
const spook = (s) => s._spookCache || 0;

export const GOALS = [
  { id: 'first-delight', name: 'First Happy Customer', desc: 'Delight a monster.',
    progress: (s) => [s.stats.delighted, 1], check: (s) => s.stats.delighted >= 1,
    reward: { coins: 20 } },
  { id: 'serve-10', name: 'Getting the Hang of It', desc: 'Serve 10 dishes.',
    progress: (s) => [s.stats.served, 10], check: (s) => s.stats.served >= 10,
    reward: { coins: 25, unlockIngredients: ['slime-jelly'], text: 'Slime Jelly is now in the Market!' } },
  { id: 'recipes-3', name: 'Recipe Rookie', desc: 'Discover 3 Signature Recipes.',
    progress: (s) => [s.stats.namedFound, 3], check: (s) => s.stats.namedFound >= 3,
    reward: { coins: 30, unlockIngredients: ['moon-milk'], text: 'Moon Milk is now in the Market!' } },
  { id: 'first-backfire', name: 'Oops!', desc: 'Cause a kitchen backfire.',
    progress: (s) => [s.stats.backfires, 1], check: (s) => s.stats.backfires >= 1,
    reward: { coins: 15, text: 'Every great chef has set something on fire. Or summoned something.' } },
  { id: 'on-fire', name: 'Too Hot to Handle', desc: 'Set a customer (comically) on fire.',
    progress: (s) => [s.stats.onfire, 1], check: (s) => s.stats.onfire >= 1,
    reward: { coins: 10, text: 'They\'re fine! They\'re totally fine.' } },
  { id: 'week-1', name: 'Survived the First Week', desc: 'Finish 7 nights.',
    progress: (s) => [s.night, 7], check: (s) => s.night >= 7,
    reward: { coins: 60, unlockItems: ['haunted-portrait'], text: 'The Haunted Portrait is now available in Build Mode!' } },
  { id: 'delight-25', name: 'Crowd Pleaser', desc: 'Delight 25 monsters.',
    progress: (s) => [s.stats.delighted, 25], check: (s) => s.stats.delighted >= 25,
    reward: { coins: 60, unlockItems: ['fog-machine'], text: 'The Fog Machine is now available in Build Mode!' } },
  { id: 'spook-20', name: 'Properly Spooky', desc: 'Reach 20 Spookiness.',
    progress: (s) => [spook(s), 20], check: (s) => spook(s) >= 20,
    reward: { coins: 50, rep: 0.1 } },
  { id: 'bestiary-8', name: 'Monster Expert', desc: 'Meet 8 different kinds of monster.',
    progress: (s) => [Object.keys(s.bestiary).length, 8], check: (s) => Object.keys(s.bestiary).length >= 8,
    reward: { coins: 70 } },
  { id: 'recipes-10', name: 'Recipe Wizard', desc: 'Discover 10 Signature Recipes.',
    progress: (s) => [s.stats.namedFound, 10], check: (s) => s.stats.namedFound >= 10,
    reward: { coins: 120, rep: 0.15 } },
  { id: 'full-house', name: 'Full House', desc: 'Serve 12 dishes in a single night.',
    progress: (s) => [s.stats.bestNight, 12], check: (s) => s.stats.bestNight >= 12,
    reward: { coins: 80 } },
  { id: 'inspection', name: 'Totally Normal Restaurant', desc: 'Pass a health inspection.',
    progress: (s) => [s.stats.inspectionsPassed, 1], check: (s) => s.stats.inspectionsPassed >= 1,
    reward: { coins: 50 } },
  { id: 'story-1', name: 'Part of the Family', desc: 'Complete a regular\'s storyline.',
    progress: (s) => [s.stats.storiesDone, 1], check: (s) => s.stats.storiesDone >= 1,
    reward: { coins: 80, rep: 0.1 } },
  { id: 'rep-3', name: 'Three-Star Diner', desc: 'Reach 3★ reputation.',
    progress: (s) => [Math.floor(s.rep * 10) / 10, 3], check: (s) => s.rep >= 3,
    reward: { coins: 150 } },
  { id: 'rich', name: 'Dragon\'s Hoard', desc: 'Hold 600 coins at once.',
    progress: (s) => [s.coins, 600], check: (s) => s.coins >= 600,
    reward: { rep: 0.1, text: 'A dragon nods at you approvingly from across the street.' } },
  { id: 'all-stories', name: 'Everyone\'s Favourite', desc: 'Complete all 6 regulars\' storylines.',
    progress: (s) => [s.stats.storiesDone, 6], check: (s) => s.stats.storiesDone >= 6,
    reward: { coins: 300, rep: 0.3 } },
];
