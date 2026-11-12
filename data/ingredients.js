/**
 * INGREDIENTS
 *
 * Fields:
 *   id       unique id (used in saves and recipes — don't rename once shipped)
 *   name     display name
 *   emoji    icon shown in the pantry
 *   traits   trait ids from data/traits.js (1–3 is a good number)
 *   cost     coins per unit at the Market
 *   desc     flavour text
 * Unlocking (pick one):
 *   start: true          in the pantry from night one
 *   rep: 1.5             appears in the Market at 1.5★ reputation
 *   reward: true         only unlocked by a goal or a regular's storyline
 *   event: 'event-id'    limited-time: only for sale while that seasonal event runs
 */
export const INGREDIENTS = [
  // ---- Starter pantry (8) ----
  { id: 'bat-wings',        name: 'Bat Wings',        emoji: '🦇', traits: ['crunchy', 'spooky'], cost: 2, start: true, desc: 'Free-range. The bats were thrilled to donate. Mostly.' },
  { id: 'bog-water',        name: 'Bog Water',        emoji: '🫙', traits: ['slimy', 'gloomy'],   cost: 1, start: true, desc: 'Hand-scooped from the finest bog in the valley. Contains at least one tadpole.' },
  { id: 'screaming-carrot', name: 'Screaming Carrot', emoji: '🥕', traits: ['crunchy', 'loud'],   cost: 2, start: true, desc: 'Pulled fresh. It has not stopped screaming since.' },
  { id: 'eyeball-grapes',   name: 'Eyeball Grapes',   emoji: '👁️', traits: ['squishy', 'spooky'], cost: 2, start: true, desc: 'They see everything. They judge nothing. Very supportive grapes.' },
  { id: 'glowshroom',       name: 'Glowshroom',       emoji: '🍄', traits: ['glowy'],             cost: 2, start: true, desc: 'Doubles as a reading lamp.' },
  { id: 'rain-cloud',       name: 'Sour Rain Cloud',  emoji: '🌧️', traits: ['gloomy', 'cold'],    cost: 2, start: true, desc: 'A small personal storm. Sighs a lot.' },
  { id: 'ghost-pepper',     name: 'Ghost Pepper',     emoji: '🌶️', traits: ['spicy', 'spooky'],   cost: 3, start: true, desc: 'An actual ghost lives in it. It is also very hot.' },
  { id: 'sugar-skull',      name: 'Sugar Skull',      emoji: '💀', traits: ['sweet', 'crunchy'],  cost: 2, start: true, desc: 'Smiles at you while you eat it. Supportive, like the grapes.' },

  // ---- Market unlocks by reputation ----
  { id: 'swamp-onion',      name: 'Swamp Onion',      emoji: '🧅', traits: ['stinky', 'gloomy'],  cost: 2, rep: 0.5, desc: 'Makes you cry, then makes you cry harder.' },
  { id: 'sea-tears',        name: 'Sea Salt Tears',   emoji: '🧂', traits: ['salty', 'gloomy'],   cost: 2, rep: 0.5, desc: 'Ethically sourced from a very sentimental mermaid.' },
  { id: 'cursed-cheese',    name: 'Cursed Cheese',    emoji: '🧀', traits: ['stinky', 'cursed'],  cost: 3, rep: 1,   desc: 'Aged in a haunted cellar. The holes are portals. Probably.' },
  { id: 'pixie-dust',       name: 'Pixie Dust',       emoji: '✨', traits: ['sparkly'],           cost: 4, rep: 1,   desc: 'Gets everywhere. You will find it in your socks for weeks.' },
  { id: 'frostmint',        name: 'Frostmint',        emoji: '🌱', traits: ['cold', 'sweet'],     cost: 3, rep: 1,   desc: 'Grown on a glacier by a very patient yeti.' },
  { id: 'garlic',           name: 'Garlic',           emoji: '🧄', traits: ['stinky', 'loud'],    cost: 2, rep: 1,   desc: 'Keep away from vampires. (Or don\'t. Nobody\'s judging.)' },
  { id: 'hex-egg',          name: 'Hex Egg',          emoji: '🥚', traits: ['cursed', 'squishy'], cost: 3, rep: 1.5, desc: 'Laid by a chicken who knows what she did.' },
  { id: 'thunder-berries',  name: 'Thunder Berries',  emoji: '🫐', traits: ['zappy', 'sweet'],    cost: 3, rep: 1.5, desc: 'Picked during a lightning storm by a very brave farmer.' },
  { id: 'squid-ink',        name: 'Squid Ink',        emoji: '🦑', traits: ['salty', 'spooky'],   cost: 3, rep: 1.5, desc: 'Do NOT mention this to the kraken.' },
  { id: 'lava-rocks',       name: 'Lava Rocks',       emoji: '🌋', traits: ['spicy', 'crunchy', 'smoky'], cost: 4, rep: 2, desc: 'Rock candy, but the rock is literal and the candy is not.' },
  { id: 'glitter-beetle',   name: 'Glitter Beetle',   emoji: '🪲', traits: ['crunchy', 'sparkly'], cost: 4, rep: 2,  desc: 'A beetle who really committed to a look.' },
  { id: 'kelp-noodles',     name: 'Kelp Noodles',     emoji: '🌿', traits: ['slimy', 'salty'],    cost: 3, rep: 2,   desc: 'Slurpable seaweed spaghetti from the deep.' },
  { id: 'wailing-wheat',    name: 'Wailing Wheat',    emoji: '🌾', traits: ['loud', 'ancient'],   cost: 3, rep: 2.5, desc: 'An heirloom grain that has been complaining since the Bronze Age.' },
  { id: 'ectoplasm',        name: 'Ectoplasm',        emoji: '🫧', traits: ['spooky', 'slimy', 'glowy'], cost: 4, rep: 2.5, desc: 'Ghost goo. Ask the ghosts politely before collecting.' },
  { id: 'grave-pudding',    name: 'Grave Dirt Pudding', emoji: '🍫', traits: ['squishy', 'gloomy', 'sweet'], cost: 3, rep: 3, desc: 'It is chocolate. We promise. (It is mostly chocolate.)' },
  { id: 'mummy-dust',       name: 'Mummy Dust',       emoji: '⏳', traits: ['ancient', 'cursed'], cost: 4, rep: 3,   desc: 'Swept up after Pharaoh Nebby\'s last visit. He did not ask for it back.' },
  { id: 'bottled-lightning',name: 'Bottled Lightning',emoji: '🧪', traits: ['zappy', 'loud', 'glowy'], cost: 5, rep: 3, desc: 'Shake well. Then run.' },
  { id: 'dragon-dandruff',  name: 'Dragon Dandruff',  emoji: '🔥', traits: ['spicy', 'sparkly'],  cost: 5, rep: 3.5, desc: 'Collected from a very embarrassed dragon\'s shoulders.' },

  // ---- Reward-only (goals / storylines) ----
  { id: 'slime-jelly',      name: 'Slime Jelly',      emoji: '🍮', traits: ['slimy', 'squishy', 'sweet'], cost: 3, reward: true, desc: 'Wobbles hello. Wobbles goodbye.' },
  { id: 'moon-milk',        name: 'Moon Milk',        emoji: '🥛', traits: ['glowy', 'sweet'],    cost: 3, reward: true, desc: 'Milked from the moon. Don\'t ask how. The moon doesn\'t like to talk about it.' },
  { id: 'fossil-bread',     name: 'Fossil Bread',     emoji: '🍞', traits: ['ancient', 'crunchy'], cost: 3, reward: true, desc: 'Baked in 3000 BC. Best before: also 3000 BC.' },

  // ---- Limited-time seasonal ingredients ----
  { id: 'bog-blossom',      name: 'Bog Blossom',      emoji: '🌸', traits: ['sweet', 'sparkly', 'slimy'], cost: 3, event: 'swamp-bloom',     desc: 'Blooms once a year in the swamp. Smells like strawberries and regret.' },
  { id: 'midnight-mallow',  name: 'Midnight Marshmallow', emoji: '🍡', traits: ['sweet', 'squishy', 'smoky'], cost: 3, event: 'midnight-picnic', desc: 'Pre-toasted under a midnight moon.' },
  { id: 'pumpkin-guts',     name: 'Pumpkin Guts',     emoji: '🎃', traits: ['squishy', 'sweet', 'spooky'], cost: 3, event: 'harvest-moon',  desc: 'Scooped from a jack-o\'-lantern who volunteered. Enthusiastically.' },
  { id: 'avalanche-snow',   name: 'Avalanche Snow',   emoji: '🏔️', traits: ['cold', 'crunchy', 'sparkly'], cost: 3, event: 'frost-fright', desc: 'Freshly fallen from a very dramatic mountain.' },
];
