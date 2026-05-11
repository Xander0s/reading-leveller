import type { Tier } from '../lib/types';

interface Props {
  tier: Tier;
  tierLabel: string;
  rationale: string;
  evidence: string[];
}

const TIER_STYLES: Record<Tier, { bg: string; ring: string; text: string; dot: string }> = {
  below: {
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    text: 'text-amber-900',
    dot: 'bg-tier-below',
  },
  at: {
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    text: 'text-emerald-900',
    dot: 'bg-tier-at',
  },
  above: {
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    text: 'text-violet-900',
    dot: 'bg-tier-above',
  },
};

export function TierBadge({ tier, tierLabel, rationale, evidence }: Props) {
  const s = TIER_STYLES[tier];

  return (
    <section className={`rounded-2xl ${s.bg} p-5 ring-1 ${s.ring}`}>
      <header className="flex items-center gap-2">
        <span className={`inline-block h-3 w-3 rounded-full ${s.dot}`} />
        <h2 className={`text-sm font-semibold uppercase tracking-wide ${s.text}`}>
          Rubric tier
        </h2>
      </header>

      <p className={`mt-2 text-2xl font-bold ${s.text}`}>{tierLabel}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{rationale}</p>

      {evidence.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Evidence from the text
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            {evidence.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
