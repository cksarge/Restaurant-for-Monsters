/**
 * RIDDLES — turning trait lists into monster-speak, and back again.
 *
 * Markup: "[phrase|trait]" marks a phrase that secretly means a trait.
 *   parseRiddle('Soup, [but sad|gloomy]') → [{text:'Soup, '}, {text:'but sad', trait:'gloomy'}]
 */
import { DB } from './db.js';
import { pick, shuffle, chance } from './utils.js';

const MARK = /\[([^\]|]+)\|([a-z-]+)\]/g;

export function parseRiddle(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    parts.push({ text: m[1], trait: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** The distinct traits a riddle asks for. */
export const riddleTraits = (text) => [...new Set(parseRiddle(text).filter((p) => p.trait).map((p) => p.trait))];

/** Riddle with the markup removed (what the monster actually says). */
export const plainText = (text) => text.replace(MARK, '$1');

/** All [phrase|trait] pairs (used to fill the Phrasebook). */
export const riddlePhrases = (text) => parseRiddle(text).filter((p) => p.trait).map((p) => ({ phrase: p.text.toLowerCase(), trait: p.trait }));

// Change the case of the first real letter (skipping a leading "[" from the markup)
const firstLetter = (s, fn) => s.replace(/^(\[?)(.)/, (_, b, c) => b + fn(c));
const cap = (s) => firstLetter(s, (c) => c.toUpperCase());
const uncap = (s) => firstLetter(s, (c) => c.toLowerCase());

/**
 * Build a fresh riddle for a set of traits, e.g. ['soupy','gloomy','loud'] →
 * "I would like [a stew|soupy] [that has given up on its dreams|gloomy], and [that screams a little|loud]"
 */
export function generateRiddle(traits, { bare = false, noQuestion = false } = {}) {
  const P = DB.phrases;
  const order = shuffle(traits);
  // A trait with a noun form (e.g. soupy → "soup") can be the dish itself.
  const nounTrait = order.find((t) => P[t]?.noun && chance(0.85));
  const rest = order.filter((t) => t !== nounTrait);

  const adjs = [];
  const clauses = [];
  rest.forEach((t, i) => {
    // Mix adjectives and clauses so riddles don't all sound the same
    const useAdj = P[t].adj && (i === 0 ? chance(0.45) : chance(0.25)) && adjs.length < 1;
    if (useAdj) adjs.push(`[${pick(P[t].adj)}|${t}]`);
    else clauses.push({ t, text: `[${pick(P[t].clause)}|${t}]` });
  });

  const adj = adjs[0];
  const article = (markup) => (/^\[[aeiou]/i.test(markup) ? 'an' : 'a');
  let head;
  if (nounTrait) {
    // e.g. "[soup|soupy]", "a [sad|gloomy] [stew|soupy]", "[sad|gloomy] [broth|soupy]"
    const noun = pick(P[nounTrait].noun);
    const bare = noun.replace(/^an? /, '');
    if (!adj) head = `[${noun}|${nounTrait}]`;
    else if (bare !== noun) head = `${article(adj)} ${adj} [${bare}|${nounTrait}]`;
    else head = `${adj} [${noun}|${nounTrait}]`;
  } else {
    // e.g. "something [crunchy|crunchy]", "a [crunchy|crunchy] snack"
    const generic = pick(DB.dishHeads);
    if (!adj) head = generic;
    else if (/something$/.test(generic) || generic.startsWith('whatever')) head = `${generic} ${adj}`;
    else head = `${article(adj)} ${adj} ${generic.replace(/^an? /, '')}`;
  }

  let body = head;
  clauses.forEach((c, i) => {
    const clauseText = c.text;
    const startsBut = /^\[but /.test(clauseText);
    if (i === 0) body += startsBut ? `, ${clauseText}` : ` ${clauseText}`;
    else body += startsBut ? `, ${clauseText}` : `, and ${clauseText}`;
  });

  // `bare` = just the dish ("a sad stew that screams"), for voices like "TROLL WANT {order}"
  if (bare) return body;
  const frame = pick(DB.orderFrames.filter((f) => !noQuestion || !f.endsWith('?')));
  const sentence = frame.replace('{head}', body);
  return cap(sentence);
}

/** Wrap an order in the monster's personal voice. */
export function voiceWrap(monster, riddle, voice = null) {
  let v = voice || (monster.voice?.length ? pick(monster.voice) : '{order}.');
  // If the voice adds words after the order ("{order}, if you please."), drop the
  // order's own end punctuation so we don't get "dreams?, if you please."
  let after = v.slice(v.indexOf('{order}') + 7);
  if (/\?$/.test(riddle) && /^[.!]/.test(after)) after = after.slice(1);        // a question keeps its "?"
  else if (/^[,.!?]/.test(after)) riddle = riddle.replace(/[.!?]+$/, '');
  v = v.slice(0, v.indexOf('{order}') + 7) + after;
  // Mid-sentence orders start lowercase ("TROLL WANT a stew"), but not after
  // a finished sentence ("Boo! Sorry, habit. I would like…") and never "I".
  const before = v.slice(0, v.indexOf('{order}')).trim();
  const midSentence = before && (!/[.!?*]$/.test(before) || /\.\.\.$/.test(before));
  const text = midSentence && !/^\[?I\b/.test(riddle) ? uncap(riddle) : cap(riddle);
  return v.replace('{order}', text);
}

/** A complete generated order in a monster's voice for the given traits. */
export function monsterOrder(monster, traits) {
  const v = monster.voice?.length ? pick(monster.voice) : '{order}.';
  // Voices that already contain a verb ("TROLL WANT {order}") take a bare dish
  const bare = /\b(want|vant|have)\b[.\s]*\{order\}/i.test(v);
  // Voices that keep talking after the order ("{order}... pleeeease...") shouldn't follow a question
  const noQuestion = v.slice(v.indexOf('{order}') + 7).trim().length > 1;
  return voiceWrap(monster, generateRiddle(traits, { bare, noQuestion }), v);
}
