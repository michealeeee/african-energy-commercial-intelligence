import { useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { DataTable } from "../components/ui/DataTable";
import { Badge, PageHeader } from "../components/ui/EmptyState";
import { KpiCard } from "../components/ui/KpiCard";
import { ConfirmDialog, Modal } from "../components/ui/Modal";
import { usd, uid } from "../lib/format";
import { PLANS, ROLE_LABEL, type Company, type PlanId, type User } from "../types";
import { useEnergy } from "../store/EnergyFlowContext";

export default function AdminHome() {
  const { state } = useEnergy();
  const mrr = state.subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + (PLANS.find((p) => p.id === s.planId)?.monthlyPriceUsd ?? 0), 0);
  return (
    <div>
      <PageHeader eyebrow="Super Admin" title="Platform overview" subtitle="All Ghana tenants, mock billing and system activity. Isolated from company books." />
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Companies" value={String(state.companies.length)} />
        <KpiCard label="Active subscriptions" value={String(state.subscriptions.filter((s) => s.status === "active").length)} />
        <KpiCard label="Platform MRR (mock)" value={usd(mrr, 0)} hint="USD · mock payments" />
        <KpiCard label="Users" value={String(state.users.length)} />
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="border-b border-line px-4 py-3 font-semibold">Recent audit</div>
        <ul className="divide-y divide-line text-sm">
          {state.auditLogs.slice(0, 8).map((a) => (
            <li key={a.id} className="px-4 py-3">
              <span className="text-gold">{a.action}</span> · {a.entity} · {a.detail}
              <span className="block text-xs text-mist">{a.createdAt}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AdminCompanies() {
  const { state, dispatch } = useEnergy();
  const [editing, setEditing] = useState<Company | null>(null);
  const [suspend, setSuspend] = useState<Company | null>(null);
  return (
    <div>
      <PageHeader title="Companies" actions={<Button variant="gold" onClick={() => setEditing({ id: uid("co"), name: "", shortName: "", country: "Ghana", city: "Accra", licenseNo: "", status: "active", planId: "starter", billingEmail: "", createdAt: new Date().toISOString().slice(0, 10) })}>Create company</Button>} />
      <DataTable
        rows={state.companies}
        columns={[
          { key: "n", header: "Company", render: (r) => r.name },
          { key: "c", header: "City", render: (r) => r.city },
          { key: "p", header: "Plan", render: (r) => r.planId },
          { key: "s", header: "Status", render: (r) => <Badge tone={r.status === "active" ? "good" : "bad"}>{r.status}</Badge> },
          {
            key: "a",
            header: "",
            render: (r) => (
              <div className="flex gap-2">
                <button className="text-gold" onClick={() => setEditing(r)}>Edit</button>
                <button className="text-loss" onClick={() => setSuspend(r)}>{r.status === "active" ? "Suspend" : "Reinstate"}</button>
              </div>
            ),
          },
        ]}
      />
      {editing && (
        <Modal title="Company" onClose={() => setEditing(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "upsert_company", company: editing }); if (!state.subscriptions.some((s) => s.companyId === editing.id)) {
            /* subscription created via set_plan below */
          } dispatch({ type: "set_plan", companyId: editing.id, planId: editing.planId }); setEditing(null); }}>
            <Field label="Name"><input className={inputClass} required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, shortName: e.target.value.slice(0, 18) })} /></Field>
            <Field label="City"><input className={inputClass} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></Field>
            <Field label="Licence"><input className={inputClass} value={editing.licenseNo} onChange={(e) => setEditing({ ...editing, licenseNo: e.target.value })} /></Field>
            <Field label="Plan">
              <select className={inputClass} value={editing.planId} onChange={(e) => setEditing({ ...editing, planId: e.target.value as PlanId })}>
                {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gold" type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
      {suspend && (
        <ConfirmDialog
          title={suspend.status === "active" ? "Suspend company" : "Reinstate company"}
          body="Users of a suspended tenant cannot sign in."
          confirm="Confirm"
          onCancel={() => setSuspend(null)}
          onConfirm={() => { dispatch({ type: "set_company_status", id: suspend.id, status: suspend.status === "active" ? "suspended" : "active" }); setSuspend(null); }}
        />
      )}
    </div>
  );
}

export function AdminUsers() {
  const { state, dispatch } = useEnergy();
  const [editing, setEditing] = useState<User | null>(null);
  return (
    <div>
      <PageHeader title="Users" actions={<Button variant="gold" onClick={() => setEditing({ id: uid("u"), companyId: state.companies[0]?.id ?? null, name: "", email: "", password: "demo123", role: "viewer", status: "active", lastLoginAt: null })}>Invite user</Button>} />
      <DataTable
        rows={state.users}
        columns={[
          { key: "n", header: "Name", render: (r) => r.name },
          { key: "e", header: "Email", render: (r) => r.email },
          { key: "c", header: "Company", render: (r) => state.companies.find((c) => c.id === r.companyId)?.shortName ?? "Platform" },
          { key: "r", header: "Role", render: (r) => ROLE_LABEL[r.role] },
          { key: "s", header: "Status", render: (r) => r.status },
          { key: "a", header: "", render: (r) => <button className="text-gold" onClick={() => setEditing(r)}>Edit</button> },
        ]}
      />
      {editing && (
        <Modal title="User" onClose={() => setEditing(null)}>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); dispatch({ type: "upsert_user", user: editing }); setEditing(null); }}>
            <Field label="Name"><input className={inputClass} required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
            <Field label="Company">
              <select className={inputClass} value={editing.companyId ?? ""} onChange={(e) => setEditing({ ...editing, companyId: e.target.value || null, role: e.target.value ? editing.role === "super_admin" ? "company_admin" : editing.role : "super_admin" })}>
                <option value="">Platform</option>
                {state.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Role">
              <select className={inputClass} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as User["role"] })}>
                {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gold" type="submit">Save</Button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AdminBilling() {
  const { state, dispatch } = useEnergy();
  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Mock payment references stand in for Paystack/Stripe until the billing API is connected." />
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {PLANS.map((p) => (
          <article key={p.id} className="rounded-2xl border border-line bg-panel p-4">
            <p className="text-gold">{p.name}</p>
            <p className="num mt-1 text-2xl">{usd(p.monthlyPriceUsd, 0)}<span className="text-sm text-mist">/mo</span></p>
            <p className="mt-2 text-sm text-mist">{p.blurb}</p>
            <p className="mt-2 text-xs text-mist">{p.userLimit} users · {p.locationLimit} locations</p>
          </article>
        ))}
      </div>
      <DataTable
        rows={state.subscriptions}
        columns={[
          { key: "c", header: "Company", render: (r) => state.companies.find((c) => c.id === r.companyId)?.name },
          { key: "p", header: "Plan", render: (r) => r.planId },
          { key: "s", header: "Status", render: (r) => r.status },
          { key: "d", header: "Period", render: (r) => `${r.periodStart} → ${r.periodEnd}` },
          { key: "m", header: "Payment", render: (r) => r.mockPaymentRef },
          {
            key: "a",
            header: "Change plan",
            render: (r) => (
              <select className={inputClass} value={r.planId} onChange={(e) => dispatch({ type: "set_plan", companyId: r.companyId, planId: e.target.value as PlanId })}>
                {PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ),
          },
        ]}
      />
    </div>
  );
}

export function AdminMarket() {
  const { state } = useEnergy();
  return (
    <div>
      <PageHeader title="Market-data settings" subtitle="Placeholder provider config. API keys will live in Django environment variables, never in this UI." />
      <div className="rounded-2xl border border-line bg-panel p-5 text-sm">
        <p>Provider: <span className="text-gold">demo-seed</span> (swap to licensed feed)</p>
        <p className="mt-2 text-mist">Indicators: {state.market.map((m) => m.indicator).join(" · ")}</p>
        <p className="mt-2 text-mist">Polling interval: 15 min · FX pair: USDGHS · Crude: ICE Brent, NYMEX WTI</p>
      </div>
    </div>
  );
}

export function AdminConfig() {
  return (
    <div>
      <PageHeader title="System configuration" />
      <ul className="space-y-2 text-sm text-mist">
        <li>Default currency: GHS</li>
        <li>Default liquid unit: litres</li>
        <li>Low-margin threshold: 5%</li>
        <li>FX alert: 1% daily move</li>
        <li>Contract expiry window: 14 days</li>
        <li>Product categories: Petrol, Diesel, LPG, Jet fuel, Kerosene, Other</li>
      </ul>
    </div>
  );
}

export function AdminAudit() {
  const { state } = useEnergy();
  return (
    <div>
      <PageHeader title="Audit logs" />
      <DataTable
        rows={state.auditLogs}
        columns={[
          { key: "t", header: "When", render: (r) => r.createdAt.replace("T", " ").slice(0, 19) },
          { key: "u", header: "Actor", render: (r) => state.users.find((u) => u.id === r.actorId)?.name ?? r.actorId },
          { key: "a", header: "Action", render: (r) => r.action },
          { key: "e", header: "Entity", render: (r) => r.entity },
          { key: "d", header: "Detail", render: (r) => r.detail },
        ]}
      />
    </div>
  );
}

