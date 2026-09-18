let AC: AudioContext | null = null;
let master: GainNode | null = null;
let audioOn = false;
let drone: OscillatorNode | null = null;
let droneGain: GainNode | null = null;

export function initAudio() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = AC.createGain();
    master.gain.value = 0.5;
    master.connect(AC.destination);
    audioOn = true;
  } catch {
    audioOn = false;
  }
}

export async function resumeAudio() {
  initAudio();
  if (AC?.state === "suspended") {
    try {
      await AC.resume();
    } catch {
      /* ignore */
    }
  }
}

export function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "square",
  peak = 0.22,
  glideTo: number | null = null,
) {
  if (!audioOn || !AC || !master) return;
  const t = AC.currentTime;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.03);
}

export function noiseBurst(dur = 0.3, peak = 0.28, lp = 1200) {
  if (!audioOn || !AC || !master) return;
  const t = AC.currentTime;
  const b = AC.createBuffer(1, Math.max(1, AC.sampleRate * dur), AC.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  }
  const n = AC.createBufferSource();
  n.buffer = b;
  const f = AC.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = lp;
  const g = AC.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f);
  f.connect(g);
  g.connect(master);
  n.start(t);
}

export function powerOnSFX() {
  noiseBurst(0.12, 0.18, 4000);
  tone(180, 0.55, "sawtooth", 0.14, 1400);
  tone(70, 0.4, "sine", 0.2, 180);
}

export function impact() {
  tone(150, 0.5, "sine", 0.5, 48);
  noiseBurst(0.35, 0.22, 900);
}

export function stinger() {
  tone(320, 0.5, "sawtooth", 0.18, 1000);
  tone(480, 0.55, "square", 0.12, 1300);
}

export function boom() {
  tone(90, 0.9, "sine", 0.6, 38);
  noiseBurst(0.7, 0.32, 1500);
  tone(220, 0.7, "sawtooth", 0.12, 60);
}

export function startDrone() {
  if (!audioOn || !AC || !master || drone) return;
  drone = AC.createOscillator();
  drone.type = "sawtooth";
  drone.frequency.value = 68;
  const f = AC.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 280;
  droneGain = AC.createGain();
  droneGain.gain.value = 0.0001;
  drone.connect(f);
  f.connect(droneGain);
  droneGain.connect(master);
  drone.start();
  droneGain.gain.linearRampToValueAtTime(0.11, AC.currentTime + 0.3);
}

export function stopDrone() {
  if (!drone || !AC || !droneGain) return;
  try {
    droneGain.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.2);
    drone.stop(AC.currentTime + 0.26);
  } catch {
    /* ignore */
  }
  drone = null;
  droneGain = null;
}

export function isAudioOn() {
  return audioOn;
}
