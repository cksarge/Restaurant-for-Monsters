/**
 * DECORATIONS — 1×1 items that make the restaurant spookier (and attract fans).
 *
 * Fields:
 *   spook        Spookiness added (some monsters only visit above a Spookiness level)
 *   loves        species who visit more often and are more patient while it's placed
 *   tipBonus     extra tip multiplier for everyone (e.g. 0.05 = +5%)
 *   patienceBonus extra patience for everyone (e.g. 0.05 = +5%)
 *   art          sprite name in js/ui/sprites.js → decorSVG()
 *   anim         CSS idle animation: 'flicker' | 'sway' | 'bob' | 'eyes' | 'fog' | 'swim' | 'spin' | 'pulse'
 * Unlocking:  start: true | rep: n | reward: true | event: 'event-id' | goal (set reward: true)
 */
export const DECORATIONS = [
  { id: 'jack-o-lantern', name: "Jack-o'-Lantern", cost: 15, spook: 3, start: true, art: 'pumpkin', anim: 'flicker',
    loves: ['skeleton', 'pumpkin-head', 'imp'], desc: 'Grins at guests. Guests grin back. Mostly.' },
  { id: 'candelabra', name: 'Drippy Candelabra', cost: 20, spook: 2, start: true, art: 'candelabra', anim: 'flicker',
    loves: ['vampire', 'mummy', 'moth-folk'], patienceBonus: 0.02, desc: 'Warm candlelight. The wax drips upward on Tuesdays.' },
  { id: 'cobweb-chandelier', name: 'Cobweb Chandelier', cost: 35, spook: 4, start: true, art: 'chandelier', anim: 'sway',
    loves: ['ghost', 'vampire'], desc: 'Hand-spun by Doris, our resident spider. Doris is very proud.' },
  { id: 'man-eating-plant', name: 'Man-Eating Plant (Decorative)', cost: 30, spook: 3, rep: 0.5, art: 'plant', anim: 'sway',
    loves: ['swamp-creature', 'slime', 'witch'], desc: 'His name is Gerald. He has never eaten a man. He is a vegetarian.' },
  { id: 'gravestone', name: 'Novelty Gravestone', cost: 25, spook: 3, rep: 0.5, art: 'gravestone', anim: 'none',
    loves: ['skeleton', 'ghost'], desc: '"Here lies Kevin. He tried the ghost pepper."' },
  { id: 'haunted-portrait', name: 'Haunted Portrait', cost: 60, spook: 6, reward: true, art: 'portrait', anim: 'eyes',
    loves: ['vampire', 'gorgon', 'banshee'], desc: 'Its eyes follow guests around the room. Guests find this delightful.' },
  { id: 'fish-tank', name: 'Fancy Fish Tank', cost: 75, spook: 1, rep: 1, art: 'fishtank', anim: 'swim',
    loves: ['kraken', 'swamp-creature'], patienceBonus: 0.03, desc: 'Sir Tentacles finds it deeply comforting. The fish find him slightly alarming.' },
  { id: 'fog-machine', name: 'Fog Machine', cost: 70, spook: 7, reward: true, art: 'fog', anim: 'fog',
    loves: ['ghost', 'shadow', 'banshee', 'swamp-creature'], desc: 'Adds atmosphere. And mild confusion about where your table went.' },
  { id: 'crystal-ball', name: 'Crystal Ball', cost: 55, spook: 4, rep: 1.5, art: 'crystal', anim: 'pulse',
    loves: ['witch'], desc: 'Predicts that you will buy more decorations.' },
  { id: 'suit-of-armor', name: 'Suit of Armor', cost: 65, spook: 4, rep: 1.5, art: 'armor', anim: 'none',
    loves: ['mummy', 'gorgon'], desc: 'Empty. Probably. It waves sometimes.' },
  { id: 'bat-mobile', name: 'Bat Mobile', cost: 30, spook: 3, rep: 1, art: 'bats', anim: 'spin',
    loves: ['vampire'], desc: 'Real bats. They volunteered. They get free bat wings— wait.' },
  { id: 'cauldron-decor', name: 'Bubbling Display Cauldron', cost: 45, spook: 3, rep: 1, art: 'cauldron', anim: 'pulse',
    loves: ['witch'], desc: 'Just for show. Do not eat what\'s in it.' },
  { id: 'tesla-coil', name: 'Tesla Coil Lamp', cost: 80, spook: 4, rep: 2, art: 'tesla', anim: 'pulse',
    loves: ['patchwork'], tipBonus: 0.03, desc: 'Lighting AND entertainment. Mostly safe.' },
  { id: 'disco-skull', name: 'Disco Skull Ball', cost: 90, spook: 2, rep: 2, art: 'disco', anim: 'spin',
    loves: ['skeleton', 'imp', 'dragon'], tipBonus: 0.04, desc: 'A mirror-ball shaped like a skull. Instant party.' },
  { id: 'giant-bone', name: 'Giant Chew Bone', cost: 40, spook: 1, reward: true, art: 'bone', anim: 'none',
    loves: ['werewolf'], patienceBonus: 0.02, desc: 'A gift from Wolfgang. Werewolves cannot resist.' },
  { id: 'garlic-wreath', name: 'Ironic Garlic Wreath', cost: 30, spook: 2, reward: true, art: 'wreath', anim: 'none',
    loves: ['vampire'], desc: 'A gift from Count Fangsworth. "It\'s IRONIC," he insists.' },
  { id: 'mildred-portrait', name: 'Portrait of Great-Aunt Mildred', cost: 0, spook: 5, reward: true, art: 'mildred', anim: 'eyes',
    loves: ['ghost', 'kraken', 'vampire'], tipBonus: 0.05, patienceBonus: 0.05, desc: 'She is watching over the place. Smiling.' },

  // ---- Seasonal ----
  { id: 'bog-lily', name: 'Bog Lily Pond', cost: 40, spook: 2, event: 'swamp-bloom', art: 'lilypond', anim: 'bob',
    loves: ['bog-fairy', 'slime', 'swamp-creature'], desc: 'A tiny pond. A tiny frog lives in it. His name is also Gerald.' },
  { id: 'picnic-lanterns', name: 'Paper Moon Lanterns', cost: 40, spook: 1, event: 'midnight-picnic', art: 'lanterns', anim: 'sway',
    loves: ['moth-folk', 'ghost'], tipBonus: 0.02, desc: 'Moth folk will stare at them for hours.' },
  { id: 'scarecrow', name: 'Friendly Scarecrow', cost: 45, spook: 4, event: 'harvest-moon', art: 'scarecrow', anim: 'sway',
    loves: ['pumpkin-head', 'skeleton'], desc: 'Scares crows. Befriends everybody else.' },
  { id: 'snow-sculpture', name: 'Snow Monster Sculpture', cost: 45, spook: 3, event: 'frost-fright', art: 'snowman', anim: 'none',
    loves: ['yeti', 'frost-imp'], desc: 'A snowman, but with more teeth.' },
  { id: 'icicle-lights', name: 'Icicle Lights', cost: 35, spook: 2, event: 'frost-fright', art: 'icicles', anim: 'flicker',
    loves: ['frost-imp', 'ghost'], desc: 'Twinkly and slightly stabby.' },
];
