import type { StoryPhase } from "./phases";

/**
 * Sacred Timeline — TVA monitor language (ref: Loki + shubhxg/marvel-loki-tva-website):
 * - Dual orange rails frame the tube (site uses #aa2d0a borders)
 * - Bright white core signal between them (timebranches.png hero line)
 * - Smooth orange arcs sprout from the white signal (not chaotic filaments)
 * - One red Kratos anomaly grows from the white core and breaches the rails
 */

export const C = {
  base: "#040507",
  grid: "rgba(249,134,26,0.14)",
  rail: "#aa2d0a",
  railHot: "#f9861a",
  wave: "#ffffff",
  waveGlow: "rgba(255,235,210,0.95)",
  branch: "#f9861a",
  branchCore: "#ffc878",
  branchDeep: "#b86517",
  cse: "#e0120a",
  cseHot: "#ff5540",
  amber: "#f9861a",
  warn: "#ff3b2e",
  white: "#eafaff",
};

export type Pt = { x: number; y: number };

export type BranchDef = {
  rootT: number;
  dir: 1 | -1;
  /** how far the arc reaches from the core (normalized) */
  len: number;
  /** sideways lean along +x (timeline flow) */
  lean: number;
  /** curve bow — larger = more ECG / root-like arc */
  bow: number;
  seed: number;
};

/** Nexus red branch always roots on the white signal */
export const ANOMALY_ROOT_T = 0.52;
export const ANOMALY_DIR: 1 | -1 = -1;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Straight Sacred Timeline rails — TVA border language (no bow) */
export const RAIL_TOP = 0.3;
export const RAIL_BOT = 0.7;
/** Inset so white/orange stay clearly inside the tube */
export const RAIL_PAD = 0.022;

export function railY(_xn: number, which: "top" | "bot") {
  return which === "top" ? RAIL_TOP : RAIL_BOT;
}

/** White core — gentle continuous left→right scroll */
export function signalY(xn: number, t: number, reduce = false) {
  const p = (xn - 0.04) / 0.92;
  const maxAmp = (RAIL_BOT - RAIL_TOP) * 0.5 - RAIL_PAD - 0.02;
  const amp = Math.min(0.028, maxAmp);
  const scroll = reduce ? t * 0.08 : t * 0.18;
  const jitter = reduce ? 0 : Math.sin(t * 14 + xn * 18) * 0.001;
  const y =
    0.5 +
    amp * Math.sin((p - scroll) * Math.PI * 1.6) +
    amp * 0.22 * Math.sin((p - scroll * 1.2) * Math.PI * 3.4 + 0.5) +
    amp * 0.1 * Math.sin((p - scroll * 0.65) * Math.PI * 5.8) +
    jitter;
  return clamp(y, RAIL_TOP + RAIL_PAD, RAIL_BOT - RAIL_PAD);
}

function rnd(seed: number, n: number) {
  const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Sparse elegant arcs inside the Sacred Timeline band.
 * Max reach stops short of the rails — only the red Kratos line breaches.
 */
export function buildBranches(count: number, seed = 1): BranchDef[] {
  const out: BranchDef[] = [];
  // Half-band minus pad: room from center (0.5) to inner rail
  const maxReach = (RAIL_BOT - RAIL_TOP) * 0.5 - RAIL_PAD - 0.01;
  for (let i = 0; i < count; i++) {
    const s = seed + i * 19.17;
    const r = (n: number) => rnd(s, n);
    out.push({
      rootT: 0.08 + (i / Math.max(1, count - 1)) * 0.84 + (r(1) - 0.5) * 0.018,
      dir: i % 2 === 0 ? -1 : 1,
      len: 0.08 + r(4) * maxReach * 0.85,
      lean: 0.03 + r(5) * 0.08,
      bow: 0.45 + r(6) * 0.45,
      seed: s,
    });
  }
  return out.sort((a, b) => a.rootT - b.rootT);
}

function sampleSignal(t: number, reduce: boolean): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 160; i++) {
    const xn = 0.02 + (i / 160) * 0.96;
    pts.push({ x: xn, y: signalY(xn, t, reduce) });
  }
  return pts;
}

