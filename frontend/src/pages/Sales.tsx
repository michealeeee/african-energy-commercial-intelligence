import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { canMutateModule } from "../lib/permissions";
import { formatDate, ghs, pct, uid } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Currency } from "../types";

const empty = {
  customerId: "",
  productId: "",
  locationId: "",
  quantity: 10000,
  sellingPrice: 14,
  currency: "GHS" as Currency,
  exchangeRate: 1,
  date: new Date().toISOString().slice(0, 10),
  discounts: 0,
  transportation: 0,
  otherCosts: 0,
};

export default function Sales() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "sales");
  const rows = state.sales.filter((s) => s.companyId === company.id);
  const customers = state.customers.filter((c) => c.companyId === company.id);
  const products = state.products.filter((p) => p.companyId === company.id && !p.deletedAt);
  const locations = state.locations.filter((l) => l.companyId === company.id);
  const lot = state.inventory.find((i) => i.companyId === company.id && i.productId === form.productId && i.locationId === form.locationId);
  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        eyebrow="Commercial operations"
        title="Sales"
        subtitle="Revenue, COGS at average depot cost, gross profit and margin. Posting draws inventory."
        actions={write ? <Button variant="gold" onClick={() => setOpen(true)}>New sale</Button> : undefined}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.date) },
          { key: "c", header: "Customer", render: (r) => customers.find((c) => c.id === r.customerId)?.name ?? "—" },
          { key: "p", header: "Product", render: (r) => products.find((p) => p.id === r.productId)?.name ?? r.productId },
          { key: "rev", header: "Revenue", render: (r) => <span className="num">{ghs(r.revenue)}</span> },
          { key: "gp", header: "Gross profit", render: (r) => <span className={`num ${r.grossProfit < 0 ? "text-loss" : "text-gain"}`}>{ghs(r.grossProfit)}</span> },
          { key: "m", header: "Margin", render: (r) => <span className="num">{pct(r.grossMarginPct)}</span> },
          { key: "ar", header: "Open AR", render: (r) => <span className="num">{ghs(r.receivableOutstanding)}</span> },
        ]}
      />
      {open && (
        <Modal title="Record sale" wide onClose={() => setOpen(false)}>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({
                type: "add_sale",
                sale: {
                  id: uid("so"),
                  companyId: company.id,
                  ...form,
                  exchangeRate: form.currency === "GHS" ? 1 : form.exchangeRate,
                  receivableOutstanding: form.quantity * form.sellingPrice * 0.25,
                },
              });
              dispatch({ type: "audit", companyId: company.id, actorId: user.id, action: "create", entity: "sale", detail: "Posted sale" });
              setOpen(false);
            }}
          >
            <Field label="Customer">
              <select className={inputClass} required value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
                <option value="">Select</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Product">
              <select className={inputClass} required value={form.productId} onChange={(e) => set("productId", e.target.value)}>
                <option value="">Select</option>
                {products.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Depot">
              <select className={inputClass} required value={form.locationId} onChange={(e) => set("locationId", e.target.value)}>
                <option value="">Select</option>
                {locations.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Date"><input className={inputClass} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Quantity"><input className={inputClass} type="number" value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} /></Field>
            <Field label="Selling price"><input className={inputClass} type="number" step="0.01" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} /></Field>
            <Field label="Currency">
              <select className={inputClass} value={form.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
                <option>GHS</option>
                <option>USD</option>
              </select>
            </Field>
            <Field label="FX rate"><input className={inputClass} type="number" step="0.01" value={form.exchangeRate} onChange={(e) => set("exchangeRate", Number(e.target.value))} /></Field>
            <Field label="Discounts (GHS)"><input className={inputClass} type="number" value={form.discounts} onChange={(e) => set("discounts", Number(e.target.value))} /></Field>
            <Field label="Transportation (GHS)"><input className={inputClass} type="number" value={form.transportation} onChange={(e) => set("transportation", Number(e.target.value))} /></Field>
            <Field label="Other costs (GHS)"><input className={inputClass} type="number" value={form.otherCosts} onChange={(e) => set("otherCosts", Number(e.target.value))} /></Field>
            <p className="sm:col-span-2 text-sm text-mist">Depot stock {lot ? lot.quantity.toLocaleString() : 0} · avg cost {lot ? ghs(lot.averageCost, 2) : "—"}</p>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="gold" type="submit">Post sale</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
