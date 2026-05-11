// Source: "Resource Organisation Process 2026" (school rubric, Victorian primary, Prep–Year 6).
// Hard-coded so it ships compiled into the bundle and is injected verbatim into
// the Claude system prompt. Update here if the rubric document changes.

export const RUBRIC = {
  preamble: `The goal of tagging is NOT to "level" texts. The question we are answering is: "What makes this text hard — and for whom?"

We tag across three independent dimensions — Decoding, Language, Knowledge — each on a three-point demand scale (Low / Medium / High). The scale references the demand on the skill within the text, not the overall quality or suitability of the text.`,
  scale: ['Low (L)', 'Medium (M)', 'High (H)'],
  dimensions: {
    decoding: {
      name: 'Decoding Demand (D)',
      aligns: 'This aligns most closely with DIBELS data.',
      L: [
        'Mostly one- and two-syllable words',
        'High-frequency words',
        'Simple spelling patterns (CVC, CVCC, etc.)',
      ],
      M: [
        'Some multisyllabic words',
        'Common prefixes/suffixes (un-, re-, -ed, -ing)',
        'Occasional tricky spellings',
      ],
      H: [
        'Many multisyllabic words',
        'Greek/Latin roots (bio-, geo-, -ology)',
        'Irregular spellings',
        'Domain-specific terminology',
      ],
      quickTest: [
        'Can a student decode most words automatically? → L',
        'Do they need to chunk words? → M',
        'Are words likely to break them down? → H',
      ],
    },
    language: {
      name: 'Language Demand (L)',
      aligns: 'This aligns strongly with CUBED NLM.',
      L: ['Short, simple sentences', 'Familiar vocabulary', 'Literal meaning'],
      M: ['Some complex sentences', 'Tier 2 vocabulary', 'Some inference required'],
      H: [
        'Long, complex sentences (subordinate clauses, passive voice)',
        'Dense Tier 2 and Tier 3 vocabulary',
        'Abstract ideas',
        'Heavy inference required',
      ],
    },
    knowledge: {
      name: 'Knowledge Demand (K)',
      aligns: '',
      L: ['Everyday experiences', 'Familiar topics', 'No background knowledge needed'],
      M: ['Some new concepts', 'Can be understood with brief explanation'],
      H: [
        'Unfamiliar topics (e.g. ancient civilisations, scientific processes)',
        'Requires prior knowledge or heavy front-loading',
        'Concepts build on each other',
      ],
    },
  },
  lexileNote:
    'Lexile is a secondary signal only — used to give teachers insight into text complexity when D/L/K are not able to be differentiated. It can help with suitability to age, complexity, and themes.',
} as const;

export function buildRubricText(): string {
  const r = RUBRIC;
  const dimBlock = (key: 'decoding' | 'language' | 'knowledge') => {
    const d = r.dimensions[key];
    const sections = (
      [
        ['Low (L)', d.L],
        ['Medium (M)', d.M],
        ['High (H)', d.H],
      ] as const
    )
      .map(
        ([label, items]) =>
          `**${label}**\n` + items.map((i) => `  - ${i}`).join('\n'),
      )
      .join('\n');
    const quick =
      'quickTest' in d
        ? `\nQuick test:\n` + d.quickTest.map((q) => `  - ${q}`).join('\n')
        : '';
    return `### ${d.name}\n${d.aligns ? `_${d.aligns}_\n\n` : ''}${sections}${quick}`;
  };

  return [
    r.preamble,
    '',
    `Demand scale: ${r.scale.join(' · ')}.`,
    '',
    dimBlock('decoding'),
    '',
    dimBlock('language'),
    '',
    dimBlock('knowledge'),
    '',
    `**Lexile:** ${r.lexileNote}`,
  ].join('\n');
}
