import type { Dimension, DimensionResult, Rating } from '../lib/types';
import { DIMENSION_META, RATING_META } from '../lib/types';

interface Props {
  dimension: Dimension;
  result: DimensionResult;
}

// Colour palette matches the school rubric document: Low = red, Medium = amber,
// High = green. These denote *demand level*, not quality — high demand is green
// because it's the most challenging, matching the existing school palette.
const RATING_STYLES: Record<
  Rating,
  { pill: string; ring: string; dot: string; text: string }
> = {
  L: {
    pill: 'bg-red-100 text-red-900',
    ring: 'ring-red-200',
    dot: 'bg-red-500',
    text: 'text-red-900',
  },
  M: {
    pill: 'bg-amber-100 text-amber-900',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-900',
  },
  H: {
    pill: 'bg-emerald-100 text-emerald-900',
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-600',
    text: 'text-emerald-900',
  },
};

export function DimensionCard({ dimension, result }: Props) {
  const meta = DIMENSION_META[dimension];
  const rating = RATING_META[result.rating];
  const s = RATING_STYLES[result.rating];

  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${s.ring}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${s.dot} text-sm font-bold text-white`}
            >
              {meta.code}
            </span>
            <h2 className="text-base font-semibold text-slate-900">{meta.name}</h2>
          </div>
          {meta.aligns && (
            <p className="mt-0.5 pl-9 text-xs text-slate-500">{meta.aligns}</p>
          )}
        </div>

        <div
          className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-1.5 ${s.pill}`}
        >
          <span className="text-lg font-bold leading-none">{rating.label}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide">
            {rating.full}
          </span>
        </div>
      </header>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">
        {result.rationale}
      </p>

      {result.evidence.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Evidence
          </h3>
          <ul className="mt-1.5 space-y-1.5 text-sm text-slate-700">
            {result.evidence.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`}
                />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
