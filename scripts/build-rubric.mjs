// Parses a rubric PDF in public/rubric/ and writes src/generated/rubric.ts.
//
// This is a heuristic extractor: it pulls all text from the PDF and groups
// it by year-level headings + tier headings using regex. The first run after
// you drop your real rubric in will likely need a tweak to the patterns
// below — see TWEAK markers. The placeholder fallback keeps the app
// buildable until then.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const RUBRIC_DIR = join(ROOT, 'public', 'rubric');
const OUT = join(ROOT, 'src', 'generated', 'rubric.ts');

const YEAR_CODES = ['F', '1', '2', '3', '4', '5', '6'];
const YEAR_LABELS = {
  F: 'Prep (Foundation)',
  1: 'Year 1', 2: 'Year 2', 3: 'Year 3',
  4: 'Year 4', 5: 'Year 5', 6: 'Year 6',
};

// TWEAK: tier label aliases — extend with whatever wording your rubric uses.
const TIER_PATTERNS = [
  { tier: 'below', label: 'Below standard', re: /\b(below|working towards|approaching|emerging)\b/i },
  { tier: 'at',    label: 'At standard',    re: /\b(at|meeting|achieving|consolidating|standard)\b/i },
  { tier: 'above', label: 'Above standard', re: /\b(above|exceeding|extending|advanced)\b/i },
];

async function main() {
  if (!existsSync(RUBRIC_DIR)) mkdirSync(RUBRIC_DIR, { recursive: true });

  const pdfPath = findPdf(RUBRIC_DIR);
  if (!pdfPath) {
    console.log(`[build-rubric] No PDF in ${RUBRIC_DIR} — keeping placeholder.`);
    writePlaceholder('no-pdf-present');
    return;
  }

  console.log(`[build-rubric] Parsing ${pdfPath}…`);

  // Load pdfjs-dist lazily so the install step is the only thing required.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(readFileSync(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
    fullText += `\n${pageText}`;
  }

  const years = extractYears(fullText);

  if (years.length === 0) {
    console.warn(
      '[build-rubric] Could not detect year-level structure in the PDF.\n' +
        '  The PDF was parsed but no year-level headings matched. Either:\n' +
        '   1. Tweak YEAR / TIER patterns in scripts/build-rubric.mjs, or\n' +
        '   2. Edit src/generated/rubric.ts by hand — it is a normal TS file.\n' +
        '  Keeping placeholder for now.',
    );
    writePlaceholder(`unparseable:${pdfPath}`);
    return;
  }

  writeRubric({ source: pdfPath, years });
  console.log(
    `[build-rubric] Wrote ${OUT} with ${years.length} year-level rubric(s).`,
  );
}

function findPdf(dir) {
  if (!existsSync(dir)) return null;
  const pdfs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (pdfs.length === 0) return null;
  return join(dir, pdfs[0]);
}

function extractYears(text) {
  // TWEAK: heading patterns. Adjust to your rubric's wording.
  const yearHeading = /\b(Prep|Foundation|Year\s*([1-6]))\b/gi;
  const matches = [...text.matchAll(yearHeading)];
  if (matches.length === 0) return [];

  const sections = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const next = matches[i + 1];
    const code = m[2] ?? 'F';
    const yearCode = String(code).toUpperCase() === 'PREP' || code === undefined ? 'F' : code;
    const start = m.index ?? 0;
    const end = next?.index ?? text.length;
    sections.push({ yearCode, body: text.slice(start, end) });
  }

  // Merge sections per year (PDF may repeat the heading).
  const byYear = new Map();
  for (const s of sections) {
    if (!YEAR_CODES.includes(s.yearCode)) continue;
    const prev = byYear.get(s.yearCode) ?? '';
    byYear.set(s.yearCode, `${prev}\n${s.body}`);
  }

  const years = [];
  for (const yearCode of YEAR_CODES) {
    const body = byYear.get(yearCode);
    if (!body) continue;
    const tiers = extractTiers(body);
    if (tiers.length === 0) continue;
    years.push({ yearCode, yearLabel: YEAR_LABELS[yearCode], tiers });
  }
  return years;
}

function extractTiers(body) {
  const tiers = [];
  for (const t of TIER_PATTERNS) {
    const m = body.match(t.re);
    if (!m) continue;
    const startIdx = m.index ?? 0;

    // Take ~600 chars after the tier heading, trimmed to the next tier match.
    let chunk = body.slice(startIdx, startIdx + 800);
    for (const other of TIER_PATTERNS) {
      if (other.tier === t.tier) continue;
      const nextMatch = chunk.slice(t.label.length).match(other.re);
      if (nextMatch?.index !== undefined) {
        chunk = chunk.slice(0, t.label.length + nextMatch.index);
      }
    }

    const descriptors = chunk
      .split(/(?:•|•|\n|\.\s+(?=[A-Z]))/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 12 && s.length <= 220);

    if (descriptors.length > 0) {
      tiers.push({ tier: t.tier, label: t.label, descriptors });
    }
  }
  return tiers;
}

function writeRubric({ source, years }) {
  const generatedAt = new Date().toISOString();
  const content =
    `// AUTO-GENERATED by scripts/build-rubric.mjs — do not edit by hand.\n` +
    `// Re-run \`npm run build:rubric\` after replacing the source PDF in public/rubric/.\n\n` +
    `export interface RubricTier {\n` +
    `  tier: 'below' | 'at' | 'above';\n` +
    `  label: string;\n` +
    `  descriptors: string[];\n` +
    `}\n\n` +
    `export interface YearRubric {\n` +
    `  yearCode: 'F' | '1' | '2' | '3' | '4' | '5' | '6';\n` +
    `  yearLabel: string;\n` +
    `  tiers: RubricTier[];\n` +
    `}\n\n` +
    `export interface Rubric {\n` +
    `  source: string;\n` +
    `  generatedAt: string;\n` +
    `  years: YearRubric[];\n` +
    `}\n\n` +
    `export const RUBRIC: Rubric = ${JSON.stringify({ source, generatedAt, years }, null, 2)};\n`;

  writeFileSync(OUT, content, 'utf8');
}

function writePlaceholder(reason) {
  const content =
    `// AUTO-GENERATED by scripts/build-rubric.mjs — do not edit by hand.\n` +
    `// Placeholder (${reason}). Drop a PDF in public/rubric/ then run \`npm run build:rubric\`.\n\n` +
    `export interface RubricTier {\n` +
    `  tier: 'below' | 'at' | 'above';\n` +
    `  label: string;\n` +
    `  descriptors: string[];\n` +
    `}\n\n` +
    `export interface YearRubric {\n` +
    `  yearCode: 'F' | '1' | '2' | '3' | '4' | '5' | '6';\n` +
    `  yearLabel: string;\n` +
    `  tiers: RubricTier[];\n` +
    `}\n\n` +
    `export interface Rubric {\n` +
    `  source: string;\n` +
    `  generatedAt: string;\n` +
    `  years: YearRubric[];\n` +
    `}\n\n` +
    `export const RUBRIC: Rubric = {\n` +
    `  source: '${reason}',\n` +
    `  generatedAt: '${new Date().toISOString()}',\n` +
    `  years: [],\n` +
    `};\n`;
  writeFileSync(OUT, content, 'utf8');
}

main().catch((err) => {
  console.error('[build-rubric] Failed:', err);
  process.exit(1);
});
