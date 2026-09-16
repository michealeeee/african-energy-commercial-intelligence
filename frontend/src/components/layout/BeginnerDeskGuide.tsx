import { useState } from "react";
import { ROLE_LABEL, type PlanId, type Role } from "../../types";

const ROLE_GUIDE: Record<
  Role,
  {
    job: string;
    today: string;
    map: { n: string; t: string; d: string }[];
  }
> = {
  super_admin: {
    job: "You run the platform, not a fuel book. Tenants, users, plans and audit live here. You will not see tanks, cargo or GH₵ margin.",
    today: "Check that every OMC is active, then open Companies if you need to suspend a tenant or change a plan.",
    map: [
      { n: "01", t: "Companies", d: "How many OMCs sit on the platform." },
      { n: "02", t: "Subscriptions / MRR", d: "Mock billing. Not real payments." },
      { n: "03", t: "Users", d: "Every demo desk, including company staff." },
      { n: "04", t: "Audit", d: "What changed recently on the platform." },
    ],
  },
  company_admin: {
    job: "You own this company's commercial book. The left menu is your daily loop: buy, tank, price, sell, collect.",
    today: "Read the book cards (inventory, purchases, sales, margin). If an alert is red, start there. Gold DEMO badges are illustrative market prints, not a live NPA tape.",
    map: [
      { n: "01", t: "Market strip", d: "Brent, WTI, USD/GHS context only — labelled Demo." },
      { n: "02", t: "Your book", d: "What you hold, what you paid, what you sold, whether you made money." },
      { n: "03", t: "Gross profit chart", d: "Realised GH₵ profit by invoice month. A dip means recent sales were below landed cost." },
      { n: "04", t: "Alerts + recent sales", d: "What needs a human today, and the last invoices." },
    ],
  },
  commercial_manager: {
    job: "You protect margin. You care that lifts are priced off true landed cost, not the last pump rumour.",
    today: "If gross margin is negative, open Pricing Calculator, then Sales. Watch mining customers and low-margin AGO.",
    map: [
      { n: "01", t: "Market strip", d: "FX and crude move your replacement cost." },
      { n: "02", t: "Gross profit / margin", d: "The scoreboard for your desk." },
      { n: "03", t: "Alerts", d: "Low margin and FX moves land here first." },
      { n: "04", t: "Recent transactions", d: "Which customer and grade made or lost money." },
    ],
  },
  trader: {
    job: "You land cargo and book lifts. Purchases, positions, market and sales are your tools.",
    today: "Check open positions and inventory litres, then Purchases if a tank is thin.",
    map: [
      { n: "01", t: "Market strip", d: "Your replacement-cost backdrop (demo)." },
      { n: "02", t: "Inventory + purchases", d: "What is in tank and what you paid to put it there." },
      { n: "03", t: "Open positions", d: "Grades still on the book." },
      { n: "04", t: "Recent sales", d: "What already left the depot." },
    ],
  },
  finance_user: {
    job: "You watch cash: receivables, payables, realised profit. Credit limits sit on customers.",
    today: "Read receivables vs payables, then Alerts for outstanding AR. Open Sales for the invoice trail.",
    map: [
      { n: "01", t: "Purchases / sales", d: "Landed cost in vs invoice out." },
      { n: "02", t: "Gross profit", d: "Did the book make money this period?" },
      { n: "03", t: "Receivables / payables", d: "Who owes you vs who you owe." },
      { n: "04", t: "Alerts", d: "Overdue AR and contract dates." },
    ],
  },
  operations_user: {
    job: "You keep the tanks honest: products, lots, movements. Pricing is not your first screen.",
    today: "Read inventory litres and the low-stock alerts, then open Inventory for depot lots.",
    map: [
      { n: "01", t: "Inventory quantity", d: "All depots mixed — drill into Inventory for Tema vs Kumasi." },
      { n: "02", t: "Inventory value", d: "What that stock is worth at landed cost." },
      { n: "03", t: "Alerts", d: "Low inventory and contract expiry." },
      { n: "04", t: "Left menu", d: "Inventory, Products, Contracts are your write modules." },
    ],
  },
  viewer: {
    job: "You can see the book. You cannot change purchases, sales or tanks. Treat this as a read-only briefing.",
    today: "Scan margin, inventory and alerts. If something looks wrong, send it to the commercial or ops desk.",
    map: [
      { n: "01", t: "Market vs book", d: "Context on top, company numbers underneath." },
      { n: "02", t: "Gross profit", d: "Whether recent invoices made money." },
      { n: "03", t: "Alerts", d: "What the working desks already flagged." },
      { n: "04", t: "Recent sales", d: "Who bought what, and at what margin." },
    ],
  },
};

const PLAN_NOTE: Record<PlanId, string> = {
  starter: "This company is on Starter. Positions, Analytics, the Alerts centre and AI Assistant are hidden in the left menu. Buy, tank, sell and basic reports stay on.",
  professional: "This company is on Professional. You have positions, P&L, alerts and the AI assistant.",
  enterprise: "This company is on Enterprise. Multi-depot architecture and the full commercial menu are on.",
};

export function BeginnerDeskGuide({
  role,
  person,
  company,
  planId,
}: {
  role: Role;
  person: string;
  company?: string;
  planId?: PlanId | null;
}) {
  const [open, setOpen] = useState(true);
  const g = ROLE_GUIDE[role];
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-gold/35 bg-panel">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">New to this desk</p>
          <p className="mt-0.5 text-sm font-semibold text-paper">
            {person} · {ROLE_LABEL[role]}
            {company ? ` · ${company}` : ""}
          </p>
        </div>
        <span className="text-xs text-mist">{open ? "Hide guide" : "Show guide"}</span>
      </button>
      {open && (
        <div className="border-t border-line px-4 py-4">
          <p className="max-w-3xl text-sm leading-relaxed text-paper">{g.job}</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist">{g.today}</p>
          {planId && <p className="mt-2 max-w-3xl text-sm text-gold-2">{PLAN_NOTE[planId]}</p>}
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {g.map.map((s) => (
              <li key={s.n} className="rounded-xl border border-line bg-ink/40 p-3">
                <p className="num text-[10px] text-gold">{s.n}</p>
                <p className="mt-1 text-sm font-semibold">{s.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-mist">{s.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-mist">Password for every demo account is demo123. Sign out (top right) and pick another desk on the login list to see a different role or company.</p>
        </div>
      )}
    </section>
  );
}
