"use client";

type Props = {
  active: boolean;
  onReplay: () => void;
};

export function OutroReveal({ active, onReplay }: Props) {
  const soon = "COMING SOON".split("").map((ch, i) => (
    <span key={i} style={{ ["--i" as string]: i }}>
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));

  return (
    <>
      <div className={`reveal ${active ? "on" : ""}`} id="reveal">
        <div className="reveal-logos">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="eecFoot" src="/assets/eec-white.png" alt="Easwari Engineering College" />
          <span className="div" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="easwari" src="/assets/cse-logo.png" alt="Dept. of CSE" />
          <span className="div" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="aceLogo" src="/assets/ACE-white.png" alt="ACE" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="rlion"
          src="/assets/lion-mark.png"
          alt="Association of Computer Engineers"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="wordmark-img" src="/assets/kratos26.png" alt="KRATOS'26" />
        <div className="soon">{soon}</div>
      </div>
      <button
        type="button"
        className={`replay ${active ? "on" : ""}`}
        aria-label="Replay intro"
        onClick={onReplay}
      >
        Replay
      </button>
    </>
  );
}
