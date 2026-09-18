export type StoryPhase =
  | "dead"
  | "boot"
  | "stable"
  | "variance"
  | "escalate"
  | "anomaly"
  | "approach"
  | "nexus"
  | "analyse"
  | "identify"
  | "critical"
  | "logged"
  | "signalLost"
  | "flicker"
  | "video"
  | "reveal";

export type CrtPhase = "off" | "warming" | "glitching" | "on" | "powering-down";

export const PHASE_MS: Record<
  | "boot"
  | "stable"
  | "variance"
  | "escalate"
  | "anomaly"
  | "approach"
  | "nexus"
  | "analyse"
  | "identify"
  | "critical"
  | "logged"
  | "signalLost"
  | "flicker",
  number
> = {
  boot: 2000,
  stable: 2000,
  variance: 1600,
  escalate: 1800,
  anomaly: 1500,
  approach: 1000,
  nexus: 1100,
  analyse: 2000,
  identify: 1600,
  critical: 2000,
  logged: 1100,
  signalLost: 700,
  flicker: 450,
};

export const PHASE_MS_REDUCED: typeof PHASE_MS = {
  boot: 800,
  stable: 800,
  variance: 700,
  escalate: 700,
  anomaly: 700,
  approach: 500,
  nexus: 500,
  analyse: 900,
  identify: 800,
  critical: 800,
  logged: 500,
  signalLost: 400,
  flicker: 200,
};

export const STORY_ORDER: StoryPhase[] = [
  "boot",
  "stable",
  "variance",
  "escalate",
  "anomaly",
  "approach",
  "nexus",
  "analyse",
  "identify",
  "critical",
  "logged",
  "signalLost",
  "flicker",
  "video",
  "reveal",
];

export function nextStoryPhase(phase: StoryPhase): StoryPhase | null {
  const i = STORY_ORDER.indexOf(phase);
  if (i < 0 || i >= STORY_ORDER.length - 1) return null;
  return STORY_ORDER[i + 1];
}
