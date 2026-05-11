# Rubric PDFs

Drop your rubric PDF here (any filename ending in `.pdf`). The first PDF found will be parsed at build time.

Then run:

```
npm run build:rubric
```

This writes `src/generated/rubric.ts`, which is imported by the Cloudflare Pages Function and injected into the Claude prompt.

If the parser can't detect year-level or tier headings, it prints a warning and keeps the previous generated file. Either:

1. Tweak the `YEAR` / `TIER` regex patterns in `scripts/build-rubric.mjs` to match your rubric's wording, or
2. Edit `src/generated/rubric.ts` by hand — it is just a normal TypeScript file.

PDFs in this folder are **not** copied to the client bundle. The static asset path `public/rubric/` happens to be convenient and gitignored; the rubric ships as inlined data in the generated TS, not as a downloadable file.
