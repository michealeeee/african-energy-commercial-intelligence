import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "../components/ui/KpiCard";
import { PageHeader } from "../components/ui/EmptyState";
import { companyKpis } from "../lib/analytics";
import { changePct } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Market() {
  const { state } = useEnergy();
  const { company } = useSession();
  const k = company ? companyKpis(state, company.id) : null;

  return (
    <div>
      <PageHeader
        eyebrow="Market intelligence"
        title="Energy tape"
        subtitle="Architecture is ready for a vendor feed (Django /api/market-data/). Everything on this page is seeded demo data, not live prices."
      />
      <div className="mb-4 rounded-xl border border-gold/40 bg-[#1a1608] px-4 py-3 text-sm text-gold-2">
        Demo series · source field is <span className="num">demo-seed</span>. Do not trade on these prints.
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {state.market.map((m) => {
          const week = m.history[m.history.length - 8]?.price ?? m.previousPrice;
          const month = m.history[m.history.length - 31]?.price ?? m.previousPrice;
          return (
            <KpiCard
              key={m.id}
              demo
              label={m.indicator}
              value={`${m.currency === "USD" ? "$" : ""}${m.price.toFixed(m.price < 5 ? 3 : 2)}${m.currency === "GHS" ? " GHS" : ""}`}
              delta={changePct(m.price, m.previousPrice)}
              hint={`Wk ${changePct(m.price, week).toFixed(2)}% · Mo ${changePct(m.price, month).toFixed(2)}% · ${m.unit}`}
            />
          );
        })}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {state.market.slice(0, 4).map((m) => (
          <div key={m.id} className="rounded-2xl border border-line bg-panel p-4">
            <h2 className="font-semibold">{m.indicator}</h2>
            <p className="text-xs text-mist">90-day demo history · {m.source}</p>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <LineChart data={m.history}>
                  <CartesianGrid stroke="#1d3a4f" strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis stroke="#8aa0b5" fontSize={11} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: "#0d1a28", border: "1px solid #1d3a4f" }} />
                  <Line type="monotone" dataKey="price" stroke="#f3c96b" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-mist">
        FX used in Apex landed-cost cargoes sits near {k?.fx?.price.toFixed(2)} in this demo tape. Brent/WTI are markers only until a licensed feed is wired.
      </p>
    </div>
  );
}
