/**
 * CALENDAR, MOON PHASES and EVENTS
 *
 * Time is in-game only: 1 shift = 1 night, 7 nights = 1 week,
 * 4 weeks = 1 month, 4 months (one per season) = 1 year (112 nights).
 */
export const CALENDAR = {
  nightsPerWeek: 7,
  weeksPerMonth: 4,
  monthsPerYear: 4,
  dayNames: ['Moanday', 'Tombsday', 'Wailsday', 'Thirstday', 'Frightday', 'Scaturday', 'Shunday'],
  months: [
    { name: 'Mudmonth',   season: 'Spring', icon: '🌱' },
    { name: 'Swelter',    season: 'Summer', icon: '☀️' },
    { name: 'Rotober',    season: 'Fall',   icon: '🍂' },
    { name: 'Shiverary',  season: 'Winter', icon: '❄️' },
  ],
};

/**
 * MOON PHASES — an 8-night cycle. Effects are applied in js/calendar.js.
 *   spawn         { species: weight multiplier }
 *   traitPay      { trait: pay multiplier for dishes with that trait }
 *   patienceMult / tipMult   everyone
 *   rush          a pack of this species arrives together mid-shift
 */
export const MOON_PHASES = [
  { name: 'New Moon',        icon: '🌑', effect: 'Shy shadow creatures come out to eat.', spawn: { shadow: 3 } },
  { name: 'Waxing Crescent', icon: '🌒', effect: 'A hopeful moon: everyone is a little more patient.', patienceMult: 1.1 },
  { name: 'First Quarter',   icon: '🌓', effect: 'Werewolves feel itchy and visit more often.', spawn: { werewolf: 1.6 } },
  { name: 'Waxing Gibbous',  icon: '🌔', effect: 'Glowy dishes pay 20% more.', traitPay: { glowy: 1.2 } },
  { name: 'Full Moon',       icon: '🌕', effect: 'WEREWOLF RUSH! Glowy dishes pay 50% more.', spawn: { werewolf: 3 }, traitPay: { glowy: 1.5 }, rush: 'werewolf' },
  { name: 'Waning Gibbous',  icon: '🌖', effect: 'Post-full-moon generosity: tips +15%.', tipMult: 1.15 },
  { name: 'Last Quarter',    icon: '🌗', effect: 'Ghosts are restless and visit more.', spawn: { ghost: 2, banshee: 1.5 } },
  { name: 'Waning Crescent', icon: '🌘', effect: 'Drowsy moon: everyone is 15% more patient.', patienceMult: 1.15, spawn: { shadow: 1 } },
];

/**
 * SEASONAL EVENTS — fixed points in the year.
 *   month, startNight, nights   when it runs (startNight is 0–27 within the month)
 *   monsters                    event-only visitors (see `event` in monsters.js)
 *   ingredients / furniture / decorations   limited-time stock (bought while active, kept forever)
 *   goal                        bonus goal: delight `count` customers with a dish that has `trait`
 */
export const SEASONAL_EVENTS = [
  { id: 'swamp-bloom', name: 'Swamp Bloom', icon: '🌸', month: 0, startNight: 14, nights: 4,
    desc: 'The swamp flowers bloom once a year! Bog fairies visit, and Bog Blossoms are in season.',
    monsters: ['bog-fairy'], ingredients: ['bog-blossom'], furniture: ['lily-table'], decorations: ['bog-lily'],
    goal: { trait: 'sweet', count: 6, reward: { coins: 90, rep: 0.1 }, text: 'Delight 6 customers with Sweet dishes' } },
  { id: 'midnight-picnic', name: 'Midnight Picnic', icon: '🧺', month: 1, startNight: 14, nights: 4,
    desc: 'Summer picnics under the stars! Moth folk flutter in, and Midnight Marshmallows are toasting.',
    monsters: ['moth-folk'], ingredients: ['midnight-mallow'], furniture: ['picnic-table'], decorations: ['picnic-lanterns'],
    goal: { trait: 'glowy', count: 6, reward: { coins: 110, rep: 0.1 }, text: 'Delight 6 customers with Glowy dishes' } },
  { id: 'harvest-moon', name: 'Harvest Moon Festival', icon: '🎃', month: 2, startNight: 14, nights: 4,
    desc: 'The biggest night of the monster year! Pumpkin heads roll in, and Pumpkin Guts are fresh.',
    monsters: ['pumpkin-head'], ingredients: ['pumpkin-guts'], furniture: ['pumpkin-table'], decorations: ['scarecrow'],
    goal: { trait: 'spooky', count: 8, reward: { coins: 140, rep: 0.15 }, text: 'Delight 8 customers with Spooky dishes' } },
  { id: 'frost-fright', name: 'Frost Fright', icon: '⛄', month: 3, startNight: 7, nights: 4,
    desc: 'Winter\'s chilliest celebration! Frost sprites and yetis visit, and Avalanche Snow is falling.',
    monsters: ['frost-imp', 'yeti'], ingredients: ['avalanche-snow'], furniture: ['ice-table'], decorations: ['snow-sculpture', 'icicle-lights'],
    goal: { trait: 'cold', count: 8, reward: { coins: 150, rep: 0.15 }, text: 'Delight 8 customers with Cold dishes' } },
];

