interface Props {
  estimate: number;
  band: string;
  rationale: string;
}

const MIN = 0;
const MAX = 1200;

export function LexileGauge({ estimate, band, rationale }: Props) {
  const clamped = Math.max(MIN, Math.min(MAX, estimate));
  const pct = ((clamped - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Lexile estimate
        </h2>
        <span className="text-xs text-slate-400">{band}</span>
      </header>

      <div className="mt-3 flex items-end gap-2">
        <span className="text-4xl font-bold text-brand-900">{estimate}</span>
        <span className="pb-1 text-lg font-semibold text-brand-700">L</span>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-violet-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        <span>BR</span>
        <span>500L</span>
        <span>1000L+</span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-700">{rationale}</p>
    </section>
  );
}
