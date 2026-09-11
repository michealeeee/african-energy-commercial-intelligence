export function KpiCard({
  label,
  value,
  hint,
  delta,
  demo,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  demo?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <article className="rounded-2xl border border-line bg-panel p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-mist">{label}</p>
        {demo && <span className="rounded-full bg-[#2a2410] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-2">Demo</span>}
      </div>
      <p className="num mt-2 text-2xl font-semibold tracking-tight text-paper">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span className={`num ${up ? "text-gain" : "text-loss"}`}>
            {up ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}%
          </span>
        )}
        {hint && <span className="text-mist">{hint}</span>}
      </div>
    </article>
  );
}
