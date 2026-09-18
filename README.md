# KRATOS'26 — Temporal Monitor Teaser

Next.js App Router teaser: CSS CRT shell + Loki-inspired Sacred Timeline canvas, then the intro video and coming-soon outro.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Dead CRT — press the power button (or tap the stage)
2. Analog CRT warmup / glitch
3. Temporal monitoring → Sacred Timeline (dual rails + dense orange branches)
4. Kratos-red anomaly → Nexus Event → **KRATOS'26**
5. Signal lost → `/assets/intro.mp4` → outro (lion / wordmark / COMING SOON)

## Assets

Files in `public/assets/` (from the Kratos26 asset pack):

- `intro.mp4`
- `kratos26.png`
- `lion-mark.png`
- `crest.png`

## Stack

- Next.js 16 + React 19 + TypeScript
- Plain CSS (CRT shell ported from crt-glow-magic)
- Canvas `requestAnimationFrame` timeline (no motion library)
