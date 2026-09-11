import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PlanGate } from "../components/layout/guards";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/EmptyState";
import { inputClass } from "../components/ui/Button";
import { companyKpis, monthlyPnl } from "../lib/analytics";
import { ghs, pct } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Analytics() {
  const { state } = useEnergy();
  const { company } = useSession();
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-09-11");
  if (!company) return null;

  const products = state.products.filter((p) => p.companyId === company.id);
  const customers = state.customers.filter((c) => c.companyId === company.id);
  const suppliers = state.suppliers.filter((s) => s.companyId === company.id);
  const locations = state.locations.filter((l) => l.companyId === company.id);

  const sales = state.sales.filter((s) => {
    if (s.companyId !== company.id) return false;
    if (s.date < from || s.date > to) return false;
    if (productId && s.productId !== productId) return false;
    if (customerId && s.customerId !== customerId) return false;
    if (locationId && s.locationId !== locationId) return false;
    return true;
  });
  const purchases = state.purchases.filter((p) => {
    if (p.companyId !== company.id) return false;
    if (p.date < from || p.date > to) return false;
    if (productId && p.productId !== productId) return false;
    if (supplierId && p.supplierId !== supplierId) return false;
    if (locationId && p.locationId !== locationId) return false;
    return true;
  });

  const k = companyKpis(state, company.id);
  const byProduct = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales) m.set(s.productId, (m.get(s.productId) ?? 0) + s.grossProfit);
    return [...m.entries()].map(([id, gp]) => ({ name: products.find((p) => p.id === id)?.name ?? id, gp }));
  }, [sales, products]);
  const byCustomer = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales) m.set(s.customerId, (m.get(s.customerId) ?? 0) + s.grossProfit);
    return [...m.entries()].map(([id, gp]) => ({ name: customers.find((c) => c.id === id)?.name ?? id, gp }));
  }, [sales, customers]);
  const bySupplier = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of purchases) m.set(p.supplierId, (m.get(p.supplierId) ?? 0) + p.totalLandedCost);
    return [...m.entries()].map(([id, cost]) => ({ name: suppliers.find((s) => s.id === id)?.name ?? id, cost }));
  }, [purchases, suppliers]);
  const byLoc = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sales) m.set(s.locationId, (m.get(s.locationId) ?? 0) + s.grossProfit);
    return [...m.entries()].map(([id, gp]) => ({ name: locations.find((l) => l.id === id)?.name ?? id, gp }));
  }, [sales, locations]);

  const rev = sales.reduce((s, r) => s + r.revenue, 0);
  const cogs = sales.reduce((s, r) => s + r.cost, 0);
  const gp = sales.reduce((s, r) => s + r.grossProfit, 0);

  return (
    <PlanGate feature="analytics">
      <PageHeader eyebrow="Financial intelligence" title="P&L and analytics" subtitle="Filters apply to realised sales and purchases in this tenant. Aggregation here mirrors the MongoDB pipelines the API will run later." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">All products</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={inputClass} value={customerId} onChange={(e) => setCustomerId(e.target.value)}><option value="">All customers</option>{customers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={inputClass} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">All suppliers</option>{suppliers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={inputClass} value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">All locations</option>{locations.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex gap-2">
          <input className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={ghs(rev)} />
        <KpiCard label="COGS" value={ghs(cogs)} />
        <KpiCard label="Gross profit" value={ghs(gp)} />
        <KpiCard label="Gross margin" value={pct(rev ? (gp / rev) * 100 : 0)} />
        <KpiCard label="Realised P&L" value={ghs(k.realized)} />
        <KpiCard label="Unrealised P&L" value={ghs(k.unrealized)} hint="Mark vs last sale" />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Chart title="Profit by product" data={byProduct} dataKey="gp" />
        <Chart title="Profit by customer" data={byCustomer} dataKey="gp" />
        <Chart title="Landed spend by supplier" data={bySupplier} dataKey="cost" />
        <Chart title="Profit by location" data={byLoc} dataKey="gp" />
      </div>
      <div className="mt-4 rounded-2xl border border-line bg-panel p-4">
        <h3 className="mb-3 font-semibold">Profit by month</h3>
        <Chart title="" data={monthlyPnl(state, company.id).map((m) => ({ name: m.month, gp: m.gp }))} dataKey="gp" hideTitle />
      </div>
    </PlanGate>
  );
}

function Chart({ title, data, dataKey, hideTitle }: { title: string; data: { name: string; [k: string]: string | number }[]; dataKey: string; hideTitle?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      {!hideTitle && <h3 className="mb-3 font-semibold">{title}</h3>}
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid stroke="#1d3a4f" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#8aa0b5" fontSize={10} interval={0} angle={-18} textAnchor="end" height={60} />
            <YAxis stroke="#8aa0b5" fontSize={11} />
            <Tooltip contentStyle={{ background: "#0d1a28", border: "1px solid #1d3a4f" }} />
            <Legend />
            <Bar dataKey={dataKey} fill="#d4a017" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
