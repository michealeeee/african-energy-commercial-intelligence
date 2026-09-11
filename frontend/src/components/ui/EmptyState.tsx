import type { ReactNode } from "react";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-paper">{title}</p>
      {body && <p className="mt-1 text-sm text-mist">{body}</p>}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-mist">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" | "gold" }) {
  const cls = {
    neutral: "bg-panel-2 text-mist",
    good: "bg-[#12352c] text-gain",
    bad: "bg-[#3a1b1b] text-loss",
    warn: "bg-[#3a2e12] text-gold-2",
    gold: "bg-[#2a2410] text-gold",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${cls}`}>{children}</span>;
}

export function Locked({ plan }: { plan: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel p-10 text-center">
      <p className="text-gold">Professional feature</p>
      <h2 className="mt-2 text-xl font-semibold">Upgrade required</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist">
        This module is included on the {plan} plan and above. Your current subscription does not include it. Super Admin can change plans in billing.
      </p>
    </div>
  );
}
