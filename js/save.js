/**
 * SAVE / LOAD
 *
 * Progress is stored in the browser's localStorage. Every access is wrapped in
 * try/catch: private browsing, blocked cookies or a full disk just mean the
 * game runs without saving instead of crashing.
 *
 * Saves only happen between shifts (and after Build Mode changes). If you
 * reload mid-shift, you'll restart that night from the beginning.
 */
import { game, migrateState } from './state.js';

const SAVE_KEY = 'rfm-save-v1';
const SETTINGS_KEY = 'rfm-settings-v1';

function storage() {
  try {
    const s = window.localStorage;
    const probe = '__rfm_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export const storageAvailable = () => storage() !== null;

export function saveGame() {
  if (!game.state) return false;
  try {
    const s = storage();
    if (!s) return false;
    // `_`-prefixed fields are runtime caches; don't persist them.
    const json = JSON.stringify(game.state, (k, v) => (k.startsWith('_') ? undefined : v));
    s.setItem(SAVE_KEY, json);
    return true;
  } catch (err) {
    console.warn('Could not save the game:', err);
    return false;
  }
}

export function hasSave() {
  try {
    return !!storage()?.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    if (!raw) return null;
    return migrateState(JSON.parse(raw));
  } catch (err) {
    console.warn('Save file could not be read — starting fresh.', err);
    return null;
  }
}

export function deleteSave() {
  try { storage()?.removeItem(SAVE_KEY); } catch { /* nothing to do */ }
}

export function saveSettings() {
  try { storage()?.setItem(SETTINGS_KEY, JSON.stringify(game.settings)); } catch { /* ignore */ }
}

export function loadSettings() {
  try {
    const raw = storage()?.getItem(SETTINGS_KEY);
    if (raw) Object.assign(game.settings, JSON.parse(raw));
  } catch { /* defaults are fine */ }
}
