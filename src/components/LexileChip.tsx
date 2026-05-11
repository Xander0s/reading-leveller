import type { LevellingResponse } from '../lib/types';

export function LexileChip({ lexile }: { lexile: LevellingResponse['lexile'] }) {
  const value =
    lexile.estimate !== null
      ? `${lexile.estimate}L`
      : lexile.band ?? '—';

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Lexile <span className="font-normal normal-case text-slate-400">(secondary signal)</span>
          </h2>
          <p className="mt-1 text-2xl font-bold text-slate-700">{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{lexile.note}</p>
    </section>
  );
}
