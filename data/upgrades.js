/**
 * UPGRADES — one-time purchases between shifts.
 *
 *   type 'station'    unlocks a cooking station (id must match data/recipes.js STATIONS)
 *   type 'kitchen'    tweaks numbers (see effects)
 *   type 'expansion'  more floor space (room ids match data/themes.js ROOMS)
 *
 * effects:
 *   cookMult: { stationId: multiplier }   faster cooking
 *   queuePatience / tipMult / counterSlots
 *   room: { id, w, h }                    unlocks or resizes a room
 */
export const UPGRADES = [
  { id: 'freezer', type: 'station', name: 'Haunted Freezer', icon: '🧊', cost: 90, minRep: 0.5,
    desc: 'Unlocks the Freezer station: adds Cold, removes Spicy and Smoky. Hums a spooky tune.' },
  { id: 'lightning', type: 'station', name: 'Lightning Oven', icon: '⚡', cost: 170, minRep: 1.5,
    desc: 'Unlocks the Lightning Oven: adds Zappy and cooks super fast. IT\'S ALIVE!' },
  { id: 'turbo-bubbler', type: 'kitchen', name: 'Turbo Bubbler', icon: '🫧', cost: 60, minRep: 0.5,
    desc: 'The cauldron cooks 35% faster.', effects: { cookMult: { cauldron: 0.65 } } },
  { id: 'dragon-bellows', type: 'kitchen', name: 'Dragon-Lung Bellows', icon: '🌬️', cost: 60, minRep: 1,
    desc: 'The grill cooks 35% faster.', effects: { cookMult: { grill: 0.65 } } },
  { id: 'frost-fan', type: 'kitchen', name: 'Yeti-Breath Fan', icon: '🌀', cost: 70, minRep: 1.5, requires: 'freezer',
    desc: 'The freezer cooks 35% faster.', effects: { cookMult: { freezer: 0.65 } } },
  { id: 'soothing-bell', type: 'kitchen', name: 'Soothing Doorbell', icon: '🔔', cost: 50, minRep: 0,
    desc: 'Plays a lullaby. The waiting line waits 30% longer.', effects: { queuePatience: 1.3 } },
  { id: 'big-counter', type: 'kitchen', name: 'Bigger Serving Counter', icon: '🍽️', cost: 45, minRep: 0,
    desc: 'Hold 5 finished dishes instead of 3.', effects: { counterSlots: 5 } },
  { id: 'googly-jar', type: 'kitchen', name: 'Googly-Eyed Tip Jar', icon: '🫙', cost: 80, minRep: 1,
    desc: 'Monsters feel watched. Tips +10%.', effects: { tipMult: 1.1 } },
  { id: 'expand-main', type: 'expansion', name: 'Knock Down a Wall', icon: '🔨', cost: 200, minRep: 1.5,
    desc: 'Expand the Dining Room from 6×5 to 8×6 tiles.', effects: { room: { id: 'main', w: 8, h: 6 } } },
  { id: 'back-room', type: 'expansion', name: 'Open the Back Room', icon: '🚪', cost: 350, minRep: 2.5,
    desc: 'Clear out Great-Aunt Mildred\'s storage room for a second 6×5 dining room.', effects: { room: { id: 'back', w: 6, h: 5 } } },
  { id: 'patio', type: 'expansion', name: 'Graveyard Patio', icon: '🪦', cost: 500, minRep: 3.5,
    desc: 'An outdoor patio among the (friendly) graves. Ghosts, skeletons and banshees love sitting outside.', effects: { room: { id: 'patio', w: 7, h: 4 } } },
];