function pointOnSignal(signal: Pt[], rootT: number): Pt {
  const i = clamp(rootT, 0, 0.999) * (signal.length - 1);
  const i0 = Math.floor(i);
  const i1 = Math.min(signal.length - 1, i0 + 1);
  const f = i - i0;
  return {
    x: lerp(signal[i0].x, signal[i1].x, f),
    y: lerp(signal[i0].y, signal[i1].y, f),
  };
}

function clampInBand(y: number) {
  return clamp(y, RAIL_TOP + RAIL_PAD, RAIL_BOT - RAIL_PAD);
}

/**
 * Smooth TVA arc from white core — tip clamped inside the rail band.
 */
function branchPath(root: Pt, b: BranchDef, grow: number): Pt[][] {
  const g = clamp(grow, 0, 1);
  if (g <= 0.02) return [[{ ...root }]];

  const tipX = clamp(root.x + b.lean * (0.7 + b.bow * 0.4), 0.04, 0.96);
  const tipY = clampInBand(root.y + b.dir * b.len);
  const ctrlX = root.x + b.lean * 0.35 + (rnd(b.seed, 11) - 0.5) * 0.02;
  const ctrlY = clampInBand(root.y + b.dir * b.len * (0.35 + b.bow * 0.25));

  const steps = 18;
  const gSteps = Math.max(2, Math.ceil(steps * g));
  const main: Pt[] = [];
  for (let s = 0; s <= gSteps; s++) {
    const u = s / steps;
    const omu = 1 - u;
    const x = omu * omu * root.x + 2 * omu * u * ctrlX + u * u * tipX;
    const y = clampInBand(omu * omu * root.y + 2 * omu * u * ctrlY + u * u * tipY);
    main.push({ x, y });
  }
  return [main];
}

/**
 * Red anomaly: grows FROM the white signal and breaches past the lower rail.
 */
function anomalyPath(signal: Pt[], progress: number, t: number, reduce: boolean): Pt[] {
  const root = pointOnSignal(signal, ANOMALY_ROOT_T);
  const g = clamp(progress, 0, 1);
  if (g <= 0.01) return [root];

  const tipX = clamp(root.x + 0.06, 0.05, 0.95);
  // Past lower rail — only Kratos exits the Sacred Timeline
  const tipY = clamp(root.y + ANOMALY_DIR * 0.42, 0.08, 0.94);
  const ctrlX = root.x + 0.02;
  const ctrlY = root.y + ANOMALY_DIR * 0.2;

  const steps = 36;
  const gSteps = Math.max(1, Math.ceil(steps * g));
  const pts: Pt[] = [];
  for (let s = 0; s <= gSteps; s++) {
    const u = s / steps;
    const omu = 1 - u;
    let x = omu * omu * root.x + 2 * omu * u * ctrlX + u * u * tipX;
    let y = omu * omu * root.y + 2 * omu * u * ctrlY + u * u * tipY;
    if (!reduce) x += Math.sin(u * 14 + t * 3.5) * 0.004;
    pts.push({ x: clamp(x, 0.05, 0.95), y: clamp(y, 0.08, 0.94) });
  }
  return pts;
}

