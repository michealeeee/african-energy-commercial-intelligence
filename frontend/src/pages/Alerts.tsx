import { PlanGate } from "../components/layout/guards";
import { Badge, PageHeader } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { formatDate } from "../lib/format";
import { openAlerts, useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Alerts() {
  const { state, dispatch } = useEnergy();
  const { company } = useSession();
  if (!company) return null;
  const rows = openAlerts(state.alerts, company.id);

  return (
    <PlanGate feature="alerts" plan="Professional">
      <PageHeader eyebrow="Risk signals" title="Alert centre" subtitle="Low stock, margin, FX, market moves, contract expiry and receivables — tenant scoped." />
      <div className="space-y-3">
        {rows.map((a) => (
          <article key={a.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={a.severity === "critical" || a.severity === "high" ? "bad" : a.severity === "medium" ? "warn" : "neutral"}>{a.severity}</Badge>
                <Badge>{a.status}</Badge>
                <span className="text-xs uppercase tracking-wide text-mist">{a.type.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-2">{a.message}</p>
              <p className="text-xs text-mist">{formatDate(a.createdAt.slice(0, 10))} · {a.relatedEntity}</p>
            </div>
            <div className="flex gap-2">
              {a.status === "open" && <Button onClick={() => dispatch({ type: "ack_alert", id: a.id })}>Acknowledge</Button>}
              {a.status !== "resolved" && <Button variant="gold" onClick={() => dispatch({ type: "resolve_alert", id: a.id })}>Resolve</Button>}
            </div>
          </article>
        ))}
      </div>
    </PlanGate>
  );
}
