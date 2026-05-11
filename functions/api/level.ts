import { buildRubricText } from '../../src/lib/rubric';

interface Env {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL?: string;
  ALLOWED_ORIGIN?: string;
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

interface ImageInput {
  base64: string;
  mediaType: ImageMediaType;
}

interface RequestBody {
  images: ImageInput[];
  textTitle?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MAX_IMAGES = 3;
const MAX_BASE64_PER_IMAGE = 5 * 1024 * 1024; // ~3.7 MB raw

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

  if (!Array.isArray(body.images) || body.images.length === 0) {
    return json({ error: 'No images provided' }, 400);
  }

  if (body.images.length > MAX_IMAGES) {
    return json({ error: `Too many images (max ${MAX_IMAGES})` }, 400);
  }

  for (const [i, img] of body.images.entries()) {
    if (!img?.base64 || !img.mediaType) {
      return json({ error: `Image ${i + 1} missing base64 or mediaType` }, 400);
    }
    if (img.base64.length > MAX_BASE64_PER_IMAGE) {
      return json(
        { error: `Image ${i + 1} too large; retake or use a smaller file` },
        413,
      );
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(body.images.length, body.textTitle);

  const imageBlocks = body.images.flatMap((img, i) => [
    { type: 'text', text: `[Page ${i + 1} of ${body.images.length}]` },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType,
        data: img.base64,
      },
    },
  ]);

  const anthropicPayload = {
    model: env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
    max_tokens: 2500,
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
        content: [...imageBlocks, { type: 'text', text: userPrompt }],
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
    headers: { 'content-type': 'application/json', ...corsHeaders(allowed) },
  });
}

function corsHeaders(origin?: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function buildSystemPrompt(): string {
  return `You are an assistant for primary-school teachers in a Victorian (Australian) school, applying the school's "Resource Organisation Process" rubric to one or more photographed pages from a text.

You receive between 1 and ${MAX_IMAGES} images. **All images are from the same text** — typically sequential or representative pages. Treat them as a single combined sample when rating.

Your job is to:

1. **Transcribe** the visible text from each page faithfully, in order. Concatenate into a single transcript with a blank line between pages. Preserve paragraphs and punctuation. Skip page numbers, captions, and decorative elements. Mark illegible spans with [...]. If a page is mostly illustration, transcribe whatever text is present and note it in warnings.

2. Rate the **combined sample** on **three independent demand dimensions**, each on a 3-point scale (L / M / H). Use the rubric below verbatim. **These are independent — do not let one rating influence another.** A text can be Low Decoding and High Knowledge, or vice versa. The ratings characterise demand, NOT quality, NOT year-level fit.

   When pages vary in demand, rate the text as a whole — what a student reading the full text would encounter — rather than averaging or picking the worst page.

3. For each dimension, give a concise rationale (2–3 sentences) and 2–4 short pieces of evidence drawn from across the pages (≤120 chars each — direct quotes preferred). Evidence can come from any of the supplied pages.

4. Provide a **Lexile** estimate only as a secondary signal. The school's stance: Lexile is only useful when D/L/K cannot be differentiated. Always include the rubric's note about Lexile in the \`lexile.note\` field. If you can reasonably estimate from the combined sample, give a number (or "BR…L" band for very early texts); otherwise set \`lexile.estimate\` to null and explain in the note.

5. Warnings (optional): only if any image is partial, glare-affected, mostly illustration, or the format may skew the analysis (e.g. poem, instructions, list); or if the supplied pages don't appear to be from the same text.

**Output strict JSON, no prose, no markdown fences.** Schema:
{
  "textTitle": string | null,
  "transcript": string,
  "dimensions": {
    "decoding":  { "rating": "L" | "M" | "H", "rationale": string, "evidence": string[] },
    "language":  { "rating": "L" | "M" | "H", "rationale": string, "evidence": string[] },
    "knowledge": { "rating": "L" | "M" | "H", "rationale": string, "evidence": string[] }
  },
  "lexile": { "estimate": number | null, "band": string | null, "note": string },
  "warnings"?: string[]
}

Australian English spelling. Be concise — teachers read this on a phone between lessons.

---

# Rubric — "Resource Organisation Process" (school document)

${buildRubricText()}
`;
}

function buildUserPrompt(imageCount: number, textTitle?: string): string {
  const title = textTitle?.trim();
  const titleLine = title
    ? `The teacher has provided the text title: "${title}". Echo it back in \`textTitle\`.`
    : 'No text title supplied — set `textTitle` to null (or extract from the page if a title is visible).';
  const pageCountLine =
    imageCount === 1
      ? 'You have been given 1 page.'
      : `You have been given ${imageCount} pages. Treat them as a single combined sample.`;
  return `${pageCountLine}\n${titleLine}\n\nTranscribe each page in order, then rate D / L / K independently for the combined sample. Return only the JSON object.`;
}

function extractJson(text: string): unknown | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
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