function strokePath(
  ctx: CanvasRenderingContext2D,
  path: Pt[],
  X: (n: number) => number,
  Y: (n: number) => number,
  color: string,
  width: number,
  blur: number,
  alpha = 1,
) {
  if (path.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  path.forEach((p, i) => {
    if (i === 0) ctx.moveTo(X(p.x), Y(p.y));
    else ctx.lineTo(X(p.x), Y(p.y));
  });
  ctx.stroke();
  ctx.restore();
}

function drawRails(ctx: CanvasRenderingContext2D, W: number, H: number, alpha: number) {
  const drawOne = (which: "top" | "bot") => {
    const y = railY(0, which) * H;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "butt";
    // Straight TVA bars — full width (ref: border-top/bottom solid #aa2d0a)
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.strokeStyle = "rgba(170,45,10,0.55)";
    ctx.lineWidth = Math.max(6, H * 0.02);
    ctx.shadowColor = "rgba(249,134,26,0.85)";
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.strokeStyle = C.railHot;
    ctx.lineWidth = Math.max(2.2, H * 0.008);
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.strokeStyle = "#ffc878";
    ctx.lineWidth = Math.max(0.8, H * 0.0025);
    ctx.shadowBlur = 2;
    ctx.stroke();
    ctx.restore();
  };
  drawOne("top");
  drawOne("bot");
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  signal: Pt[],
  W: number,
  H: number,
  alpha: number,
) {
  const X = (n: number) => n * W;
  const Y = (n: number) => n * H;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trace = () => {
    ctx.beginPath();
    signal.forEach((p, i) => {
      if (i === 0) ctx.moveTo(X(p.x), Y(p.y));
      else ctx.lineTo(X(p.x), Y(p.y));
    });
    ctx.stroke();
  };
  ctx.strokeStyle = "rgba(255,240,220,0.4)";
  ctx.lineWidth = Math.max(7, H * 0.028);
  ctx.shadowColor = C.waveGlow;
  ctx.shadowBlur = 22;
  trace();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(2.5, H * 0.012);
  ctx.shadowBlur = 9;
  trace();
  ctx.restore();
}

function drawBranchGlow(
  ctx: CanvasRenderingContext2D,
  paths: Pt[][],
  W: number,
  H: number,
  intensity: number,
) {
  const X = (n: number) => n * W;
  const Y = (n: number) => n * H;
  paths.forEach((path) => {
    strokePath(ctx, path, X, Y, "rgba(184,101,23,0.4)", Math.max(4, H * 0.014) * intensity, 14, 0.95);
    strokePath(ctx, path, X, Y, C.branch, Math.max(1.6, H * 0.006) * intensity, 7, 1);
    strokePath(ctx, path, X, Y, C.branchCore, Math.max(0.7, H * 0.002), 1.5, 0.8);
  });
}

function drawAnomaly(
  ctx: CanvasRenderingContext2D,
  signal: Pt[],
  progress: number,
  t: number,
  W: number,
  H: number,
  intensity: number,
  reduce: boolean,
) {
  if (progress <= 0.02) return;
  const X = (n: number) => n * W;
  const Y = (n: number) => n * H;
  const pts = anomalyPath(signal, progress, t, reduce);
  strokePath(ctx, pts, X, Y, "rgba(255,30,20,0.45)", Math.max(9, H * 0.042), 26, intensity);
  strokePath(ctx, pts, X, Y, C.cse, Math.max(3.2, H * 0.016), 12, intensity);
  strokePath(ctx, pts, X, Y, C.cseHot, Math.max(1.4, H * 0.0055), 4, intensity);
}

function drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  // Finer graph-paper grid like the TVA reference graphic
  for (let i = 1; i < 24; i++) {
    const x = (i / 24) * W;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let j = 1; j < 16; j++) {
    const y = (j / 16) * H;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawScreenText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  W: number,
  H: number,
  alpha: number,
) {
  if (!lines.length || alpha <= 0) return;
  let size = Math.min(H * 0.055, W * 0.038, 16);
  const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");
  ctx.save();
  ctx.font = `600 ${size}px "Courier New", VT323, monospace`;
  const maxW = W * 0.72;
  while (size > 9 && ctx.measureText(longest).width > maxW) {
    size -= 0.5;
    ctx.font = `600 ${size}px "Courier New", VT323, monospace`;
  }
  const lh = size * 1.3;
  const x0 = W * 0.045;
  const y0 = H * 0.78;
  ctx.globalAlpha = alpha;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, i) => {
    const warn = /⚠|WARNING|CRITICAL|NEXUS|KRATOS|SIGNAL LOST|IDENTIFIED|CONTAINMENT|TRACING|SOURCE|CSE|EASWARI|SYMPOSIUM/.test(line);
    ctx.fillStyle = warn ? C.warn : C.amber;
    ctx.shadowColor = warn ? "rgba(255,40,25,0.9)" : "rgba(255,150,30,0.75)";
    ctx.shadowBlur = 7;
    ctx.fillText(line, x0, y0 + i * lh);
  });
  ctx.restore();
}

