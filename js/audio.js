/**
 * SOUND EFFECTS — synthesized live with the Web Audio API.
 * No audio files means nothing to license and nothing to download.
 *
 * Call sfx('coin'), sfx('bubble'), etc. Browsers only allow audio after the
 * player interacts with the page, so unlockAudio() runs on the first tap.
 */
import { game } from './state.js';

let ctx = null;
let master = null;

export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* audio unavailable — the game works silently */ }
}

function ready() {
  if (!ctx || !game.settings.sound) return false;
  master.gain.value = game.settings.volume * 0.5;
  return true;
}

/** One oscillator note with a quick envelope. */
function tone({ freq = 440, to = null, type = 'sine', dur = 0.15, vol = 0.3, delay = 0, attack = 0.005 }) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Filtered noise burst (sizzles, whooshes, fog). */
function noise({ dur = 0.3, vol = 0.2, delay = 0, filter = 1200, type = 'bandpass', sweepTo = null }) {
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(filter, t0);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

const SOUNDS = {
  click:   () => tone({ freq: 660, to: 520, type: 'triangle', dur: 0.06, vol: 0.15 }),
  pop:     () => tone({ freq: 380, to: 900, type: 'sine', dur: 0.1, vol: 0.25 }),
  add:     () => { tone({ freq: 300, to: 180, type: 'sine', dur: 0.12, vol: 0.3 }); noise({ dur: 0.08, vol: 0.08, filter: 800 }); },
  coin:    () => { tone({ freq: 988, type: 'square', dur: 0.08, vol: 0.12 }); tone({ freq: 1319, type: 'square', dur: 0.22, vol: 0.12, delay: 0.07 }); },
  bubble:  () => { for (let i = 0; i < 4; i++) tone({ freq: 200 + Math.random() * 200, to: 500 + Math.random() * 300, type: 'sine', dur: 0.09, vol: 0.18, delay: i * 0.09 }); },
  sizzle:  () => noise({ dur: 0.7, vol: 0.12, filter: 4000, type: 'highpass' }),
  freeze:  () => { tone({ freq: 1800, to: 2600, type: 'sine', dur: 0.4, vol: 0.08 }); noise({ dur: 0.4, vol: 0.06, filter: 6000, type: 'highpass' }); },
  zap:     () => { tone({ freq: 120, to: 1600, type: 'sawtooth', dur: 0.18, vol: 0.12 }); noise({ dur: 0.2, vol: 0.12, filter: 3000 }); },
  ding:    () => { tone({ freq: 1568, type: 'sine', dur: 0.5, vol: 0.2 }); tone({ freq: 2093, type: 'sine', dur: 0.5, vol: 0.1, delay: 0.02 }); },
  door:    () => { tone({ freq: 1175, type: 'sine', dur: 0.35, vol: 0.18 }); tone({ freq: 880, type: 'sine', dur: 0.5, vol: 0.18, delay: 0.15 }); },
  happy:   () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.18, delay: i * 0.07 })),
  meh:     () => { tone({ freq: 392, type: 'triangle', dur: 0.2, vol: 0.15 }); tone({ freq: 370, type: 'triangle', dur: 0.3, vol: 0.15, delay: 0.18 }); },
  sad:     () => { tone({ freq: 330, to: 220, type: 'triangle', dur: 0.5, vol: 0.18 }); },
  fire:    () => { noise({ dur: 0.9, vol: 0.25, filter: 500, type: 'lowpass', sweepTo: 2500 }); tone({ freq: 700, to: 200, type: 'sawtooth', dur: 0.6, vol: 0.06 }); },
  ghost:   () => { tone({ freq: 500, to: 700, type: 'sine', dur: 0.6, vol: 0.12 }); tone({ freq: 700, to: 450, type: 'sine', dur: 0.7, vol: 0.12, delay: 0.5 }); },
  boom:    () => { tone({ freq: 140, to: 40, type: 'sine', dur: 0.7, vol: 0.45 }); noise({ dur: 0.6, vol: 0.25, filter: 300, type: 'lowpass' }); },
  whoosh:  () => noise({ dur: 0.35, vol: 0.12, filter: 400, sweepTo: 3000 }),
  sneeze:  () => { tone({ freq: 300, to: 600, type: 'sine', dur: 0.25, vol: 0.12 }); noise({ dur: 0.4, vol: 0.3, filter: 2000, delay: 0.3, sweepTo: 500 }); },
  fanfare: () => [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', dur: i === 5 ? 0.6 : 0.14, vol: 0.1, delay: i * 0.13 })),
  error:   () => tone({ freq: 200, type: 'square', dur: 0.15, vol: 0.1 }),
  honk:    () => { tone({ freq: 330, type: 'square', dur: 0.2, vol: 0.12 }); tone({ freq: 294, type: 'square', dur: 0.3, vol: 0.12, delay: 0.25 }); },
  howl:    () => tone({ freq: 400, to: 900, type: 'triangle', dur: 1.1, vol: 0.12, attack: 0.3 }),
  clean:   () => noise({ dur: 0.25, vol: 0.1, filter: 2500, sweepTo: 5000 }),
};

export function sfx(name) {
  if (!ready()) return;
  try { SOUNDS[name]?.(); } catch { /* never let audio break the game */ }
}
