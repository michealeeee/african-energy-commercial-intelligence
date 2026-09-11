import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { Badge, PageHeader } from "../components/ui/EmptyState";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { canMutateModule } from "../lib/permissions";
import { uid } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";
import type { Product } from "../types";

const CATS = ["Petrol", "Diesel", "LPG", "Jet fuel", "Kerosene", "Other"];

export default function Products() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [editing, setEditing] = useState<Product | null>(null);
  const [del, setDel] = useState<Product | null>(null);
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "products");
  const rows = state.products.filter((p) => p.companyId === company.id && !p.deletedAt);

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        subtitle="Petroleum grades this company trades. Minimum inventory drives low-stock alerts."
        actions={write ? <Button variant="gold" onClick={() => setEditing({ id: uid("pr"), companyId: company.id, name: "", category: "Diesel", unit: "L", minInventory: 50000, description: "", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null })}>Add product</Button> : undefined}
      />
      <DataTable
        rows={rows}
        columns={[
          { key: "n", header: "Name", render: (r) => r.name },
          { key: "c", header: "Category", render: (r) => r.category },
          { key: "u", header: "Unit", render: (r) => r.unit },
          { key: "m", header: "Min inventory", render: (r) => r.minInventory.toLocaleString() },
          { key: "s", header: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "neutral"}>{r.status}</Badge> },
          {
            key: "a",
            header: "",
            render: (r) => write ? (
              <div className="flex gap-2">
                <button className="text-gold" onClick={() => setEditing(r)}>Edit</button>
                <button className="text-loss" onClick={() => setDel(r)}>Deactivate</button>
              </div>
            ) : null,
          },
        ]}
      />
      {editing && (
        <Modal title="Product" onClose={() => setEditing(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "upsert_product", product: { ...editing, updatedAt: new Date().toISOString() } }); setEditing(null); }}>
            <Field label="Name"><input className={inputClass} required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Category">
              <select className={inputClass} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Unit"><input className={inputClass} value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} /></Field>
            <Field label="Minimum inventory"><input className={inputClass} type="number" value={editing.minInventory} onChange={(e) => setEditing({ ...editing, minInventory: Number(e.target.value) })} /></Field>
            <Field label="Description"><textarea className={inputClass} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gold" type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
      {del && (
        <ConfirmDialog
          title="Deactivate product"
          body={`Soft-delete ${del.name}? Historical purchases remain.`}
          confirm="Deactivate"
          onCancel={() => setDel(null)}
          onConfirm={() => { dispatch({ type: "soft_delete_product", id: del.id }); setDel(null); }}
        />
      )}
    </div>
  );
}
