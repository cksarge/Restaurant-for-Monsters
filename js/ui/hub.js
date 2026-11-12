/**
 * HUB — between shifts. Read last night's report, shop at the Market, buy
 * upgrades, hire staff, check goals and the calendar, then open for the night.
 */
import { DB } from '../db.js';
import { game } from '../state.js';
import { h, $, pick } from '../utils.js';
import { dateInfo, nightEvents, upcoming, inspectionKnown } from '../calendar.js';
import {
  marketIngredients, lockedIngredients, buyIngredient, upgradeAvailable, buyUpgrade,
  hireHelper, fireHelper, nightlyWages, spookiness,
} from '../economy.js';
import { monsterSVG, stationSVG } from './sprites.js';
import { signEl } from './room.js';
import { toast, confirmDialog } from './fx.js';
import { saveGame } from '../save.js';
import { sfx } from '../audio.js';

let tab = 'market';
let handlers = {};

const traitChip = (t) => h('span', { class: 'chip trait', style: { '--tc': DB.traits[t].color } }, DB.traits[t].icon, ' ', DB.traits[t].name);

export function renderHub(opts) {
  handlers = opts || handlers;
  const s = game.state;
  const view = $('#view-hub');
  view.innerHTML = '';
  const d = dateInfo(s.night);
  const ev = nightEvents(s, s.night);

  // ---- Tonight card ----
  const tonight = h('div', { class: 'card tonight' },
    signEl(),
    h('h2', {}, `Tonight: ${d.dayName}, ${d.month.name} ${d.nightOfMonth + 1}`),
    h('div', { class: 'tonight-tags' },
      h('span', { class: 'chip big-chip', title: d.moon.effect }, `${d.moon.icon} ${d.moon.name}`),
      ev.seasonal ? h('span', { class: 'chip big-chip event' }, `${ev.seasonal.icon} ${ev.seasonal.name}`) : null,
      ev.bus ? h('span', { class: 'chip big-chip' }, '🚌 Ghost Tour Bus booked') : null,
      inspectionKnown(ev.inspection, s.night) ? h('span', { class: 'chip big-chip warn' }, '📋 Inspector rumoured!') : null,
      ev.awards ? h('span', { class: 'chip big-chip event' }, '🏆 Awards night!') : null),
    h('p', { class: 'muted' }, d.moon.effect, ev.seasonal ? ` ${ev.seasonal.desc}` : ''),
    rumors(),
    h('button', { class: 'btn primary big open-btn pulse-glow', id: 'open-btn', onclick: () => handlers.onOpen?.() }, `🌙 Open for Night ${s.night + 1}`),
    h('div', { class: 'quick-actions' },
      h('button', { class: 'btn', onclick: () => handlers.onBuild?.() }, '🛠️ Build Mode'),
      h('button', { class: 'btn', onclick: () => handlers.onCalendar?.() }, '📅 Calendar'),
      h('button', { class: 'btn', onclick: () => handlers.onBook?.() }, '📖 Recipes'),
      h('button', { class: 'btn', onclick: () => handlers.onGuide?.() }, '👾 Monsters')),
  );

  // ---- Shop tabs ----
  const tabBar = h('div', { class: 'tabs' }, [['market', '🛒 Market'], ['upgrades', '🔧 Upgrades'], ['staff', '🧟 Staff'], ['goals', '🏅 Goals']].map(([id, label]) =>
    h('button', { class: `tab${tab === id ? ' active' : ''}`, onclick: () => { tab = id; sfx('click'); renderHub(); } }, label)));
  const body = h('div', { class: 'tab-body' }, tab === 'market' ? market() : tab === 'upgrades' ? upgrades() : tab === 'staff' ? staff() : goals());

  view.append(h('div', { class: 'hub-grid' },
    h('div', { class: 'hub-left' }, tonight, s.lastSummary ? lastNightCard(s.lastSummary) : welcomeCard()),
    h('div', { class: 'hub-right card' }, tabBar, body)));
}

function rumors() {
  const s = game.state;
  const items = [];
  for (const insp of s.schedule?.inspections || []) {
    if (inspectionKnown(insp, s.night) && insp.night >= s.night) {
      const who = pick(DB.rumorWho);
      const day = insp.night === s.night ? 'TONIGHT' : dateInfo(insp.night).dayName;
      items.push(h('li', { class: 'rumor warn' }, '🗣️ ', pick(DB.inspector.rumors).replace('{who}', who).replace('{day}', day)));
    }
  }
  const up = upcoming(s, s.night + 1, 5).filter((u) => u.kind === 'seasonal' || u.kind === 'awards' || u.kind === 'bus');
  for (const u of up.slice(0, 2)) items.push(h('li', { class: 'rumor' }, `${u.icon} ${dateInfo(u.night).dayName}: ${u.text}`));
  return items.length ? h('ul', { class: 'rumors' }, items) : null;
}

function welcomeCard() {
  return h('div', { class: 'card report' }, h('h3', {}, 'Welcome to your restaurant!'),
    h('p', {}, 'Monsters order in riddles. Decode what traits they want, combine ingredients at a cooking station, and serve them before their patience runs out.'));
}

