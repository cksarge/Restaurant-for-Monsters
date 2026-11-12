/**
 * CALENDAR & TIME — everything here runs on in-game nights, never real dates.
 *
 *   1 shift = 1 night · 7 nights = 1 week · 4 weeks = 1 month
 *   4 months (one per season) = 1 year = 112 nights
 *   The moon cycles every 8 nights (night % 8).
 *
 * Inspections, critic visits and ghost-tour buses are scheduled once per year
 * with a seeded RNG and saved, so reloading never reshuffles them.
 */
import { DB } from './db.js';
import { seededRng } from './utils.js';

const C = DB.calendar;
export const NIGHTS_PER_WEEK = C.nightsPerWeek;
export const NIGHTS_PER_MONTH = C.nightsPerWeek * C.weeksPerMonth;   // 28
export const NIGHTS_PER_YEAR = NIGHTS_PER_MONTH * C.monthsPerYear;    // 112
export const MOON_CYCLE = DB.moons.length;                             // 8

export const yearOf = (night) => Math.floor(night / NIGHTS_PER_YEAR);

/** Everything you might want to know about a night number. */
export function dateInfo(night) {
  const inYear = night % NIGHTS_PER_YEAR;
  const monthIdx = Math.floor(inYear / NIGHTS_PER_MONTH);
  const nightOfMonth = inYear % NIGHTS_PER_MONTH;
  const month = C.months[monthIdx];
  const phase = night % MOON_CYCLE;
  return {
    night,
    year: yearOf(night),
    monthIdx,
    month,
    nightOfMonth,                                   // 0–27
    week: Math.floor(nightOfMonth / NIGHTS_PER_WEEK), // 0–3
    dayName: C.dayNames[night % NIGHTS_PER_WEEK],
    phase,
    moon: DB.moons[phase],
    label: `${C.dayNames[night % NIGHTS_PER_WEEK]}, ${month.name} ${nightOfMonth + 1}`,
    longLabel: `${C.dayNames[night % NIGHTS_PER_WEEK]}, Night ${nightOfMonth + 1} of ${month.name} (${month.season}), Year ${yearOf(night) + 1}`,
  };
}

/** The seasonal event running on a given night, or null. */
export function seasonalOn(night) {
  const d = dateInfo(night);
  return DB.seasonalList.find((e) => e.month === d.monthIdx && d.nightOfMonth >= e.startNight && d.nightOfMonth < e.startNight + e.nights) || null;
}

/** Night number on which a seasonal event starts in a given year. */
export const seasonalStartNight = (ev, year) => year * NIGHTS_PER_YEAR + ev.month * NIGHTS_PER_MONTH + ev.startNight;

/** The last night of each year hosts the Monster Food Awards. */
export const isAwardsNight = (night) => night % NIGHTS_PER_YEAR === NIGHTS_PER_YEAR - 1;

/**
 * Generate this year's schedule (inspections, buses, critic visits) if missing.
 * Uses a seed derived from the save, so it's stable across reloads.
 */
export function ensureSchedule(state) {
  const year = yearOf(state.night);
  if (state.schedule && state.schedule.year === year) return state.schedule;
  const rng = seededRng(state.seed + year * 7919);
  const between = (a, b) => a + Math.floor(rng() * (b - a + 1));
  const start = year * NIGHTS_PER_YEAR;
  const end = start + NIGHTS_PER_YEAR - 1; // awards night stays calm

  const I = DB.inspector;
  const inspections = [];
  for (let n = start + (year === 0 ? I.firstNight : between(3, 8)); n < end; n += between(I.gapMin, I.gapMax)) {
    const surprise = n >= I.surpriseFromNight && rng() < I.surpriseChance;
    inspections.push({ night: n, surprise });
  }

  const buses = [];
  for (let n = start + between(3, 6); n < end; n += between(6, 10)) buses.push(n);

  const critics = [];
  const K = DB.critic;
  for (let n = start + (year === 0 ? K.firstNight : between(3, 8)); n < end; n += between(K.gapMin, K.gapMax)) critics.push(n);

  state.schedule = { year, inspections, buses, critics };
  return state.schedule;
}

/** What's happening on a specific night. */
export function nightEvents(state, night) {
  const sch = ensureSchedule(state);
  const insp = sch.inspections.find((i) => i.night === night) || null;
  return {
    date: dateInfo(night),
    seasonal: seasonalOn(night),
    inspection: insp,
    bus: sch.buses.includes(night),
    critic: sch.critics.includes(night),
    awards: isAwardsNight(night),
  };
}

/** Is a scheduled inspection known to the player yet? (Warned 2 nights ahead unless it's a surprise.) */
export function inspectionKnown(insp, currentNight) {
  return !!insp && !insp.surprise && insp.night - currentNight <= 2;
}

/**
 * Upcoming things the player can plan around, for the calendar and the hub.
 * Surprise inspections and critics are hidden — that's what makes them surprises!
 */
export function upcoming(state, from = state.night, span = 14) {
  const list = [];
  for (let n = from; n < from + span; n++) {
    const ev = nightEvents(state, n);
    const d = ev.date;
    if (ev.seasonal && (n === from || seasonalOn(n - 1) !== ev.seasonal)) list.push({ night: n, icon: ev.seasonal.icon, text: `${ev.seasonal.name} begins`, kind: 'seasonal' });
    if (d.phase === 4) list.push({ night: n, icon: '🌕', text: 'Full Moon — werewolf rush!', kind: 'moon' });
    if (d.phase === 0) list.push({ night: n, icon: '🌑', text: 'New Moon — shadow creatures', kind: 'moon' });
    if (ev.bus) list.push({ night: n, icon: '🚌', text: 'Ghost Tour Bus booked', kind: 'bus' });
    if (inspectionKnown(ev.inspection, state.night)) list.push({ night: n, icon: '📋', text: 'Health inspector (rumoured)', kind: 'inspection' });
    if (ev.awards) list.push({ night: n, icon: '🏆', text: 'Monster Food Awards!', kind: 'awards' });
  }
  return list;
}

/** Combined effects of tonight's moon phase. */
export function moonEffects(night) {
  const m = DB.moons[night % MOON_CYCLE];
  return {
    spawn: m.spawn || {},
    traitPay: m.traitPay || {},
    patienceMult: m.patienceMult || 1,
    tipMult: m.tipMult || 1,
    rush: m.rush || null,
  };
}
