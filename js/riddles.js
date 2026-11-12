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

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Build a fresh riddle for a set of traits, e.g. ['soupy','gloomy','loud'] →
 * "I would like [a stew|soupy] [that has given up on its dreams|gloomy], and [that screams a little|loud]"
 */
export function generateRiddle(traits) {
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

  const frame = pick(DB.orderFrames);
  const sentence = frame.replace('{head}', body);
  return cap(sentence);
}

/** Wrap an order in the monster's personal voice. */
export function voiceWrap(monster, riddle) {
  const v = monster.voice?.length ? pick(monster.voice) : '{order}.';
  const lower = riddle.charAt(0).toLowerCase() + riddle.slice(1);
  // Keep the riddle's capital letter when it starts the sentence.
  return v.startsWith('{order}') ? v.replace('{order}', riddle) : v.replace('{order}', lower);
}
