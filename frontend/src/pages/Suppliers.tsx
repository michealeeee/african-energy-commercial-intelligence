import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { ghs, money, uid } from "../lib/format";
import { canMutateModule } from "../lib/permissions";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Supplier, SupplierQuote } from "../types";

export default function Suppliers() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [quoteFor, setQuoteFor] = useState<Supplier | null>(null);
  const [qForm, setQForm] = useState({ productId: "", price: 0.8, currency: "USD" as "USD" | "GHS", validUntil: "2026-09-30", notes: "" });
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "suppliers");
  const rows = state.suppliers.filter((s) => s.companyId === company.id);
  const purchases = state.purchases.filter((p) => p.companyId === company.id);
  const quotes = state.quotes.filter((q) => q.companyId === company.id);
  const products = state.products.filter((p) => p.companyId === company.id && !p.deletedAt);
  const spend = (id: string) => purchases.filter((p) => p.supplierId === id).reduce((s, r) => s + r.totalLandedCost, 0);
  const avgUnit = (id: string) => {
    const xs = purchases.filter((p) => p.supplierId === id);
    const qty = xs.reduce((s, r) => s + r.quantity, 0);
    const cost = xs.reduce((s, r) => s + r.totalLandedCost, 0);
    return qty ? cost / qty : 0;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Counterparties"
        title="Suppliers"
        subtitle="Quotations, delivered cost performance and total purchases. Tenant-scoped."
        actions={write ? <Button variant="gold" onClick={() => setEditing({ id: uid("su"), companyId: company.id, name: "", country: "Ghana", contact: "", email: "", phone: "", paymentTerms: "Net 14", status: "active", notes: "", createdAt: new Date().toISOString().slice(0, 10) })}>Add supplier</Button> : undefined}
      />
      <h2 className="mb-2 font-semibold">Price comparison (open quotes)</h2>
      <div className="mb-6 overflow-x-auto rounded-2xl border border-line">
        <table className="min-w-full text-sm">
          <thead className="bg-panel-2 text-xs uppercase text-mist">
            <tr>
              <th className="px-3 py-2 text-left">Supplier</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Valid</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-t border-line">
                <td className="px-3 py-2">{rows.find((s) => s.id === q.supplierId)?.name}</td>
                <td className="px-3 py-2">{products.find((p) => p.id === q.productId)?.name}</td>
                <td className="num px-3 py-2">{money(q.price, q.currency, 3)}</td>
                <td className="px-3 py-2">{q.validUntil}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DataTable
        rows={rows}
        columns={[
          { key: "n", header: "Supplier", render: (r) => r.name },
          { key: "c", header: "Country", render: (r) => r.country },
          { key: "t", header: "Terms", render: (r) => r.paymentTerms },
          { key: "s", header: "Purchases", render: (r) => <span className="num">{ghs(spend(r.id))}</span> },
          { key: "u", header: "Avg landed / unit", render: (r) => <span className="num">{ghs(avgUnit(r.id), 2)}</span> },
          {
            key: "a",
            header: "",
            render: (r) => (
              <div className="flex gap-2">
                {write && <button className="text-gold" onClick={() => { setQuoteFor(r); setQForm((f) => ({ ...f, productId: products[0]?.id ?? "" })); }}>Quote</button>}
                {write && <button className="text-mist" onClick={() => setEditing(r)}>Edit</button>}
              </div>
            ),
          },
        ]}
      />
      {editing && (
        <Modal title="Supplier" onClose={() => setEditing(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "upsert_supplier", supplier: editing }); setEditing(null); }}>
            <Field label="Name"><input className={inputClass} required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Country"><input className={inputClass} value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></Field>
            <Field label="Payment terms"><input className={inputClass} value={editing.paymentTerms} onChange={(e) => setEditing({ ...editing, paymentTerms: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gold" type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
      {quoteFor && (
        <Modal title={`Quote · ${quoteFor.name}`} onClose={() => setQuoteFor(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const quote: SupplierQuote = { id: uid("q"), companyId: company.id, supplierId: quoteFor.id, ...qForm, createdAt: new Date().toISOString().slice(0, 10) };
              dispatch({ type: "add_quote", quote });
              setQuoteFor(null);
            }}
          >
            <Field label="Product">
              <select className={inputClass} value={qForm.productId} onChange={(e) => setQForm({ ...qForm, productId: e.target.value })}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Price"><input className={inputClass} type="number" step="0.001" value={qForm.price} onChange={(e) => setQForm({ ...qForm, price: Number(e.target.value) })} /></Field>
            <Field label="Currency">
              <select className={inputClass} value={qForm.currency} onChange={(e) => setQForm({ ...qForm, currency: e.target.value as "USD" | "GHS" })}>
                <option>USD</option>
                <option>GHS</option>
              </select>
            </Field>
            <Field label="Valid until"><input className={inputClass} type="date" value={qForm.validUntil} onChange={(e) => setQForm({ ...qForm, validUntil: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setQuoteFor(null)}>Cancel</Button><Button variant="gold" type="submit">Save quote</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
