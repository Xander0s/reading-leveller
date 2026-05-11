# Reading Leveller

A Progressive Web App for Victorian primary teachers (Prep–Year 6). Photograph a page from a text and get:

1. A **Lexile** estimate.
2. A **three-tier rubric rating** (below / at / above standard) for a target year level, based on a rubric PDF that ships with the app.

Built for classroom use — works on a phone, installs as a PWA, and uses Claude's vision model for OCR + levelling in a single round-trip.

## Architecture

```
┌──────────────────┐         ┌─────────────────────────┐         ┌────────────────┐
│ React PWA        │ POST    │ Cloudflare Pages        │ POST    │ Anthropic API  │
│ (Vite + Tailwind)│ /api/   │ Function (functions/api │  ───►   │ (Claude vision)│
│                  │ level   │ /level.ts)              │         │                │
│  • Camera/upload │ ───────►│  • Holds API key        │         │                │
│  • JPEG resize   │         │  • Injects rubric       │         │                │
│  • Result UI     │ ◄─────  │  • Parses JSON output   │ ◄─────  │                │
└──────────────────┘         └─────────────────────────┘         └────────────────┘
```

**The Anthropic API key never reaches the browser.** It lives only as a Cloudflare Pages environment variable, read by the Pages Function.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind, PWA via `vite-plugin-pwa`
- **Backend:** Cloudflare Pages Functions (single deploy with the frontend)
- **AI:** Claude (`claude-sonnet-4-6` by default; override via `ANTHROPIC_MODEL` env var)
- **Rubric:** parsed from a PDF in `public/rubric/` at build time → `src/generated/rubric.ts`

## Local development

```bash
# 1. Install
npm install

# 2. Drop your rubric PDF into public/rubric/ then parse it
npm run build:rubric

# 3. Set the API key for local Pages Function dev
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste your sk-ant-... key

# 4a. Front-end only (mock the API yourself, no Claude calls)
npm run dev
# → http://localhost:5173

# 4b. Full stack with the Pages Function proxying to Claude
npm run dev:functions
# → http://localhost:8788
```

`npm run dev` runs Vite alone and proxies `/api/*` to `http://127.0.0.1:8788` — so you can run both side by side: `wrangler pages dev` in one terminal, `npm run dev` in another.

## Deploying to Cloudflare Pages

One-time:

1. Push this repo to GitHub.
2. In the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick this repo.
3. Build settings: framework preset **None**, build command `npm run build`, output directory `dist`.
4. **Settings → Environment variables (Production):** add `ANTHROPIC_API_KEY` as an encrypted variable.
5. (Optional) Add `ANTHROPIC_MODEL` and `ALLOWED_ORIGIN` if you want to override defaults.

Subsequent deploys are automatic on `git push`.

To deploy from your laptop instead:

```bash
wrangler login
wrangler pages project create reading-leveller
wrangler pages secret put ANTHROPIC_API_KEY --project-name reading-leveller
npm run deploy
```

## Replacing the rubric

1. Drop a new PDF into `public/rubric/` (replacing the old one — the parser picks the first `.pdf` it finds).
2. Run `npm run build:rubric`.
3. Check `src/generated/rubric.ts` — if year levels or tiers are missing, tweak the regex patterns at the top of `scripts/build-rubric.mjs` and re-run.

The rubric ships as compiled-in TS data, not as a downloadable PDF — students can't access the file from the deployed site.

## Year-level support

Prep (Foundation), Year 1 through Year 6. Year-level codes are `F, 1, 2, 3, 4, 5, 6`. Labels follow Victorian Curriculum 2.0 conventions.

## Notes

- Lexile estimates are **approximate**. Treat as a guide, not a published measure.
- PWA installs from any modern mobile browser (iOS Safari → Share → Add to Home Screen; Android Chrome → install prompt).
- Photos are processed in-memory by the Pages Function and forwarded to Anthropic — neither the image nor the transcript is persisted server-side by this app.

## Project layout

```
.
├── functions/api/level.ts      # Cloudflare Pages Function — Claude proxy
├── public/
│   ├── favicon.svg
│   └── rubric/                 # Drop PDFs here (gitignored)
├── scripts/build-rubric.mjs    # PDF → src/generated/rubric.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/             # PhotoCapture, ResultsCard, LexileGauge, TierBadge, Spinner
│   ├── generated/rubric.ts     # AUTO-GENERATED
│   └── lib/                    # api.ts, image.ts, types.ts
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── wrangler.toml
└── package.json
```
