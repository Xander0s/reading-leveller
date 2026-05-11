import type { LevellingResponse } from '../lib/types';
import { DimensionCard } from './DimensionCard';
import { LexileChip } from './LexileChip';
import { SummaryTag } from './SummaryTag';

export function ResultsCard({ result }: { result: LevellingResponse }) {
  return (
    <div className="space-y-4">
      {result.textTitle && (
        <h2 className="text-lg font-semibold text-slate-900">
          {result.textTitle}
        </h2>
      )}

      <SummaryTag dimensions={result.dimensions} />

      <DimensionCard dimension="decoding" result={result.dimensions.decoding} />
      <DimensionCard dimension="language" result={result.dimensions.language} />
      <DimensionCard dimension="knowledge" result={result.dimensions.knowledge} />

      <LexileChip lexile={result.lexile} />

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
          <p className="font-semibold">Worth checking</p>
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