/** RUSH HOURS — groups who show up together. */
export const RUSHES = {
  bus:      { name: 'Ghost Tour Bus', icon: '🚌', species: ['ghost', 'ghost', 'ghost', 'ghost', 'skeleton', 'banshee'], size: [4, 6],
              text: 'HONK HONK! A Ghost Tour Bus pulls up! Here comes a crowd!' },
  werewolf: { name: 'Werewolf Pack', icon: '🐺', species: ['werewolf'], size: [3, 4],
              text: 'AWOOOOO! It\'s the full moon — a werewolf pack bursts in!' },
};

/** HEALTH INSPECTOR — scheduling + minigame tuning. */
export const INSPECTOR = {
  name: 'Inspector Plimsworth',
  art: { body: 'human', color: '#f2c9a0', belly: '#5b6b80', eyes: 2, eyeColor: '#3b2b1e', mouth: 'flat', extras: ['glasses', 'clipboard', 'hair-flat', 'tie'], accent: '#2f3a4a' },
  firstNight: 6, gapMin: 10, gapMax: 16,
  surpriseFromNight: 56,      // from month 3 onwards, some visits are surprises
  surpriseChance: 0.5,
  duration: 26,               // seconds the minigame lasts (game-paced)
  strikesToFail: 3,
  passReward: { coins: 60, rep: 0.15 },
  failPenalty: { coins: 50, rep: 0.25 },
  rumors: [
    '{who} whispers: "Psst. A HUMAN with a CLIPBOARD is coming on {day}. Act normal."',
    '{who} heard from a bat who heard from a rat: the health inspector visits on {day}!',
    '{who} leans in: "My cousin saw a human in a beige suit asking about you. {day}, I think."',
  ],
  // monster: draw that monster's sprite (otherwise the emoji is shown)
  suspicious: [
    { emoji: '🧛', monster: 'vampire', fix: '🥸', label: 'Fangs showing!',        excuse: 'He\'s just… very excited about dental hygiene.' },
    { emoji: '🐙', monster: 'kraken', fix: '🧣', label: 'Tentacle poking out!',  excuse: 'That\'s a very long scarf, actually.' },
    { emoji: '👻', monster: 'ghost', fix: '🪟', label: 'See-through customer!', excuse: 'It\'s a very clean window!' },
    { emoji: '🧟', monster: 'patchwork', fix: '🎩', label: 'Stitches showing!',     excuse: 'He\'s in fashion. Patchwork is in this year.' },
    { emoji: '👁️', fix: '🍽️', label: 'Eyeball soup!',         excuse: 'Those are grapes. Very round grapes.' },
    { emoji: '🦇', fix: '🧺', label: 'Bat wings on a plate!', excuse: 'Chicken. It\'s chicken. Spooky chicken.' },
    { emoji: '🐺', monster: 'werewolf', fix: '🪒', label: 'Werewolf shedding!',    excuse: 'Our wool sweaters are VERY fluffy.' },
    { emoji: '🟢', monster: 'slime', fix: '🧽', label: 'Slime on the floor!',   excuse: 'Fresh lime jello spill. Mopping it now!' },
  ],
  inspectorLines: [
    'Hmm. *scribbles*', 'What was that?', 'Is that… normal?', 'Interesting.', 'I see.', '*squints*',
  ],
};

/** FOOD CRITIC — Sir Reginald Crumbleton of The Nightly Howl. */
export const CRITIC = {
  name: 'Sir Reginald Crumbleton',
  paper: 'The Nightly Howl',
  firstNight: 4, gapMin: 9, gapMax: 14,
  headlines: {
    5: ['A TRIUMPH OF TERROR-TORY CUISINE', 'I WEPT STONE TEARS OF JOY', 'FIVE FANGS UP'],
    4: ['A DELIGHTFULLY DREADFUL DINER', 'GO, AND BRING AN APPETITE', 'NEARLY FLAWLESSLY FIENDISH'],
    3: ['PERFECTLY, PLEASANTLY PASSABLE', 'NOT BAD, FOR A RUN-DOWN DINER', 'THE GRAVY WAS GRAVY'],
    2: ['A DISAPPOINTING DUNGEON OF DINING', 'I HAVE TASTED BETTER GRAVEL', 'MEH, AND ALSO, BLEH'],
    1: ['AVOID, UNLESS CURSED', 'A CULINARY CATASTROPHE', 'I WOULD RATHER EAT MY MONOCLE'],
  },
  bodies: {
    5: 'Every bite was a haunting symphony. The atmosphere was deliciously dreadful. I shall return, and I never return anywhere.',
    4: 'Clever cooking and a charming room. A few rough edges, but the chef clearly understands monsters.',
    3: 'The food arrived. It was food. I ate it. The room could use more personality — and more spookiness.',
    2: 'My order was misunderstood, and the room was as spooky as a bowl of oatmeal. Room for improvement.',
    1: 'I am a gargoyle. I have sat on a cathedral for 600 years. This was worse.',
  },
};

/** Tiny news ticker lines shown on the hub between shifts. */
export const RUMOR_WHO = ['Gloria the Ghost', 'A passing bat', 'Sir Tentacles', 'Count Fangsworth', 'The rat under the fridge', 'Doris the spider'];
