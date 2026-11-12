/**
 * RIDDLE PHRASES — the "monster language" used to describe traits.
 *
 * Orders are written with a tiny markup: [phrase|trait]
 *   e.g. "Something [crunchy|crunchy] that [screams a little|loud]"
 * The player sees only the phrase. Once a phrase has been decoded (after
 * serving that order), the Phrasebook remembers it and shows a hint icon.
 *
 * For each trait:
 *   adj    — adjectives placed before the dish ("a [sad|gloomy] snack")
 *   clause — phrases placed after the dish ("soup [that screams a little|loud]")
 *   noun   — (optional) the dish itself ("[soup|soupy]")
 */
export const TRAIT_PHRASES = {
  crunchy: {
    adj: ['crunchy', 'crackly', 'snappy', 'bone-crunching', 'crispity'],
    clause: ['that goes CRUNCH', 'that crackles like old bones', 'that fights my teeth a little', 'that snaps like a twig in a haunted forest'],
  },
  slimy: {
    adj: ['slimy', 'gloopy', 'oozy', 'slippery', 'glistening'],
    clause: ['that slides down on its own', 'that leaves a little trail', 'that wiggles off the spoon', 'that is mostly ooze'],
  },
  squishy: {
    adj: ['squishy', 'squelchy', 'wobbly', 'jiggly'],
    clause: ['that wobbles when I look at it', 'that goes *squelch*', 'that jiggles like a nervous ghost', 'that I can poke'],
  },
  cursed: {
    adj: ['cursed', 'hexed', 'forbidden', 'jinxed', 'ominous'],
    clause: ['that a witch would warn me about', 'with a tiny curse on it', 'that brings seven years of bad luck', 'that whispers prophecies'],
  },
  cold: {
    adj: ['cold', 'frosty', 'icy', 'chilly', 'frozen'],
    clause: ['that gives me brain-freeze', "colder than my landlord's heart", 'with frost on top', 'that makes my teeth chatter'],
  },
  spicy: {
    adj: ['spicy', 'fiery', 'scorching', 'hot-hot', 'sizzling'],
    clause: ['that makes my ears whistle', 'that bites back', 'that makes me breathe fire (more than usual)', 'that makes my eyes water'],
  },
  sweet: {
    adj: ['sweet', 'sugary', 'candy-ish', 'sticky-sweet'],
    clause: ['that rots my one good tooth', "that tastes like a nightmare's birthday party", 'with extra sugar on the sugar', 'that my dentist would hate'],
  },
  sparkly: {
    adj: ['sparkly', 'glittery', 'twinkly', 'shimmery', 'dazzling'],
    clause: ['that twinkles at me', 'that a dragon would hoard', 'covered in glitter', 'that sparkles like a vampire in denial'],
  },
  gloomy: {
    adj: ['gloomy', 'sad', 'mopey', 'melancholy', 'heartbroken'],
    clause: ['but sad', 'that has given up on its dreams', 'that cries a little', 'that listens to sad violin music', 'that writes bad poetry'],
  },
  glowy: {
    adj: ['glowy', 'glowing', 'radiant', 'luminous'],
    clause: ['that glows in the dark', 'I can read by', 'that lights up the room', 'that I could use as a nightlight'],
  },
  loud: {
    adj: ['loud', 'noisy', 'shouty', 'screechy'],
    clause: ['that screams a little', 'that sings while I chew', 'that yells my name', 'that the neighbours complain about'],
  },
  spooky: {
    adj: ['spooky', 'haunted', 'eerie', 'creepy', 'shivery'],
    clause: ['that says "boo"', 'haunted by a very small ghost', 'that gives me goosebumps', 'that stares back'],
  },
  stinky: {
    adj: ['stinky', 'smelly', 'pungent', 'whiffy', 'ripe'],
    clause: ['that smells like old socks', 'that clears the room', 'that my nose files a complaint about', 'with a bouquet of swamp'],
  },
  salty: {
    adj: ['salty', 'briny', 'sea-salty'],
    clause: ['that tastes like the deep sea', "like a sailor's tears", 'that reminds me of the ocean', 'with a splash of tide'],
  },
  ancient: {
    adj: ['ancient', 'antique', 'vintage', 'prehistoric', 'dusty'],
    clause: ['older than my grandmother', 'from before the pyramids', 'that remembers the dinosaurs', 'aged for a few thousand years'],
  },
  soupy: {
    noun: ['soup', 'a bowl of slurp', 'broth', 'a stew', 'a chowder'],
    adj: ['soupy', 'slurpy', 'brothy'],
    clause: ['in a bowl, with a spoon', 'that I can slurp', 'that sloshes'],
  },
  smoky: {
    adj: ['smoky', 'charred', 'grilled', 'flame-kissed', 'toasty'],
    clause: ['straight off the grill', 'that smells like a campfire', 'with grill marks on it', 'kissed by fire'],
  },
  zappy: {
    adj: ['zappy', 'electric', 'shocking', 'buzzy', 'crackling'],
    clause: ['that zaps my tongue', 'that makes my hair stand up', 'with a little lightning in it', 'that hums with electricity'],
  },
};

/** Generic dish words used when no trait provides a noun. */
export const DISH_HEADS = [
  'something', 'a little something', 'a snack', 'a plate of something', 'a dish', 'a treat', 'whatever you have',
];

/** Sentence frames. {head} is the dish; {more} is "and"-joined extra clauses. */
export const ORDER_FRAMES = [
  '{head}',
  'I would like {head}',
  'Bring me {head}',
  'Do you have {head}?',
  'I am craving {head}',
  "Tonight I fancy {head}",
  'Surprise me with {head}',
];
