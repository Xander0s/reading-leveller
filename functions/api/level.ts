import { RUBRIC, type YearRubric } from '../../src/generated/rubric';

interface Env {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

interface RequestBody {
  imageBase64: string;
  imageMediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  yearLevel: 'F' | '1' | '2' | '3' | '4' | '5' | '6';
}

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: 'Server misconfigured', detail: 'ANTHROPIC_API_KEY missing' }, 500);
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!body.imageBase64 || !body.imageMediaType || !body.yearLevel) {
    return json({ error: 'Missing imageBase64, imageMediaType, or yearLevel' }, 400);
  }

  // Cap payload at ~5MB base64 (~3.7MB image). Larger images should be
  // resized client-side; this guards the Worker quota.
  if (body.imageBase64.length > 5 * 1024 * 1024) {
    return json({ error: 'Image too large; please retake or use a smaller file' }, 413);
  }

  const yearRubric = RUBRIC.years.find((y) => y.yearCode === body.yearLevel);
  const systemPrompt = buildSystemPrompt(yearRubric);

  const anthropicPayload = {
    model: env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: body.imageMediaType,
              data: body.imageBase64,
            },
          },
          {
            type: 'text',
            text: buildUserPrompt(body.yearLevel),
          },
        ],
      },
    ],
  };

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(anthropicPayload),
    });
  } catch (e) {
    return json({ error: 'Upstream request failed', detail: String(e) }, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return json({ error: 'Anthropic API error', detail: text }, upstream.status);
  }

  const data = (await upstream.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = data.content?.find((c) => c.type === 'text')?.text ?? '';
  const parsed = extractJson(text);
  if (!parsed) {
    return json(
      { error: 'Could not parse model output', detail: text.slice(0, 500) },
      502,
    );
  }

  return json(parsed, 200);
};

export const onRequestOptions: PagesFunction<Env> = async ({ env }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env.ALLOWED_ORIGIN),
  });
};

function json(payload: unknown, status: number, allowed?: string): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders(allowed),
    },
  });
}

function corsHeaders(origin?: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function buildSystemPrompt(yearRubric: YearRubric | undefined): string {
  const yearLabel = yearRubric?.yearLabel ?? '(unspecified)';
  const tierBlock = yearRubric
    ? yearRubric.tiers
        .map(
          (t) =>
            `### ${t.label} (${t.tier})\n` +
            t.descriptors.map((d) => `- ${d}`).join('\n'),
        )
        .join('\n\n')
    : '_No rubric loaded — fall back to general Victorian Curriculum 2.0 English standards for the target year level._';

  return `You are a reading-levelling assistant for Australian primary teachers (Prep–Year 6, Victorian Curriculum 2.0).

You receive a photo of a single page from a text and a target year level. Your job is to:

1. Transcribe the visible text faithfully (preserve paragraphs and punctuation; skip captions and page numbers; mark illegible spans with […]).
2. Estimate a **Lexile measure** for the transcribed text. Use sentence length, word frequency, syntactic complexity, and concept density. Provide a numeric estimate (or a "BR…L" band for very early texts) and a one-sentence rationale.
3. Assign a **rubric tier** (below / at / above) for the target year level using the rubric below. Provide the human-readable tier label, a 2–3 sentence rationale, and 2–4 short evidence quotes (≤120 chars each) from the transcript.
4. Add brief warnings only if the image is partial, glare-affected, or the text appears to be a non-narrative format that may skew Lexile (e.g., poem, list).

**Output strict JSON, no prose, no markdown fences.** Schema:
{
  "transcript": string,
  "lexile": { "estimate": number, "band": string, "rationale": string },
  "rubric": {
    "tier": "below" | "at" | "above",
    "tierLabel": string,
    "rationale": string,
    "evidence": string[]
  },
  "warnings"?: string[]
}

---

**Rubric for ${yearLabel}:**

${tierBlock}

---

Australian English spelling. Be concise — teachers read this on a phone between lessons.`;
}

function buildUserPrompt(year: RequestBody['yearLevel']): string {
  const yearLabel =
    year === 'F' ? 'Prep (Foundation)' : `Year ${year}`;
  return `Target year level: ${yearLabel}.\n\nTranscribe the page, estimate Lexile, and assign a rubric tier. Return only the JSON object.`;
}

function extractJson(text: string): unknown | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to brace-matching for models that wrap output.
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
