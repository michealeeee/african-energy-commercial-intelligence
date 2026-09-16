import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/EmptyState";
import { BeginnerDeskGuide } from "../components/layout/BeginnerDeskGuide";
import { companyKpis, monthlyPnl } from "../lib/analytics";
import { formatDate, ghs, litres, pct } from "../lib/format";
import { openAlerts, useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Dashboard() {
  const { state } = useEnergy();
  const { company, user } = useSession();
  if (!company || !user) return null;
  const k = companyKpis(state, company.id);
  const pnl = monthlyPnl(state, company.id);
  const sales = state.sales.filter((s) => s.companyId === company.id).slice(0, 6);
  const alerts = openAlerts(state.alerts, company.id).slice(0, 5);
  const customers = state.customers.filter((c) => c.companyId === company.id);
  const products = state.products.filter((p) => p.companyId === company.id);

  return (
    <div>
      <PageHeader
        eyebrow="Commercial book"
        title="Dashboard"
        subtitle="Start here if you are new. This screen is one company's book: what is in tank, what it cost, what you sold, and whether you made money."
      />
      <BeginnerDeskGuide role={user.role} person={user.name} company={company.name} planId={company.planId} />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">1 · Market context (demo tape)</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Brent" value={`$${k.brent?.price.toFixed(2)}`} delta={k.brentD} hint="USD/bbl" demo />
        <KpiCard label="WTI" value={`$${k.wti?.price.toFixed(2)}`} delta={k.wtiD} hint="USD/bbl" demo />
        <KpiCard label="USD / GHS" value={k.fx?.price.toFixed(2) ?? "—"} delta={k.fxD} hint="Cedi per dollar" demo />
        <KpiCard label="AGO proxy" value={`$${state.market.find((m) => m.id === "m_ago_platts")?.price.toFixed(3)}`} hint="USD/L CIF" demo />
      </div>
      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">2 · This company's book</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Inventory" value={litres(k.inventoryQty)} hint="All depots / units mixed" />
        <KpiCard label="Inventory value" value={ghs(k.inventoryValue)} />
        <KpiCard label="Purchases (landed)" value={ghs(k.totalPurchases)} />
        <KpiCard label="Sales" value={ghs(k.totalSales)} />
        <KpiCard label="Gross profit" value={ghs(k.grossProfit)} />
        <KpiCard label="Gross margin" value={pct(k.grossMargin)} />
        <KpiCard label="Open positions" value={String(k.openPositions)} hint="Products with remaining qty" />
        <KpiCard label="Receivables / payables" value={`${ghs(k.receivables)} / ${ghs(k.payables)}`} />
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-panel p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">3 · Realised gross profit</h2>
            <span className="text-xs text-mist">By invoice month</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={pnl}>
                <defs>
                  <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a017" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d4a017" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1d3a4f" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#8aa0b5" fontSize={12} />
                <YAxis stroke="#8aa0b5" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0d1a28", border: "1px solid #1d3a4f" }} />
                <Area type="monotone" dataKey="gp" stroke="#f3c96b" fill="url(#gp)" name="Gross profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <h2 className="font-semibold">4 · Alerts — do these first</h2>
          <ul className="mt-3 space-y-3">
            {alerts.length === 0 && (
              <li className="text-sm text-mist">No open alerts on this company. When tanks run low or invoices age, they will list here.</li>
            )}
            {alerts.map((a) => (
              <li key={a.id} className="border-b border-line pb-3 last:border-0">
                <p className="text-xs uppercase tracking-wide text-gold">{a.severity} · {a.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm">{a.message}</p>
              </li>
            ))}
          </ul>
          <Link to="/alerts" className="mt-3 inline-block text-sm text-gold">
            Open alert centre →
          </Link>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3 font-semibold">5 · Recent transactions</div>
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-mist">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Customer</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Revenue</th>
              <th className="px-4 py-2 text-left">Margin</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-2">{formatDate(s.date)}</td>
                <td className="px-4 py-2">{customers.find((c) => c.id === s.customerId)?.name}</td>
                <td className="px-4 py-2">{products.find((p) => p.id === s.productId)?.name}</td>
                <td className="num px-4 py-2">{ghs(s.revenue)}</td>
                <td className={`num px-4 py-2 ${s.grossMarginPct < 5 ? "text-loss" : "text-gain"}`}>{pct(s.grossMarginPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
