let AC = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
  }
  return AC;
}

export function beep(freq = 880, dur = 0.08, vol = 0.3, type = 'square') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (e) {
    console.warn("Audio Context playback error:", e);
  }
}

export function beepScan() {
  beep(1760, 0.06, 0.25, 'square');
}

export function beepError() {
  beep(200, 0.3, 0.4, 'sawtooth');
  setTimeout(() => beep(150, 0.3, 0.3, 'sawtooth'), 100);
}

export function beepSuccess() {
  beep(880, 0.08, 0.2, 'sine');
  setTimeout(() => beep(1100, 0.12, 0.2, 'sine'), 80);
}

export function beepPay() {
  [880, 1100, 1320].forEach((f, i) => {
    setTimeout(() => beep(f, 0.15, 0.25, 'sine'), i * 100);
  });
}

export function beepAlert() {
  beep(440, 0.2, 0.3, 'triangle');
}
