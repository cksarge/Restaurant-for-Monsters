/**
 * MAIN — boots the game and moves between screens:
 *   Title → (Letter) → Shift ⇄ Hub ⇄ Build Mode → Awards → …
 */
import { DB, validateData } from './db.js';
import { game, on, newGameState } from './state.js';
import { $, h } from './utils.js';
import { saveGame, loadGame, hasSave, deleteSave, loadSettings, storageAvailable } from './save.js';
import { unlockAudio, sfx } from './audio.js';
import { ensureSchedule, NIGHTS_PER_YEAR, yearOf } from './calendar.js';
import { refreshUnlocks } from './economy.js';
import { startShift, setPaused, closeUp, abandonShift } from './shift.js';
import { runInspection } from './events.js';
import { openBuild } from './build.js';
import { startTutorial } from './tutorial.js';
import { renderHud, updateHudClock, initHudEvents } from './ui/hud.js';
import { renderHub } from './ui/hub.js';
import { renderDining, updateDining, initDiningEvents } from './ui/dining.js';
import { renderKitchen, updateKitchen, initKitchenEvents } from './ui/kitchen.js';
import { openRecipeBook, openMonsterGuide, openCalendar, openSettings } from './ui/modals.js';
import { renderTitle, showLetter, showNightReport, showAwards, showHowToPlay } from './ui/screens.js';
import { toast, confetti, modalOpen, closeTopModal, confirmDialog } from './ui/fx.js';
import { startPopupManager } from './ui/popups.js';

// ---------- Settings → CSS ----------
function applySettings() {
  const st = game.settings;
  document.documentElement.style.setProperty('--anim-k', st.animSpeed ? String(1 / st.animSpeed) : '0.01');
  document.body.classList.toggle('reduce-motion', st.animSpeed === 0);
}

// ---------- Screens & views ----------
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function showView(view) {
  game.ui.view = view;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  $('#screen-game').dataset.view = view;
}

const hudHandlers = {
  onCalendar: () => openCalendar(),
  onBook: () => openRecipeBook(),
  onGuide: () => openMonsterGuide(),
  onSettings: () => openGameSettings(),
  onPause: () => { if (game.shift) { setPaused(!game.shift.paused); showPauseVeil(game.shift.paused); } },
};

function openGameSettings() {
  const wasPaused = game.shift?.paused;
  if (game.shift) setPaused(true);
  openSettings({
    onTitle: () => { abandonShift(); location.reload(); },
    onRestart: () => { abandonShift(); deleteSave(); location.reload(); },
  });
  // Unpause when the settings modal closes
  const watch = setInterval(() => { if (!modalOpen()) { clearInterval(watch); if (game.shift && !wasPaused) setPaused(false); } }, 200);
}

function showPauseVeil(on) {
  $('#pause-veil')?.remove();
  if (!on) return;
  document.body.append(h('div', { id: 'pause-veil', onclick: () => { setPaused(false); showPauseVeil(false); } },
    h('div', { class: 'pause-card card' }, h('h2', {}, '⏸️ Paused'), h('p', { class: 'muted' }, 'The monsters are politely frozen in time.'), h('button', { class: 'btn primary big' }, '▶️ Resume'))));
}

// ---------- Title ----------
function goTitle() {
  showScreen('screen-title');
  renderTitle({
    hasSave: hasSave(),
    onContinue: () => { unlockAudio(); sfx('door'); continueGame(); },
    onNew: async () => {
      unlockAudio();
      if (hasSave()) {
        if (!(await confirmDialog('Start over?', 'Starting a new game will replace your saved restaurant.', 'New game'))) return;
      }
      newGame();
    },
    onSettings: () => { unlockAudio(); openSettings(); },
    onHelp: () => { unlockAudio(); showHowToPlay(); },
  });
}

function newGame() {
  game.state = newGameState();
  ensureSchedule(game.state);
  saveGame();
  showScreen('screen-game');
  showView('hub');
  renderHud(hudHandlers);
  renderHub(hubHandlers);
  showLetter(() => beginNight());
}

function continueGame() {
  const loaded = loadGame();
  if (!loaded) return newGame();
  game.state = loaded;
  ensureSchedule(game.state);
  refreshUnlocks();
  showScreen('screen-game');
  goHub();
}

// ---------- Hub ----------
const hubHandlers = {
  onOpen: () => beginNight(),
  onBuild: () => goBuild(),
  onCalendar: () => openCalendar(),
  onBook: () => openRecipeBook(),
  onGuide: () => openMonsterGuide(),
  onChange: () => renderHud(hudHandlers),
};

