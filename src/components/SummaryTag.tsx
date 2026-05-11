import type { LevellingResponse, Rating } from '../lib/types';

const COLOUR: Record<Rating, string> = {
  L: 'text-red-700',
  M: 'text-amber-700',
  H: 'text-emerald-700',
};

export function SummaryTag({ dimensions }: { dimensions: LevellingResponse['dimensions'] }) {
  const cells: Array<['D' | 'L' | 'K', Rating]> = [
    ['D', dimensions.decoding.rating],
    ['L', dimensions.language.rating],
    ['K', dimensions.knowledge.rating],
  ];

  return (
    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xl font-bold tracking-wide text-slate-700 shadow-sm">
      {cells.map(([code, rating], i) => (
        <span key={code} className="inline-flex items-center">
          {i > 0 && <span className="mx-2 text-slate-300">|</span>}
          <span>{code}:</span>
          <span className={`ml-1 ${COLOUR[rating]}`}>{rating}</span>
        </span>
      ))}
    </div>
  );
}
