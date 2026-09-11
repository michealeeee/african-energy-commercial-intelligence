import { useMemo, useState } from "react";
import { Button, inputClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/EmptyState";
import { APP_NAME } from "../brand";
import { exportCsv, exportPdf, formatDate, ghs, pct } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

const KINDS = [
  "purchases",
  "sales",
  "inventory",
  "pnl",
  "margin",
  "suppliers",
  "customers",
  "positions",
  "market",
] as const;

export default function Reports() {
  const { state } = useEnergy();
  const { company } = useSession();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("sales");
  const [productId, setProductId] = useState("");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-09-11");
  if (!company) return null;
  const products = state.products.filter((p) => p.companyId === company.id);
  const customers = state.customers.filter((c) => c.companyId === company.id);
  const suppliers = state.suppliers.filter((s) => s.companyId === company.id);

  const table = useMemo(() => {
    const headers = ["Field A", "Field B", "Field C", "Field D"];
    let rows: (string | number)[][] = [];
    if (kind === "sales") {
      headers.splice(0, 4, "Date", "Customer", "Product", "Revenue", "Margin %");
      rows = state.sales
        .filter((s) => s.companyId === company.id && s.date >= from && s.date <= to && (!productId || s.productId === productId))
        .map((s) => [s.date, customers.find((c) => c.id === s.customerId)?.name ?? "", products.find((p) => p.id === s.productId)?.name ?? "", ghs(s.revenue), pct(s.grossMarginPct)]);
    } else if (kind === "purchases") {
      headers.splice(0, 4, "Date", "Supplier", "Product", "Landed", "Cost/u");
      rows = state.purchases
        .filter((s) => s.companyId === company.id && s.date >= from && s.date <= to && (!productId || s.productId === productId))
        .map((s) => [s.date, suppliers.find((c) => c.id === s.supplierId)?.name ?? "", products.find((p) => p.id === s.productId)?.name ?? "", ghs(s.totalLandedCost), ghs(s.costPerUnit, 2)]);
    } else if (kind === "inventory") {
      headers.splice(0, 4, "Product", "Depot", "Qty", "Value");
      rows = state.inventory.filter((i) => i.companyId === company.id).map((i) => [
        products.find((p) => p.id === i.productId)?.name ?? "",
        state.locations.find((l) => l.id === i.locationId)?.name ?? "",
        i.quantity,
        ghs(i.quantity * i.averageCost),
      ]);
    } else if (kind === "pnl" || kind === "margin") {
      headers.splice(0, 4, "Product", "Revenue", "GP", "Margin");
      const map = new Map<string, { rev: number; gp: number }>();
      for (const s of state.sales.filter((x) => x.companyId === company.id && x.date >= from && x.date <= to)) {
        const cur = map.get(s.productId) ?? { rev: 0, gp: 0 };
        cur.rev += s.revenue;
        cur.gp += s.grossProfit;
        map.set(s.productId, cur);
      }
      rows = [...map.entries()].map(([id, v]) => [products.find((p) => p.id === id)?.name ?? id, ghs(v.rev), ghs(v.gp), pct(v.rev ? (v.gp / v.rev) * 100 : 0)]);
    } else if (kind === "suppliers") {
      headers.splice(0, 4, "Supplier", "Landed spend", "Lifts", "Avg unit");
      rows = suppliers.map((s) => {
        const xs = state.purchases.filter((p) => p.supplierId === s.id);
        const cost = xs.reduce((a, b) => a + b.totalLandedCost, 0);
        const qty = xs.reduce((a, b) => a + b.quantity, 0);
        return [s.name, ghs(cost), xs.length, qty ? ghs(cost / qty, 2) : "—"];
      });
    } else if (kind === "customers") {
      headers.splice(0, 4, "Customer", "Revenue", "GP", "AR");
      rows = customers.map((c) => {
        const xs = state.sales.filter((s) => s.customerId === c.id);
        return [c.name, ghs(xs.reduce((a, b) => a + b.revenue, 0)), ghs(xs.reduce((a, b) => a + b.grossProfit, 0)), ghs(xs.reduce((a, b) => a + b.receivableOutstanding, 0))];
      });
    } else if (kind === "positions") {
      headers.splice(0, 4, "Product", "On hand", "Avg cost", "Value");
      rows = products.map((p) => {
        const lots = state.inventory.filter((i) => i.productId === p.id);
        const qty = lots.reduce((a, b) => a + b.quantity, 0);
        const val = lots.reduce((a, b) => a + b.quantity * b.averageCost, 0);
        return [p.name, qty, qty ? ghs(val / qty, 2) : "—", ghs(val)];
      });
    } else {
      headers.splice(0, 4, "Indicator", "Price", "Unit", "Source");
      rows = state.market.map((m) => [m.indicator, m.price, m.unit, `${m.source} (DEMO)`]);
    }
    return { headers, rows };
  }, [kind, state, company, productId, from, to, products, customers, suppliers]);

  const html = `<table><thead><tr>${table.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${table.rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

  return (
    <div>
      <PageHeader
        eyebrow="Exports"
        title="Reports"
        subtitle="Filter the book and download CSV or a print-ready PDF. Market reports stay labelled as demo."
        actions={
          <>
            <Button onClick={() => exportCsv(`aeci-${kind}.csv`, table.headers, table.rows)}>CSV</Button>
            <Button variant="gold" onClick={() => exportPdf(`${APP_NAME} ${kind} report`, html)}>PDF</Button>
          </>
        }
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])}>
          {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-mist">
            <tr>{table.headers.map((h) => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                {r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-mist">Generated {formatDate("2026-09-11")} · {APP_NAME} · {company.name} · tenant isolation applied in the client store (backend will enforce the same).</p>
    </div>
  );
}
