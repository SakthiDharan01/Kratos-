"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CRTMonitor } from "@/components/CRTMonitor";
import { OutroReveal } from "@/components/OutroReveal";
import {
  boom,
  impact,
  isAudioOn,
  powerOnSFX,
  resumeAudio,
  startDrone,
  stinger,
  stopDrone,
  tone,
  noiseBurst,
} from "@/lib/audio";
import {
  type CrtPhase,
  type StoryPhase,
  PHASE_MS,
  PHASE_MS_REDUCED,
  nextStoryPhase,
} from "@/lib/phases";
import { buildBranches, drawFrame, type BranchDef } from "@/lib/timelineDraw";

export function KratosTeaser() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [crtPhase, setCrtPhase] = useState<CrtPhase>("off");
  const [story, setStory] = useState<StoryPhase>("dead");
  const [hint, setHint] = useState("PRESS POWER TO BEGIN");
  const [sndHint, setSndHint] = useState(true);
  const phaseStart = useRef(performance.now());
  const branches = useRef<BranchDef[]>(buildBranches(14, 42));
  const reduceRef = useRef(false);
  const nexusFired = useRef(false);
  const identifyFired = useRef(false);
  const transitioning = useRef(false);
  const [powerBusy, setPowerBusy] = useState(false);
  const advancing = useRef(false);
  const storyRef = useRef<StoryPhase>("dead");
  const crtRef = useRef<CrtPhase>("off");
  const videoTimer = useRef<number | null>(null);
  const powerTimers = useRef<number[]>([]);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const timings = () => (reduceRef.current ? PHASE_MS_REDUCED : PHASE_MS);

  const clearPowerTimers = () => {
    powerTimers.current.forEach((t) => window.clearTimeout(t));
    powerTimers.current = [];
  };

  const setStoryPhase = useCallback((p: StoryPhase) => {
    advancing.current = false;
    storyRef.current = p;
    setStory(p);
    phaseStart.current = performance.now();

    if (p === "stable") startDrone();
    if (p === "variance") tone(560, 0.12, "triangle", 0.1);
    if (p === "escalate") tone(300, 0.18, "sawtooth", 0.12, 620);
    if (p === "anomaly") tone(174, 0.35, "sawtooth", 0.22, 90);
    if (p === "nexus") {
      /* impact fired mid-phase */
    }
    if (p === "analyse") {
      stopDrone();
      tone(320, 0.2, "sawtooth", 0.1, 220);
    }
    if (p === "identify" && !identifyFired.current) {
      identifyFired.current = true;
      stinger();
    }
    if (p === "critical") {
      noiseBurst(0.4, 0.2, 800);
      tone(90, 0.5, "sawtooth", 0.15, 50);
    }
    if (p === "logged") tone(440, 0.25, "sine", 0.12);
    if (p === "signalLost") {
      stopDrone();
      tone(1500, 0.14, "square", 0.22, 180);
    }
    if (p === "reveal") {
      setHint("");
      boom();
    }
    if (p !== "dead" && p !== "reveal" && p !== "video") {
      setHint("TAP TO SKIP");
    }
  }, []);

  const startVideo = useCallback(() => {
    setCrtPhase("on");
    crtRef.current = "on";
    setHint("");
    setStoryPhase("video");
  }, [setStoryPhase]);

  // Play only after React paints CRT on + .clip-on (avoids stuck/black video)
  useEffect(() => {
    if (story !== "video") return;

    setCrtPhase("on");
    crtRef.current = "on";

    const v = videoRef.current;
    if (!v) return;

    let cancelled = false;
    let stallCheck: number | null = null;

    const tryPlay = async () => {
      if (cancelled) return;
      try {
        if (v.currentTime > 0.05) v.currentTime = 0;
      } catch {
        /* ignore seek errors */
      }
      // Prefer unmuted if user already enabled sound; fall back to muted for autoplay
      v.muted = !isAudioOn();
      try {
        await v.play();
      } catch {
        v.muted = true;
        try {
          await v.play();
        } catch {
          /* autoplay blocked */
        }
      }
    };

    const kick = () => {
      if (v.readyState >= 2) void tryPlay();
      else v.addEventListener("loadeddata", () => void tryPlay(), { once: true });
    };

    // Defer one frame so opacity / CRT classes have applied
    const raf = requestAnimationFrame(kick);

    if (videoTimer.current) window.clearTimeout(videoTimer.current);
    // Fallback if ended never fires
    videoTimer.current = window.setTimeout(() => {
      if (storyRef.current === "video") setStoryPhase("reveal");
    }, 90000);

    // If playback never advances, skip to reveal instead of staying stuck
    stallCheck = window.setTimeout(() => {
      if (storyRef.current === "video" && v.currentTime < 0.15 && v.paused) {
        setStoryPhase("reveal");
      }
    }, 4000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (stallCheck) window.clearTimeout(stallCheck);
    };
  }, [story, setStoryPhase]);

  const advance = useCallback(() => {
    if (advancing.current) return;
    const cur = storyRef.current;
    if (cur === "dead" || cur === "reveal") return;
    advancing.current = true;
    if (cur === "video") {
      const v = videoRef.current;
      if (v) v.pause();
      setStoryPhase("reveal");
      return;
    }
    if (cur === "flicker") {
      startVideo();
      return;
    }
    if (cur === "signalLost") {
      setCrtPhase("powering-down");
      crtRef.current = "powering-down";
      setStoryPhase("flicker");
      return;
    }
    const n = nextStoryPhase(cur);
    if (n === "video") startVideo();
    else if (n) setStoryPhase(n);
    else advancing.current = false;
  }, [setStoryPhase, startVideo]);

  const enterDead = useCallback(() => {
    clearPowerTimers();
    if (videoTimer.current) window.clearTimeout(videoTimer.current);
    stopDrone();
    transitioning.current = false;
    setPowerBusy(false);
    advancing.current = false;
    nexusFired.current = false;
    identifyFired.current = false;
    branches.current = buildBranches(14, Math.floor(Math.random() * 1000));
    const v = videoRef.current;
    if (v) {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
    setCrtPhase("off");
    crtRef.current = "off";
    setStoryPhase("dead");
    setHint("PRESS POWER TO BEGIN");
  }, [setStoryPhase]);

  const powerOn = useCallback(async () => {
    if (crtRef.current !== "off" || transitioning.current) return;
    if (storyRef.current !== "dead") return;
    transitioning.current = true;
    setPowerBusy(true);
    await resumeAudio();
    setSndHint(false);
    powerOnSFX();

    if (reduceRef.current) {
      setCrtPhase("on");
      crtRef.current = "on";
      transitioning.current = false;
      setPowerBusy(false);
      setStoryPhase("boot");
      return;
    }

    setCrtPhase("warming");
    crtRef.current = "warming";
    clearPowerTimers();
    powerTimers.current.push(
      window.setTimeout(() => {
        setCrtPhase("glitching");
        crtRef.current = "glitching";
      }, 520),
      window.setTimeout(() => {
        setCrtPhase("on");
        crtRef.current = "on";
        transitioning.current = false;
        setPowerBusy(false);
        setStoryPhase("boot");
      }, 1320),
    );
  }, [setStoryPhase]);

  // canvas loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = rect.width;
      const H = rect.height;
      if (W < 2 || H < 2) return;

      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const phase = storyRef.current;
      const el = performance.now() - phaseStart.current;
      const msKey = phase as keyof typeof PHASE_MS;
      const phaseMs = timings()[msKey] ?? 1000;
      const t = performance.now() / 1000;

      if (phase === "nexus" && el / phaseMs > 0.32 && !nexusFired.current) {
        nexusFired.current = true;
        impact();
      }

      // auto-advance timed story phases
      if (
        phase !== "dead" &&
        phase !== "video" &&
        phase !== "reveal" &&
        phase in timings() &&
        el >= phaseMs
      ) {
        advance();
        return;
      }

      drawFrame({
        ctx,
        W,
        H,
        phase,
        el,
        phaseMs,
        t,
        branches: branches.current,
        reduce: reduceRef.current,
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [advance]);

  // skip on body pointer (not power)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        if (storyRef.current === "dead") powerOn();
        else resumeAudio();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [powerOn]);

  const onVideoEnded = () => {
    if (storyRef.current === "video") setStoryPhase("reveal");
  };

  const skip = () => {
    if (storyRef.current === "dead" || storyRef.current === "reveal") return;
    if (transitioning.current) return;
    resumeAudio();
    advance();
  };

  const showCanvas = story !== "reveal";
  const showStage = story !== "reveal";

  return (
    <div className="teaser-root">
      {showStage && (
        <div className="stage" onPointerDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest(".crt-power-button") || t.closest(".replay")) return;
          if (storyRef.current === "dead") {
            powerOn();
            return;
          }
          skip();
        }}>
          <div className="unit">
            <div className="logohdr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/eec-white.png"
                alt="Easwari Engineering College"
                className="eec"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/cse-logo.png"
                alt="Department of Computer Science and Engineering"
                className="dept"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/ACE-white.png"
                alt="Association of Computer Engineers"
                className="ace"
              />
            </div>

            <CRTMonitor
              phase={crtPhase}
              onPower={powerOn}
              powerDisabled={crtPhase !== "off" || powerBusy}
              video={
                <video
                  ref={videoRef}
                  className={`clip${story === "video" ? " clip-on" : ""}`}
                  src="/assets/intro.mp4"
                  playsInline
                  preload="auto"
                  onEnded={onVideoEnded}
                />
              }
            >
              {showCanvas && (
                <canvas
                  ref={canvasRef}
                  className={`crt-canvas${story === "video" ? " crt-canvas-hide" : ""}`}
                />
              )}
            </CRTMonitor>
          </div>

          {hint && story !== "video" && (
            <div className={`hint ${story === "dead" ? "power-hint" : ""}`}>{hint}</div>
          )}
        </div>
      )}

      {sndHint && (
        <button
          type="button"
          className="sndhint"
          onPointerDown={(e) => {
            e.stopPropagation();
            resumeAudio();
            setSndHint(false);
          }}
        >
          TAP FOR SOUND
        </button>
      )}

      <OutroReveal active={story === "reveal"} onReplay={enterDead} />
    </div>
  );
}
