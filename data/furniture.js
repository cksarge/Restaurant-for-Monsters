/**
 * FURNITURE — things monsters sit at. Placed in Build Mode on the room grid.
 *
 * Fields:
 *   w, h        footprint in grid tiles (swapped when rotated 90°)
 *   seats       how many customers can sit here at once
 *   fits        which monster sizes fit ('small' | 'medium' | 'big' | 'giant')
 *   cost        price in coins (selling refunds half)
 *   spook       Spookiness added
 *   comfort     monster species ids who LOVE this seat (more patience + better tips)
 *   art         sprite recipe for js/ui/sprites.js → furnitureSVG()
 *                 shape: 'rect' | 'round' | 'coffin' | 'lily' | 'bar' | 'sarcophagus'
 *                 top / edge / seat: colours,  pattern: optional overlay ('check', 'moss', 'ice', 'planks', 'gold')
 * Unlocking (pick one):  start: true | rep: n | reward: true | event: 'event-id'
 */
export const FURNITURE = [
  { id: 'diner-table', name: 'Wobbly Diner Table', w: 1, h: 1, seats: 2, fits: ['small', 'medium'], cost: 25, spook: 0, start: true,
    desc: 'Inherited from Great-Aunt Mildred. One leg is shorter than the others. Nobody knows which.',
    art: { shape: 'rect', top: '#b07a4f', edge: '#7a4f30', seat: '#c0392b', pattern: 'planks' } },
  { id: 'round-table', name: 'Round Candle Table', w: 1, h: 1, seats: 2, fits: ['small', 'medium'], cost: 35, spook: 1, start: true,
    desc: 'Comes with a candle that never quite goes out.',
    art: { shape: 'round', top: '#6b3f7a', edge: '#40224d', seat: '#d8a24a', candle: true } },
  { id: 'booth', name: 'Comfy Booth', w: 2, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 60, spook: 0, start: true,
    desc: 'Roomy enough for werewolves, krakens and other big personalities.',
    art: { shape: 'rect', top: '#a0522d', edge: '#6b3518', seat: '#7b2d8b', bench: true } },
  { id: 'bone-bar', name: 'Bone Bar Counter', w: 3, h: 1, seats: 3, fits: ['small'], cost: 70, spook: 2, rep: 0.5,
    desc: 'Bar stools made of (fake!) bones. Small monsters only. Skeletons love it.',
    comfort: ['skeleton', 'imp'],
    art: { shape: 'bar', top: '#e8dcc0', edge: '#a89878', seat: '#fff5e0' } },
  { id: 'coffin-booth', name: 'Coffin Booth', w: 2, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 90, spook: 4, rep: 1,
    desc: 'Velvet-lined and extremely comfortable. Vampires get cozy and tip better.',
    comfort: ['vampire', 'shadow'],
    art: { shape: 'coffin', top: '#3b2433', edge: '#1e1119', seat: '#a3123a', bench: true } },
  { id: 'swamp-booth', name: 'Damp Swamp Booth', w: 2, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 85, spook: 2, rep: 1,
    desc: 'Pleasantly soggy. Slimes and swamp creatures tip extra here.',
    comfort: ['slime', 'swamp-creature'],
    art: { shape: 'rect', top: '#4d6b3c', edge: '#2e4224', seat: '#6b8f4a', bench: true, pattern: 'moss' } },
  { id: 'giant-table', name: 'Reinforced Giant Table', w: 2, h: 2, seats: 1, fits: ['small', 'medium', 'big', 'giant'], cost: 140, spook: 0, rep: 1.5,
    desc: 'Steel-reinforced oak. The ONLY table a troll can sit at without breaking it.',
    comfort: ['troll', 'dragon'],
    art: { shape: 'rect', top: '#8b5a2b', edge: '#4a2e14', seat: '#6d6d6d', pattern: 'bolts' } },
  { id: 'ice-table', name: 'Ice Sculpture Table', w: 1, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 80, spook: 1, rep: 2,
    desc: 'Never melts (it\'s cursed to stay frozen). Yetis adore it.',
    comfort: ['yeti', 'frost-imp'],
    art: { shape: 'round', top: '#bfe9ff', edge: '#7cc4e8', seat: '#e8f8ff', pattern: 'ice' } },
  { id: 'sarcophagus-booth', name: 'Sarcophagus Booth', w: 2, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 100, spook: 5, reward: true,
    desc: 'A gift from Pharaoh Nebby. Mummies feel right at home.',
    comfort: ['mummy'],
    art: { shape: 'sarcophagus', top: '#d4a73a', edge: '#8a6a1c', seat: '#2b5ea8', bench: true, pattern: 'gold' } },
  { id: 'tide-booth', name: 'Tide Pool Booth', w: 2, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 100, spook: 2, reward: true,
    desc: 'A gift from Sir Tentacles. Comes with a few very small, very polite crabs.',
    comfort: ['kraken', 'swamp-creature'],
    art: { shape: 'rect', top: '#3a8fb7', edge: '#1f5a78', seat: '#f2d0a4', bench: true, pattern: 'waves' } },

  // ---- Seasonal event furniture ----
  { id: 'lily-table', name: 'Lily Pad Table', w: 1, h: 1, seats: 2, fits: ['small', 'medium'], cost: 50, spook: 1, event: 'swamp-bloom',
    desc: 'A giant lily pad on a stem. Bog fairies love it.', comfort: ['bog-fairy', 'slime'],
    art: { shape: 'lily', top: '#5fb85a', edge: '#3c7d3a', seat: '#f6b3e6' } },
  { id: 'picnic-table', name: 'Midnight Picnic Table', w: 2, h: 1, seats: 3, fits: ['small', 'medium'], cost: 60, spook: 0, event: 'midnight-picnic',
    desc: 'Checkered and cheerful. Moth folk flock to it.', comfort: ['moth-folk'],
    art: { shape: 'rect', top: '#d64545', edge: '#8f2b2b', seat: '#8b5a2b', pattern: 'check' } },
  { id: 'pumpkin-table', name: 'Giant Pumpkin Table', w: 1, h: 1, seats: 2, fits: ['small', 'medium', 'big'], cost: 55, spook: 3, event: 'harvest-moon',
    desc: 'A hollowed-out prize pumpkin. Smells like pie.', comfort: ['pumpkin-head', 'werewolf'],
    art: { shape: 'round', top: '#ff9234', edge: '#c4621a', seat: '#6a8f3d', pattern: 'pumpkin' } },
];