function lastNightCard(sum) {
  const rep = sum.repDelta || 0;
  return h('div', { class: 'card report' },
    h('h3', {}, `📜 Night ${sum.night + 1} Report`),
    h('div', { class: 'report-stats' },
      stat('🍽️', sum.served, 'served'), stat('😍', sum.delighted, 'delighted'), stat('😐', sum.unimpressed, 'meh'),
      stat('😵‍💫', sum.confused, 'confused'), stat('🔥', sum.onfire, 'on fire'), stat('🚪', sum.walkouts, 'walked out')),
    h('p', {}, `Earned `, h('b', {}, `${sum.coins + sum.tips}🪙`), ` (${sum.tips} in tips)${sum.wages ? ` · Staff wages −${sum.wages}🪙` : ''} · Reputation `, h('b', { class: rep >= 0 ? 'good' : 'bad' }, `${rep >= 0 ? '+' : ''}${rep.toFixed(2)}★`)),
    sum.critic ? reviewEl(sum.critic) : null,
    sum.inspection ? h('p', { class: sum.inspection.passed ? 'good' : 'bad' }, sum.inspection.passed ? `📋 Passed the health inspection! +${DB.inspector.passReward.coins}🪙` : `📋 Failed the health inspection. −${DB.inspector.failPenalty.coins}🪙`) : null,
    sum.newRecipes?.length ? h('p', {}, '⭐ New signature dishes: ', sum.newRecipes.join(', ')) : null,
    sum.story?.length ? h('ul', { class: 'story-list' }, sum.story.map((t) => h('li', {}, '💜 ', t))) : null,
    sum.goals?.length ? h('p', {}, '🏅 Goals completed: ', sum.goals.join(', ')) : null,
    sum.backfires?.length ? h('p', { class: 'muted' }, '💥 Kitchen mishaps: ', [...new Set(sum.backfires)].join(', ')) : null,
    ...(sum.notes || []).map((n) => h('p', { class: 'muted' }, n)),
    ...(sum.unlocks || []).map((n) => h('p', { class: 'unlock-note' }, n)),
  );
}

const stat = (icon, n, label) => h('div', { class: 'stat' }, h('span', { class: 'stat-icon' }, icon), h('b', {}, n), h('small', {}, label));

