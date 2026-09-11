import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PlanGate } from "../components/layout/guards";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/EmptyState";
import { companyKpis } from "../lib/analytics";
import { ghs, litres } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Positions() {
  const { state } = useEnergy();
  const { company } = useSession();
  if (!company) return null;
  const k = companyKpis(state, company.id);

  return (
    <PlanGate feature="positions">
      <PageHeader
        eyebrow="Book"
        title="Positions"
        subtitle="Purchased versus sold, remaining depot quantity, average cost, last-sale market proxy and unrealised P&L. Market value is estimated from your own last selling price, not a live Platts assessment."
      />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <KpiCard label="Realised P&L" value={ghs(k.realized)} hint="Closed sales" />
        <KpiCard label="Unrealised P&L" value={ghs(k.unrealized)} hint="Remaining × (last sale − avg cost)" />
        <KpiCard label="Inventory value" value={ghs(k.inventoryValue)} />
      </div>
      <div className="mb-6 h-64 rounded-2xl border border-line bg-panel p-4">
        <ResponsiveContainer>
          <BarChart data={k.positions.map((p) => ({ name: p.product.name, remaining: p.remaining, sold: p.sold }))}>
            <CartesianGrid stroke="#1d3a4f" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#8aa0b5" fontSize={11} />
            <YAxis stroke="#8aa0b5" fontSize={11} />
            <Tooltip contentStyle={{ background: "#0d1a28", border: "1px solid #1d3a4f" }} />
            <Bar dataKey="remaining" fill="#d4a017" name="Remaining" />
            <Bar dataKey="sold" fill="#2dd4bf" name="Sold" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {k.positions.map((p) => (
          <article key={p.product.id} className="rounded-2xl border border-line bg-panel p-5">
            <h3 className="text-lg font-semibold">{p.product.name}</h3>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>Purchased<div className="num text-paper">{litres(p.bought)}</div></div>
              <div>Sold<div className="num text-paper">{litres(p.sold)}</div></div>
              <div>Remaining<div className="num text-gold-2">{p.remaining.toLocaleString()} {p.product.unit}</div></div>
              <div>Average cost<div className="num">{ghs(p.avgCost, 2)}/{p.product.unit}</div></div>
              <div>Est. market<div className="num">{ghs(p.marketUnit, 2)}/{p.product.unit}</div></div>
              <div>Unrealised P&L<div className={`num ${p.unrealized >= 0 ? "text-gain" : "text-loss"}`}>{ghs(p.unrealized)}</div></div>
            </dl>
            <p className="mt-3 text-xs text-mist">Estimated market value uses last recorded selling price for this product (demo book), not an external quote.</p>
          </article>
        ))}
      </div>
    </PlanGate>
  );
}
