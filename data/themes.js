/**
 * THEMES and STYLE OPTIONS for the restaurant.
 *
 * A THEME is a full makeover: it sets wallpaper, floor and lighting, adds
 * Spookiness, and some monsters love or hate it (see `themes` in monsters.js).
 * You can still tweak wallpaper/floor/lighting after applying a theme.
 *
 * WALLPAPERS and FLOORS are CSS backgrounds — add your own by writing any
 * valid CSS `background` value.
 */
export const THEMES = [
  { id: 'diner', name: 'Run-Down Diner', cost: 0, minRep: 0, spook: 0, wallpaper: 'peeling', floor: 'checker', light: '#ffcf7a',
    desc: 'Great-Aunt Mildred\'s original look. Charming. Sticky.' },
  { id: 'gothic', name: 'Gothic Castle', cost: 220, minRep: 1.5, spook: 8, wallpaper: 'damask', floor: 'flagstone', light: '#ff9f5a',
    desc: 'Stone, velvet and candelabras. Vampires and mummies swoon. Imps find it stuffy.' },
  { id: 'swamp', name: 'Swamp Shack', cost: 180, minRep: 1, spook: 5, wallpaper: 'reeds', floor: 'mud', light: '#a8ff7a',
    desc: 'Damp, mossy and froggy. Swamp creatures and slimes feel at home. Yetis do not.' },
  { id: 'carnival', name: 'Haunted Carnival', cost: 260, minRep: 2.5, spook: 6, wallpaper: 'stripes', floor: 'sawdust', light: '#ff7ad9',
    desc: 'Creepy clowns not included. Skeletons and imps LOVE it. Vampires find it tacky.' },
  { id: 'ice', name: 'Ice Cavern', cost: 300, minRep: 3, spook: 6, wallpaper: 'icewall', floor: 'ice', light: '#8fe3ff',
    desc: 'Glittering ice everywhere. Yetis are thrilled. Werewolves and dragons shiver.' },
];

export const WALLPAPERS = [
  { id: 'peeling', name: 'Peeling Paint', css: 'repeating-linear-gradient(90deg, #4a3a5c 0 22px, #45355a 22px 44px)' },
  { id: 'damask',  name: 'Velvet Damask', css: 'radial-gradient(circle at 50% 40%, #5a1e3a 0 9px, transparent 10px) 0 0/34px 34px, radial-gradient(circle at 50% 50%, #3c1428 0 5px, transparent 6px) 17px 17px/34px 34px, #2e0f20' },
  { id: 'reeds',   name: 'Swamp Reeds',   css: 'repeating-linear-gradient(80deg, #2f4a2a 0 6px, #3a5a33 6px 14px, #26401f 14px 18px)' },
  { id: 'stripes', name: 'Circus Stripes', css: 'repeating-linear-gradient(90deg, #5c1a3f 0 26px, #2a1838 26px 52px)' },
  { id: 'icewall', name: 'Glacier Wall',  css: 'linear-gradient(135deg, #1d4a6b 0%, #2b6d94 40%, #1d4a6b 60%, #163a55 100%)' },
  { id: 'bones',   name: 'Bone Pattern',  css: 'radial-gradient(circle, #6d5a7a 0 3px, transparent 4px) 0 0/22px 22px, #3b2d4a' },
  { id: 'brick',   name: 'Crypt Brick',   css: 'linear-gradient(#2a2030 2px, transparent 2px) 0 0/40px 20px, linear-gradient(90deg, #2a2030 2px, transparent 2px) 0 0/40px 40px, #5a3e3e' },
];

export const FLOORS = [
  { id: 'checker',   name: 'Sticky Checker', css: 'conic-gradient(#3a2a4d 25%, #5b4a73 0 50%, #3a2a4d 0 75%, #5b4a73 0) 0 0/var(--cell2) var(--cell2)' },
  { id: 'flagstone', name: 'Castle Flagstone', css: 'linear-gradient(#2a2430 3px, transparent 3px) 0 0/var(--cell) var(--cell), linear-gradient(90deg, #2a2430 3px, transparent 3px) 0 0/var(--cell) var(--cell), #5a5468' },
  { id: 'mud',       name: 'Squishy Mud',    css: 'radial-gradient(circle at 30% 30%, #5a4632 0 12%, transparent 13%) 0 0/var(--cell) var(--cell), radial-gradient(circle at 70% 70%, #4a3826 0 10%, transparent 11%) 0 0/var(--cell) var(--cell), #3d2e1f' },
  { id: 'sawdust',   name: 'Carnival Sawdust', css: 'radial-gradient(circle, #c9a26b 0 1px, transparent 2px) 0 0/9px 9px, #8a6a3f' },
  { id: 'ice',       name: 'Polished Ice',   css: 'linear-gradient(135deg, rgba(255,255,255,.12) 0 10%, transparent 10% 50%, rgba(255,255,255,.08) 50% 60%, transparent 60%) 0 0/var(--cell2) var(--cell2), #6fb3d6' },
  { id: 'planks',    name: 'Creaky Planks',  css: 'repeating-linear-gradient(0deg, #5a3a22 0 calc(var(--cell) / 2 - 2px), #3e2716 0 calc(var(--cell) / 2))' },
  { id: 'grass',     name: 'Graveyard Grass', css: 'radial-gradient(circle at 20% 30%, #3c6b34 0 6%, transparent 7%) 0 0/var(--cell) var(--cell), #2d5229' },
];

export const LIGHTS = ['#ffcf7a', '#ff9f5a', '#a8ff7a', '#ff7ad9', '#8fe3ff', '#c39bff', '#ff5e5e', '#ffffff'];

export const SIGN_STYLES = [
  { id: 'wood',   name: 'Old Wooden Sign' },
  { id: 'neon',   name: 'Flickering Neon' },
  { id: 'stone',  name: 'Carved Tombstone' },
  { id: 'slime',  name: 'Dripping Slime' },
];

/**
 * ROOMS — the floor space you can expand into (bought on the Expand tab).
 *   door: grid cell [x, y] reserved for the entrance (main room only)
 *   outdoor: monsters with outdoorLover get bonus patience here
 */
export const ROOMS = [
  { id: 'main',  name: 'Dining Room', w: 6, h: 5, door: [0, 4], start: true },
  { id: 'back',  name: 'Back Room', w: 6, h: 5 },
  { id: 'patio', name: 'Graveyard Patio', w: 7, h: 4, outdoor: true, floor: 'grass' },
];
