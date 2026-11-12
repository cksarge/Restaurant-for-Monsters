/**
 * TRAITS — the flavour "atoms" of the game.
 *
 * Ingredients carry traits, cooking stations add/remove traits, and monsters
 * order dishes by describing the traits they want (in riddles).
 *
 * To add a new trait:
 *   1. Add an entry here.
 *   2. Add riddle phrases for it in data/riddles.js (so monsters can ask for it).
 *   3. Give it to some ingredients in data/ingredients.js.
 */
export const TRAITS = [
  { id: 'crunchy', name: 'Crunchy', icon: '🦴', color: '#e9c46a' },
  { id: 'slimy',   name: 'Slimy',   icon: '🟢', color: '#7ed957' },
  { id: 'squishy', name: 'Squishy', icon: '🍮', color: '#f4a3c4' },
  { id: 'cursed',  name: 'Cursed',  icon: '🔮', color: '#b06cff' },
  { id: 'cold',    name: 'Cold',    icon: '❄️', color: '#8fd3ff' },
  { id: 'spicy',   name: 'Spicy',   icon: '🌶️', color: '#ff6b4a' },
  { id: 'sweet',   name: 'Sweet',   icon: '🍬', color: '#ff9ad5' },
  { id: 'sparkly', name: 'Sparkly', icon: '✨', color: '#fff27a' },
  { id: 'gloomy',  name: 'Gloomy',  icon: '🌧️', color: '#8a93b8' },
  { id: 'glowy',   name: 'Glowy',   icon: '💡', color: '#d8ff6b' },
  { id: 'loud',    name: 'Loud',    icon: '📢', color: '#ffb347' },
  { id: 'spooky',  name: 'Spooky',  icon: '👻', color: '#e6e6fa' },
  { id: 'stinky',  name: 'Stinky',  icon: '🧦', color: '#a3b14b' },
  { id: 'salty',   name: 'Salty',   icon: '🧂', color: '#cfe8ef' },
  { id: 'ancient', name: 'Ancient', icon: '🏺', color: '#d9a066' },
  { id: 'soupy',   name: 'Soupy',   icon: '🥣', color: '#e0a96d' },
  { id: 'smoky',   name: 'Smoky',   icon: '💨', color: '#b0a8a0' },
  { id: 'zappy',   name: 'Zappy',   icon: '⚡', color: '#ffe14d' },
];
