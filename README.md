# Reading Leveller

A PWA for a Victorian primary school (Prep–Year 6) that photographs a page from a text and returns a **3-dimensional demand profile** using the school's own *Resource Organisation Process* rubric:

- **D — Decoding demand** (aligns with DIBELS)
- **L — Language demand** (aligns with CUBED NLM)
- **K — Knowledge demand**

Each dimension is rated **Low / Medium / High** on the school's 3-point scale. A Lexile estimate is provided as a *secondary* signal only — used when D/L/K cannot be differentiated. The tool is **not** for "levelling" texts; it answers *"what makes this text hard, and for whom?"*

The full rubric is in [docs/Resource Organisation Process 2026.pdf](docs/Resource%20Organisation%20Process%202026.pdf) and inlined in [src/lib/rubric.ts](src/lib/rubric.ts).

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
- **AI:** Claude (`claude-sonnet-4-6` by default; override via `ANTHROPIC_MODEL`)
- **Rubric:** hard-coded in `src/lib/rubric.ts` (~50 lines), injected into the Claude system prompt with prompt caching

## Local development

```bash
# 1. Install
npm install

# 2. Set the API key for local Pages Function dev
cp .dev.vars.example .dev.vars
# edit .dev.vars and paste your sk-ant-... key

# 3a. Front-end only
npm run dev
# → http://localhost:5173

# 3b. Full stack (frontend + Pages Function → Claude)
npm run dev:functions
# → http://localhost:8788
```

`npm run dev` runs Vite alone and proxies `/api/*` to `http://127.0.0.1:8788` — so you can run both side by side: `wrangler pages dev` in one terminal, `npm run dev` in another.

## Deploying to Cloudflare Pages

One-time:

1. Push this repo to GitHub (already done — [github.com/Xander0s/reading-leveller](https://github.com/Xander0s/reading-leveller)).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick this repo.
3. Build settings: framework preset **None**, build command `npm run build`, output directory `dist`.
4. **Settings → Environment variables (Production):** add `ANTHROPIC_API_KEY` as an encrypted variable.
5. (Optional) Add `ANTHROPIC_MODEL` (e.g. `claude-opus-4-7`) or `ALLOWED_ORIGIN` overrides.

Subsequent deploys are automatic on `git push`.

To deploy from your laptop instead:

```bash
wrangler login
wrangler pages project create reading-leveller
wrangler pages secret put ANTHROPIC_API_KEY --project-name reading-leveller
npm run deploy
```

## Updating the rubric

The rubric lives in [src/lib/rubric.ts](src/lib/rubric.ts) as a single typed constant. If the school document changes:

1. Update the bullet lists in `RUBRIC.dimensions.*`.
2. (Optional) Replace the reference PDF in `docs/`.
3. `git commit && git push` — Cloudflare auto-deploys.

No build script, no PDF parsing — the rubric is small enough that hand-edits are simpler and lossless.

## Output schema

```ts
{
  textTitle: string | null,
  transcript: string,
  dimensions: {
    decoding:  { rating: 'L' | 'M' | 'H', rationale: string, evidence: string[] },
    language:  { rating: 'L' | 'M' | 'H', rationale: string, evidence: string[] },
    knowledge: { rating: 'L' | 'M' | 'H', rationale: string, evidence: string[] }
  },
  lexile: { estimate: number | null, band: string | null, note: string },
  warnings?: string[]
}
```

## UI conventions

- **Colour palette matches the school document**: Low = red, Medium = amber, High = green. These denote *demand level* (high demand is green because it's the most challenging — matching the existing palette teachers see in the printed rubric). Don't invert.
- Every result shows the school's summary tag format: `D: M | L: H | K: M`.
- Lexile appears as a small grey chip below the three dimension cards — deliberately secondary.

## Notes

- Lexile estimates are **approximate**. Treat as a guide, not a published measure.
- PWA installs from any modern mobile browser (iOS Safari → Share → Add to Home Screen; Android Chrome → install prompt).
- Photos are processed in-memory by the Pages Function and forwarded to Anthropic — neither the image nor the transcript is persisted server-side by this app.

## Project layout

```
.
├── docs/                       # Reference: original rubric PDF
├── functions/api/level.ts      # Cloudflare Pages Function — Claude proxy
├── public/favicon.svg
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/             # PhotoCapture, DimensionCard, SummaryTag, LexileChip, ResultsCard, Spinner
│   └── lib/                    # api.ts, image.ts, rubric.ts, types.ts
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── wrangler.toml
└── package.json
```
