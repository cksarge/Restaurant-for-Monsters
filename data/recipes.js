/**
 * STATIONS, SIGNATURE RECIPES and BACKFIRES
 *
 * Cooking rules:
 *   dish traits = (union of ingredient traits) + station.adds − station.removes
 *
 * SIGNATURE RECIPES are exact combinations (ingredients + station) that get a
 * special name and a coin bonus. Ingredient order doesn't matter.
 *   secret: true → hidden in the Recipe Book until a storyline reveals it.
 *
 * BACKFIRES trigger when a combination meets a condition. They're
 * deterministic, so players can learn (and avoid… or exploit) them.
 *   when.counts    { trait: n } — at least n of the chosen INGREDIENTS carry that trait
 *   when.station   only at this station
 *   effect         handled in js/cooking.js → applyBackfire()
 */
export const STATIONS = [
  { id: 'cauldron',  name: 'Cauldron',       icon: '🫕', adds: ['soupy'], removes: [],                 time: 14, start: true,
    desc: 'Bubble bubble. Turns anything into soup.' },
  { id: 'grill',     name: 'Grill',          icon: '🔥', adds: ['smoky'], removes: ['cold'],           time: 10, start: true,
    desc: 'Adds smoky char. Melts away cold.' },
  { id: 'freezer',   name: 'Freezer',        icon: '🧊', adds: ['cold'],  removes: ['spicy', 'smoky'], time: 12,
    desc: 'Makes things cold. Cancels spicy and smoky.' },
  { id: 'lightning', name: 'Lightning Oven', icon: '⚡', adds: ['zappy'], removes: [],                 time: 6,
    desc: 'IT\'S ALIVE! Adds zap. Very fast. Slightly unsafe.' },
];

export const RECIPES = [
  { id: 'disappointment-soup', name: 'Soup of Mild Disappointment', ingredients: ['bog-water', 'rain-cloud'], station: 'cauldron', bonus: 6 },
  { id: 'screaming-crunch',    name: 'Screaming Bat Crunch',        ingredients: ['screaming-carrot', 'bat-wings'], station: 'grill', bonus: 6 },
  { id: 'eyeball-pops',        name: 'Frozen Eyeball Pops',         ingredients: ['eyeball-grapes', 'sugar-skull'], station: 'freezer', bonus: 7 },
  { id: 'glow-stew',           name: 'Glow-in-the-Dark Stew',       ingredients: ['glowshroom', 'bog-water'], station: 'cauldron', bonus: 6 },
  { id: 'haunted-wings',       name: 'Haunted Hot Wings',           ingredients: ['ghost-pepper', 'bat-wings'], station: 'grill', bonus: 7 },
  { id: 'skull-brulee',        name: 'Electric Sugar Skull Brûlée', ingredients: ['sugar-skull', 'glowshroom'], station: 'lightning', bonus: 9 },
  { id: 'cursed-grilled-cheese', name: 'Cursed Grilled Cheese',     ingredients: ['cursed-cheese', 'fossil-bread'], station: 'grill', bonus: 9 },
  { id: 'thunder-smoothie',    name: 'Thunderstorm Smoothie',       ingredients: ['thunder-berries', 'moon-milk'], station: 'freezer', bonus: 9 },
  { id: 'tear-chowder',        name: 'Chowder of Tears',            ingredients: ['sea-tears', 'kelp-noodles'], station: 'cauldron', bonus: 9 },
  { id: 'lava-cake',           name: 'Molten (Actual Lava) Cake',   ingredients: ['lava-rocks', 'sugar-skull'], station: 'grill', bonus: 10 },
  { id: 'pixie-pop',           name: 'Pixie Popsicle',              ingredients: ['pixie-dust', 'frostmint'], station: 'freezer', bonus: 9 },
  { id: 'sobbing-onion',       name: 'Sobbing Onion Soup',          ingredients: ['swamp-onion', 'rain-cloud'], station: 'cauldron', bonus: 7 },
  { id: 'beetle-brittle',      name: 'Glitter Beetle Brittle',      ingredients: ['glitter-beetle', 'sugar-skull'], station: 'grill', bonus: 10 },
  { id: 'remembering-loaf',    name: 'The Loaf That Remembers',     ingredients: ['fossil-bread', 'wailing-wheat'], station: 'lightning', bonus: 11 },
  { id: 'ecto-jello',          name: 'Ecto-Jello',                  ingredients: ['ectoplasm', 'slime-jelly'], station: 'freezer', bonus: 11 },
  { id: 'forbidden-knots',     name: 'Forbidden Garlic Knots',      ingredients: ['garlic', 'fossil-bread'], station: 'grill', bonus: 9 },
  { id: 'ink-pasta',           name: 'Midnight Ink Pasta',          ingredients: ['squid-ink', 'kelp-noodles'], station: 'cauldron', bonus: 10 },
  { id: 'shocking-pudding',    name: 'Shocking Pudding',            ingredients: ['bottled-lightning', 'grave-pudding'], station: 'lightning', bonus: 12 },
  { id: 'hexcellent-omelette', name: 'Hex-cellent Omelette',        ingredients: ['hex-egg', 'glowshroom'], station: 'grill', bonus: 9 },
  { id: 'cheese-fondue',       name: 'Fon-DOOM Fondue',             ingredients: ['cursed-cheese', 'swamp-onion'], station: 'cauldron', bonus: 9 },
  { id: 'dandruff-chili',      name: 'Five-Alarm Dandruff Chili',   ingredients: ['dragon-dandruff', 'ghost-pepper'], station: 'cauldron', bonus: 12 },
  { id: 'zombie-zinger',       name: 'Zinging Eyeball Fizz',        ingredients: ['eyeball-grapes', 'thunder-berries'], station: 'lightning', bonus: 9 },
  { id: 'bloom-salad',         name: 'Bog Bloom Salad',             ingredients: ['bog-blossom', 'slime-jelly'], station: 'freezer', bonus: 12 },
  { id: 'smores-of-doom',      name: "S'mores of Mild Doom",        ingredients: ['midnight-mallow', 'sugar-skull'], station: 'grill', bonus: 12 },
  { id: 'screaming-pie',       name: 'Screaming Pumpkin Pie',       ingredients: ['pumpkin-guts', 'screaming-carrot'], station: 'grill', bonus: 12 },
  { id: 'avalanche-sundae',    name: 'Avalanche Sundae',            ingredients: ['avalanche-snow', 'moon-milk'], station: 'freezer', bonus: 12 },
  { id: 'mildred-gloom-soup',  name: "Great-Aunt Mildred's Gloom Soup", ingredients: ['bog-water', 'rain-cloud', 'sea-tears'], station: 'cauldron', bonus: 25, secret: true },
];