function goHub() {
  ensureSchedule(game.state);
  showView('hub');
  renderHud(hudHandlers);
  renderHub(hubHandlers);
}

function goBuild() {
  showView('build');
  openBuild({ onDone: () => { sfx('click'); goHub(); } });
}

// ---------- Shift ----------
function setPane(pane) {
  const v = $('#view-shift');
  v.dataset.pane = pane;
  document.querySelectorAll('.pane-tab').forEach((b) => b.classList.toggle('active', b.dataset.pane === pane));
}
const isNarrow = () => window.matchMedia('(max-width: 899px)').matches;

function beginNight() {
  const s = game.state;
  showView('shift');
  startShift();
  renderHud(hudHandlers);
  renderDining(() => openCalendar());
  renderKitchen();
  setPane('dining');
  if (s.night === 0 && !s.tutorialDone) startTutorial(setPane);
  sfx('door');
}

function updateOrderBadge() {
  const sh = game.shift;
  const badge = $('#kitchen-badge');
  if (!sh || !badge) return;
  const n = sh.customers.filter((c) => c.state === 'seated').length;
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}

// ---------- Global event wiring ----------
function wireEvents() {
  initHudEvents();
  initDiningEvents();
  initKitchenEvents();

  on('shift:tick', (sh) => { updateDining(sh); updateKitchen(sh); updateHudClock(); });
  on('toast', (t) => toast(t));
  on('customer:seated', updateOrderBadge);
  on('customer:leave', updateOrderBadge);
  on('served', updateOrderBadge);

  // On phones, flip between panes so the action is always visible
  on('order:tapped', () => { if (isNarrow()) setPane('kitchen'); });
  on('served', () => { if (isNarrow()) setTimeout(() => setPane('dining'), 250); });

  on('inspection:start', () => { runInspection().then(() => renderHud(hudHandlers)); });
  on('backfire', (bf) => { toast({ icon: bf.icon, text: `${bf.name}! ${bf.text}`, big: true }); document.body.classList.add('screen-shake'); setTimeout(() => document.body.classList.remove('screen-shake'), 500); });
  on('recipe:discovered', (dish) => { toast({ icon: '⭐', text: `Signature dish discovered: ${dish.name}!`, big: true }); sfx('fanfare'); confetti(window.innerWidth * 0.7, window.innerHeight * 0.5, 30); });
  on('goal', ({ goal, msgs }) => { toast({ icon: '🏅', text: `Goal complete: ${goal.name}! ${msgs.join(' ')}`, big: true }); sfx('fanfare'); });
  on('story', ({ reg }) => toast({ icon: '💜', text: `${reg.name}'s story moved forward!` }));

  on('shift:end', (sum) => {
    showPauseVeil(false);
    renderHud(hudHandlers);
    showNightReport(sum, () => {
      const s = game.state;
      // The last night of each year ends with the Monster Food Awards
      const finishedYear = yearOf(s.night - 1);
      if (s.night % NIGHTS_PER_YEAR === 0 && !s.awardsYears.includes(finishedYear)) {
        showScreen('screen-awards');
        showAwards(() => { saveGame(); showScreen('screen-game'); goHub(); });
      } else goHub();
    });
  });

  // Pause automatically when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.shift && !game.shift.paused) { setPaused(true); showPauseVeil(true); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalOpen()) closeTopModal();
      else if (game.shift) hudHandlers.onPause();
    }
  });

  // Mobile pane tabs
  document.querySelectorAll('.pane-tab').forEach((b) => b.addEventListener('click', () => { sfx('click'); setPane(b.dataset.pane); }));
  $('#close-up-btn')?.addEventListener('click', () => closeUp());
  on('shift:tick', (sh) => { $('#close-up-btn')?.classList.toggle('hidden', !sh.closing); });

  on('settings', applySettings);
  document.addEventListener('pointerdown', unlockAudio, { once: true });
}

// ---------- Boot ----------
function boot() {
  loadSettings();
  // Respect the OS "reduce motion" preference on first run
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !localStorageHasSettings()) game.settings.animSpeed = 0;
  applySettings();
  validateData();
  wireEvents();
  startPopupManager();
  goTitle();
  if (!storageAvailable()) setTimeout(() => toast({ icon: '💾', text: 'Saving is unavailable in this browser mode — progress will be lost when you close the tab.', big: true }), 800);
  window.RFM = { game, DB, saveGame }; // handy for debugging in the console
}

function localStorageHasSettings() {
  try { return !!window.localStorage.getItem('rfm-settings-v1'); } catch { return false; }
}

boot();
