import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { Badge, PageHeader } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { formatDate, ghs, uid } from "../lib/format";
import { canMutateModule } from "../lib/permissions";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Contract } from "../types";

export default function Contracts() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [editing, setEditing] = useState<Contract | null>(null);
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "contracts");
  const rows = state.contracts.filter((c) => c.companyId === company.id);
  const products = state.products.filter((p) => p.companyId === company.id);
  const parties = [...state.suppliers, ...state.customers].filter((p) => p.companyId === company.id);

  return (
    <div>
      <PageHeader
        eyebrow="Commitments"
        title="Contracts"
        subtitle="Frame agreements with remaining quantity, value and expiry. Expiry within 14 days is flagged."
        actions={write ? <Button variant="gold" onClick={() => setEditing({ id: uid("ct"), companyId: company.id, partyType: "customer", partyId: "", productId: products[0]?.id ?? "", quantity: 100000, fulfilledQty: 0, price: 14, currency: "GHS", startDate: "2026-09-11", expiryDate: "2026-12-31", paymentTerms: "Net 14", deliveryTerms: "DAP", notes: "", createdAt: "2026-09-11" })}>New contract</Button> : undefined}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "p", header: "Party", render: (r) => parties.find((x) => x.id === r.partyId)?.name ?? r.partyId },
          { key: "t", header: "Type", render: (r) => r.partyType },
          { key: "pr", header: "Product", render: (r) => products.find((p) => p.id === r.productId)?.name },
          { key: "q", header: "Remaining", render: (r) => <span className="num">{(r.quantity - r.fulfilledQty).toLocaleString()} / {r.quantity.toLocaleString()}</span> },
          { key: "v", header: "Value", render: (r) => <span className="num">{ghs(r.quantity * r.price * (r.currency === "USD" ? (state.market.find((m) => m.id === "m_usd_ghs")?.price ?? 15.5) : 1))}</span> },
          { key: "e", header: "Expiry", render: (r) => formatDate(r.expiryDate) },
          { key: "s", header: "Status", render: (r) => (r.expiryDate < "2026-09-25" ? <Badge tone="bad">Expiring</Badge> : <Badge tone="good">Live</Badge>) },
          { key: "a", header: "", render: (r) => write ? <button className="text-gold" onClick={() => setEditing(r)}>Edit</button> : null },
        ]}
      />
      {editing && (
        <Modal title="Contract" wide onClose={() => setEditing(null)}>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "upsert_contract", contract: editing }); setEditing(null); }}>
            <Field label="Party type">
              <select className={inputClass} value={editing.partyType} onChange={(e) => setEditing({ ...editing, partyType: e.target.value as Contract["partyType"] })}>
                <option value="customer">Customer</option>
                <option value="supplier">Supplier</option>
              </select>
            </Field>
            <Field label="Party">
              <select className={inputClass} value={editing.partyId} onChange={(e) => setEditing({ ...editing, partyId: e.target.value })}>
                <option value="">Select</option>
                {(editing.partyType === "customer" ? state.customers : state.suppliers).filter((p) => p.companyId === company.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Product">
              <select className={inputClass} value={editing.productId} onChange={(e) => setEditing({ ...editing, productId: e.target.value })}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Quantity"><input className={inputClass} type="number" value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })} /></Field>
            <Field label="Fulfilled"><input className={inputClass} type="number" value={editing.fulfilledQty} onChange={(e) => setEditing({ ...editing, fulfilledQty: Number(e.target.value) })} /></Field>
            <Field label="Price"><input className={inputClass} type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
            <Field label="Start"><input className={inputClass} type="date" value={editing.startDate} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} /></Field>
            <Field label="Expiry"><input className={inputClass} type="date" value={editing.expiryDate} onChange={(e) => setEditing({ ...editing, expiryDate: e.target.value })} /></Field>
            <Field label="Payment terms"><input className={inputClass} value={editing.paymentTerms} onChange={(e) => setEditing({ ...editing, paymentTerms: e.target.value })} /></Field>
            <Field label="Delivery terms"><input className={inputClass} value={editing.deliveryTerms} onChange={(e) => setEditing({ ...editing, deliveryTerms: e.target.value })} /></Field>
            <Field label="Notes"><input className={inputClass} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            <div className="sm:col-span-2 flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gold" type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
