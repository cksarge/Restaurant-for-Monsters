/**
 * REGULARS — named recurring customers with short storylines.
 *
 * Each night there's a chance a regular visits. When they do, they bring the
 * NEXT chapter of their story. Delight them with that chapter's order and the
 * story advances (and you get the reward). Fail, and they'll try again later.
 *
 * Chapter fields:
 *   minNight            earliest night this chapter can happen
 *   minRep              (optional) reputation needed
 *   arrive              what they say when they sit down
 *   order               { riddle } using the [phrase|trait] markup
 *   requireIngredient   the dish must contain this ingredient
 *   forbidIngredient    the dish must NOT contain this ingredient
 *   requireDecor        a decoration that must be placed in the restaurant first
 *   needDecorText       what they say if requireDecor is missing
 *   gift                { ingredientId: qty } handed to you when they arrive
 *   success / fail      what they say after the dish
 *   reward              { coins, rep, unlockIngredients, unlockItems, unlockRecipes, unlockHelpers, text }
 *   moon                (optional) only on these moon phases
 */
export const REGULARS = [
  {
    id: 'fangsworth', name: 'Count Fangsworth', species: 'vampire',
    tagline: 'A vampire on a strict garlic-free diet. Strictly. Definitely.',
    art: { extras: ['cape', 'hair-slick', 'monocle'] },
    chapters: [
      { minNight: 1,
        arrive: 'Good evening. I am Count Fangsworth. You should know I am on a STRICTLY garlic-free diet.',
        order: { riddle: 'Something [cold|cold] and [mournful|gloomy]. With absolutely no garlic. None.' }, forbidIngredient: 'garlic',
        success: 'Exquisite. Not a whiff of garlic. Good. GOOD. ...Good.', fail: 'Hmph. I shall return.',
        reward: { coins: 20, text: 'Count Fangsworth left a tip in very old coins.' } },
      { minNight: 5,
        arrive: '*sniffs the air* Do I detect... no. Nothing. I detect NOTHING. Carry on.',
        order: { riddle: 'Something [that smells strongly|stinky]. Not of garlic! Just... in general. For research.' }, forbidIngredient: 'garlic',
        success: 'Mm. Yes. Pungent. Reminds me of... nothing. Of NOTHING.', fail: 'This does not smell like— I mean, this is fine. Goodnight.',
        reward: { coins: 25, unlockIngredients: ['garlic'], text: 'Garlic is now in the Market. Count Fangsworth "has no idea how that happened."' } },
      { minNight: 10,
        arrive: '*leans in, whispering* Listen. I need something... forbidden. Something that rhymes with "barlic." Tell NO ONE.',
        gift: { garlic: 2 },
        order: { riddle: 'Something [forbidden|stinky] and [loud enough to drown out my shame|loud]. You know what I mean. *wink*' }, requireIngredient: 'garlic',
        success: 'OH. OH MY. THREE HUNDRED YEARS I HAVE DENIED MYSELF THIS. *weeps tears of joy*', fail: 'Not quite the... forbidden flavour I was hoping for. *sigh*',
        reward: { coins: 40, rep: 0.1, text: 'Count Fangsworth slipped you a secret 40-coin tip. "Our little secret."' } },
      { minNight: 15,
        arrive: 'I have decided to stop hiding who I am. I am a vampire... who loves garlic. *the whole restaurant gasps*',
        order: { riddle: 'Your finest [garlicky|stinky] creation, [chilled like my undead heart|cold]. I am FREE!' }, requireIngredient: 'garlic',
        success: 'I have never felt more alive! (Technically, I am not alive.) Thank you, my friend.', fail: 'Close! But my liberation deserves perfection. I shall return!',
        reward: { coins: 60, rep: 0.2, unlockItems: ['garlic-wreath'], text: 'Story complete! Count Fangsworth gifted you an ironic Garlic Wreath decoration.' } },
    ],
  },
  {
    id: 'nebby', name: 'Pharaoh Nebby', species: 'mummy',
    tagline: 'A 3,000-year-old mummy who thinks everything is too spicy.',
    art: { extras: ['bandages', 'nemes'] },
    chapters: [
      { minNight: 2,
        arrive: 'I am Pharaoh Nebby, ruler of the Third... no, Fourth... a dynasty. I would like something NOT spicy.',
        order: { riddle: 'Something [cold|cold]. Cold food cannot be spicy. Can it? IT CANNOT.' },
        success: 'Hmm. Slightly spicy. But I shall allow it.', fail: 'Too spicy. (It was a bowl of ice.)',
        reward: { coins: 20, unlockIngredients: ['fossil-bread'], text: 'Nebby left you a loaf of Fossil Bread "from home." It\'s now in your Market.' } },
      { minNight: 7,
        arrive: 'In my day, we ate bread so old it had its own pyramid. Bring me something from my era.',
        order: { riddle: 'Something [ancient|ancient] and [crunchy like the desert|crunchy]. Like the good old dynasty days.' },
        success: 'AH. Now THIS is food. Not spicy at all. Well. A little spicy. Mostly not.', fail: 'Too modern. And probably spicy.',
        reward: { coins: 30, rep: 0.1, text: 'Nebby tipped you in a tiny golden scarab.' } },
      { minNight: 13,
        arrive: 'I have been thinking. For three thousand years I have said everything is too spicy. But... what IS spicy? I must know.',
        order: { riddle: 'Something [ACTUALLY spicy|spicy]. Truly. I am ready. ...I think I am ready.' },
        success: 'OH. OH NO. OH YES. *bandages unravel* THIS is spicy?! Everything else was NOT spicy! I have wasted MILLENNIA!', fail: 'Hm. That was not spicy. Wait. Was it? I am confused.',
        reward: { coins: 60, rep: 0.2, unlockItems: ['sarcophagus-booth'], text: 'Story complete! Nebby gifted you a Sarcophagus Booth from his tomb.' } },
    ],
  },
  {
    id: 'tentacles', name: 'Sir Tentacles', species: 'kraken',
    tagline: 'The most polite kraken in the seven seas. Misses home a little.',
    art: { extras: ['top-hat', 'monocle', 'bowtie'] },
    chapters: [
      { minNight: 0,
        arrive: 'Oh! Hello! So sorry to intrude on your first night. I knew your great-aunt, you know. Lovely woman.',
        order: { riddle: '[Soup|soupy], [but sad|gloomy], if it\'s no trouble. So sorry. Thank you!' },
        success: 'Splendid! Just like your great-aunt used to make! Thank you, thank you, thank you!', fail: 'Oh, it\'s lovely, really! I\'ll... try again another night. Sorry!',
        reward: { coins: 15, text: 'Sir Tentacles left a generous tip. "For your first night! Sorry it\'s so small!"' } },
      { minNight: 4,
        arrive: 'I hope you don\'t mind me saying so, but... I do miss the sea. Something that tastes like home, perhaps?',
        order: { riddle: 'Something [that tastes like the deep blue sea|salty] and [chilly as the abyss|cold], please. So sorry.' },
        success: 'Oh my. I can almost hear the whales singing. Thank you ever so much.', fail: 'Oh, it\'s lovely, but not quite home. Sorry!',
        reward: { coins: 25, unlockIngredients: ['kelp-noodles'], text: 'Sir Tentacles had his cousins deliver Kelp Noodles. They\'re in your Market now.' } },
      { minNight: 9, requireDecor: 'fish-tank',
        needDecorText: 'I don\'t suppose... you\'d ever get a fish tank? Only if it\'s no trouble! It would just feel so homey.',
        arrive: 'A FISH TANK! Oh, I could cry! Well, I\'m always a bit wet, but still! Something to celebrate?',
        order: { riddle: 'A [slippery|slimy] [soup|soupy] for a celebration! If it\'s not too much bother!' },
        success: 'This is the happiest night of my life! Well, top eight. One per arm.', fail: 'Still lovely to see the fish tank. Sorry, I\'ll try again!',
        reward: { coins: 70, rep: 0.25, unlockItems: ['tide-booth'], text: 'Story complete! Sir Tentacles gifted you a Tide Pool Booth. (He apologised for the size.)' } },
    ],
  },
  {
    id: 'gloria', name: 'Gloria the Ghost', species: 'ghost',
    tagline: 'Your great-aunt Mildred\'s oldest friend. Trying to remember a lost recipe.',
    art: { extras: ['pearls', 'blush'] },
    chapters: [
      { minNight: 3,
        arrive: 'Oooh, you must be Mildred\'s grand-nibling! I\'m Gloria. Mildred and I went way back. WAY back. She used to make the most wonderful soup...',
        order: { riddle: 'Something like Mildred\'s soup... I remember it was [a soup|soupy]... and it was [sad, but in a cozy way|gloomy]...' },
        success: 'Ooh, that\'s close! Not quite it, but close. It had something else in it...', fail: 'Oh, no, that\'s not it at all, dear. Oooo.',
        reward: { coins: 20, text: 'Gloria says she\'ll try to remember more.' } },
      { minNight: 8,
        arrive: 'I remembered something! Mildred\'s soup was [salty|salty]! Like tears! She always said "a good soup should make you cry a little."',
        order: { riddle: 'A [soup|soupy] that tastes [like a sailor\'s tears|salty], dear. Oooo, this is so exciting!' },
        success: 'Oooh, yes! Salty! But there was still one more thing... it was COLD and RAINY, like the night we met!', fail: 'Not quite salty enough, dear.',
        reward: { coins: 30, text: 'Gloria is so close to remembering...' } },
      { minNight: 12,
        arrive: 'I\'ve got it! Bog water, a sour rain cloud and sea salt tears! In the cauldron! Oh, please make it, dear!',
        order: { riddle: 'Mildred\'s soup: [soupy|soupy], [salty|salty], [cold|cold] and [gloomy|gloomy]. Bog water, rain cloud, sea tears. In the cauldron!' },
        unlockOnArrive: ['mildred-gloom-soup'],
        success: '*sobs ghostly tears* That\'s it. That\'s Mildred\'s soup. She would be so proud of you, dear.', fail: 'Oh, not quite... Bog water, rain cloud, sea tears, dear! In the cauldron!',
        reward: { coins: 80, rep: 0.3, unlockItems: ['mildred-portrait'], text: 'Story complete! Gloria gave you a Portrait of Great-Aunt Mildred. She\'s smiling.' } },
    ],
  },
  {
    id: 'wolfgang', name: 'Wolfgang', species: 'werewolf',
    tagline: 'A werewolf preparing to ask his sweetheart to the Howl-o-ween Dance.',
    art: { extras: ['ears-wolf', 'snout', 'fur', 'bowtie'] },
    chapters: [
      { minNight: 4,
        arrive: 'Hey! I\'m Wolfgang. I\'m working up the courage to ask Luna to the Howl-o-ween Dance. Need fuel!',
        order: { riddle: 'Something [CRUNCHY|crunchy] and [toasty|smoky]. For courage! AWOO!' },
        success: 'I feel BRAVER already! AWOO!', fail: 'Hmm. Not quite brave-food.',
        reward: { coins: 20, text: 'Wolfgang gave you a slobbery high-five and some coins.' } },
      { minNight: 9, moon: [4],
        arrive: 'IT\'S THE FULL MOON. I\'M ASKING HER TONIGHT. I NEED SOMETHING AMAZING. AWOOOO!',
        order: { riddle: 'Something [LOUD|loud], [CRUNCHY|crunchy] and [FIERY|spicy]! Like my LOVE! AWOOOO!' },
        success: 'SHE SAID YES!!! AWOOOOOOOOOO!', fail: 'I... chickened out. Next full moon!',
        reward: { coins: 50, rep: 0.2, unlockItems: ['giant-bone'], text: 'Story complete! Wolfgang gave you a Giant Chew Bone decoration. Werewolves love it.' } },
    ],
  },
  {
    id: 'bolt', name: 'Bolt', species: 'patchwork',
    tagline: 'A patchwork monster who dreams of becoming a chef.',
    art: { extras: ['bolts', 'stitches', 'chef-hat'] },
    chapters: [
      { minNight: 6, minRep: 1,
        arrive: 'BOLT LIKE FOOD. BOLT WANT TO MAKE FOOD. HOW... YOU... MAKE FOOD?',
        order: { riddle: 'Show Bolt! Something [that zaps|zappy]! Bolt watch and learn!' },
        success: 'BOLT UNDERSTAND! ...Bolt not understand. But Bolt INSPIRED!', fail: 'Bolt... still confused. Bolt come back.',
        reward: { coins: 20, text: 'Bolt is inspired.' } },
      { minNight: 11,
        arrive: 'Bolt practised! Bolt made toast! Toast exploded! Bolt want to see real chef again!',
        order: { riddle: 'Something [glowing|glowy] and [crackling with power|zappy]! Like Bolt\'s brain!' },
        success: 'BOLT SEE NOW! COOKING IS JUST... SCIENCE WITH SNACKS!', fail: 'Bolt need more lessons.',
        reward: { coins: 40, unlockHelpers: ['bolt-cook'], text: 'Story complete! Bolt can now be hired as a Line Cook (Staff tab).' } },
    ],
  },
];
