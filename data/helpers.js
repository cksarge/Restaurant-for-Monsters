/**
 * HELPERS — staff you can hire between shifts. Each has a perk AND a quirk.
 *
 *   hire      one-time hiring fee
 *   wage      coins paid every night they work
 *   effects   numbers read by the game systems:
 *     autoClean       minutes for them to clean a dirty seat by themselves
 *     patienceMult    multiplier on seated customers' patience
 *     queuePatience   multiplier on how long the waiting line will wait
 *     tipMult         multiplier on tips
 *     cookSpeed       multiplier on cooking time (0.7 = 30% faster)
 *     hintTrait       reveal one wanted trait on every order ticket
 *     spook           Spookiness added
 *   quirk     id of a funny downside handled in js/shift.js → applyHelperQuirk()
 *   reward    true = must be unlocked first (e.g. by a storyline)
 */
export const HELPERS = [
  { id: 'zombie-dishwasher', name: 'Morty', role: 'Zombie Dishwasher', hire: 40, wage: 4,
    art: { body: 'tall', color: '#9bb58a', belly: '#c8d9b8', eyes: 2, eyeColor: '#d6e05a', mouth: 'flat', extras: ['stitches', 'apron'], accent: '#e8e2d0' },
    perk: 'Cleans dirty tables by himself. Slowly. Very, very slowly.', quirkText: 'Slow… but never, ever quits.',
    effects: { autoClean: 28 }, quirk: 'slow' },
  { id: 'goblin-waiter', name: 'Snick', role: 'Goblin Waiter', hire: 60, wage: 8,
    art: { body: 'small', color: '#7fb34f', belly: '#b9dc8f', eyes: 2, eyeColor: '#ff3b3b', mouth: 'grin', extras: ['ears-pointy', 'apron'], accent: '#e8e2d0', scale: 0.8 },
    perk: 'Fast and charming: seated customers are 15% more patient.', quirkText: 'Steals fries. Every dish pays 8% less.',
    effects: { patienceMult: 1.15 }, quirk: 'fries' },
  { id: 'witch-souschef', name: 'Hazel', role: 'Witch Sous-Chef', hire: 90, wage: 10,
    art: { body: 'human', color: '#a8d98a', belly: '#2d4a3a', eyes: 2, eyeColor: '#7b2cbf', mouth: 'grin', extras: ['hat-witch', 'hair-long'], accent: '#2d4a3a' },
    perk: 'Reads monster minds: shows one wanted trait on every order.', quirkText: 'Sometimes hexes a dish (adds Cursed). Cackles about it.',
    effects: { hintTrait: true }, quirk: 'hex' },
  { id: 'skeleton-musician', name: 'Rattles', role: 'Skeleton Musician', hire: 70, wage: 6,
    art: { body: 'skeleton', color: '#f4f1e8', belly: '#ffffff', eyes: 2, eyeColor: '#7ad9ff', mouth: 'teeth', extras: ['beret'], accent: '#c0392b' },
    perk: 'Plays the xylo-bone: tips +10% and +5 Spookiness.', quirkText: 'Too loud for mummies and shadows (they lose patience faster).',
    effects: { tipMult: 1.1, spook: 5 }, quirk: 'loud' },
  { id: 'mimic-host', name: 'Chesty', role: 'Mimic Host', hire: 80, wage: 7,
    art: { body: 'wide', color: '#a0522d', belly: '#d4a73a', eyes: 2, eyeColor: '#ffe14d', mouth: 'teeth', extras: ['chest-lid'], accent: '#d4a73a', scale: 0.85 },
    perk: 'Greets the line: waiting customers wait twice as long.', quirkText: 'Eats one random pantry ingredient every night. Not sorry.',
    effects: { queuePatience: 2 }, quirk: 'snack' },
  { id: 'bolt-cook', name: 'Bolt', role: 'Patchwork Line Cook', hire: 0, wage: 9, reward: true,
    art: { body: 'tall', color: '#8fbf8a', belly: '#b9dcb2', eyes: 2, eyeColor: '#2d3a2b', mouth: 'smile', extras: ['bolts', 'stitches', 'chef-hat'], accent: '#ffffff' },
    perk: 'Cooks 30% faster at every station.', quirkText: 'Gets excited and sometimes zaps a dish (adds Zappy).',
    effects: { cookSpeed: 0.7 }, quirk: 'zap' },
];

export const MAX_HELPERS = 3;
