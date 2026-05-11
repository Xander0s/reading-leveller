import type { LevellingResponse } from '../lib/types';
import { LexileGauge } from './LexileGauge';
import { TierBadge } from './TierBadge';

export function ResultsCard({ result }: { result: LevellingResponse }) {
  return (
    <div className="space-y-4">
      <LexileGauge
        estimate={result.lexile.estimate}
        band={result.lexile.band}
        rationale={result.lexile.rationale}
      />

      <TierBadge
        tier={result.rubric.tier}
        tierLabel={result.rubric.tierLabel}
        rationale={result.rubric.rationale}
        evidence={result.rubric.evidence}
      />

      <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-500">
          Transcribed text
        </summary>
        <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700">
          {result.transcript}
        </pre>
      </details>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Worth checking:</p>
          <ul className="mt-1 list-disc pl-5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
