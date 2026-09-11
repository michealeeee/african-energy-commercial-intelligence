import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ghs, pct, uid } from "../lib/format";
import { canMutateModule } from "../lib/permissions";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Customer } from "../types";

export default function Customers() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [historyFor, setHistoryFor] = useState<Customer | null>(null);
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "customers");
  const rows = state.customers.filter((c) => c.companyId === company.id);
  const sales = state.sales.filter((s) => s.companyId === company.id);

  const metrics = (id: string) => {
    const xs = sales.filter((s) => s.customerId === id);
    const rev = xs.reduce((s, r) => s + r.revenue, 0);
    const gp = xs.reduce((s, r) => s + r.grossProfit, 0);
    const ar = xs.reduce((s, r) => s + r.receivableOutstanding, 0);
    return { rev, gp, ar, m: rev ? (gp / rev) * 100 : 0, n: xs.length };
  };

  return (
    <div>
      <PageHeader
        eyebrow="Counterparties"
        title="Customers"
        subtitle="Balances, profitability and lift history. Isolated to this company tenant."
        actions={write ? <Button variant="gold" onClick={() => setEditing({ id: uid("cu"), companyId: company.id, name: "", segment: "Industrial", city: "Accra", contact: "", email: "", phone: "", creditLimit: 100000, status: "active", notes: "", createdAt: new Date().toISOString().slice(0, 10) })}>Add customer</Button> : undefined}
      />
      <DataTable
        rows={rows}
        filter={(r, q) => `${r.name} ${r.city} ${r.segment}`.toLowerCase().includes(q)}
        columns={[
          { key: "n", header: "Customer", render: (r) => r.name },
          { key: "s", header: "Segment", render: (r) => r.segment },
          { key: "rev", header: "Revenue", render: (r) => <span className="num">{ghs(metrics(r.id).rev)}</span> },
          { key: "gp", header: "Profit", render: (r) => <span className="num">{ghs(metrics(r.id).gp)}</span> },
          { key: "m", header: "Margin", render: (r) => pct(metrics(r.id).m) },
          { key: "ar", header: "Outstanding", render: (r) => <span className="num">{ghs(metrics(r.id).ar)}</span> },
          {
            key: "a",
            header: "",
            render: (r) => (
              <div className="flex gap-2">
                <button className="text-gold" onClick={() => setHistoryFor(r)}>History</button>
                {write && <button className="text-mist" onClick={() => setEditing(r)}>Edit</button>}
              </div>
            ),
          },
        ]}
      />
      {editing && (
        <Modal title={rows.some((r) => r.id === editing.id) ? "Edit customer" : "New customer"} onClose={() => setEditing(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "upsert_customer", customer: editing });
              setEditing(null);
            }}
          >
            <Field label="Name"><input className={inputClass} required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Segment"><input className={inputClass} value={editing.segment} onChange={(e) => setEditing({ ...editing, segment: e.target.value })} /></Field>
            <Field label="City"><input className={inputClass} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
            <Field label="Credit limit (GHS)"><input className={inputClass} type="number" value={editing.creditLimit} onChange={(e) => setEditing({ ...editing, creditLimit: Number(e.target.value) })} /></Field>
            <Field label="Email"><input className={inputClass} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="gold" type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
      {historyFor && (
        <Modal title={`${historyFor.name} · history`} wide onClose={() => setHistoryFor(null)}>
          <p className="mb-3 text-sm text-mist">Profit {ghs(metrics(historyFor.id).gp)} · Outstanding {ghs(metrics(historyFor.id).ar)}</p>
          <table className="w-full text-sm">
            <thead className="text-mist"><tr><th className="text-left">Date</th><th className="text-left">Revenue</th><th className="text-left">GP</th><th className="text-left">AR</th></tr></thead>
            <tbody>
              {sales.filter((s) => s.customerId === historyFor.id).map((s) => (
                <tr key={s.id} className="border-t border-line"><td className="py-2">{s.date}</td><td className="num">{ghs(s.revenue)}</td><td className="num">{ghs(s.grossProfit)}</td><td className="num">{ghs(s.receivableOutstanding)}</td></tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