function drawNoise(ctx: CanvasRenderingContext2D, W: number, H: number, amount: number, reduce: boolean) {
  if (reduce || amount <= 0) return;
  const n = Math.floor(40 * amount);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = `rgba(255,${100 + Math.random() * 100},${60 + Math.random() * 40},${0.04 + Math.random() * 0.06})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1);
  }
}

function drawGlitch(ctx: CanvasRenderingContext2D, W: number, H: number, intensity: number) {
  if (intensity <= 0) return;
  const slices = Math.floor(3 + intensity * 5);
  for (let i = 0; i < slices; i++) {
    const y = Math.random() * H;
    const h = 2 + Math.random() * H * 0.035 * intensity;
    const ox = (Math.random() - 0.5) * W * 0.04 * intensity;
    ctx.fillStyle =
      Math.random() > 0.5
        ? `rgba(255,60,40,${0.08 + 0.1 * intensity})`
        : `rgba(255,180,80,${0.06 + 0.08 * intensity})`;
    ctx.fillRect(ox, y, W, h);
  }
}

function drawCollapse(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  p: number,
  label: string,
) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (label && p < 0.35) drawScreenText(ctx, [label], W, H, 1 - p / 0.35);
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "#bfefff";
  ctx.shadowBlur = 40;
  if (p < 0.55) {
    const h = lerp(H, 2, easeInOut(p / 0.55));
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, (H - h) / 2, W, h);
  } else if (p < 0.82) {
    const w = lerp(W, 2, easeInOut((p - 0.55) / 0.27));
    ctx.fillRect((W - w) / 2, H / 2 - 1, w, 2);
  } else {
    const s = lerp(3, 0, (p - 0.82) / 0.18);
    if (s > 0.2) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFlicker(ctx: CanvasRenderingContext2D, W: number, H: number, p: number) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (p < 0.3) {
    drawNoise(ctx, W, H, 0.7, false);
    if (Math.random() > 0.4) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.2})`;
      ctx.fillRect(0, 0, W, H);
    }
  } else if (p < 0.55) {
    ctx.fillStyle = `rgba(255,255,255,${easeOut((p - 0.3) / 0.25)})`;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = `rgba(255,255,255,${1 - (p - 0.55) / 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
}

export type DrawArgs = {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
  phase: StoryPhase;
  el: number;
  phaseMs: number;
  t: number;
  branches: BranchDef[];
  reduce: boolean;
};

export function drawFrame(args: DrawArgs) {
  const { ctx, W, H, phase, el, phaseMs, t, branches, reduce } = args;
  const p = phaseMs > 0 ? clamp(el / phaseMs, 0, 1) : 0;

  if (phase === "dead") {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (phase === "signalLost") {
    drawCollapse(ctx, W, H, p, "SIGNAL LOST");
    return;
  }

  if (phase === "flicker") {
    drawFlicker(ctx, W, H, p);
    return;
  }

  if (phase === "video" || phase === "reveal") return;

  ctx.fillStyle = C.base;
  ctx.fillRect(0, 0, W, H);

  const signal = sampleSignal(t, reduce);

  // Progressive density — still rooted on the white line
  const branchCount =
    phase === "variance"
      ? Math.min(8, branches.length)
      : phase === "escalate"
        ? Math.min(14, branches.length)
        : ["anomaly", "approach", "nexus", "analyse", "identify", "critical", "logged"].includes(phase)
          ? branches.length
          : 0;

  const growAll =
    phase === "variance" ? easeOut(p) : phase === "escalate" ? 0.5 + 0.5 * easeOut(p) : 1;

  const drawBranchSet = (count: number, growBase: number) => {
    for (let i = 0; i < count; i++) {
      const b = branches[i];
      const start = (i / Math.max(1, count)) * 0.4;
      const g = clamp((growBase - start) / 0.5, 0, 1);
      if (g <= 0) continue;
      const root = pointOnSignal(signal, b.rootT);
      const paths = branchPath(root, b, easeOut(g));
      drawBranchGlow(ctx, paths, W, H, 0.9 + 0.1 * g);
    }
  };

  // Draw order (TVA): grid → rails → orange branches → white core → red anomaly → chrome
  const paintTimeline = (
    railsA: number,
    waveA: number,
    count: number,
    grow: number,
    anomalyProg: number | null,
    anomalyI = 1,
  ) => {
    drawGrid(ctx, W, H, 0.35);
    drawRails(ctx, W, H, railsA);
    if (count > 0) drawBranchSet(count, grow);
    drawWave(ctx, signal, W, H, waveA);
    if (anomalyProg != null && anomalyProg > 0) {
      drawAnomaly(ctx, signal, anomalyProg, t, W, H, anomalyI, reduce);
    }
  };

  if (phase === "boot") {
    paintTimeline(0.9, 0.7, 0, 0, null);
    drawNoise(ctx, W, H, 0.05, reduce);
    return;
  }

  if (phase === "stable") {
    paintTimeline(1, 1, 0, 0, null);
    drawNoise(ctx, W, H, 0.04, reduce);
    return;
  }

  if (phase === "variance") {
    paintTimeline(1, 1, branchCount, growAll, null);
    drawNoise(ctx, W, H, 0.06, reduce);
    return;
  }

  if (phase === "escalate") {
    paintTimeline(1, 1, branchCount, growAll, null);
    drawNoise(ctx, W, H, 0.08, reduce);
    return;
  }

  // Red line sprouts from white signal (0 → short nub → longer toward rail)
  if (phase === "anomaly") {
    paintTimeline(1, 1, branches.length, 1, lerp(0.08, 0.35, easeOut(p)), 1);
    drawNoise(ctx, W, H, 0.08, reduce);
    return;
  }

  // Approaching / breaching the lower Sacred Timeline rail
  if (phase === "approach") {
    paintTimeline(1, 1, branches.length, 1, lerp(0.35, 0.55, easeOut(p)), 1.1);
    drawScreenText(
      ctx,
      ["⚠ WARNING", "TEMPORAL VARIANCE"],
      W,
      H,
      clamp(p / 0.25, 0, 1),
    );
    drawNoise(ctx, W, H, 0.1, reduce);
    return;
  }

  if (phase === "nexus") {
    const ap = lerp(0.55, 0.95, easeOut(p));
    paintTimeline(1, 1, branches.length, 1, ap, 1.25);
    if (p > 0.28 && p < 0.55) {
      ctx.fillStyle = `rgba(255,255,255,${0.18 * (1 - Math.abs(p - 0.4) / 0.15)})`;
      ctx.fillRect(0, 0, W, H);
      drawGlitch(ctx, W, H, 1.1);
    }
    if (p > 0.4) {
      drawScreenText(
        ctx,
        ["⚠ WARNING", "NEXUS EVENT DETECTED", "CSE SYMPOSIUM"],
        W,
        H,
        1,
      );
    }
    drawNoise(ctx, W, H, 0.15, reduce);
    return;
  }

  if (phase === "analyse") {
    paintTimeline(1, 1, branches.length, 1, 0.92, 0.85);
    drawScreenText(
      ctx,
      ["TRACING SOURCE...", "EASWARI ENGINEERING COLLEGE"],
      W,
      H,
      clamp(p / 0.2, 0, 1),
    );
    drawNoise(ctx, W, H, 0.08, reduce);
    return;
  }

  if (phase === "identify") {
    paintTimeline(1, 1, branches.length, 1, 0.95, 0.9);
    drawScreenText(
      ctx,
      ["EVENT IDENTIFIED", "KRATOS'26"],
      W,
      H,
      clamp(p / 0.25, 0, 1),
    );
    drawNoise(ctx, W, H, 0.06, reduce);
    return;
  }

  if (phase === "critical") {
    ctx.save();
    if (!reduce) ctx.translate((Math.random() - 0.5) * 3 * p, (Math.random() - 0.5) * 2 * p);
    paintTimeline(1, 1, branches.length, 1, 0.95, 1 + p * 0.25);
    if (p > 0.2) drawGlitch(ctx, W, H, 0.45 + p * 0.7);
    ctx.restore();
    drawScreenText(
      ctx,
      ["KRATOS'26", "CONTAINMENT FAILED"],
      W,
      H,
      clamp(p / 0.2, 0, 1),
    );
    drawNoise(ctx, W, H, 0.12 + p * 0.12, reduce);
    return;
  }

  if (phase === "logged") {
    // Keep Sacred Timeline + branches until signal collapse — no extra copy
    paintTimeline(1, 1, branches.length, 1, 0.95, 1);
    drawNoise(ctx, W, H, 0.04, reduce);
  }
}