export const BACKFIRES = [
  { id: 'angry-ghost', name: 'Tiny Angry Ghost', icon: '👻',
    when: { counts: { cursed: 2 } }, effect: 'ghostTips',
    text: 'Two curses collide! A tiny, furious ghost pops out of the pot and starts eating your tips for the rest of the night.' },
  { id: 'sonic-boom', name: 'Sonic Boom', icon: '💥',
    when: { station: 'lightning', counts: { loud: 2 } }, effect: 'patienceDown',
    text: 'KA-BLAMMO! The lightning oven amplifies the screaming. Everyone\'s hair stands on end (even the bald ones).' },
  { id: 'stink-cloud', name: 'The Stink Cloud', icon: '🤢',
    when: { station: 'grill', counts: { stinky: 2 } }, effect: 'stinkCloud',
    text: 'A green stink cloud rolls into the dining room. The swamp creatures applaud. Nobody else does.' },
  { id: 'disco', name: 'Spontaneous Disco', icon: '🪩',
    when: { station: 'lightning', counts: { sparkly: 2 } }, effect: 'patienceUp',
    text: 'The sparkles go critical. A disco ball forms out of nowhere. Everyone is in a GREAT mood.' },
  { id: 'grease-volcano', name: 'Grill Volcano', icon: '🌋',
    when: { station: 'grill', counts: { spicy: 2 } }, effect: { breakStation: 'grill', minutes: 45 },
    text: 'The grill has become a small, enthusiastic volcano. It needs a little lie-down.' },
  { id: 'freezer-freeze', name: 'Freezer Freezes Itself', icon: '🥶',
    when: { station: 'freezer', counts: { cold: 2 } }, effect: { breakStation: 'freezer', minutes: 40 },
    text: 'Too much cold! The freezer has frozen ITSELF. It\'ll thaw in a bit.' },
  { id: 'slime-overflow', name: 'Slime Tsunami', icon: '🌊',
    when: { station: 'cauldron', counts: { slimy: 3 } }, effect: { coins: -6 },
    text: 'The cauldron overflows with slime. You spend 6 coins on mops. The slime monsters ask if they can swim in it.' },
  { id: 'time-warp', name: 'Tiny Time Warp', icon: '🌀',
    when: { counts: { ancient: 2 } }, effect: { clock: -20 },
    text: 'Too much ancientness in one pot! Time hiccups backwards by 20 minutes. Your watch is very confused.' },
];
