/**
 * LAYOUT — grid math shared by Build Mode and the dining room.
 * Rooms are grids of tiles; placed items occupy rectangles of tiles.
 */
import { DB, itemDef } from './db.js';
import { game } from './state.js';

/** Unlocked rooms in display order, with their current size. */
export function roomsList(state = game.state) {
  return DB.roomList.filter((r) => state.rooms[r.id]).map((r) => {
    const size = state.rooms[r.id];
    // The door is always on the left wall, bottom row of the main room
    const door = r.door ? [0, size.h - 1] : null;
    return { ...r, w: size.w, h: size.h, door };
  });
}

/** Footprint of a placed item after rotation. */
export function footprint(p) {
  const def = itemDef(p.id);
  const w = def?.w || 1, h = def?.h || 1;
  return p.rot % 2 ? { w: h, h: w } : { w, h };
}

/** Can an item of size w×h go at (x, y) in this room? */
export function canPlace(state, roomId, x, y, w, h, ignoreUid = null) {
  const room = roomsList(state).find((r) => r.id === roomId);
  if (!room) return false;
  if (x < 0 || y < 0 || x + w > room.w || y + h > room.h) return false;
  if (room.door && x <= room.door[0] && room.door[0] < x + w && y <= room.door[1] && room.door[1] < y + h) return false;
  for (const p of state.placed) {
    if (p.room !== roomId || p.uid === ignoreUid) continue;
    const f = footprint(p);
    if (x < p.x + f.w && p.x < x + w && y < p.y + f.h && p.y < y + h) return false;
  }
  return true;
}

/**
 * All seats in the restaurant. Each seat knows where a monster sitting there
 * should be drawn (in tile coordinates) and which monster sizes fit.
 */
export function allSeats(state = game.state) {
  const seats = [];
  const rooms = Object.fromEntries(roomsList(state).map((r) => [r.id, r]));
  for (const p of state.placed) {
    const def = DB.furniture[p.id];
    if (!def || !def.seats || !rooms[p.room]) continue;
    const f = footprint(p);
    const horizontal = f.w >= f.h;
    for (let i = 0; i < def.seats; i++) {
      seats.push({
        key: `${p.uid}:${i}`,
        placedUid: p.uid,
        room: p.room,
        def,
        fits: def.fits,
        // anchor = where the monster's feet go (behind the table edge)
        // Feet sit at the table-top line, so the upper body shows above the table
        x: horizontal ? p.x + ((i + 0.5) * f.w) / def.seats : p.x + f.w / 2,
        y: horizontal ? p.y + f.h * 0.52 : p.y + ((i + 0.55) * f.h) / def.seats,
        width: horizontal ? f.w / def.seats : f.w,
        z: p.y,
        outdoor: !!rooms[p.room].outdoor,
      });
    }
  }
  return seats;
}

/** Fraction of a room's floor covered by furniture (big monsters hate > 60%). */
export function crowding(state, roomId) {
  const room = roomsList(state).find((r) => r.id === roomId);
  if (!room) return 0;
  let used = 0;
  for (const p of state.placed) if (p.room === roomId) { const f = footprint(p); used += f.w * f.h; }
  return used / (room.w * room.h);
}

export const CROWDED = 0.6;

/** Seat counts by size for the Build Mode summary. */
export function seatSummary(state = game.state) {
  const seats = allSeats(state);
  return {
    total: seats.length,
    big: seats.filter((s) => s.fits.includes('big')).length,
    giant: seats.filter((s) => s.fits.includes('giant')).length,
  };
}
