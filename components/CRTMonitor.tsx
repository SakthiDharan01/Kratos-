"use client";

import type { ReactNode } from "react";
import type { CrtPhase } from "@/lib/phases";

type Props = {
  children?: ReactNode;
  video?: ReactNode;
  phase: CrtPhase;
  onPower: () => void;
  powerDisabled?: boolean;
  className?: string;
};

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2v10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 5.5a8 8 0 1 0 11 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CRTMonitor({
  children,
  video,
  phase,
  onPower,
  powerDisabled,
  className = "",
}: Props) {
  const isOn = phase !== "off" && phase !== "powering-down";
  const speakers = Array.from({ length: 42 }, (_, i) => i);

  return (
    <section className={`crt-monitor ${className}`} aria-label="CRT monitor">
      <div className="crt-top-ridge" aria-hidden="true" />
      <div className="crt-face">
        <div className="crt-screen-frame">
          <div className={`crt-glass crt-${phase}`}>
            <div className="crt-content" aria-hidden={!isOn}>
              {children}
              {video}
            </div>
            <div className="crt-warmup-line" aria-hidden="true" />
            <div className="crt-static" aria-hidden="true" />
            <div className="crt-scanlines" aria-hidden="true" />
            <div className="crt-glass-shade" aria-hidden="true" />
            <div className="crt-reflection" aria-hidden="true" />
          </div>
        </div>

        <aside className="crt-controls" aria-label="Monitor controls">
          <div className="crt-control-blank" aria-hidden="true" />
          <div className="crt-knob-well">
            <div className="crt-knob" aria-hidden="true">
              <span />
            </div>
          </div>
          <div className="crt-knob-well crt-knob-well-small">
            <div className="crt-knob crt-knob-small" aria-hidden="true">
              <span />
            </div>
          </div>
          <div className="crt-push-row" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="crt-speaker" aria-hidden="true">
            {speakers.map((i) => (
              <i key={i} />
            ))}
          </div>
          <div className="crt-power-zone">
            <span
              className={`crt-led ${isOn ? "crt-led-on" : ""}`}
              aria-label={isOn ? "Power on" : "Power off"}
            />
            <button
              type="button"
              className="crt-power-button"
              onPointerDown={(e) => {
                e.preventDefault();
                if (!powerDisabled) onPower();
              }}
              disabled={powerDisabled}
              aria-pressed={isOn}
              aria-label={isOn ? "Monitor powered on" : "Turn monitor on"}
            >
              <PowerIcon />
            </button>
          </div>
        </aside>
      </div>
      <div className="crt-seam" aria-hidden="true" />
      <div className="crt-base" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
