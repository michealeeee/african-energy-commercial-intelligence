import { useMemo, useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { canMutateModule } from "../lib/permissions";
import { formatDate, ghs, litres, uid } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Currency, Purchase } from "../types";

const empty = {
  supplierId: "",
  productId: "",
  locationId: "",
  quantity: 10000,
  purchasePrice: 0.8,
  currency: "USD" as Currency,
  exchangeRate: 15.5,
  date: new Date().toISOString().slice(0, 10),
  freight: 0,
  insurance: 0,
  portHandling: 0,
  taxes: 0,
  transportation: 0,
  storage: 0,
  financing: 0,
  otherCosts: 0,
};

export default function Purchases() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "purchases");
  const rows = state.purchases.filter((p) => p.companyId === company.id);
  const suppliers = state.suppliers.filter((s) => s.companyId === company.id);
  const products = state.products.filter((p) => p.companyId === company.id && !p.deletedAt);
  const locations = state.locations.filter((l) => l.companyId === company.id);

  const preview = useMemo(() => {
    const productCost = form.quantity * form.purchasePrice * (form.currency === "GHS" ? 1 : form.exchangeRate);
    const extras = form.freight + form.insurance + form.portHandling + form.taxes + form.transportation + form.storage + form.financing + form.otherCosts;
    const landed = productCost + extras;
    return { productCost, landed, cpu: form.quantity ? landed / form.quantity : 0 };
  }, [form]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        eyebrow="Commercial operations"
        title="Purchases"
        subtitle="Cargo and ex-refinery lifts with full landed-cost stack. Inventory lots update when a purchase is posted."
        actions={write ? <Button variant="gold" onClick={() => setOpen(true)}>New purchase</Button> : undefined}
      />
      <DataTable
        rows={rows}
        searchPlaceholder="Search purchases"
        columns={[
          { key: "date", header: "Date", render: (r) => formatDate(r.date) },
          { key: "supplier", header: "Supplier", render: (r) => suppliers.find((s) => s.id === r.supplierId)?.name ?? "—" },
          { key: "product", header: "Product", render: (r) => products.find((p) => p.id === r.productId)?.name ?? r.productId },
          { key: "qty", header: "Qty", render: (r) => <span className="num">{litres(r.quantity)}</span> },
          { key: "landed", header: "Landed cost", render: (r) => <span className="num">{ghs(r.totalLandedCost)}</span> },
          { key: "cpu", header: "Cost / unit", render: (r) => <span className="num">{ghs(r.costPerUnit, 2)}</span> },
          { key: "ap", header: "Open AP", render: (r) => <span className="num">{ghs(r.payableOutstanding)}</span> },
        ]}
      />
      {open && (
        <Modal title="Record purchase" wide onClose={() => setOpen(false)}>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fx = form.currency === "GHS" ? 1 : form.exchangeRate;
              const row: Omit<Purchase, "totalPurchaseCost" | "totalLandedCost" | "costPerUnit" | "createdAt"> = {
                id: uid("po"),
                companyId: company.id,
                ...form,
                exchangeRate: fx,
                payableOutstanding: preview.landed * 0.2,
              };
              dispatch({ type: "add_purchase", purchase: row });
              dispatch({ type: "audit", companyId: company.id, actorId: user.id, action: "create", entity: "purchase", detail: row.id });
              setOpen(false);
            }}
          >
            <Field label="Supplier">
              <select className={inputClass} value={form.supplierId} onChange={(e) => set("supplierId", e.target.value)} required>
                <option value="">Select</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Product">
              <select className={inputClass} value={form.productId} onChange={(e) => set("productId", e.target.value)} required>
                <option value="">Select</option>
                {products.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Depot">
              <select className={inputClass} value={form.locationId} onChange={(e) => set("locationId", e.target.value)} required>
                <option value="">Select</option>
                {locations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Date">
              <input className={inputClass} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Quantity">
              <input className={inputClass} type="number" value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} />
            </Field>
            <Field label="Purchase price">
              <input className={inputClass} type="number" step="0.01" value={form.purchasePrice} onChange={(e) => set("purchasePrice", Number(e.target.value))} />
            </Field>
            <Field label="Currency">
              <select className={inputClass} value={form.currency} onChange={(e) => set("currency", e.target.value as Currency)}>
                <option>USD</option>
                <option>GHS</option>
              </select>
            </Field>
            <Field label="Exchange rate (GHS per 1 FX)">
              <input className={inputClass} type="number" step="0.01" value={form.exchangeRate} onChange={(e) => set("exchangeRate", Number(e.target.value))} disabled={form.currency === "GHS"} />
            </Field>
            {(["freight", "insurance", "portHandling", "taxes", "transportation", "storage", "financing", "otherCosts"] as const).map((k) => (
              <Field key={k} label={`${k} (GHS)`}>
                <input className={inputClass} type="number" value={form[k]} onChange={(e) => set(k, Number(e.target.value))} />
              </Field>
            ))}
            <div className="sm:col-span-2 rounded-xl border border-gold/30 bg-[#161208] p-4 text-sm">
              <p>Product cost {ghs(preview.productCost)} · Landed {ghs(preview.landed)} · Cost/unit {ghs(preview.cpu, 2)}</p>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="gold" type="submit">Post to inventory</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
