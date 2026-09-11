import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { PageHeader, Badge } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { canMutateModule } from "../lib/permissions";
import { formatDate, ghs } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Inventory() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const [mode, setMode] = useState<"adjust" | "transfer" | null>(null);
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [toLocationId, setTo] = useState("");
  const [qty, setQty] = useState(1000);
  const [notes, setNotes] = useState("Dip / gain-loss");
  if (!company || !user) return null;
  const write = canMutateModule(user.role, "inventory");
  const products = state.products.filter((p) => p.companyId === company.id && !p.deletedAt);
  const locations = state.locations.filter((l) => l.companyId === company.id);
  const lots = state.inventory.filter((i) => i.companyId === company.id);
  const moves = state.movements.filter((m) => m.companyId === company.id);
  const name = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const loc = (id: string | null) => (id ? locations.find((l) => l.id === id)?.name ?? id : "—");
  const chart = products.map((p) => ({
    name: p.name,
    qty: lots.filter((l) => l.productId === p.id).reduce((s, r) => s + r.quantity, 0),
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        subtitle="Lots by depot, weighted average cost, value, and a movement ledger for purchases, sales, transfers and adjustments."
        actions={
          write ? (
            <>
              <Button onClick={() => setMode("adjust")}>Adjustment</Button>
              <Button variant="gold" onClick={() => setMode("transfer")}>Transfer</Button>
            </>
          ) : undefined
        }
      />
      <div className="mb-6 h-56 rounded-2xl border border-line bg-panel p-4">
        <ResponsiveContainer>
          <BarChart data={chart}>
            <CartesianGrid stroke="#1d3a4f" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#8aa0b5" fontSize={11} />
            <YAxis stroke="#8aa0b5" fontSize={11} />
            <Tooltip contentStyle={{ background: "#0d1a28", border: "1px solid #1d3a4f" }} />
            <Bar dataKey="qty" fill="#d4a017" name="On hand" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h2 className="mb-3 font-semibold">Depot lots</h2>
      <DataTable
        rows={lots}
        columns={[
          { key: "p", header: "Product", render: (r) => name(r.productId) },
          { key: "l", header: "Depot", render: (r) => loc(r.locationId) },
          { key: "q", header: "Qty", render: (r) => <span className="num">{r.quantity.toLocaleString()}</span> },
          { key: "a", header: "Avg cost", render: (r) => <span className="num">{ghs(r.averageCost, 2)}</span> },
          { key: "v", header: "Value", render: (r) => <span className="num">{ghs(r.quantity * r.averageCost)}</span> },
          {
            key: "min",
            header: "Status",
            render: (r) => {
              const min = products.find((p) => p.id === r.productId)?.minInventory ?? 0;
              const total = lots.filter((l) => l.productId === r.productId).reduce((s, x) => s + x.quantity, 0);
              return total < min ? <Badge tone="bad">Low stock</Badge> : <Badge tone="good">Healthy</Badge>;
            },
          },
        ]}
      />
      <h2 className="mb-3 mt-8 font-semibold">Movement ledger</h2>
      <DataTable
        rows={moves}
        columns={[
          { key: "d", header: "Date", render: (r) => formatDate(r.date) },
          { key: "t", header: "Type", render: (r) => r.type },
          { key: "p", header: "Product", render: (r) => name(r.productId) },
          { key: "f", header: "From", render: (r) => loc(r.fromLocationId) },
          { key: "to", header: "To", render: (r) => loc(r.toLocationId) },
          { key: "q", header: "Qty", render: (r) => <span className="num">{r.quantity.toLocaleString()}</span> },
          { key: "n", header: "Notes", render: (r) => r.notes },
        ]}
      />
      {mode && (
        <Modal title={mode === "adjust" ? "Stock adjustment" : "Depot transfer"} onClose={() => setMode(null)}>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "adjust") {
                dispatch({ type: "adjust_inventory", companyId: company.id, productId, locationId, quantity: qty, notes });
              } else {
                dispatch({ type: "transfer_inventory", companyId: company.id, productId, fromLocationId: locationId, toLocationId, quantity: qty });
              }
              setMode(null);
            }}
          >
            <Field label="Product">
              <select className={inputClass} required value={productId} onChange={(e) => setProductId(e.target.value)}>
                <option value="">Select</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label={mode === "transfer" ? "From depot" : "Depot"}>
              <select className={inputClass} required value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                <option value="">Select</option>
                {locations.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            {mode === "transfer" && (
              <Field label="To depot">
                <select className={inputClass} required value={toLocationId} onChange={(e) => setTo(e.target.value)}>
                  <option value="">Select</option>
                  {locations.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
            )}
            <Field label={mode === "adjust" ? "Quantity (+ gain / − loss)" : "Quantity"}>
              <input className={inputClass} type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </Field>
            {mode === "adjust" && (
              <Field label="Notes">
                <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)}>Cancel</Button>
              <Button variant="gold" type="submit">Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