export function reviewEl(r) {
  return h('div', { class: 'review' },
    h('div', { class: 'review-paper' }, DB.critic.paper),
    h('div', { class: 'review-stars' }, '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars)),
    h('div', { class: 'review-head' }, `“${r.headline}”`),
    h('p', {}, r.body),
    h('small', { class: 'muted' }, `— ${DB.critic.name} · Reputation ${r.repDelta >= 0 ? '+' : ''}${r.repDelta.toFixed(2)}★`));
}

// ---------- Market ----------
function market() {
  const s = game.state;
  const list = marketIngredients();
  const locked = lockedIngredients();
  return h('div', {},
    h('p', { class: 'muted' }, 'Stock up before opening. Traits stay a mystery until you cook with an ingredient!'),
    h('div', { class: 'market' }, list.map((ing) => {
      const qty = s.pantry[ing.id] || 0;
      const known = s.knownIngredients[ing.id];
      return h('div', { class: `market-item${ing.event ? ' limited' : ''}` },
        h('span', { class: 'mi-emoji' }, ing.emoji),
        h('div', { class: 'mi-info' },
          h('b', {}, ing.name, ing.event ? h('span', { class: 'chip event' }, '⏳ Limited') : null),
          h('div', { class: 'mi-traits' }, known ? ing.traits.map(traitChip) : h('span', { class: 'muted' }, '??? (cook to discover)')),
          h('small', { class: 'muted' }, ing.desc)),
        h('div', { class: 'mi-buy' },
          h('span', { class: 'mi-stock' }, `Have ×${qty}`),
          h('div', { class: 'row' },
            h('button', { class: 'btn small', disabled: s.coins < ing.cost, onclick: () => buy(ing.id, 1) }, `+1 · ${ing.cost}🪙`),
            h('button', { class: 'btn small green', disabled: s.coins < ing.cost * 5, onclick: () => buy(ing.id, 5) }, `+5 · ${ing.cost * 5}🪙`))));
    })),
    locked.length ? h('div', { class: 'locked-list' }, h('h4', {}, 'Coming soon'), h('div', { class: 'row' }, locked.map((ing) =>
      h('span', { class: 'chip locked', title: ing.rep !== undefined ? `Unlocks at ${ing.rep}★` : 'Unlocked by a goal or a regular' }, '❔ ', ing.rep !== undefined ? `${ing.rep}★` : '🎁')))) : null,
  );
}

function buy(id, qty) {
  if (buyIngredient(id, qty)) { sfx('coin'); saveGame(); renderHub(); }
  else { sfx('error'); toast({ icon: '🪙', text: 'Not enough coins!' }); }
}

// ---------- Upgrades ----------
function upgrades() {
  const s = game.state;
  return h('div', { class: 'upgrade-list' }, DB.upgradeList.map((up) => {
    const owned = s.upgrades.includes(up.id);
    const avail = upgradeAvailable(up);
    const why = owned ? '' : s.rep < (up.minRep || 0) ? `Needs ${up.minRep}★` : up.requires && !s.upgrades.includes(up.requires) ? `Needs ${DB.upgrades[up.requires].name}` : '';
    return h('div', { class: `upgrade${owned ? ' owned' : ''}${!avail && !owned ? ' locked' : ''}` },
      up.type === 'station' ? h('div', { class: 'up-art', html: stationSVG(up.id) }) : h('span', { class: 'up-icon' }, up.icon),
      h('div', { class: 'up-info' }, h('b', {}, up.name), h('small', { class: 'muted' }, up.desc)),
      owned ? h('span', { class: 'chip good' }, '✓ Owned') : h('button', {
        class: 'btn small primary', disabled: !avail || s.coins < up.cost,
        onclick: () => { if (buyUpgrade(up.id)) { sfx('fanfare'); toast({ icon: up.icon, text: `${up.name} purchased!` }); saveGame(); renderHub(); handlers.onChange?.(); } },
      }, why || `${up.cost}🪙`));
  }));
}

// ---------- Staff ----------
function staff() {
  const s = game.state;
  return h('div', {},
    h('p', { class: 'muted' }, `Hire up to ${DB.maxHelpers} helpers. Wages are paid each night (currently ${nightlyWages()}🪙/night).`),
    h('div', { class: 'staff-list' }, DB.helperList.filter((hp) => s.unlockedHelpers.includes(hp.id) || hp.reward).map((hp) => {
      const hired = s.helpers.includes(hp.id);
      const unlocked = s.unlockedHelpers.includes(hp.id);
      return h('div', { class: `staff${hired ? ' hired' : ''}${unlocked ? '' : ' locked'}` },
        h('div', { class: 'staff-art', html: unlocked ? monsterSVG(hp.art, { mood: hired ? 'delighted' : 'neutral' }) : monsterSVG(hp.art) }),
        h('div', { class: 'staff-info' },
          h('b', {}, unlocked ? `${hp.name} the ${hp.role}` : '??? (unlock through a story)'),
          unlocked ? h('p', {}, '✅ ', hp.perk) : null,
          unlocked ? h('p', { class: 'muted' }, '🙃 ', hp.quirkText) : null,
          unlocked ? h('small', {}, `Hire ${hp.hire}🪙 · Wage ${hp.wage}🪙/night`) : null),
        unlocked ? (hired
          ? h('button', { class: 'btn small ghost', onclick: async () => { if (await confirmDialog('Let them go?', `${hp.name} will leave the restaurant (no refund).`, 'Let go')) { fireHelper(hp.id); saveGame(); renderHub(); handlers.onChange?.(); } } }, 'Let go')
          : h('button', { class: 'btn small primary', disabled: s.helpers.length >= DB.maxHelpers || s.coins < hp.hire, onclick: () => { if (hireHelper(hp.id)) { sfx('fanfare'); toast({ icon: '🤝', text: `${hp.name} joins the team!` }); saveGame(); renderHub(); handlers.onChange?.(); } } }, s.helpers.length >= DB.maxHelpers ? 'Team full' : `Hire · ${hp.hire}🪙`)) : null);
    })));
}

// ---------- Goals ----------
function goals() {
  const s = game.state;
  spookiness(s);
  const ev = nightEvents(s, s.night).seasonal;
  return h('div', { class: 'goal-list' },
    ev ? (() => {
      const prog = s.eventProgress[`${ev.id}-${Math.floor(s.night / 112)}`] || { count: 0 };
      return h('div', { class: `goal event${prog.done ? ' done' : ''}` }, h('span', { class: 'goal-icon' }, ev.icon),
        h('div', { class: 'goal-info' }, h('b', {}, `${ev.name}: ${ev.goal.text}`), h('div', { class: 'bar' }, h('i', { style: { width: `${Math.min(1, prog.count / ev.goal.count) * 100}%` } })), h('small', {}, `${Math.min(prog.count, ev.goal.count)} / ${ev.goal.count} · Reward: ${ev.goal.reward.coins}🪙`)));
    })() : null,
    DB.goals.map((g) => {
      const done = s.goalsDone.includes(g.id);
      const [cur, target] = g.progress ? g.progress(s) : [done ? 1 : 0, 1];
      const reward = [g.reward.coins ? `${g.reward.coins}🪙` : '', g.reward.rep ? `+${g.reward.rep}★` : '', g.reward.unlockIngredients || g.reward.unlockItems ? '🎁 unlock' : ''].filter(Boolean).join(' · ');
      return h('div', { class: `goal${done ? ' done' : ''}` }, h('span', { class: 'goal-icon' }, done ? '🏅' : '🎯'),
        h('div', { class: 'goal-info' }, h('b', {}, g.name), h('small', { class: 'muted' }, g.desc),
          h('div', { class: 'bar' }, h('i', { style: { width: `${Math.min(1, cur / target) * 100}%` } })),
          h('small', {}, done ? 'Complete!' : `${Math.min(cur, target)} / ${target} · Reward: ${reward}`)));
    }));
}
